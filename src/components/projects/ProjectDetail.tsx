import { useInk, useThemedStyles, type Ink } from "@/hooks/use-themed-styles";
import { useSetTabBarHidden } from "@/components/TabBarVisibilityContext";
import MoveMediaModal, {
  type MoveDestination,
} from "@/components/projects/MoveMediaModal";
import NewFolderModal from "@/components/projects/NewFolderModal";
import PhotoEditor, { type PhotoEditResult } from "@/components/projects/PhotoEditor";
import ConfirmDeleteModal from "@/components/ui/confirm-delete-modal";
import ShareButton from "@/components/ui/share-button";
import type { Project, ProjectMedia } from "@/lib/library";
import { deleteMedia, deleteMediaMany, moveMediaMany } from "@/lib/media";
import { createFolder } from "@/lib/projects";
import { router } from "expo-router";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  FolderInput,
  FolderPlus,
  Maximize,
  Pencil,
  Play,
  X,
  Trash2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { runOnJS } from "react-native-worklets";

interface ProjectDetailProps {
  project: Project;
  allProjects: Project[];
  onBack: () => void;
  /** Opens the viewer on this media item when the project first mounts. */
  initialMediaId?: string | null;
  /** Called after a media item is deleted so the library can reload. */
  onMediaDeleted?: () => void;
  /** Called after a folder is created so the library can reload. */
  onFolderCreated?: () => void;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function ProjectDetail({
  project,
  allProjects,
  onBack,
  initialMediaId,
  onMediaDeleted,
  onFolderCreated,
}: ProjectDetailProps) {
  const styles = useStyles();
  const t = useInk();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [editing, setEditing] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [movingBulk, setMovingBulk] = useState(false);
  const insets = useSafeAreaInsets();
  const setTabBarHidden = useSetTabBarHidden();
  const sortedMedia = [...project.media].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const folders = project.folders ?? [];
  const folderIds = new Set(folders.map((folder) => folder.id));
  const unfiledMedia = sortedMedia.filter(
    (media) => !media.folder || !folderIds.has(media.folder),
  );

  const allOrdered = [
    ...folders.flatMap((folder) =>
      sortedMedia.filter((media) => media.folder === folder.id),
    ),
    ...unfiledMedia,
  ];

  const [viewer, setViewer] = useState<{
    items: ProjectMedia[];
    index: number;
  } | null>(() => {
    const index = initialMediaId
      ? allOrdered.findIndex((m) => m.id === initialMediaId)
      : -1;
    return index >= 0 ? { items: allOrdered, index } : null;
  });

  const toggleFolder = (id: string) =>
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    setTabBarHidden(viewer !== null || editing);
    return () => setTabBarHidden(false);
  }, [setTabBarHidden, viewer, editing]);

  const exitEditing = () => {
    setEditing(false);
    setSelected(new Set());
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteSelected = async () => {
    setBulkDeleting(true);
    try {
      await deleteMediaMany([...selected]);
      setConfirmingBulk(false);
      exitEditing();
      onMediaDeleted?.();
    } catch (e) {
      Alert.alert("Delete failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const singleSelected =
    selected.size === 1
      ? project.media.find((m) => m.id === [...selected][0])
      : undefined;

  const moveSelected = async ({ projectId, folderId }: MoveDestination) => {
    setMovingBulk(false);
    try {
      await moveMediaMany([...selected], projectId, folderId);
      exitEditing();
      onMediaDeleted?.();
    } catch (e) {
      Alert.alert("Move failed", e instanceof Error ? e.message : "Try again.");
    }
  };

  const renderTiles = (items: ProjectMedia[]) =>
    items.map((media) => (
      <Pressable
        key={media.id}
        accessibilityRole="button"
        accessibilityLabel={`${editing ? "Select" : "Open"} ${media.kind}, ${formatDate(media.date)}`}
        accessibilityState={editing ? { selected: selected.has(media.id) } : undefined}
        onPress={() =>
          editing
            ? toggleSelected(media.id)
            : setViewer({
                items: allOrdered,
                index: allOrdered.findIndex((item) => item.id === media.id),
              })
        }
        style={styles.mediaTile}
      >
        <Image
          source={{ uri: media.thumb ?? media.src }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
        {editing && (
          <View
            style={[
              styles.selectBadge,
              selected.has(media.id) && styles.selectBadgeOn,
            ]}
          >
            {selected.has(media.id) && <Check size={14} color="#fff" />}
          </View>
        )}
        {media.kind === "video" && (
          <View style={styles.videoBadge}>
            <Play size={11} color="#fff" fill="#fff" />
            {media.duration ? (
              <Text style={styles.videoDuration}>{media.duration}</Text>
            ) : null}
          </View>
        )}
      </Pressable>
    ));

  const { width } = useWindowDimensions();
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 250 });
  }, [translateX]);

  const edgeSwipeBack = Gesture.Pan()
    .activeOffsetX(10)
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > width * 0.35 || e.velocityX > 600) {
        translateX.value = withTiming(width, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onBack)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <GestureHandlerRootView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to projects"
            onPress={onBack}
            style={styles.backButton}
          >
            <ChevronLeft size={18} color={t.text} />
            <Text style={styles.backButtonText}>Projects</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerText}>
                <Text style={styles.client}>{project.client}</Text>
                <Text style={styles.title}>{project.name}</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Take a photo for ${project.name}`}
                  onPress={() =>
                    router.navigate({
                      pathname: "/camera",
                      params: { projectId: project.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.shareButton,
                    pressed && styles.shareButtonPressed,
                  ]}
                >
                  <Camera size={20} color={t.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add a folder to ${project.name}`}
                  onPress={() => setCreatingFolder(true)}
                  style={({ pressed }) => [
                    styles.shareButton,
                    pressed && styles.shareButtonPressed,
                  ]}
                >
                  <FolderPlus size={20} color={t.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    editing ? "Cancel selection" : `Edit ${project.name}`
                  }
                  onPress={() => (editing ? exitEditing() : setEditing(true))}
                  style={({ pressed }) => [
                    styles.shareButton,
                    pressed && styles.shareButtonPressed,
                  ]}
                >
                  {editing ? (
                    <X size={20} color={t.text} />
                  ) : (
                    <Pencil size={20} color={t.text} />
                  )}
                </Pressable>
                <ShareButton
                  label={`Share all files in ${project.name}`}
                  media={sortedMedia}
                  archiveName={project.name}
                />
              </View>
            </View>
            <View style={styles.projectMeta}>
              <View
                style={[styles.colorDot, { backgroundColor: project.color }]}
              />
              <Text style={styles.metaText}>
                {project.media.length}{" "}
                {project.media.length === 1 ? "item" : "items"} · Created{" "}
                {formatDate(project.created_date)}
              </Text>
            </View>
          </View>

          {folders.map((folder) => {
            const items = sortedMedia.filter(
              (media) => media.folder === folder.id,
            );
            const expanded = expandedFolders.has(folder.id);
            const Chevron = expanded ? ChevronUp : ChevronDown;
            return (
              <View key={folder.id} style={styles.folderSection}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`${folder.name} folder, ${items.length} items`}
                  onPress={() => toggleFolder(folder.id)}
                  style={styles.folderHeader}
                >
                  <View>
                    <Text style={styles.folderName}>{folder.name}</Text>
                    <Text style={styles.folderCount}>
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </Text>
                  </View>
                  <View style={styles.folderActions}>
                    <ShareButton
                      label={`Share ${folder.name} folder`}
                      media={items}
                      archiveName={`${project.name}-${folder.name}`}
                      small
                    />
                    {items.length > 3 && (
                      <Chevron size={20} color={t.ink(0.6)} />
                    )}
                  </View>
                </Pressable>
                {items.length === 0 ? (
                  <Text style={styles.folderEmpty}>
                    No items in this folder
                  </Text>
                ) : (
                  <View style={styles.mediaGrid}>
                    {expanded
                      ? renderTiles(items)
                      : renderTiles(items.slice(0, 3))}
                  </View>
                )}
              </View>
            );
          })}

          {(folders.length === 0 || unfiledMedia.length > 0) && (
            <View style={styles.folderSection}>
              {folders.length > 0 && (
                <Text style={styles.sectionTitle}>Unfiled</Text>
              )}
              {unfiledMedia.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No photos yet</Text>
                  <Text style={styles.emptyStateText}>
                    Media added to this project will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.mediaGrid}>
                  {renderTiles(unfiledMedia)}
                </View>
              )}
            </View>
          )}
        </ScrollView>
        {editing && (
          <View style={[styles.selectBar, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.selectCount}>{selected.size} selected</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Move selected"
              disabled={selected.size === 0}
              onPress={() => setMovingBulk(true)}
              style={[
                styles.selectMove,
                selected.size === 0 && styles.selectDeleteDisabled,
              ]}
            >
              <FolderInput size={18} color={t.text} />
              <Text style={styles.selectMoveText}>Move</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete selected"
              disabled={selected.size === 0}
              onPress={() => setConfirmingBulk(true)}
              style={[
                styles.selectDelete,
                selected.size === 0 && styles.selectDeleteDisabled,
              ]}
            >
              <Trash2 size={18} color="#fff" />
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </Pressable>
          </View>
        )}
        {movingBulk && (
          <MoveMediaModal
            visible
            projects={allProjects}
            // Only a single item has a "current" location to exclude.
            currentProjectId={singleSelected ? project.id : ""}
            currentFolderId={singleSelected?.folder ?? null}
            initialProjectId={project.id}
            onClose={() => setMovingBulk(false)}
            onMove={moveSelected}
          />
        )}
        <NewFolderModal
          visible={creatingFolder}
          onClose={() => setCreatingFolder(false)}
          onCreate={async (name) => {
            await createFolder(project.id, name);
            onFolderCreated?.();
          }}
        />
        <ConfirmDeleteModal
          visible={confirmingBulk}
          title={`Delete ${selected.size} ${selected.size === 1 ? "item" : "items"}?`}
          deleting={bulkDeleting}
          onCancel={() => setConfirmingBulk(false)}
          onConfirm={deleteSelected}
        />
        {viewer === null && (
          <GestureDetector gesture={edgeSwipeBack}>
            <View style={styles.edgeSwipeZone} />
          </GestureDetector>
        )}
        {viewer !== null && (
          <GalleryViewer
            media={viewer.items}
            projectName={project.name}
            projectId={project.id}
            allProjects={allProjects}
            initialIndex={viewer.index}
            onClose={() => setViewer(null)}
            onEdited={(result) => {
              onMediaDeleted?.();
              setViewer((v) => {
                if (!v) return v;
                if (result.mode === "replace") {
                  const { id, src, thumb } = result;
                  return {
                    ...v,
                    items: v.items.map((m) =>
                      m.id === id ? { ...m, src, thumb } : m,
                    ),
                  };
                }
                const at = v.items.findIndex((m) => m.id === result.afterId);
                const items = [...v.items];
                items.splice(at + 1, 0, result.item);
                return { ...v, items };
              });
            }}
            onDeleted={(id) => {
              onMediaDeleted?.();
              setViewer((v) => {
                if (!v) return v;
                const items = v.items.filter((m) => m.id !== id);
                return items.length
                  ? { items, index: Math.min(v.index, items.length - 1) }
                  : null;
              });
            }}
          />
        )}
      </GestureHandlerRootView>
    </Animated.View>
  );
}

