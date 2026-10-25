import { router } from "expo-router";
import {
  ChevronLeft,
  Cloud,
  HelpCircle,
  Moon,
  Smartphone,
  Sun,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserThemePreference } from "@/context/ThemeContext";
import { useUser, type SaveDestinationPreference } from "@/context/UserContext";
import { useTheme } from "@/hooks/use-theme";
import { signOut } from "@/lib/auth";
import type { ThemePreference } from "@/lib/user";

const THEME_OPTIONS: Array<{
  pref: ThemePreference;
  label: string;
  icon: typeof Smartphone;
}> = [
  { pref: "system", label: "System", icon: Smartphone },
  { pref: "light", label: "Light", icon: Sun },
  { pref: "dark", label: "Dark", icon: Moon },
];

const SAVE_OPTIONS: Array<{
  pref: SaveDestinationPreference;
  label: string;
  icon: typeof Smartphone;
}> = [
  { pref: "cloud", label: "Cloud", icon: Cloud },
  { pref: "device", label: "Device", icon: Smartphone },
  { pref: "ask", label: "Always ask", icon: HelpCircle },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { themePreference, setThemePreference } = useUserThemePreference();
  const { user, saveDestination, setSaveDestination } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  const handleSelectTheme = async (pref: ThemePreference) => {
    if (pref === themePreference || isUpdatingTheme) return;
    setIsUpdatingTheme(true);
    try {
      await setThemePreference(pref);
    } catch (error: unknown) {
      Alert.alert(
        "Couldn't update theme",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  const handleSelectSaveDestination = async (
    pref: SaveDestinationPreference,
  ) => {
    if (pref === saveDestination) return;
    try {
      await setSaveDestination(pref);
    } catch (error: unknown) {
      Alert.alert(
        "Couldn't update save setting",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error: unknown) {
      Alert.alert(
        "Couldn't log out",
        error instanceof Error ? error.message : "Please try again.",
      );
      setIsSigningOut(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top + 24 },
      ]}
    >
      <View style={styles.titleRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
        Appearance
      </Text>

      <View style={styles.themeOptionsRow}>
        {THEME_OPTIONS.map(({ pref, label, icon: Icon }) => {
          const isSelected = themePreference === pref;
          const iconColor = isSelected ? theme.text : theme.textSecondary;

          return (
            <Pressable
              key={pref}
              accessibilityRole="button"
              accessibilityLabel={`Select ${label} theme`}
              accessibilityState={{ selected: isSelected }}
              disabled={isUpdatingTheme}
              onPress={() => handleSelectTheme(pref)}
              style={({ pressed }) => [
                styles.themeOptionButton,
                {
                  backgroundColor: isSelected
                    ? theme.backgroundSelected
                    : theme.backgroundElement,
                  borderColor: isSelected ? theme.text : "transparent",
                },
                pressed && styles.pressed,
              ]}
            >
              <Icon size={18} color={iconColor} strokeWidth={2} />
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color: isSelected ? theme.text : theme.textSecondary,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.spacer} />
      <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
        autosave destination
      </Text>
      <View style={styles.themeOptionsRow}>
        {SAVE_OPTIONS.map(({ pref, label, icon: Icon }) => {
          const isSelected = saveDestination === pref;
          return (
            <Pressable
              key={pref}
              accessibilityRole="button"
              accessibilityLabel={`Save destination: ${label}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleSelectSaveDestination(pref)}
              style={({ pressed }) => [
                styles.themeOptionButton,
                {
                  backgroundColor: isSelected
                    ? theme.backgroundSelected
                    : theme.backgroundElement,
                  borderColor: isSelected ? theme.text : "transparent",
                },
                pressed && styles.pressed,
              ]}
            >
              <Icon
                size={18}
                color={isSelected ? theme.text : theme.textSecondary}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color: isSelected ? theme.text : theme.textSecondary,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.spacer} />
      <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
        Account
      </Text>
      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 12 }}>
        <View
          style={[
            styles.accountCard,
            { backgroundColor: theme.backgroundElement, flex: 2 },
          ]}
        >
          <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>
            Signed in as
          </Text>
          <Text
            numberOfLines={1}
            selectable
            style={[styles.accountEmail, { color: theme.text }]}
          >
            {user?.email ?? "Unknown"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
          disabled={isSigningOut}
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.button,
            styles.logoutButton,
            pressed && styles.pressed,
            isSigningOut && styles.disabled,
            { flex: 1, minHeight: 0 },
          ]}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.buttonText, styles.logoutText]}>Log out</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  accountCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 2,
  },
  accountLabel: { fontSize: 13 },
  accountEmail: { fontSize: 16, fontWeight: "600" },
  themeOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOptionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 13,
  },
  spacer: {
    height: 12,
  },
  button: {
    minHeight: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#D93025",
  },
  logoutText: {
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
});
