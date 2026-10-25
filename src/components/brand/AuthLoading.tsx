import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AppLogo } from "@/components/brand/AppLogo";

export function AuthLoading({
  background,
  text,
  textSecondary,
}: {
  background: string;
  text: string;
  textSecondary: string;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
    );
  }, [pulse]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel="Loading"
      style={[styles.container, { backgroundColor: background }]}
    >
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <AppLogo />
        </Animated.View>
        <Text style={[styles.name, { color: text }]}>SITE PICS</Text>
        <Text style={[styles.tagline, { color: textSecondary }]}>
          SITE PHOTOS · DOCUMENTED
        </Text>
      </View>
      <View style={styles.footer}>
        <ActivityIndicator color="#FFC20E" />
        <Text style={[styles.caption, { color: textSecondary }]}>
          Preparing your site…
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", gap: 20 },
  name: { fontSize: 30, fontWeight: "900", letterSpacing: 3 },
  tagline: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    marginTop: -12,
  },
  footer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
    gap: 10,
  },
  caption: { fontSize: 14 },
});
