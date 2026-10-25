import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useColorScheme as useRNColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@/context/UserContext";
import type { ThemePreference } from "@/lib/user";

const THEME_STORAGE_KEY = "@pro-pics/theme-preference";

interface ThemeContextValue {
  themePreference: ThemePreference;
  colorScheme: "light" | "dark";
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyAppearance(pref: ThemePreference) {
  Appearance.setColorScheme((pref === "system" ? "unspecified" : pref) as any);
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const { profile, updateTheme } = useUser();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");

  // 1. Initial cold-start: load cached preference from AsyncStorage for immediate UI response
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (!isMounted || !saved) return;
        if (saved === "light" || saved === "dark" || saved === "system") {
          setThemePreferenceState(saved);
          applyAppearance(saved);
        }
      })
      .catch((err) => console.warn("Failed to read theme from cache:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronize theme when user profile changes in UserContext
  useEffect(() => {
    if (profile?.theme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemePreferenceState(profile.theme);
      applyAppearance(profile.theme);
      AsyncStorage.setItem(THEME_STORAGE_KEY, profile.theme).catch(() => {});
    }
  }, [profile?.theme]);

  // 3. User updates theme: updates local appearance, cache, and persists via UserContext
  const setThemePreference = useCallback(
    async (pref: ThemePreference) => {
      const prevPref = themePreference;

      // Optimistic local update
      setThemePreferenceState(pref);
      applyAppearance(pref);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref).catch(() => {});

      try {
        await updateTheme(pref);
      } catch (err) {
        // Rollback on failure
        setThemePreferenceState(prevPref);
        applyAppearance(prevPref);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, prevPref).catch(() => {});
        throw err;
      }
    },
    [themePreference, updateTheme],
  );

  const resolvedColorScheme: "light" | "dark" = useMemo(() => {
    if (themePreference === "dark") return "dark";
    if (themePreference === "light") return "light";
    return systemColorScheme === "dark" ? "dark" : "light";
  }, [themePreference, systemColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themePreference,
      colorScheme: resolvedColorScheme,
      isDark: resolvedColorScheme === "dark",
      setThemePreference,
    }),
    [themePreference, resolvedColorScheme, setThemePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useUserThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useUserThemePreference must be used within a ThemePreferenceProvider");
  }
  return ctx;
}
