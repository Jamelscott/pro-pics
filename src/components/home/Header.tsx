import { useCurrentDate } from "@/utils/functions/useCurrentDate";
import { Text, View } from "react-native";
import { useHomeStyles } from "./styles";
function Header({ right }: { right?: React.ReactNode }) {
  const styles = useHomeStyles();
  const { dayAndMonth: eyebrow, greeting: title } = useCurrentDate();
  return (
    <View style={styles.headerContainer}>
      <View>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export default Header;
