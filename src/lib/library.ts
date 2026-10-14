import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { fetchLocalMedia } from "./localMedia";
import { getCurrentUserId, MEDIA_BUCKET } from "./storage";
import { supabase } from "./supabase";
export interface ProjectFolder {
  id: string;
  name: string;
}

export interface ProjectMedia {
  id: string;
  description: string;
  kind: "photo" | "video";
  src: string;
  date: string;
  location: string;
  folder_tags: string[];
  device: string;
  storage: "cloud" | "local";
  size: number;
  storageBytes: number;
  thumb?: string;
  duration?: string;
  folder?: string;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  color: string;
  created_date: string;
  folders?: ProjectFolder[];
  media: ProjectMedia[];
}

const SIGNED_URL_TTL_SEC = 60 * 60;
const BYTES_PER_MB = 1024 ** 2;

const formatDuration = (sec: number | null) => {
  if (sec == null) return undefined;
  const total = Math.round(sec);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths)];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SEC);
  if (error) throw error;
  for (const item of data) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

/** Fetches the signed-in user's projects with their folders and media. */
export async function fetchLibrary(): Promise<Project[]> {
  const userId = await getCurrentUserId();
  // A failure here (e.g. no library access) shouldn't hide cloud media.
  const localPromise = fetchLocalMedia().catch((e) => {
    console.warn("Unable to load on-device media", e);
    return [];
  });

  const [projectsRes, foldersRes, mediaRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, client, color, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("folders")
      .select("id, project_id, name")
      .eq("owner_id", userId)
      .order("name"),
    supabase
      .from("media")
      .select(
        "id, project_id, folder_id, kind, storage_path, thumb_path, size_bytes, thumb_size_bytes, duration_sec, captured_at, location_name, device, description, created_at",
      )
      .eq("owner_id", userId)
      .order("captured_at", { ascending: false, nullsFirst: false }),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (foldersRes.error) throw foldersRes.error;
  if (mediaRes.error) throw mediaRes.error;

  const mediaRows = mediaRes.data;
  const urls = await signPaths(
    mediaRows.flatMap((m) =>
      m.thumb_path ? [m.storage_path, m.thumb_path] : [m.storage_path],
    ),
  );

  const byProject = new Map<string, Project>();
  const projects = projectsRes.data.map((p): Project => {
    const project: Project = {
      id: p.id,
      name: p.name,
      client: p.client ?? undefined,
      color: p.color,
      created_date: p.created_at,
      folders: [],
      media: [],
    };
    byProject.set(p.id, project);
    return project;
  });

  for (const f of foldersRes.data) {
    byProject.get(f.project_id)?.folders?.push({ id: f.id, name: f.name });
  }

  for (const m of mediaRows) {
    const src = urls.get(m.storage_path);
    if (!src) continue;
    byProject.get(m.project_id)?.media.push({
      id: m.id,
      description: m.description ?? "",
      kind: m.kind === "video" ? "video" : "photo",
      src,
      thumb: m.thumb_path ? urls.get(m.thumb_path) : undefined,
      date: m.captured_at ?? m.created_at,
      location: m.location_name ?? "",
      folder_tags: [],
      device: m.device ?? "",
      storage: "cloud",
      size: (m.size_bytes ?? 0) / BYTES_PER_MB,
      storageBytes: (m.size_bytes ?? 0) + (m.thumb_size_bytes ?? 0),
      duration: formatDuration(m.duration_sec),
      folder: m.folder_id ?? undefined,
    });
  }

  for (const m of await localPromise) {
    byProject.get(m.project_id)?.media.push({
      id: m.id,
      description: m.description ?? "",
      kind: m.kind === "video" ? "video" : "photo",
      src: m.uri,
      date: m.captured_at ?? m.created_at,
      location: m.location_name ?? "",
      folder_tags: [],
      device: m.device ?? "",
      storage: "local",
      size: (m.size_bytes ?? 0) / BYTES_PER_MB,
      storageBytes: m.size_bytes ?? 0,
      duration: formatDuration(m.duration_sec),
      folder: m.folder_id ?? undefined,
    });
  }

  return projects;
}

/** Loads the user's library, refreshing whenever the screen gains focus. */
export function useLibrary() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setProjects(await fetchLibrary());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { projects, setProjects, loading, error, refresh };
}
