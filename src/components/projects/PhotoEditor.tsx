import { MarkupOverlay } from "@/components/camera/MarkupOverlay";
import { replaceMediaImage } from "@/lib/media";
import { uploadAndCreateMedia } from "@/lib/mediaUpload";
import { signPaths, type ProjectMedia } from "@/lib/library";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { PenLine, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const THUMB_WIDTH = 400;

interface PhotoEditorProps {
  media: ProjectMedia | null;
  onClose: () => void;
  projectId: string;
  onSaved: (result: PhotoEditResult) => void;
}

export type PhotoEditResult =
  | { mode: "replace"; id: string; src: string; thumb: string }
  | { mode: "copy"; afterId: string; item: ProjectMedia };

export default function PhotoEditor({
  media,
  onClose,
  projectId,
  onSaved,
}: PhotoEditorProps) {
  return (
    <Modal
      visible={media !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {media && (
        <EditorBody
          key={media.id}
          media={media}
          onClose={onClose}
          projectId={projectId}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function EditorBody({
  media,
  onClose,
  projectId,
  onSaved,
}: PhotoEditorProps & { media: ProjectMedia }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compositeRef = useRef<View>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [markingUp, setMarkingUp] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    RNImage.getSize(
      media.src,
      (w, h) => setNatural({ w, h }),
      () => {
        Alert.alert("Couldn't load photo", "Try again.");
        onClose();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.src]);

  const fit = natural ? Math.min(width / natural.w, height / natural.h) : 0;
  const imgW = natural ? natural.w * fit : 0;
  const imgH = natural ? natural.h * fit : 0;

  const save = async (mode: "replace" | "copy") => {
    if (!natural || !compositeRef.current) return;
    setSaving(true);
    try {
      const flat = await captureRef(compositeRef, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });
      const flatRef = await ImageManipulator.manipulate(flat).renderAsync();
      const ratio = flatRef.width / width;
      // Crop away the letterbox so only the photo itself is saved.
      const cropped = await (
        await ImageManipulator.manipulate(flat)
          .crop({
            originX: Math.round(((width - imgW) / 2) * ratio),
            originY: Math.round(((height - imgH) / 2) * ratio),
            width: Math.min(flatRef.width, Math.round(imgW * ratio)),
            height: Math.min(flatRef.height, Math.round(imgH * ratio)),
          })
          .renderAsync()
      ).saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
      const thumb = await (
        await ImageManipulator.manipulate(cropped.uri)
          .resize({ width: THUMB_WIDTH })
          .renderAsync()
      ).saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });

      const sizeBytes = new File(cropped.uri).size;
      const thumbSizeBytes = new File(thumb.uri).size;

      if (mode === "replace") {
        const urls = await replaceMediaImage({
          id: media.id,
          uri: cropped.uri,
          thumbUri: thumb.uri,
          sizeBytes,
          thumbSizeBytes,
          width: cropped.width,
          height: cropped.height,
        });
        onSaved({ mode: "replace", id: media.id, ...urls });
      } else {
        const row = await uploadAndCreateMedia({
          uri: cropped.uri,
          thumbUri: thumb.uri,
          sizeBytes,
          thumbSizeBytes,
          projectId,
          folderId: media.folder ?? null,
          mimeType: "image/jpeg",
          kind: "photo",
          width: cropped.width,
          height: cropped.height,
          capturedAt: media.date,
          description: media.description || null,
        });
        const urls = await signPaths([row.storage_path, row.thumb_path ?? ""]);
        const src = urls.get(row.storage_path);
        if (!src) throw new Error("Couldn't load the new photo.");
        onSaved({
          mode: "copy",
          afterId: media.id,
          item: {
            ...media,
            id: row.id,
            src,
            thumb: row.thumb_path ? urls.get(row.thumb_path) : undefined,
            size: sizeBytes / 1024 ** 2,
            storageBytes: sizeBytes + thumbSizeBytes,
          },
        });
      }
      onClose();
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmSave = () =>
    Alert.alert("Save edited photo", "Keep the original or replace it?", [
      { text: "Cancel", style: "cancel" },
      { text: "Save as new photo", onPress: () => save("copy") },
      {
        text: "Replace original",
        style: "destructive",
        onPress: () =>
          Alert.alert(
            "Replace original?",
            "This overwrites the photo and its thumbnail with your marked-up version. This can't be undone.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Replace",
                style: "destructive",
                onPress: () => save("replace"),
              },
            ],
          ),
      },
    ]);

  const confirmClose = () =>
    Alert.alert("Discard changes?", "Your markup won't be saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onClose },
    ]);

  return (
    <>
      <View style={styles.root}>
        <View ref={compositeRef} collapsable={false} style={{ width, height }}>
          {natural ? (
            <View
              style={[
                styles.imageBox,
                {
                  left: (width - imgW) / 2,
                  top: (height - imgH) / 2,
                  width: imgW,
                  height: imgH,
                },
              ]}
            >
              <Image
                source={{ uri: media.src }}
                style={StyleSheet.absoluteFill}
                contentFit="fill"
              />
            </View>
          ) : null}
          {natural ? (
            <MarkupOverlay
              key={media.id}
              active={markingUp}
              onDone={() => setMarkingUp(false)}
            />
          ) : null}
        </View>

        {!natural && (
          <View style={styles.center} pointerEvents="none">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
            onPress={confirmClose}
            disabled={saving}
            style={styles.pill}
          >
            <X size={20} color="#fff" />
          </Pressable>
          <View style={styles.topRight}>
            {!markingUp && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resume markup"
                onPress={() => setMarkingUp(true)}
                disabled={saving}
                style={styles.pill}
              >
                <PenLine size={20} color="#fff" />
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save edited photo"
              onPress={confirmSave}
              disabled={saving || !natural}
              style={[styles.pill, styles.savePill]}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>

        {saving && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.savingText}>Saving…</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  imageBox: { position: "absolute" },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  savingText: { color: "#fff", fontWeight: "600" },
  topBar: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topRight: { flexDirection: "row", gap: 8 },
  pill: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  savePill: { backgroundColor: "#fff" },
  saveText: { color: "#000", fontWeight: "700" },
});
