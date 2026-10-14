import { File } from "expo-file-system";
import { supabase } from "./supabase";

export const MEDIA_BUCKET = "media";

interface UploadToBucketParams {
  /** Defaults to the signed-in user. */
  userId?: string;
  /** Local file uri, e.g. from expo-image-picker */
  uri: string;
  projectId: string;
  mediaId: string;
  mimeType: string;
  kind?: "originals" | "thumbs";
}

const extFromMime = (mime: string) => {
  const sub = mime.split("/")[1] ?? "bin";
  return sub === "jpeg" ? "jpg" : sub === "quicktime" ? "mov" : sub;
};

export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Not signed in");
  return data.user.id;
}

/** Uploads a local file to `{userId}/{projectId}/{kind}/{mediaId}.{ext}` and returns the storage path. */
export async function uploadToBucket({
  userId,
  uri,
  projectId,
  mediaId,
  mimeType,
  kind = "originals",
}: UploadToBucketParams): Promise<string> {
  const owner = userId ?? (await getCurrentUserId());
  const path = `${owner}/${projectId}/${kind}/${mediaId}.${extFromMime(mimeType)}`;
  await uploadFileToPath(path, uri, mimeType, false);
  return path;
}

/** Uploads a local file to an exact storage path, optionally overwriting what's there. */
export async function uploadFileToPath(
  path: string,
  uri: string,
  mimeType: string,
  upsert: boolean,
): Promise<void> {
  const body = await new File(uri).arrayBuffer();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, body, { contentType: mimeType, upsert });
  if (error) throw error;
}

export async function removeFromBucket(paths: string | string[]): Promise<void> {
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(Array.isArray(paths) ? paths : [paths]);
  if (error) throw error;
}
