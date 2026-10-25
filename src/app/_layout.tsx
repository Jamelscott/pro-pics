import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Animated, Platform, StyleSheet } from "react-native";

import LoginScreen from "@/components/auth/LoginScreen";
import { AuthLoading } from "@/components/brand/AuthLoading";
import { Colors } from "@/constants/theme";
import {
  ThemePreferenceProvider,
  useUserThemePreference,
} from "@/context/ThemeContext";
import { UserProvider, useUser } from "@/context/UserContext";

const SPLASH_HOLD_MS = 1500;
const SPLASH_FADE_MS = 400;

function AppContent() {
  const { colorScheme } = useUserThemePreference();
  const { session, isLoading: isAuthLoading, isRecoveringPassword } = useUser();
  const [holdElapsed, setHoldElapsed] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const [fade] = useState(() => new Animated.Value(1));
  const splashDone = !isAuthLoading && holdElapsed;

  // Launch only: hold the splash for a minimum time, then fade into the app.
  useEffect(() => {
    const timer = setTimeout(() => setHoldElapsed(true), SPLASH_HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    Animated.timing(fade, {
      toValue: 0,
      duration: SPLASH_FADE_MS,
      useNativeDriver: true,
    }).start(() => setSplashGone(true));
  }, [splashDone, fade]);

  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar
        style={
          Platform.OS === "android"
            ? colorScheme === "dark"
              ? "light"
              : "dark"
            : "auto"
        }
      />
      {isAuthLoading ? null : session && !isRecoveringPassword ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" />
        </Stack>
      ) : (
        <LoginScreen sessionError={null} />
      )}
      {splashGone ? null : (
        <Animated.View
          pointerEvents={splashDone ? "none" : "auto"}
          style={[StyleSheet.absoluteFill, { opacity: fade }]}
        >
          <AuthLoading
            background={colors.background}
            text={colors.text}
            textSecondary={colors.textSecondary}
          />
        </Animated.View>
      )}
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <UserProvider>
      <ThemePreferenceProvider>
        <AppContent />
      </ThemePreferenceProvider>
    </UserProvider>
  );
}
