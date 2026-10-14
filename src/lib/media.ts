import { MEDIA_BUCKET, removeFromBucket, uploadFileToPath } from "./storage";
import { supabase } from "./supabase";

export interface MediaRow {
  id: string;
  project_id: string;
  folder_id: string | null;
  owner_id: string;
  kind: string;
  storage_path: string;
  thumb_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  thumb_size_bytes: number | null;
  duration_sec: number | null;
  width: number | null;
  height: number | null;
  captured_at: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  device: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type NewMedia = Omit<MediaRow, "id" | "created_at" | "updated_at" | "owner_id"> &
  Partial<Pick<MediaRow, "owner_id">>;

/** Inserts rows into the `media` table in one request. owner_id defaults to the signed-in user. */
export async function createMediaMany(inputs: NewMedia[]): Promise<MediaRow[]> {
  if (inputs.length === 0) return [];

  let defaultOwnerId: string | undefined;
  if (inputs.some((i) => !i.owner_id)) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw error ?? new Error("Not signed in");
    defaultOwnerId = data.user.id;
  }

  const { data, error } = await supabase
    .from("media")
    .insert(
      inputs.map((i) => ({ ...i, owner_id: i.owner_id ?? defaultOwnerId })),
    )
    .select();

  if (error) throw error;
  return data as MediaRow[];
}

export async function createMedia(input: NewMedia): Promise<MediaRow> {
  const [row] = await createMediaMany([input]);
  return row;
}

/** Deletes media rows and, best-effort, their files in storage. */
export async function deleteMediaMany(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { data, error: fetchError } = await supabase
    .from("media")
    .select("storage_path, thumb_path")
    .in("id", ids);
  if (fetchError) throw fetchError;

  const { error } = await supabase.from("media").delete().in("id", ids);
  if (error) throw error;

  // On-device items only lose their record; the photo stays in the camera roll.
  const { error: localError } = await supabase
    .from("local_media")
    .delete()
    .in("id", ids);
  if (localError) throw localError;

  const paths = data.flatMap((r) =>
    [r.storage_path, r.thumb_path].filter((p): p is string => !!p),
  );
  await removeFromBucket(paths).catch(() => {});
}

export const deleteMedia = (id: string) => deleteMediaMany([id]);

interface ReplaceMediaImageParams {
  id: string;
  uri: string;
  thumbUri: string;
  sizeBytes: number;
  thumbSizeBytes: number;
  width: number;
  height: number;
}

const toJpgPath = (path: string) => path.replace(/\.[^./]+$/, "") + ".jpg";

/** Overwrites a photo and its thumbnail in storage (upsert) and updates the media row. Returns fresh signed urls. */
export async function replaceMediaImage(p: ReplaceMediaImageParams) {
  const { data: row, error: rowError } = await supabase
    .from("media")
    .select("owner_id, project_id, storage_path, thumb_path")
    .eq("id", p.id)
    .single();
  if (rowError) throw rowError;

  // Edited images are always JPEG, so the files move to a .jpg path if they weren't one already.
  const storagePath = toJpgPath(row.storage_path);
  const thumbPath = row.thumb_path
    ? toJpgPath(row.thumb_path)
    : `${row.owner_id}/${row.project_id}/thumbs/${p.id}.jpg`;

  await uploadFileToPath(storagePath, p.uri, "image/jpeg", true);
  await uploadFileToPath(thumbPath, p.thumbUri, "image/jpeg", true);

  const { error } = await supabase
    .from("media")
    .update({
      storage_path: storagePath,
      thumb_path: thumbPath,
      mime_type: "image/jpeg",
      size_bytes: p.sizeBytes,
      thumb_size_bytes: p.thumbSizeBytes,
      width: p.width,
      height: p.height,
    })
    .eq("id", p.id);
  if (error) throw error;

  const stale = [row.storage_path, row.thumb_path].filter(
    (old): old is string => !!old && old !== storagePath && old !== thumbPath,
  );
  if (stale.length) await removeFromBucket(stale).catch(() => {});

  const { data: signed, error: signError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls([storagePath, thumbPath], 60 * 60);
  if (signError) throw signError;
  // Same path, new bytes: a changing query keeps the image cache from serving the old file.
  const bust = `&v=${Date.now()}`;
  const urlFor = (path: string) => {
    const url = signed.find((s) => s.path === path)?.signedUrl;
    if (!url) throw new Error("Couldn't load the updated photo.");
    return url + bust;
  };
  return { src: urlFor(storagePath), thumb: urlFor(thumbPath) };
}

/** Moves media (cloud and on-device records) to a project and folder. Storage files stay where they are. */
export async function moveMediaMany(
  ids: string[],
  projectId: string,
  folderId: string | null,
): Promise<void> {
  if (ids.length === 0) return;
  const patch = { project_id: projectId, folder_id: folderId };
  const [cloud, local] = await Promise.all([
    supabase.from("media").update(patch).in("id", ids),
    supabase.from("local_media").update(patch).in("id", ids),
  ]);
  if (cloud.error) throw cloud.error;
  if (local.error) throw local.error;
}
