import { router } from "expo-router";
import { Camera, Cloud, Play, Smartphone } from "lucide-react-native";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useHomeStyles } from "./styles";

const ago = (d: string) => {
  const timestamp = new Date(d).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
};

function RecentActivity({ activity }: { activity: any[] }) {
  const styles = useHomeStyles();
  const iconColor =
    useColorScheme() === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  return (
    <View style={styles.activitySection}>
      <Text style={styles.sectionTitle}>Recent activity</Text>
      {activity.length === 0 ? (
        <View style={styles.emptyCard}>
          <Camera size={28} color={iconColor} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyText}>
            Photos and videos you capture will show up here.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/camera")}
          >
            <Text style={styles.emptyButtonText}>Open camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.activityList}>
          {activity.map((a: any, index: number) => (
            <TouchableOpacity
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${a.kind} in ${a.project.name}`}
              onPress={() =>
                router.navigate({
                  pathname: "/projects",
                  params: { projectId: a.project.id, mediaId: a.id },
                })
              }
              style={[
                styles.activityItem,
                index !== activity.length - 1 && styles.activityItemBorder,
              ]}
            >
              <View style={styles.activityImageContainer}>
                <Image
                  source={{
                    uri: a.thumb ?? a.src,
                  }}
                  style={styles.activityImage}
                />
                {a.kind === "video" && (
                  <View style={styles.playIconContainer}>
                    <Play
                      size={16}
                      color="white"
                      fill="white"
                      strokeWidth={2}
                    />
                  </View>
                )}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {a.kind === "video" ? "Video" : "Photo"} added ·{" "}
                  {a.folder_tags[0] ?? a.location}
                </Text>
                <View style={styles.projectInfo}>
                  <View
                    style={[
                      styles.projectDot,
                      { backgroundColor: a.project.color },
                    ]}
                  />
                  <Text style={styles.projectNameText}>{a.project.name}</Text>
                </View>
              </View>
              <View style={styles.activityMeta}>
                <Text style={styles.timeAgo}>{ago(a.date)}</Text>
                {a.storage === "cloud" ? (
                  <Cloud
                    size={14}
                    color="#7dd3fc"
                    strokeWidth={2}
                    style={styles.storageIcon}
                  />
                ) : (
                  <Smartphone
                    size={14}
                    color="#fbbf24"
                    strokeWidth={2}
                    style={styles.storageIcon}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default RecentActivity;
