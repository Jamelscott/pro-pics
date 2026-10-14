import {
  Alert,
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import BottomSheetModal from "@/components/ui/bottom-sheet-modal";
import { useInk, useThemedStyles, type Ink } from "@/hooks/use-themed-styles";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react-native";
import { useState } from "react";

export interface MoveTarget {
  id: string;
  name: string;
  color: string;
  folders?: { id: string; name: string }[];
}

export interface MoveDestination {
  projectId: string;
  folderId: string | null;
}

interface MoveMediaModalProps {
  visible: boolean;
  title?: string;
  confirmLabel?: string;
  projects: MoveTarget[];
  currentProjectId: string;
  currentFolderId: string | null;
  /** Project to open and preselect, without marking it as the current location. */
  initialProjectId?: string;
  onClose: () => void;
  onMove: (destination: MoveDestination) => void;
  /** When provided, the project list shows a "New project" row. */
  onCreateProject?: () => void;
  /** When provided, a project's folder list shows a "New folder" row. Resolves with the created folder. */
  onCreateFolder?: (
    projectId: string,
    name: string,
  ) => Promise<{ id: string; name: string }>;
}

export default function MoveMediaModal({
  visible,
  title = "Move to",
  confirmLabel = "Move here",
  projects,
  currentProjectId,
  currentFolderId,
  initialProjectId,
  onClose,
  onMove,
  onCreateProject,
  onCreateFolder,
}: MoveMediaModalProps) {
  const styles = useThemedStyles(createStyles);
  const t = useInk();
  // null shows the list of all projects; otherwise the folders of that project
  const [browsingProjectId, setBrowsingProjectId] = useState<string | null>(
    initialProjectId ?? currentProjectId,
  );
  const [destination, setDestination] = useState<MoveDestination>({
    projectId: initialProjectId ?? currentProjectId,
    folderId: currentFolderId,
  });

  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);

  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (name: string) => name.toLowerCase().includes(q);
  const browse = (id: string | null) => {
    setBrowsingProjectId(id);
    setQuery("");
    setAddingFolder(false);
    setFolderName("");
  };

  const browsingProject = projects.find((p) => p.id === browsingProjectId);
  const isCurrent = (projectId: string, folderId: string | null) =>
    projectId === currentProjectId && folderId === currentFolderId;
  const isSelected = (projectId: string, folderId: string | null) =>
    destination.projectId === projectId && destination.folderId === folderId;
  const unchanged = isCurrent(destination.projectId, destination.folderId);

  const submitFolder = async () => {
    const name = folderName.trim();
    if (!name || !browsingProject || !onCreateFolder || savingFolder) return;
    setSavingFolder(true);
    try {
      const folder = await onCreateFolder(browsingProject.id, name);
      setDestination({ projectId: browsingProject.id, folderId: folder.id });
      setAddingFolder(false);
      setFolderName("");
    } catch (e) {
      Alert.alert(
        "Couldn't create folder",
        e instanceof Error ? e.message : "Try again.",
      );
    } finally {
      setSavingFolder(false);
    }
  };

  const renderOption = (
    projectId: string,
    folderId: string | null,
    label: string,
  ) => {
    const selected = isSelected(projectId, folderId);
    return (
      <Pressable
        key={folderId ?? "root"}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => setDestination({ projectId, folderId })}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Text style={styles.rowLabel}>{label}</Text>
        {isCurrent(projectId, folderId) && (
          <Text style={styles.currentTag}>Current</Text>
        )}
        {selected && <Check size={18} color={t.accent} />}
      </Pressable>
    );
  };

  return (
    <BottomSheetModal
      visible={visible}
      title={browsingProject ? browsingProject.name : title}
      onClose={onClose}
    >
      {browsingProject ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to all projects"
          onPress={() => browse(null)}
          style={styles.backRow}
        >
          <ChevronLeft size={18} color={t.ink(0.7)} />
          <Text style={styles.backText}>All projects</Text>
        </Pressable>
      ) : null}

      <View style={styles.searchBox}>
        <Search size={16} color={t.ink(0.5)} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={browsingProject ? "Search folders" : "Search projects"}
          placeholderTextColor={t.ink(0.4)}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {browsingProject ? (
          <>
            {onCreateFolder &&
              (addingFolder ? (
                <View style={styles.row}>
                  <TextInput
                    autoFocus
                    value={folderName}
                    onChangeText={setFolderName}
                    onSubmitEditing={submitFolder}
                    editable={!savingFolder}
                    placeholder="Folder name"
                    placeholderTextColor={t.ink(0.4)}
                    returnKeyType="done"
                    style={styles.searchInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Create folder"
                    disabled={!folderName.trim() || savingFolder}
                    onPress={submitFolder}
                  >
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: t.accent },
                        (!folderName.trim() || savingFolder) && { opacity: 0.4 },
                      ]}
                    >
                      Add
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create new folder"
                  onPress={() => setAddingFolder(true)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Plus size={16} color={t.accent} />
                  <Text style={styles.rowLabel}>New folder</Text>
                </Pressable>
              ))}
            {matches("Project root") &&
              renderOption(browsingProject.id, null, "Project root")}
            {(browsingProject.folders ?? [])
              .filter((folder) => matches(folder.name))
              .map((folder) =>
                renderOption(browsingProject.id, folder.id, folder.name),
              )}
          </>
        ) : (
          <>
            {onCreateProject && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create new project"
                onPress={onCreateProject}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                <Plus size={16} color={t.accent} />
                <Text style={styles.rowLabel}>New project</Text>
              </Pressable>
            )}
            {projects
              .filter((project) => matches(project.name))
              .map((project) => (
                <Pressable
                  key={project.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${project.name}`}
                  onPress={() => browse(project.id)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: project.color },
                    ]}
                  />
                  <Text style={styles.rowLabel}>{project.name}</Text>
                  {destination.projectId === project.id && (
                    <Check size={18} color={t.accent} />
                  )}
                  <ChevronRight size={18} color={t.ink(0.5)} />
                </Pressable>
              ))}
          </>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={unchanged}
        onPress={() => onMove(destination)}
        style={[styles.moveButton, unchanged && styles.moveButtonDisabled]}
      >
        <Text style={styles.moveButtonText}>{confirmLabel}</Text>
      </Pressable>
    </BottomSheetModal>
  );
}

const createStyles = (t: Ink) =>
  StyleSheet.create({
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 4,
    },
    backText: {
      color: t.ink(0.7),
      fontSize: 14,
      fontWeight: "600",
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: t.ink(0.06),
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      color: t.text,
      fontSize: 15,
    },
    list: {
      maxHeight: 320,
    },
    listContent: {
      gap: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: t.ink(0.06),
    },
    rowPressed: {
      backgroundColor: t.ink(0.14),
    },
    rowLabel: {
      flex: 1,
      color: t.text,
      fontSize: 15,
      fontWeight: "600",
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    currentTag: {
      color: t.ink(0.45),
      fontSize: 11,
      fontFamily: "monospace",
    },
    moveButton: {
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: "#7dd3fc",
    },
    moveButtonDisabled: {
      opacity: 0.35,
    },
    moveButtonText: {
      color: "#111318",
      fontSize: 15,
      fontWeight: "700",
    },
  });
