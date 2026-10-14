import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { MarkupOverlay } from "@/components/camera/MarkupOverlay";
import { useSetTabBarHidden } from "@/components/TabBarVisibilityContext";
import { ThemedText } from "@/components/ui/scaffolding/themed-text";
import { ThemedView } from "@/components/ui/scaffolding/themed-view";
import SavedToast from "@/components/camera/SavedToast";
import StorageLimitModal from "@/components/camera/StorageLimitModal";
import { useUser } from "@/context/UserContext";
import MoveMediaModal, {
  type MoveDestination,
} from "@/components/projects/MoveMediaModal";
import NewProjectModal from "@/components/projects/NewProjectModal";
import { Spacing } from "@/constants/theme";
import { useLibrary } from "@/lib/library";
import { createFolder, createProject } from "@/lib/projects";
import { saveToCameraRoll } from "@/lib/localMedia";
import { uploadAndCreateMedia } from "@/lib/mediaUpload";

const THUMB_WIDTH = 400;

const pillStyle = ({ pressed }: PressableStateCallbackType) => [
  styles.pill,
  pressed && styles.pillPressed,
];

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [markingUp, setMarkingUp] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<"cloud" | "device">("cloud");
  const [creatingProject, setCreatingProject] = useState(false);
  const { projects, setProjects } = useLibrary();
  const { projectId: startProjectId } = useLocalSearchParams<{
    projectId?: string;
  }>();
  const [uploading, setUploading] = useState(false);
  const [storageFullOpen, setStorageFullOpen] = useState(false);
  const { storage } = useUser();
  const [savedToast, setSavedToast] = useState<{
    mediaId: string;
    projectId: string;
    thumbUri: string;
  } | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const compositeRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const setTabBarHidden = useSetTabBarHidden();

  useEffect(() => {
    if (!savedToast) return;
    const timer = setTimeout(() => setSavedToast(null), 2000);
    return () => clearTimeout(timer);
  }, [savedToast]);

  useFocusEffect(
    useCallback(() => {
      setTabBarHidden(true);
      return () => setTabBarHidden(false);
    }, [setTabBarHidden]),
  );

  if (!permission) {
    return <ThemedView style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.message}>
          We need your permission to use the camera.
        </ThemedText>
        <Pressable style={styles.textButton} onPress={requestPermission}>
          <ThemedText type="link">Grant permission</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const takePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo) setPhotoUri(photo.uri);
  };

  const saveMedia = async ({ projectId, folderId }: MoveDestination) => {
    setPickerOpen(false);
    if (!compositeRef.current || uploading) return;
    setUploading(true);
    try {
      // Flatten the photo and its markup layer into one image.
      const uri = await captureRef(compositeRef, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });

      if (saveMode === "device") {
        const row = await saveToCameraRoll({
          uri,
          projectId,
          folderId,
          mimeType: "image/jpeg",
          kind: "photo",
          capturedAt: new Date().toISOString(),
        });
        setSavedToast({ mediaId: row.id, projectId, thumbUri: uri });
        setPhotoUri(null);
        setMarkingUp(false);
        setSaveOpen(false);
        router.setParams({ projectId: undefined });
        return;
      }

      const thumb = await (
        await ImageManipulator.manipulate(uri)
          .resize({ width: THUMB_WIDTH })
          .renderAsync()
      ).saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });

      const sizeBytes = new File(uri).size;
      const thumbSizeBytes = new File(thumb.uri).size;
      if (
        storage.limitBytes > 0 &&
        storage.usedBytes + sizeBytes + thumbSizeBytes > storage.limitBytes
      ) {
        setStorageFullOpen(true);
        return;
      }

      const media = await uploadAndCreateMedia({
        uri,
        thumbUri: thumb.uri,
        sizeBytes,
        thumbSizeBytes,
        projectId,
        folderId,
        mimeType: "image/jpeg",
        kind: "photo",
        capturedAt: new Date().toISOString(),
      });
      setSavedToast({
        mediaId: media.id,
        projectId,
        thumbUri: thumb.uri,
      });
      setPhotoUri(null);
      setMarkingUp(false);
      setSaveOpen(false);
      router.setParams({ projectId: undefined });
    } catch (e) {
      Alert.alert(saveMode === "device" ? "Save failed" : "Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProject = async (
    name: string,
    client: string,
    color: string,
  ) => {
    try {
      const row = await createProject({ name, client, color });
      setProjects((prev) => [
        ...prev,
        { id: row.id, name, client, color, created_date: "", media: [] },
      ]);
      setCreatingProject(false);
      await saveMedia({ projectId: row.id, folderId: null });
    } catch (e) {
      Alert.alert(
        "Couldn't create project",
        e instanceof Error ? e.message : "Try again.",
      );
    }
  };

  const handleCreateFolder = async (projectId: string, name: string) => {
    const folder = await createFolder(projectId, name);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, folders: [...(p.folders ?? []), folder] }
          : p,
      ),
    );
    return folder;
  };

  const railStyle = { bottom: insets.bottom + Spacing.three };

  const icon = (
    label: string,
    name: { ios: SFSymbol; android: string; web: string },
    onPress: () => void,
    accent?: boolean,
  ) => (
    <Pressable
      accessibilityLabel={label}
      style={(state) => [pillStyle(state), accent && styles.accent]}
      onPress={onPress}
    >
      <SymbolView
        name={name as never}
        tintColor="#fff"
        size={22}
        style={styles.icon}
      />
    </Pressable>
  );

  const saveOption = (
    label: string,
    ios: SFSymbol,
    android: string,
    onPress: () => void,
  ) => (
    <Pressable
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.saveOption,
        pressed && styles.pillPressed,
      ]}
      onPress={() => {
        setSaveOpen(false);
        onPress();
      }}
    >
      <SymbolView
        name={{ ios, android, web: android } as never}
        tintColor="#fff"
        size={20}
      />
      <ThemedText numberOfLines={1} style={styles.saveOptionText}>
        {label}
      </ThemedText>
    </Pressable>
  );

  const backButton = (
    <View style={[styles.topLeft, { top: insets.top + Spacing.three }]}>
      {icon(
        "Back",
        { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
        () => {
          router.setParams({ projectId: undefined });
          router.navigate(startProjectId ? "/projects" : "/");
        },
      )}
    </View>
  );

  if (photoUri) {
    return (
      <View style={styles.fill}>
        <View ref={compositeRef} collapsable={false} style={styles.fill}>
          <Image
            source={{ uri: photoUri }}
            style={styles.fill}
            contentFit="cover"
          />
          <MarkupOverlay
            key={photoUri}
            active={markingUp}
            onDone={() => setMarkingUp(false)}
          />
        </View>
        <MoveMediaModal
          key={`${pickerOpen}-${startProjectId ?? ""}`}
          visible={pickerOpen}
          title="Save to project"
          confirmLabel={uploading ? "Saving…" : "Save here"}
          projects={projects}
          currentProjectId=""
          initialProjectId={startProjectId}
          currentFolderId={null}
          onClose={() => setPickerOpen(false)}
          onMove={saveMedia}
          onCreateFolder={handleCreateFolder}
          onCreateProject={() => {
            setPickerOpen(false);
            setCreatingProject(true);
          }}
        />
        <StorageLimitModal
          visible={storageFullOpen}
          onClose={() => setStorageFullOpen(false)}
        />
        {uploading && (
          <View style={styles.savingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        <NewProjectModal
          visible={creatingProject}
          onClose={() => {
            setCreatingProject(false);
            setPickerOpen(true);
          }}
          onCreate={handleCreateProject}
        />
        {!markingUp && (
          <>
            {backButton}
            <View style={[styles.rightRail, railStyle]}>
              {icon(
                "Markup",
                { ios: "pencil.tip.crop.circle", android: "edit", web: "edit" },
                () => setMarkingUp(true),
              )}
              {icon(
                "Retake",
                {
                  ios: "arrow.counterclockwise",
                  android: "refresh",
                  web: "refresh",
                },
                () => {
                  setSaveOpen(false);
                  setPhotoUri(null);
                },
              )}
              <View style={styles.saveWrap}>
                {saveOpen && (
                  <View style={styles.saveMenu}>
                    {saveOption(
                      "Save to device",
                      "square.and.arrow.down",
                      "download",
                      () => {
                        setSaveMode("device");
                        setPickerOpen(true);
                      },
                    )}
                    {saveOption(
                      "Save to cloud",
                      "icloud.and.arrow.up",
                      "cloud_upload",
                      () => {
                        setSaveMode("cloud");
                        setPickerOpen(true);
                      },
                    )}
                  </View>
                )}
                {icon(
                  "Save",
                  {
                    ios: "square.and.arrow.down",
                    android: "save",
                    web: "save",
                  },
                  () => setSaveOpen((o) => !o),
                  true,
                )}
              </View>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView ref={cameraRef} style={styles.fill} facing={facing} />
      {backButton}
      <View
        style={[styles.shutterWrap, { bottom: insets.bottom + Spacing.three }]}
      >
        <Pressable
          accessibilityLabel="Take photo"
          style={styles.shutterOuter}
          onPress={takePhoto}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
      {savedToast && (
        <SavedToast
          thumbUri={savedToast.thumbUri}
          bottom={insets.bottom + Spacing.three}
          onPress={() => {
            const { projectId, mediaId } = savedToast;
            setSavedToast(null);
            router.navigate({
              pathname: "/projects",
              params: { projectId, mediaId },
            });
          }}
        />
      )}
      <View style={[styles.rightRail, railStyle]}>
        {icon(
          "Flip camera",
          {
            ios: "arrow.triangle.2.circlepath.camera",
            android: "flip_camera_ios",
            web: "flip_camera_ios",
          },
          () => setFacing((f) => (f === "back" ? "front" : "back")),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  savingOverlay: {
    ...StyleSheet.absoluteFill as object,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
  message: { textAlign: "center" },
  textButton: { padding: Spacing.two },
  topLeft: { position: "absolute", left: Spacing.three },
  rightRail: {
    position: "absolute",
    right: Spacing.three,
    gap: Spacing.three,
  },
  saveWrap: { alignItems: "flex-end" },
  saveMenu: {
    position: "absolute",
    right: "100%",
    bottom: 0,
    width: 200,
    marginRight: Spacing.two,
    padding: Spacing.one,
    gap: Spacing.one,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(90,90,98,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  saveOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
  },
  saveOptionText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  shutterWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  pill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(110,110,118,0.75)",
  },
  icon: { width: 24, height: 24 },
  accent: { backgroundColor: "#0a84ff" },
  pillPressed: {
    backgroundColor: "rgba(255,255,255,0.35)",
    transform: [{ scale: 0.95 }],
  },
});
