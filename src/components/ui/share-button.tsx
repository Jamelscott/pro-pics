import {
  StyleSheet,
  Alert,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share2 } from "lucide-react-native";
import { useState } from "react";
import { useInk, useThemedStyles, type Ink } from "@/hooks/use-themed-styles";
import { zip } from "react-native-zip-archive";

interface ShareableMedia {
  id: string;
  kind: "photo" | "video";
  src: string;
}

interface ShareButtonProps {
  label: string;
  media?: ShareableMedia | ShareableMedia[];
  archiveName?: string;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

const toPath = (uri: string) =>
  decodeURIComponent(uri.replace(/^file:\/\//, ""));

const extensionFor = (item: ShareableMedia) =>
  item.kind === "video" ? "mp4" : "jpg";

const toLocalFile = async (item: ShareableMedia, destination: File) => {
  if (!/^https?:\/\//i.test(item.src)) return new File(item.src);
  return File.downloadFileAsync(item.src, destination, { idempotent: true });
};

const buildArchive = async (items: ShareableMedia[], archiveName: string) => {
  const name = sanitize(archiveName);
  const folder = new Directory(Paths.cache, `share-${name}`);
  if (folder.exists) folder.delete();
  folder.create();

  const results = await Promise.allSettled(
    items.map(async (item, index) => {
      const fileName = `${String(index + 1).padStart(3, "0")}-${sanitize(item.id)}.${extensionFor(item)}`;
      const destination = new File(folder, fileName);
      const local = await toLocalFile(item, destination);
      if (local.uri !== destination.uri) local.copy(destination);
    }),
  );
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length === items.length) throw failed[0].reason;
  if (failed.length > 0) {
    console.warn(`${failed.length} of ${items.length} files skipped`, failed);
  }

  const archive = new File(Paths.cache, `${name}.zip`);
  if (archive.exists) archive.delete();
  await zip(toPath(folder.uri), toPath(archive.uri), { compressionLevel: 0 });
  folder.delete();
  return archive.uri;
};

export default function ShareButton({
  label,
  media,
  archiveName = "pro-pics-share",
  small,
  style,
}: ShareButtonProps) {
  const styles = useThemedStyles(createStyles);
  const t = useInk();
  const [isSharing, setIsSharing] = useState(false);
  const items =
    media === undefined ? [] : Array.isArray(media) ? media : [media];
  const disabled = isSharing || (media !== undefined && items.length === 0);

  const shareMedia = async () => {
    if (items.length === 0 || isSharing) return;

    setIsSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not available on this device.",
        );
        return;
      }

      if (items.length === 1) {
        const [item] = items;
        const local = await toLocalFile(
          item,
          new File(
            Paths.cache,
            `share-${sanitize(item.id)}.${extensionFor(item)}`,
          ),
        );
        await Sharing.shareAsync(local.uri, {
          mimeType: item.kind === "video" ? "video/*" : "image/*",
          UTI: item.kind === "video" ? "public.movie" : "public.image",
        });
        return;
      }

      const uri = await buildArchive(items, archiveName);
      await Sharing.shareAsync(uri, {
        mimeType: "application/zip",
        UTI: "public.zip-archive",
      });
    } catch (error) {
      console.error("Failed to share media", error);
      Alert.alert("Unable to share", "These files could not be shared.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isSharing, disabled }}
      disabled={disabled}
      onPress={media !== undefined ? shareMedia : undefined}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        style,
        disabled && styles.sharing,
        pressed && (small ? styles.pressedSmall : styles.pressed),
      ]}
    >
      <Share2 size={20} color={small ? t.ink(0.6) : t.text} />
    </Pressable>
  );
}

const createStyles = (t: Ink) =>
  StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: t.ink(0.12),
    },
    buttonSmall: {
      width: 20,
      height: 20,
      borderRadius: 0,
      backgroundColor: "transparent",
    },
    pressed: {
      backgroundColor: t.ink(0.28),
      transform: [{ scale: 0.92 }],
    },
    pressedSmall: {
      backgroundColor: "transparent",
      opacity: 0.5,
      transform: [{ scale: 0.92 }],
    },
    sharing: {
      opacity: 0.5,
    },
  });