function GalleryViewer({
  media,
  projectName,
  projectId,
  allProjects,
  initialIndex,
  onClose,
  onEdited,
  onDeleted,
}: {
  media: ProjectMedia[];
  projectName: string;
  projectId: string;
  allProjects: Project[];
  initialIndex: number;
  onClose: () => void;
  onEdited: (result: PhotoEditResult) => void;
  onDeleted: (id: string) => void;
}) {
  const styles = useStyles();
  const t = useInk();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [moving, setMoving] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const { width } = useWindowDimensions();
  const safeIndex = Math.min(currentIndex, media.length - 1);
  const currentMedia = media[safeIndex];
  const sameFolder = media.filter(
    (item) => (item.folder ?? null) === (currentMedia.folder ?? null),
  );
  const folderCount = sameFolder.length;
  const folderPosition =
    sameFolder.findIndex((item) => item.id === currentMedia.id) + 1;
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 250 });
  }, [translateX]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteMedia(currentMedia.id);
      setConfirmingDelete(false);
      onDeleted(currentMedia.id);
    } catch (e) {
      Alert.alert("Delete failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const slideOut = () => {
    translateX.value = withTiming(width, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const edgeSwipeBack = Gesture.Pan()
    .activeOffsetX(10)
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > width * 0.35 || e.velocityX > 600) {
        translateX.value = withTiming(width, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const panelY = useSharedValue(0);
  const panelHidden = useSharedValue(0);
  const panelStart = useSharedValue(0);

  const panelGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
    .onBegin(() => {
      panelStart.value = panelY.value;
    })
    .onUpdate((e) => {
      panelY.value = Math.min(
        panelHidden.value,
        Math.max(0, panelStart.value + e.translationY),
      );
    })
    .onEnd((e) => {
      const hide =
        e.velocityY > 500 ||
        (e.velocityY > -500 && panelY.value > panelHidden.value / 2);
      panelY.value = withSpring(hide ? panelHidden.value : 0, {
        velocity: e.velocityY,
      });
    });

  const togglePanel = () => {
    panelY.value = withTiming(panelY.value > 0 ? 0 : panelHidden.value, {
      duration: 220,
    });
  };

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelY.value }],
  }));

  return (
    <Animated.View style={[styles.gallery, styles.galleryCard, cardStyle]}>
      <FlatList
        data={media}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.galleryPage, { width }]}>
            <ZoomableGalleryImage
              media={item}
              projectName={projectName}
              onZoomChange={setIsZoomed}
              resetToken={resetToken}
            />
          </View>
        )}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        horizontal
        pagingEnabled
        scrollEnabled={!isZoomed}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        bounces
        style={styles.galleryPager}
        onMomentumScrollEnd={(event) => {
          setCurrentIndex(
            Math.max(
              0,
              Math.min(
                media.length - 1,
                Math.round(event.nativeEvent.contentOffset.x / width),
              ),
            ),
          );
          setIsZoomed(false);
        }}
      />
      <SafeAreaView
        style={styles.viewerOverlay}
        edges={["top", "bottom"]}
        pointerEvents="box-none"
      >
        {!isZoomed && (
          <GestureDetector gesture={panelGesture}>
            <Animated.View
              style={[styles.viewerDetails, panelStyle]}
              onLayout={(e) => {
                panelHidden.value = e.nativeEvent.layout.height - -5;
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show or hide details"
                hitSlop={8}
                onPress={togglePanel}
                style={styles.panelHandleArea}
              >
                <View style={styles.panelHandle} />
              </Pressable>
              <View style={styles.viewerDetailsRow}>
                <View style={styles.viewerHeading}>
                  <View style={styles.viewerSubtitle}>
                    <Text style={styles.viewerSubtitleText}>
                      {formatDate(currentMedia.date)} · {folderPosition} of{" "}
                      {folderCount}
                    </Text>
                  </View>
                  <Text style={styles.viewerProjectName}>{projectName}</Text>
                  {currentMedia.folder_tags.length > 0 ? (
                    <Text style={styles.viewerTags}>
                      {currentMedia.folder_tags.join(" · ")}
                    </Text>
                  ) : null}
                  {currentMedia.description ? (
                    <Text style={styles.viewerDescription}>
                      {currentMedia.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.viewerButtonRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to gallery"
                  onPress={slideOut}
                  style={styles.closeButton}
                >
                  <ChevronLeft size={24} color={t.text} />
                </Pressable>
                <View style={styles.viewerActionsRight}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit this ${currentMedia.kind}`}
                    onPress={() => {
                      if (currentMedia.kind !== "photo") {
                        Alert.alert("Can't edit", "Only photos can be marked up.");
                      } else if (currentMedia.storage !== "cloud") {
                        Alert.alert(
                          "Can't edit",
                          "Photos saved only on this device can't be edited here.",
                        );
                      } else {
                        setEditingPhoto(true);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.shareButton,
                      styles.viewerShareButton,
                      pressed && styles.shareButtonPressed,
                    ]}
                  >
                    <Pencil size={20} color={t.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move this ${currentMedia.kind}`}
                    onPress={() => setMoving(true)}
                    style={({ pressed }) => [
                      styles.shareButton,
                      styles.viewerShareButton,
                      pressed && styles.shareButtonPressed,
                    ]}
                  >
                    <FolderInput size={20} color={t.text} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete this ${currentMedia.kind}`}
                    onPress={() => setConfirmingDelete(true)}
                    style={({ pressed }) => [
                      styles.shareButton,
                      styles.viewerShareButton,
                      pressed && styles.shareButtonPressed,
                    ]}
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </Pressable>
                  <ShareButton
                    label={`Share this ${currentMedia.kind}`}
                    media={currentMedia}
                    style={styles.viewerShareButton}
                  />
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        )}
        {isZoomed && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset zoom"
            onPress={() => {
              setResetToken((token) => token + 1);
              setIsZoomed(false);
            }}
            style={({ pressed }) => [
              styles.screenshotIndicator,
              styles.resetZoomButton,
              pressed && styles.screenshotIndicatorPressed,
            ]}
          >
            <Maximize size={22} color={t.text} />
          </Pressable>
        )}
        {isZoomed && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Screenshot"
            style={({ pressed }) => [
              styles.screenshotIndicator,
              pressed && styles.screenshotIndicatorPressed,
            ]}
          >
            <Camera size={22} color={t.text} />
          </Pressable>
        )}
      </SafeAreaView>
      <PhotoEditor
        media={editingPhoto ? currentMedia : null}
        projectId={projectId}
        onClose={() => setEditingPhoto(false)}
        onSaved={onEdited}
      />
      {!isZoomed && (
        <GestureDetector gesture={edgeSwipeBack}>
          <View style={styles.edgeSwipeZone} />
        </GestureDetector>
      )}
      <ConfirmDeleteModal
        visible={confirmingDelete}
        title={`Delete this ${currentMedia.kind}?`}
        deleting={deleting}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={confirmDelete}
      />
      {moving && (
        <MoveMediaModal
          visible
          projects={allProjects}
          currentProjectId={projectId}
          currentFolderId={currentMedia.folder ?? null}
          onClose={() => setMoving(false)}
          onMove={() => setMoving(false)}
        />
      )}
    </Animated.View>
  );
}

function ZoomableGalleryImage({
  media,
  projectName,
  onZoomChange,
  resetToken,
}: {
  media: ProjectMedia;
  projectName: string;
  onZoomChange: (zoomed: boolean) => void;
  resetToken: number;
}) {
  const styles = useStyles();
  const [zoomed, setZoomed] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [sourceDimensions, setSourceDimensions] = useState({
    width: 0,
    height: 0,
  });
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const setZoomState = (value: boolean) => {
    setZoomed(value);
    onZoomChange(value);
  };

  useEffect(() => {
    if (resetToken === 0) return;
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    setZoomed(false);
  }, [resetToken, scale, savedScale, translateX, translateY]);

  const pan = Gesture.Pan()
    .enabled(zoomed)
    .maxPointers(1)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
        return;
      }
      const maxX = (dimensions.width * (scale.value - 1)) / 2;
      const maxY = (dimensions.height * (scale.value - 1)) / 2;
      translateX.value = Math.max(
        -maxX,
        Math.min(maxX, startX.value + event.translationX),
      );
      translateY.value = Math.max(
        -maxY,
        Math.min(maxY, startY.value + event.translationY),
      );
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      runOnJS(setZoomState)(true);
    })
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(4, savedScale.value * event.scale));
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      const isAwayFromDefault = Math.abs(scale.value - 1) >= 0.01;
      if (!isAwayFromDefault) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
      runOnJS(setZoomState)(isAwayFromDefault);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (Math.abs(scale.value - 1) > 0.01) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(setZoomState)(false);
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
        runOnJS(setZoomState)(true);
      }
    });

  const imageTransform = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));
  const imageGestures = Gesture.Simultaneous(pan, pinch, doubleTap);
  const coverScale =
    sourceDimensions.width > 0 && sourceDimensions.height > 0
      ? Math.max(
          dimensions.width / sourceDimensions.width,
          dimensions.height / sourceDimensions.height,
        )
      : 0;
  const imageWidth =
    coverScale > 0 ? sourceDimensions.width * coverScale : dimensions.width;
  const imageHeight =
    coverScale > 0 ? sourceDimensions.height * coverScale : dimensions.height;

  return (
    <View
      style={styles.galleryImageFrame}
      onLayout={(event) => {
        setDimensions({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        });
      }}
    >
      <GestureDetector gesture={imageGestures}>
        <Animated.Image
          source={{ uri: media.src }}
          style={[
            styles.viewerImage,
            { width: imageWidth, height: imageHeight },
            imageTransform,
          ]}
          resizeMode="cover"
          onLoad={(event) => {
            const { width, height } = event.nativeEvent.source;
            if (width > 0 && height > 0) {
              setSourceDimensions({ width, height });
            }
          }}
          accessibilityLabel={`${media.kind} from ${projectName}`}
        />
      </GestureDetector>
      {media.kind === "video" && (
        <View pointerEvents="none" style={styles.viewerVideoBadge}>
          <Play size={20} color="#fff" fill="#fff" />
          {media.duration ? (
            <Text style={styles.viewerVideoDuration}>{media.duration}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const createStyles = (t: Ink) =>
  StyleSheet.create({
    galleryCard: {
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: -4, height: 0 },
      elevation: 16,
    },
    card: {
      ...StyleSheet.absoluteFill,
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: -4, height: 0 },
      elevation: 16,
    },
    edgeSwipeZone: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: 24,
    },
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    scrollContent: {
      paddingHorizontal: 10,
      paddingTop: 50,
      paddingBottom: 24,
    },
    backButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingVertical: 8,
      paddingRight: 14,
      paddingLeft: 6,
      borderRadius: 20,
      backgroundColor: t.ink(0.1),
    },
    backButtonText: {
      color: t.text,
      fontSize: 14,
      fontWeight: "600",
    },
    header: {
      marginTop: 24,
      marginBottom: 26,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    headerText: {
      flex: 1,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    shareButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: t.ink(0.12),
    },
    shareButtonPressed: {
      backgroundColor: t.ink(0.28),
      transform: [{ scale: 0.92 }],
    },
    viewerShareButton: {
      marginLeft: 0,
    },
    viewerActions: {
      flexDirection: "column",
      gap: 8,
      padding: 8,
      borderRadius: 16,
      backgroundColor: t.ink(0.08),
    },
    client: {
      marginBottom: 5,
      color: t.ink(0.5),
      fontFamily: "monospace",
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    title: {
      color: t.text,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    projectMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 10,
    },
    colorDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    metaText: {
      color: t.ink(0.5),
      fontFamily: "monospace",
      fontSize: 11,
    },
    sectionTitle: {
      marginBottom: 12,
      color: t.ink(0.7),
      fontSize: 14,
      fontWeight: "600",
    },
    confirmDeleteText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    selectBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    selectBadgeOn: { backgroundColor: t.accent, borderColor: t.accent },
    selectBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: t.sheet,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.ink(0.15),
    },
    selectCount: { color: t.text, fontSize: 15, fontWeight: "600" },
    selectMove: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: t.ink(0.1),
    },
    selectMoveText: { color: t.text, fontSize: 15, fontWeight: "700" },
    selectDelete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 44,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: "#ef4444",
    },
    selectDeleteDisabled: { opacity: 0.4 },
    folderSection: {
      marginBottom: 22,
    },
    folderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    folderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 24,
    },
    folderEmpty: {
      color: t.ink(0.4),
      fontSize: 12,
    },
    folderName: {
      color: t.text,
      fontSize: 15,
      fontWeight: "700",
    },
    folderCount: {
      marginTop: 3,
      color: t.ink(0.4),
      fontFamily: "monospace",
      fontSize: 10,
    },
    mediaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 6,
      rowGap: 6,
    },
    mediaTile: {
      position: "relative",
      width: "31.8%",
      aspectRatio: 1,
      overflow: "hidden",
      borderRadius: 12,
      backgroundColor: t.ink(0.08),
    },
    mediaImage: {
      width: "100%",
      height: "100%",
    },
    videoBadge: {
      position: "absolute",
      right: 6,
      bottom: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "rgba(0,0,0,0.65)",
    },
    videoDuration: {
      color: "#fff",
      fontFamily: "monospace",
      fontSize: 10,
    },
    emptyState: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 44,
      borderRadius: 22,
      backgroundColor: t.ink(0.08),
    },
    emptyStateTitle: {
      color: t.text,
      fontSize: 16,
      fontWeight: "700",
    },
    emptyStateText: {
      marginTop: 6,
      color: t.ink(0.5),
      fontSize: 13,
      textAlign: "center",
    },
    gallery: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1,
      flex: 1,
      backgroundColor: t.bg,
    },
    galleryPager: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    galleryPage: {
      height: "100%",
    },
    viewerOverlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: "flex-end",
    },
    viewerHeading: {
      flex: 1,
    },
    viewerTitle: {
      color: t.text,
      fontSize: 16,
      fontWeight: "700",
    },
    viewerSubtitle: {
      marginBottom: 5,
      fontSize: 12,
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    viewerSubtitleText: {
      color: t.ink(0.5),
      fontSize: 12,
    },
    closeButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: t.ink(0.12),
    },
    galleryImageFrame: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      backgroundColor: t.bg,
    },
    viewerImage: {
      alignSelf: "center",
    },
    viewerVideoBadge: {
      position: "absolute",
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: "rgba(0,0,0,0.65)",
    },
    viewerVideoDuration: {
      color: "#fff",
      fontFamily: "monospace",
      fontSize: 13,
    },
    viewerDetailsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    viewerButtonRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
    },
    viewerActionsRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    panelHandleArea: {
      alignItems: "center",
      height: 22,
      justifyContent: "flex-start",
    },
    panelHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: t.ink(0.6),
    },
    viewerDetails: {
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 2,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 12,
      borderRadius: 16,
      backgroundColor: t.isDark ? "rgba(0,0,0,0.58)" : "rgba(255,255,255,0.85)",
    },
    screenshotIndicator: {
      position: "absolute",
      bottom: 28,
      right: 28,
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 24,
      backgroundColor: t.ink(0.18),
      borderWidth: 1,
      borderColor: t.ink(0.25),
    },
    resetZoomButton: {
      right: undefined,
      left: 28,
    },
    screenshotIndicatorPressed: {
      backgroundColor: t.ink(0.32),
      borderColor: t.ink(0.45),
      transform: [{ scale: 0.92 }],
    },
    viewerProjectName: {
      color: t.text,
      fontSize: 15,
      fontWeight: "600",
    },
    viewerTags: {
      marginTop: 5,
      color: t.ink(0.55),
      fontSize: 12,
    },
    viewerDescription: {
      marginTop: 5,
      color: t.ink(0.8),
      fontSize: 12,
      lineHeight: 16,
    },
  });

const useStyles = () => useThemedStyles(createStyles);
