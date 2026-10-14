import { StyleSheet } from "react-native";
import { useThemedStyles, type Ink } from "@/hooks/use-themed-styles";

const createStyles = (t: Ink) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    scrollContent: {
      paddingBottom: 14,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 10,
    },
    eyebrow: {
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1.4,
      color: t.ink(0.45),
      marginBottom: 4,
    },
    title: {
      fontSize: 34,
      fontWeight: "800",
      color: t.text,
      letterSpacing: -0.5,
      paddingBottom: 20,
    },
    createButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.ink(0.1),
      justifyContent: "center",
      alignItems: "center",
    },
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
      paddingBottom: 32,
      backgroundColor: t.sheet,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.ink(0.15),
    },
    selectCount: { color: t.text, fontSize: 15, fontWeight: "600" },
    selectDelete: {
      height: 44,
      paddingHorizontal: 22,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ef4444",
    },
    selectDeleteText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    projectsListContainer: {
      paddingHorizontal: 10,
      gap: 12,
    },
    emptyStateContainer: {
      paddingVertical: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyStateText: {
      color: t.ink(0.5),
      fontSize: 14,
      textAlign: "center",
    },
    projectCard: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 24,
      backgroundColor: t.ink(0.08),
    },
    thumbnailGrid: {
      width: 72,
      height: 72,
      borderRadius: 16,
      overflow: "hidden",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2,
    },
    thumbnailImage: {
      width: "48%",
      height: "48%",
      borderRadius: 4,
    },
    thumbnailPlaceholder: {
      width: "48%",
      height: "48%",
      backgroundColor: t.ink(0.05),
      borderRadius: 4,
    },
    projectInfo: {
      flex: 1,
      justifyContent: "center",
    },
    projectName: {
      fontWeight: "700",
      color: t.text,
      fontSize: 16,
      marginBottom: 2,
    },
    projectClient: {
      fontSize: 12,
      color: t.ink(0.55),
      marginBottom: 6,
    },
    projectMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    projectColorDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    projectMetaText: {
      fontFamily: "monospace",
      fontSize: 10,
      color: t.ink(0.45),
      flex: 1,
    },
    searchBarContainer: {
      paddingBlockEnd: 12,
      paddingHorizontal: 10,
      paddingBottom: 16,
    },
    filterGroup: {
      gap: 6,
    },
    filterLabel: {
      fontFamily: "monospace",
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.4,
      color: t.ink(0.45),
      textTransform: "uppercase",
      marginBottom: 4,
    },
    filterChipsRow: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: t.ink(0.1),
    },
    filterChipActive: {
      backgroundColor: t.text,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: t.ink(0.75),
    },
    filterChipTextActive: {
      color: t.bg,
    },
    resetButton: {
      paddingVertical: 8,
    },
    resetButtonHidden: {
      opacity: 0,
    },
    resetButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: t.accent,
    },
    searchInputContainer: {
      flexDirection: "row",
      gap: 8,
    },
    searchInput: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.isDark ? "rgba(26, 31, 39, 0.5)" : t.ink(0.06),
    },
    searchInputField: {
      flex: 1,
      color: t.text,
      fontSize: 14,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.isDark ? "rgba(26, 31, 39, 0.5)" : t.ink(0.06),
      justifyContent: "center",
      alignItems: "center",
    },
    filterButtonActive: {
      backgroundColor: t.ink(0.15),
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#7dd3fc",
      justifyContent: "center",
      alignItems: "center",
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#000000",
    },
  });

export const useProjectStyles = () => useThemedStyles(createStyles);
