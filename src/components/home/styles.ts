import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

export function useHomeStyles() {
  const isDark = useColorScheme() === "dark";
  return useMemo(() => createStyles(isDark), [isDark]);
}

const createStyles = (isDark: boolean) => {
  const ink = isDark ? "255,255,255" : "0,0,0";
  const text = isDark ? "#fff" : "#000";
  const bg = isDark ? "#000" : "#fff";
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    headerContainer: {
      paddingHorizontal: 10,
      marginBottom: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    headerAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `rgba(${ink},0.08)`,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1.4,
      color: `rgba(${ink},0.45)`,
      marginTop: 4,
      marginLeft: 2,
      fontFamily: "monospace",
      textAlign: "left",
    },
    title: {
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -0.5,
      color: text,
      textAlign: "left",
    },
    storageGrid: {
      paddingHorizontal: 10,
      flexDirection: "row",
      gap: 12,
    },
    storageColumn: {},
    storageCard: {
      flex: 1,
      backgroundColor: `rgba(${ink},0.1)`,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: `rgba(${ink},0.15)`,
    },
    storageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    storageLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: `rgba(${ink},0.7)`,
    },
    storageFree: {
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: -0.5,
      marginTop: 12,
      color: text,
    },
    storageFreeUnit: {
      fontSize: 14,
      fontWeight: "500",
      color: `rgba(${ink},0.5)`,
    },
    progressBarContainer: {
      height: 6,
      borderRadius: 3,
      backgroundColor: `rgba(${ink},0.1)`,
      marginTop: 12,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      borderRadius: 3,
    },
    storageStats: {
      fontSize: 10,
      fontFamily: "monospace",
      color: `rgba(${ink},0.45)`,
      marginTop: 8,
    },
    sectionMargin: {
      marginTop: 28,
      paddingHorizontal: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: `rgba(${ink},0.6)`,
      marginBottom: 12,
    },
    horizontalScroll: {},
    projectCard: {
      width: 144,
      marginRight: 12,
    },
    projectImageContainer: {
      height: 176,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: `rgba(${ink},0.05)`,
    },
    projectImage: {
      width: "100%",
      height: "100%",
    },
    projectOverlay: {
      position: "absolute",
      bottom: 8,
      left: 8,
      right: 8,
      backgroundColor: "rgba(67, 62, 62, 0.84)",
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
    },
    projectName: {
      fontSize: 13,
      fontWeight: "800",
      color: "#fff",
    },
    projectItemCount: {
      fontSize: 10,
      fontFamily: "monospace",
      color: "#fff",
    },
    activitySection: {
      marginTop: 28,
      marginBottom: 40,
      paddingHorizontal: 10,
    },
    activityList: {
      backgroundColor: `rgba(${ink},0.1)`,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: `rgba(${ink},0.15)`,
      overflow: "hidden",
    },
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    activityItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: `rgba(${ink},0.1)`,
    },
    activityImageContainer: {
      position: "relative",
      width: 48,
      height: 48,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: `rgba(${ink},0.1)`,
    },
    activityImage: {
      width: "100%",
      height: "100%",
    },
    playIconContainer: {
      position: "absolute",
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: text,
    },
    projectInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    projectDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    projectNameText: {
      fontSize: 12,
      color: `rgba(${ink},0.55)`,
    },
    activityMeta: {
      alignItems: "flex-end",
    },
    timeAgo: {
      fontSize: 10,
      fontFamily: "monospace",
      color: `rgba(${ink},0.45)`,
    },
    storageIcon: {
      marginTop: 4,
    },
    emptyCard: {
      backgroundColor: `rgba(${ink},0.1)`,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: `rgba(${ink},0.15)`,
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 20,
      gap: 6,
    },
    emptyIcon: {
      marginBottom: 6,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: text,
    },
    emptyText: {
      fontSize: 12,
      textAlign: "center",
      color: `rgba(${ink},0.55)`,
    },
    emptyButton: {
      marginTop: 10,
      backgroundColor: text,
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    emptyButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: bg,
    },
  });
};
