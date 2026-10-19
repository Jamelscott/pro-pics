import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";

import LoginScreen from "@/components/auth/LoginScreen";
import { ThemePreferenceProvider, useUserThemePreference } from "@/context/ThemeContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { Colors } from "@/constants/theme";

function AppContent() {
  const { colorScheme } = useUserThemePreference();
  const { session, isLoading: isAuthLoading, isRecoveringPassword } = useUser();
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
      {isAuthLoading ? (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator color="#208AEF" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking your account…
          </Text>
        </View>
      ) : session && !isRecoveringPassword ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" />
        </Stack>
      ) : (
        <LoginScreen sessionError={null} />
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});
