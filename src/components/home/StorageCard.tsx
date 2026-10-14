import { Paths } from "expo-file-system";
import { useFocusEffect } from "expo-router";
import { Cloud, HardDrive, Smartphone } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useUser } from "@/context/UserContext";
import type { Project } from "@/lib/library";
import CloudStorageBreakdown from "./CloudStorageBreakdown";
import { useHomeStyles } from "./styles";

const GB = 1000 ** 3;

function readAppStorage() {
  const documentBytes = Paths.document.size;
  const cacheBytes = Paths.cache.size;
  if (documentBytes === null || cacheBytes === null) return null;
  return documentBytes + cacheBytes;
}

function readDeviceStorage() {
  const total = Paths.totalDiskSpace / GB;
  const free = Paths.availableDiskSpace / GB;
  return { total, used: Math.max(total - free, 0) };
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return null;
  if (bytes < 1000 ** 2) {
    return { value: (bytes / 1000).toFixed(0), unit: "KB used" };
  }
  if (bytes < GB) {
    return { value: (bytes / 1000 ** 2).toFixed(1), unit: "MB used" };
  }
  return { value: (bytes / GB).toFixed(2), unit: "GB used" };
}

function StorageData({ projects }: { projects: Project[] }) {
  const styles = useHomeStyles();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 32) / 2;
  const { storage, refreshProfile } = useUser();
  const [device, setDevice] = useState(readDeviceStorage);
  const [appBytes, setAppBytes] = useState(readAppStorage);
  const [cloudBreakdownVisible, setCloudBreakdownVisible] = useState(false);

  // Refresh when returning to the screen
  useFocusEffect(
    useCallback(() => {
      setDevice(readDeviceStorage());
      const bytes = readAppStorage();
      setAppBytes(bytes);
      if (bytes === null) {
        console.warn("Unable to read app storage usage.");
      }
      refreshProfile().catch(() => {});
    }, [refreshProfile]),
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.storageGrid}
    >
      <View style={[styles.storageColumn, { width: cardWidth }]}>
        <StorageCard
          icon={Cloud}
          label="Cloud"
          used={storage.usedGb}
          total={storage.limitGb}
          tint="#38bdf8"
          onPress={() => setCloudBreakdownVisible(true)}
        />
      </View>
      <View style={[styles.storageColumn, { width: cardWidth }]}>
        <StorageCard
          icon={Smartphone}
          label="On device"
          used={device.used}
          total={device.total}
          tint="#fbbf24"
        />
      </View>
      <View style={[styles.storageColumn, { width: cardWidth }]}>
        <StorageCard
          icon={HardDrive}
          label="App storage"
          used={appBytes === null ? null : appBytes / GB}
          total={null}
          tint="#a78bfa"
          usageValue={formatBytes(appBytes)}
          details="Private app files and cache"
        />
      </View>
      <CloudStorageBreakdown
        visible={cloudBreakdownVisible}
        projects={projects}
        usedBytes={storage.usedBytes}
        onClose={() => setCloudBreakdownVisible(false)}
      />
    </ScrollView>
  );
}

function StorageCard({
  icon: Icon,
  label,
  used,
  total,
  tint,
  usageValue,
  details,
  onPress,
}: {
  icon: typeof Cloud;
  label: string;
  used: number | null;
  total: number | null;
  tint: string;
  usageValue?: { value: string; unit: string } | null;
  details?: string;
  onPress?: () => void;
}) {
  const styles = useHomeStyles();
  const iconColor =
    useColorScheme() === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
  const pct =
    used !== null && total !== null && total > 0
      ? Math.round((used / total) * 100)
      : 0;
  const pctExact = used !== null && total !== null && total > 0 ? (used / total) * 100 : 0;
  const pctLabel =
    pctExact > 0 && pctExact < 1 ? "<1%" : `${Math.round(pctExact)}%`;
  const usedFmt = used === null ? null : formatBytes(used * GB);
  const usedLabel = usedFmt
    ? `${usedFmt.value} ${usedFmt.unit.replace(" used", "")}`
    : "";
  const formattedUsage =
    usageValue === undefined
      ? used === null
        ? null
        : { value: used.toFixed(1), unit: "GB used" }
      : usageValue;
  const content = (
    <>
      <View style={styles.storageHeader}>
        <Icon size={16} color={iconColor} strokeWidth={2} />
        <Text style={styles.storageLabel}>{label}</Text>
      </View>
      <Text style={styles.storageFree}>
        {total === null
          ? (formattedUsage?.value ?? "—")
          : used === null
            ? "—"
            : (total - used).toFixed(1)}
        <Text style={styles.storageFreeUnit}>
          {total === null
            ? ` ${formattedUsage?.unit ?? "unavailable"}`
            : used === null
              ? " unavailable"
              : " GB free"}
        </Text>
      </Text>
      {total !== null && (
        <>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${pctExact > 0 ? Math.max(pct, 1) : 0}%`, backgroundColor: tint },
              ]}
            />
          </View>
          <Text style={styles.storageStats}>
            {used === null
              ? "Usage unavailable"
              : `${usedLabel} / ${+total.toFixed(0)} GB · ${pctLabel}`}
          </Text>
        </>
      )}
      {details && <Text style={styles.storageStats}>{details}</Text>}
    </>
  );

  if (!onPress) {
    return <View style={styles.storageCard}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Show cloud storage breakdown"
      accessibilityHint="Breakdown by project and folder"
      onPress={onPress}
      style={({ pressed }) => [
        styles.storageCard,
        pressed && { opacity: 0.8 },
      ]}
    >
      {content}
    </Pressable>
  );
}
export default StorageData;
