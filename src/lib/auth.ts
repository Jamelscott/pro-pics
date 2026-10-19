import * as Linking from "expo-linking";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface AuthenticatedUser {
  accessToken: string;
  user: User;
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthenticatedUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.session)
    throw new Error("Sign-in succeeded without an auth session.");

  return {
    accessToken: data.session.access_token,
    user: data.user,
  };
}

export async function getCurrentAuth(): Promise<AuthenticatedUser | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;
  if (!data.session) return null;

  return {
    accessToken: data.session.access_token,
    user: data.session.user,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export const PASSWORD_RESET_PATH = "reset-password";

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Linking.createURL(PASSWORD_RESET_PATH),
  });

  if (error) throw error;
}

// Handles the deep link from the recovery email. Returns true if it was one.
export async function handlePasswordRecoveryUrl(url: string): Promise<boolean> {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return false;

  const params = new URLSearchParams(url.slice(hashIndex + 1));
  if (params.get("type") !== "recovery") return false;

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return false;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
  return true;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) throw error;
}
