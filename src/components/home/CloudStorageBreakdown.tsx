import BottomSheetModal from "@/components/ui/bottom-sheet-modal";
import { useInk } from "@/hooks/use-themed-styles";
import type { Project } from "@/lib/library";
import { Folder, FolderOpen } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

interface CloudStorageBreakdownProps {
  visible: boolean;
  projects: Project[];
  usedBytes: number;
  onClose: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 ** 2) return `${(bytes / 1000).toFixed(1)} KB`;
  if (bytes < 1000 ** 3) return `${(bytes / 1000 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1000 ** 3).toFixed(2)} GB`;
};

export default function CloudStorageBreakdown({
  visible,
  projects,
  usedBytes,
  onClose,
}: CloudStorageBreakdownProps) {
  const ink = useInk();
  const { height } = useWindowDimensions();
  const styles = createStyles(ink);
  const groups = projects
    .map((project) => {
      const media = project.media.filter((item) => item.storage === "cloud");
      const folderNames = new Map(
        (project.folders ?? []).map((folder) => [folder.id, folder.name]),
      );
      const folders = new Map<
        string,
        { id: string; name: string; bytes: number; count: number }
      >();

      for (const item of media) {
        const folderId = item.folder ?? "";
        const folderName = item.folder
          ? (folderNames.get(item.folder) ?? "Other")
          : "Unfiled";
        const group = folders.get(folderId) ?? {
          id: folderId,
          name: folderName,
          bytes: 0,
          count: 0,
        };
        group.bytes += item.storageBytes;
        group.count += 1;
        folders.set(folderId, group);
      }

      const folderRows = [...folders.values()]
        .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));

      return {
        id: project.id,
        name: project.name,
        bytes: folderRows.reduce((sum, folder) => sum + folder.bytes, 0),
        count: media.length,
        folders: folderRows,
      };
    })
    .filter((project) => project.count > 0)
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));

  return (
    <BottomSheetModal
      visible={visible}
      title="Cloud storage"
      onClose={onClose}
    >
      <Text style={styles.summary}>
        {formatSize(usedBytes)} used in your account
      </Text>
      <Text style={styles.caption}>
        Usage is grouped by project and folder. Project sizes use recorded
        original and thumbnail file sizes.
      </Text>
      <ScrollView
        style={{ maxHeight: height * 0.58 }}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <FolderOpen size={22} color={ink.ink(0.5)} />
            <Text style={styles.emptyText}>No cloud media yet.</Text>
          </View>
        ) : (
          groups.map((project) => (
            <View key={project.id} style={styles.project}>
              <View style={styles.projectRow}>
                <Text style={styles.projectName} numberOfLines={1}>
                  {project.name}
                </Text>
                <Text style={styles.projectSize}>
                  {formatSize(project.bytes)}
                </Text>
              </View>
              <Text style={styles.itemCount}>
                {project.count} {project.count === 1 ? "item" : "items"}
              </Text>
              {project.folders.map((folder) => (
                <View key={folder.id} style={styles.folderRow}>
                  <Folder size={15} color={ink.ink(0.55)} />
                  <Text style={styles.folderName} numberOfLines={1}>
                    {folder.name}
                  </Text>
                  <Text style={styles.folderCount}>{folder.count}</Text>
                  <Text style={styles.folderSize}>
                    {formatSize(folder.bytes)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.noteRow}>
        <Text style={styles.note}>
          Projects and folders are sorted by storage used.
        </Text>
      </View>
    </BottomSheetModal>
  );
}

const createStyles = (ink: ReturnType<typeof useInk>) =>
  StyleSheet.create({
    summary: {
      color: ink.text,
      fontSize: 18,
      fontWeight: "700",
    },
    caption: {
      color: ink.ink(0.6),
      fontSize: 13,
      lineHeight: 18,
      marginTop: -8,
    },
    empty: {
      alignItems: "center",
      gap: 8,
      paddingVertical: 28,
    },
    emptyText: {
      color: ink.ink(0.6),
      fontSize: 14,
    },
    project: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ink.ink(0.12),
    },
    projectRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    projectName: {
      color: ink.text,
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
    },
    projectSize: {
      color: ink.text,
      fontSize: 14,
      fontWeight: "600",
    },
    itemCount: {
      color: ink.ink(0.5),
      fontSize: 11,
      marginTop: 3,
    },
    folderRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
      paddingLeft: 10,
    },
    folderName: {
      color: ink.ink(0.75),
      flex: 1,
      fontSize: 13,
    },
    folderCount: {
      color: ink.ink(0.45),
      fontSize: 11,
      minWidth: 18,
      textAlign: "right",
    },
    folderSize: {
      color: ink.ink(0.75),
      fontSize: 12,
      minWidth: 54,
      textAlign: "right",
    },
    noteRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      paddingTop: 12,
    },
    note: {
      color: ink.ink(0.45),
      fontSize: 11,
    },
  });
