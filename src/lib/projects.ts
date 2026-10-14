import { getCurrentUserId, removeFromBucket } from "./storage";
import { supabase } from "./supabase";

export interface ProjectRow {
  id: string;
  name: string;
  client: string | null;
  color: string;
  created_at: string;
}

/** Inserts a project owned by the signed-in user. */
export async function createProject(input: {
  name: string;
  client: string;
  color: string;
}): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, owner_id: await getCurrentUserId() })
    .select("id, name, client, color, created_at")
    .single();

  if (error) throw error;
  return data as ProjectRow;
}

/** Inserts a folder in a project, owned by the signed-in user. */
export async function createFolder(
  projectId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase
    .from("folders")
    .insert({ project_id: projectId, name, owner_id: await getCurrentUserId() })
    .select("id, name")
    .single();

  if (error) throw error;
  return data;
}

/** Deletes projects with all their media (rows and storage files) and folders. */
export async function deleteProjects(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { data: media, error: mediaFetchError } = await supabase
    .from("media")
    .select("storage_path, thumb_path")
    .in("project_id", ids);
  if (mediaFetchError) throw mediaFetchError;

  const mediaDelete = await supabase.from("media").delete().in("project_id", ids);
  if (mediaDelete.error) throw mediaDelete.error;

  const folderDelete = await supabase.from("folders").delete().in("project_id", ids);
  if (folderDelete.error) throw folderDelete.error;

  // RLS rejects deletes silently, so confirm every project row is actually gone.
  const projectDelete = await supabase
    .from("projects")
    .delete()
    .in("id", ids)
    .select("id");
  if (projectDelete.error) throw projectDelete.error;
  if (projectDelete.data.length < ids.length) {
    throw new Error("Some projects couldn't be deleted from the database.");
  }

  const paths = media.flatMap((r) =>
    [r.storage_path, r.thumb_path].filter((p): p is string => !!p),
  );
  await removeFromBucket(paths).catch(() => {});
}
