import { Pencil, Plus, X } from "lucide-react-native";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInk } from "@/hooks/use-themed-styles";
import { useProjectStyles } from "./styles";

interface ProjectHeaderProps {
  projectCount: number;
  onCreatePress: () => void;
  editing?: boolean;
  onEditPress?: () => void;
}

export default function ProjectHeader({
  projectCount,
  onCreatePress,
  editing = false,
  onEditPress,
}: ProjectHeaderProps) {
  const styles = useProjectStyles();
  const insets = useSafeAreaInsets();
  const t = useInk();
  return (
    <View
      style={[
        styles.headerContainer,
        Platform.OS === "android" && { paddingTop: insets.top },
      ]}
    >
      <View>
        <Text style={styles.title}>Projects</Text>
        <Text style={styles.eyebrow}>{projectCount} Projects</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {onEditPress && (
          <TouchableOpacity
            accessibilityLabel={editing ? "Cancel selection" : "Edit projects"}
            style={styles.createButton}
            onPress={onEditPress}
            activeOpacity={0.7}
          >
            {editing ? (
              <X size={20} color={t.text} />
            ) : (
              <Pencil size={20} color={t.text} />
            )}
          </TouchableOpacity>
        )}
        {!editing && (
          <TouchableOpacity
            accessibilityLabel="New project"
            style={styles.createButton}
            onPress={onCreatePress}
            activeOpacity={0.7}
          >
            <Plus size={20} color={t.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
