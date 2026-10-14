import { router } from "expo-router";
import { FolderOpen } from "lucide-react-native";
import type { Project } from "@/lib/library";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useHomeStyles } from "./styles";

function JumpBackIn({ recentProjects }: { recentProjects: Project[] }) {
  const styles = useHomeStyles();
  const iconColor =
    useColorScheme() === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  return (
    <View style={styles.sectionMargin}>
      <Text style={styles.sectionTitle}>Jump back in</Text>
      {recentProjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <FolderOpen size={28} color={iconColor} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.emptyText}>
            Create a project to start organizing your photos and videos.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/projects")}
          >
            <Text style={styles.emptyButtonText}>Go to projects</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          {recentProjects.map((p) => (
            <TouchableOpacity
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${p.name}`}
              onPress={() =>
                router.navigate({
                  pathname: "/projects",
                  params: { projectId: p.id },
                })
              }
              style={styles.projectCard}
            >
              <View style={styles.projectImageContainer}>
                <Image
                  source={{ uri: p.media[0]?.thumb ?? p.media[0]?.src }}
                  style={styles.projectImage}
                />
                <View style={styles.projectOverlay}>
                  <Text style={styles.projectName}>{p.name}</Text>
                  <Text style={styles.projectItemCount}>
                    {p.media.length} items
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default JumpBackIn;
