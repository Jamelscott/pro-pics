import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { File } from "expo-file-system";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { getCurrentUserId } from "./storage";
import { supabase } from "./supabase";

const DEVICE_ID_KEY = "pro-pics:device-id";

/** Camera-roll asset ids are only meaningful on the device that created them, so rows are tagged with this id. */
export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export interface LocalMediaRow {
  id: string;
  project_id: string;
  folder_id: string | null;
  asset_id: string;
  kind: string;
  size_bytes: number | null;
  duration_sec: number | null;
  captured_at: string | null;
  location_name: string | null;
  device: string | null;
  description: string | null;
  created_at: string;
}

interface SaveLocalParams {
  uri: string;
  projectId: string;
  folderId?: string | null;
  mimeType?: string;
  kind?: string;
  width?: number | null;
  height?: number | null;
  capturedAt?: string | null;
}

/** Saves a file to the camera roll and records the asset against a project. */
export async function saveToCameraRoll(p: SaveLocalParams) {
  const permission = await requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to save to your device.");
  }

  const [userId, deviceId] = await Promise.all([
    getCurrentUserId(),
    getDeviceId(),
  ]);
  const asset = await Asset.create(p.uri);

  const { data, error } = await supabase
    .from("local_media")
    .insert({
      owner_id: userId,
      device_id: deviceId,
      project_id: p.projectId,
      folder_id: p.folderId ?? null,
      asset_id: asset.id,
      kind: p.kind ?? "photo",
      mime_type: p.mimeType ?? null,
      size_bytes: new File(p.uri).size,
      width: p.width ?? null,
      height: p.height ?? null,
      captured_at: p.capturedAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LocalMediaRow;
}

export interface ResolvedLocalMedia extends LocalMediaRow {
  uri: string;
}

/** Local rows for this device whose camera-roll asset still exists. Returns [] without library access. */
export async function fetchLocalMedia(): Promise<ResolvedLocalMedia[]> {
  const [userId, deviceId] = await Promise.all([
    getCurrentUserId(),
    getDeviceId(),
  ]);
  const { data, error } = await supabase
    .from("local_media")
    .select(
      "id, project_id, folder_id, asset_id, kind, size_bytes, duration_sec, captured_at, location_name, device, description, created_at",
    )
    .eq("owner_id", userId)
    .eq("device_id", deviceId)
    .order("captured_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  if (data.length === 0) return [];

  const permission = await requestPermissionsAsync();
  if (!permission.granted) return [];

  const resolved = await Promise.all(
    (data as LocalMediaRow[]).map(async (row) => {
      try {
        return { ...row, uri: await new Asset(row.asset_id).getUri() };
      } catch {
        // Asset was deleted from the camera roll.
        return null;
      }
    }),
  );
  const live = resolved.filter((r): r is ResolvedLocalMedia => r !== null);

  // With limited access, assets outside the selection look deleted, so only prune with full access.
  if (live.length < data.length && permission.accessPrivileges !== "limited") {
    const liveIds = new Set(live.map((r) => r.id));
    const orphanIds = data.filter((r) => !liveIds.has(r.id)).map((r) => r.id);
    const { error: pruneError } = await supabase
      .from("local_media")
      .delete()
      .in("id", orphanIds)
      .eq("device_id", deviceId);
    if (pruneError) console.warn("Unable to prune deleted local media", pruneError);
  }
  return live;
}
