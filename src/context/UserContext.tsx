import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { handlePasswordRecoveryUrl } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  getUserProfile,
  updateUserProfile,
  updateUserSaveLocation,
  updateUserTheme,
  type SaveLocation,
  type ThemePreference,
  type UserProfile,
} from "@/lib/user";

export type SaveDestinationPreference = SaveLocation;

interface UserStorageSummary {
  usedBytes: number;
  limitBytes: number;
  availableBytes: number;
  usedGb: number;
  limitGb: number;
  availableGb: number;
  usedPct: number;
  isOverLimit: boolean;
}

interface UserContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  storage: UserStorageSummary;
  isLoading: boolean;
  isRecoveringPassword: boolean;
  setIsRecoveringPassword: (value: boolean) => void;
  refreshProfile: () => Promise<void>;
  updateTheme: (theme: ThemePreference) => Promise<UserProfile>;
  saveDestination: SaveDestinationPreference;
  setSaveDestination: (pref: SaveDestinationPreference) => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>) => Promise<UserProfile>;
}

const BYTES_PER_GB = 1024 ** 3;

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const data = await getUserProfile(uid);
      setProfile(data);
    } catch (err) {
      console.warn("Failed to fetch user profile:", err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchProfile(newSession.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      // Flag first so the app doesn't flash the signed-in screens.
      setIsRecoveringPassword(true);
      handlePasswordRecoveryUrl(url)
        .then((handled) => {
          if (!handled) setIsRecoveringPassword(false);
        })
        .catch((err) => {
          console.warn("Failed to handle password recovery link:", err);
          setIsRecoveringPassword(false);
        });
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url),
    );
    return () => subscription.remove();
  }, []);

  // Realtime subscription to users table updates (e.g. storage change triggers)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as UserProfile);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateTheme = useCallback(
    async (theme: ThemePreference) => {
      if (!user) {
        throw new Error("Cannot update theme: User is not authenticated.");
      }
      const updated = await updateUserTheme(user.id, theme);
      setProfile(updated);
      return updated;
    },
    [user],
  );

  const saveDestination: SaveDestinationPreference =
    profile?.save_location ?? "ask";

  const setSaveDestination = useCallback(
    async (pref: SaveDestinationPreference) => {
      if (!user) {
        throw new Error("Cannot update save location: User is not authenticated.");
      }
      const updated = await updateUserSaveLocation(user.id, pref);
      setProfile(updated);
    },
    [user],
  );

  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>) => {
      if (!user) {
        throw new Error("Cannot update profile: User is not authenticated.");
      }
      const updated = await updateUserProfile(user.id, updates);
      setProfile(updated);
      return updated;
    },
    [user],
  );

  const storage = useMemo<UserStorageSummary>(() => {
    const usedBytes = profile?.storage_used_bytes ?? 0;
    const limitBytes = profile?.storage_limit_bytes ?? 0;
    const availableBytes = Math.max(limitBytes - usedBytes, 0);

    const usedGb = usedBytes / BYTES_PER_GB;
    const limitGb = limitBytes / BYTES_PER_GB;
    const availableGb = availableBytes / BYTES_PER_GB;

    const usedPct = limitBytes > 0 ? Math.min(Math.round((usedBytes / limitBytes) * 100), 100) : 0;

    return {
      usedBytes,
      limitBytes,
      availableBytes,
      usedGb,
      limitGb,
      availableGb,
      usedPct,
      isOverLimit: usedBytes >= limitBytes && limitBytes > 0,
    };
  }, [profile?.storage_used_bytes, profile?.storage_limit_bytes]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      session,
      profile,
      storage,
      isLoading,
      isRecoveringPassword,
      setIsRecoveringPassword,
      refreshProfile,
      updateTheme,
      updateProfile,
      saveDestination,
      setSaveDestination,
    }),
    [user, session, profile, storage, isLoading, isRecoveringPassword, refreshProfile, updateTheme, updateProfile, saveDestination, setSaveDestination],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
