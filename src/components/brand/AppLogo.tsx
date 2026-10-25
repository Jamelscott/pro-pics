import { StyleSheet, View } from "react-native";
import { HardHat } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";

const YELLOW = "#FFC20E";
const BLACK = "#1A1A1A";

// Viewfinder corners framing a hard hat icon.
export function AppLogo({ size = 88 }: { size?: number }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Site Pics logo"
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.26 },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M20 34V24a4 4 0 0 1 4-4h10M66 20h10a4 4 0 0 1 4 4v10M80 66v10a4 4 0 0 1-4 4H66M34 80H24a4 4 0 0 1-4-4V66"
          stroke={BLACK}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      <View style={styles.center}>
        <HardHat size={size * 0.42} color={BLACK} strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  tile: {
    backgroundColor: YELLOW,
    shadowColor: YELLOW,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
