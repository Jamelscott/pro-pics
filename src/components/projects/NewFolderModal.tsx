import { useThemedStyles, type Ink } from "@/hooks/use-themed-styles";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface NewFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function NewFolderModal({
  visible,
  onClose,
  onCreate,
}: NewFolderModalProps) {
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  const close = () => {
    if (saving) return;
    setName("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate(trimmed);
      setName("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create folder.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <Text style={styles.title}>New folder</Text>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor="#888"
            returnKeyType="done"
            onSubmitEditing={submit}
            maxLength={60}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={close}
              style={styles.button}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!trimmed || saving}
              onPress={submit}
              style={[
                styles.button,
                styles.createButton,
                !trimmed && styles.disabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.createText}>Create</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (t: Ink) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    card: {
      width: "100%",
      maxWidth: 340,
      borderRadius: 16,
      padding: 20,
      gap: 10,
      backgroundColor: t.sheet,
    },
    title: { color: t.text, fontSize: 18, fontWeight: "700" },
    input: {
      height: 44,
      borderRadius: 12,
      paddingHorizontal: 12,
      color: t.text,
      fontSize: 16,
      backgroundColor: t.ink(0.1),
    },
    error: { color: "#ef4444", fontSize: 13 },
    actions: { flexDirection: "row", gap: 10, marginTop: 6 },
    button: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.ink(0.1),
    },
    createButton: { backgroundColor: "#fff" },
    disabled: { opacity: 0.4 },
    cancelText: { color: t.text, fontSize: 15, fontWeight: "600" },
    createText: { color: "#000", fontSize: 15, fontWeight: "700" },
  });
