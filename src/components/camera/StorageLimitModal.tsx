import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface StorageLimitModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StorageLimitModal({ visible, onClose }: StorageLimitModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title}>Storage full</Text>
          <Text style={styles.body}>
            Saving this photo would put you over your storage limit, so it
            wasn&apos;t saved. Delete some photos or upgrade your plan to free
            up space.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 20,
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#1c1c1e",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  body: { color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 21 },
  button: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#0a84ff",
  },
  pressed: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
