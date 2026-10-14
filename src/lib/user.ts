import { supabase } from "./supabase";

export type ThemePreference = "light" | "dark" | "system";
export type UserTier = "free" | "pro";

export interface UserProfile {
  id: string;
  theme: ThemePreference;
  tier: UserTier;
  storage_limit_bytes: number;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
}

const PROFILE_FIELDS =
  "id, theme, tier, storage_limit_bytes, storage_used_bytes, created_at, updated_at";

/**
 * Fetches the user profile from the `users` table for a given user ID.
 * If the row does not exist yet (e.g., created before trigger was added),
 * it gracefully attempts to insert default preferences and return it.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    // Attempt upsert fallback in case trigger didn't run
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .upsert({ id: userId, theme: "system" })
      .select(PROFILE_FIELDS)
      .maybeSingle();

    if (insertError) {
      console.warn("Could not auto-create profile row:", insertError.message);
      return null;
    }
    return inserted as UserProfile;
  }

  return data as UserProfile;
}

/**
 * Updates any editable profile fields in the `users` table.
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("users")
    .upsert({ id: userId, ...updates })
    .select(PROFILE_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}

/**
 * Updates the user's theme mode in the `users` table.
 */
export async function updateUserTheme(
  userId: string,
  theme: ThemePreference,
): Promise<UserProfile> {
  return updateUserProfile(userId, { theme });
}
