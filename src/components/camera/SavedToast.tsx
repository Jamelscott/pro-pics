import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

interface SavedToastProps {
  thumbUri: string;
  bottom: number;
  onPress: () => void;
}

export default function SavedToast({ thumbUri, bottom, onPress }: SavedToastProps) {
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={[styles.wrap, { bottom }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Photo saved. Open photo"
        onPress={onPress}
        style={styles.toast}
      >
        <Image source={{ uri: thumbUri }} style={styles.thumb} contentFit="cover" />
        <Text style={styles.text}>Saved</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 6,
    paddingRight: 14,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  text: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
