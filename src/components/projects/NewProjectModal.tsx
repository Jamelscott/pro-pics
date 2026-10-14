import {
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheetModal from "@/components/ui/bottom-sheet-modal";
import { useInk, useThemedStyles, type Ink } from "@/hooks/use-themed-styles";
import { Check } from "lucide-react-native";
import { useState } from "react";

const projectColors = [
  "#7dd3fc",
  "#fcd34d",
  "#86efac",
  "#f0abfc",
  "#fca5a5",
  "#fdba74",
  "#a5b4fc",
  "#5eead4",
];

interface NewProjectModalProps {
  visible: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onCreate: (name: string, client: string, color: string) => void | Promise<void>;
}

export default function NewProjectModal({
  visible,
  isCreating = false,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const formStyles = useThemedStyles(createStyles);
  const t = useInk();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [color, setColor] = useState(projectColors[0]);
  const canCreate =
    name.trim().length > 0 && client.trim().length > 0 && !isCreating;

  const handleCreate = () => {
    if (!canCreate) return;

    Keyboard.dismiss();
    void onCreate(name.trim(), client.trim(), color);
  };

  return (
    <BottomSheetModal visible={visible} title="New project" onClose={onClose}>
      <View style={formStyles.form}>
        <View style={formStyles.field}>
          <Text style={formStyles.label}>Project name</Text>
          <TextInput
            style={formStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Harbor St. Renovation"
            placeholderTextColor={t.ink(0.35)}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Project name"
          />
        </View>

        <View style={formStyles.field}>
          <Text style={formStyles.label}>Client name</Text>
          <TextInput
            style={formStyles.input}
            value={client}
            onChangeText={setClient}
            placeholder="e.g. Malloy Builders"
            placeholderTextColor={t.ink(0.35)}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            accessibilityLabel="Client name"
          />
        </View>

        <View style={formStyles.field}>
          <Text style={formStyles.label}>Project color</Text>
          <View style={formStyles.colors}>
            {projectColors.map((option) => {
              const selected = color === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    formStyles.colorOption,
                    { backgroundColor: option },
                    selected && formStyles.selectedColorOption,
                  ]}
                  onPress={() => setColor(option)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option} project color`}
                  accessibilityState={{ selected }}
                  hitSlop={4}
                >
                  {selected && <Check size={18} color="#111318" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[
            formStyles.createButton,
            !canCreate && formStyles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!canCreate}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCreate, busy: isCreating }}
        >
          {isCreating ? (
            <ActivityIndicator color="#111318" />
          ) : (
            <Text style={formStyles.createButtonText}>Create project</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const createStyles = (t: Ink) =>
  StyleSheet.create({
    form: {
      gap: 18,
      paddingBottom: 8,
    },
    field: {
      gap: 8,
    },
    label: {
      color: t.ink(0.55),
      fontSize: 12,
      fontWeight: "600",
    },
    input: {
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.ink(0.1),
      backgroundColor: t.ink(0.06),
      paddingHorizontal: 14,
      color: t.text,
      fontSize: 15,
    },
    colors: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },
    colorOption: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    selectedColorOption: {
      borderColor: t.text,
    },
    createButton: {
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#7dd3fc",
      marginTop: 2,
    },
    createButtonDisabled: {
      opacity: 0.45,
    },
    createButtonText: {
      color: "#111318",
      fontSize: 15,
      fontWeight: "700",
    },
  });
