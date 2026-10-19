import { useCurrentDate } from "@/utils/functions/useCurrentDate";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHomeStyles } from "./styles";
function Header({ right }: { right?: React.ReactNode }) {
  const styles = useHomeStyles();
  const insets = useSafeAreaInsets();
  const { dayAndMonth: eyebrow, greeting: title } = useCurrentDate();
  return (
    <View
      style={[
        styles.headerContainer,
        Platform.OS === "android" && { paddingTop: insets.top },
      ]}
    >
      <View style={{ alignItems: "flex-start" }}>
        <Text style={styles.title}>{title}</Text>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      </View>
      {right}
    </View>
  );
}

export default Header;
