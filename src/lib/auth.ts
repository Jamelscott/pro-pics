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
  if (!data.session) throw new Error("Sign-in succeeded without an auth session.");

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