import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

// Liquid glass on iOS 26+, a dark translucent capsule everywhere else.
export function GlassCapsule({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView isInteractive style={[style, styles.clip]}>
        {children}
      </GlassView>
    );
  }
  return <View style={[style, styles.fallback, styles.clip]}>{children}</View>;
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  fallback: {
    backgroundColor: "rgba(40,40,44,0.85)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
});
