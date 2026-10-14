import { useMemo } from "react";
import { useColorScheme } from "react-native";

export interface Ink {
  isDark: boolean;
  text: string;
  bg: string;
  accent: string;
  sheet: string;
  ink: (alpha: number) => string;
}

const makeInk = (isDark: boolean): Ink => ({
  isDark,
  text: isDark ? "#fff" : "#000",
  bg: isDark ? "#000" : "#fff",
  accent: isDark ? "#7dd3fc" : "#0284c7",
  sheet: isDark ? "#1a1f27" : "#f2f2f7",
  ink: (alpha) => `rgba(${isDark ? "255,255,255" : "0,0,0"},${alpha})`,
});

const darkInk = makeInk(true);
const lightInk = makeInk(false);

export function useInk(): Ink {
  return useColorScheme() === "dark" ? darkInk : lightInk;
}

export function useThemedStyles<T>(factory: (ink: Ink) => T): T {
  const ink = useInk();
  return useMemo(() => factory(ink), [factory, ink]);
}
