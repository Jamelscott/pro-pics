import { useThemedStyles, type Ink } from "@/hooks/use-themed-styles";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  message?: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  visible,
  title,
  message = "This permanently removes it from your project and cloud storage. This can't be undone.",
  deleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !deleting && onCancel()}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={onCancel}
              style={styles.button}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={onConfirm}
              style={[styles.button, styles.deleteButton]}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
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
      gap: 8,
      backgroundColor: t.sheet,
    },
    title: { color: t.text, fontSize: 18, fontWeight: "700" },
    body: { color: t.ink(0.7), fontSize: 14, lineHeight: 20 },
    actions: { flexDirection: "row", gap: 10, marginTop: 12 },
    button: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.ink(0.1),
    },
    deleteButton: { backgroundColor: "#ef4444" },
    cancelText: { color: t.text, fontSize: 15, fontWeight: "600" },
    deleteText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });
