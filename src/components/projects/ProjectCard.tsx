import type { Project, ProjectMedia } from "@/lib/library";
import { Check, ChevronRight } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useInk } from "@/hooks/use-themed-styles";
import { useProjectStyles } from "./styles";

interface ProjectCardProps {
  project: Project;
  onPress: (id: string) => void;
  filteredMedia?: ProjectMedia[];
  isFiltering?: boolean;
  /** When set, shows a selection circle instead of the chevron. */
  selectable?: boolean;
  selected?: boolean;
}

export default function ProjectCard({
  project,
  onPress,
  filteredMedia = [],
  isFiltering = false,
  selectable = false,
  selected = false,
}: ProjectCardProps) {
  const styles = useProjectStyles();
  const t = useInk();
  const mediaToShow = isFiltering === true ? filteredMedia : project.media;
  const displayMedia = mediaToShow.slice(0, 4);
  const emptySlots = 4 - displayMedia.length;

  const fmtDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={styles.projectCard}
      accessibilityState={selectable ? { selected } : undefined}
      onPress={() => onPress(project.id)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailGrid}>
        {displayMedia.map((media, index) => (
          <Image
            key={media.id}
            source={{ uri: media.thumb ?? media.src }}
            style={styles.thumbnailImage}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.thumbnailPlaceholder} />
        ))}
      </View>
      <View style={styles.projectInfo}>
        <Text style={styles.projectName} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={styles.projectClient} numberOfLines={1}>
          {project.client}
        </Text>
        <View style={styles.projectMeta}>
          <View
            style={[styles.projectColorDot, { backgroundColor: project.color }]}
          />
          <Text style={styles.projectMetaText} numberOfLines={1}>
            {isFiltering === true
              ? `${filteredMedia.length} of ${project.media.length} match`
              : `${project.media.length} items · since ${fmtDate(project.created_date)}`}
          </Text>
        </View>
      </View>
      {selectable ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? t.accent : t.ink(0.4),
            backgroundColor: selected ? t.accent : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && <Check size={14} color="#fff" />}
        </View>
      ) : (
        <ChevronRight size={16} color={t.ink(0.4)} />
      )}
    </TouchableOpacity>
  );
}
