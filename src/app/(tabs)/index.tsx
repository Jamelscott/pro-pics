import JumpBackIn from "@/components/home/JustBackIn";
import RecentActivity from "@/components/home/RecentActivity";
import StorageData from "@/components/home/StorageCard";
import Header from "@/components/home/Header";
import { useHomeStyles } from "@/components/home/styles";
import { useLibrary } from "@/lib/library";
import { router } from "expo-router";
import { Settings } from "lucide-react-native";
import { Pressable, ScrollView } from "react-native";
import { useTheme } from "@/hooks/use-theme";

function Home() {
  const styles = useHomeStyles();
  const theme = useTheme();
  const { projects } = useLibrary();
  const activity = projects
    .flatMap((p: any) => p.media.map((m: any) => ({ ...m, project: p })))
    .sort((a: any, b: any) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const recentProjects = [
    ...new Map(activity.map((a: any) => [a.project.id, a.project])).values(),
  ] as any;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
            style={styles.headerAction}
          >
            <Settings size={22} color={theme.text} />
          </Pressable>
        }
      />
      <StorageData projects={projects} />
      <JumpBackIn recentProjects={recentProjects} />
      <RecentActivity activity={activity} />
    </ScrollView>
  );
}

export default Home;
