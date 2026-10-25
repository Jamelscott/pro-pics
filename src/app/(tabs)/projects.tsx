import NewProjectModal from "@/components/projects/NewProjectModal";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectDetail from "@/components/projects/ProjectDetail";
import ProjectHeader from "@/components/projects/ProjectHeader";
import SearchBar from "@/components/projects/SearchBar";
import { useProjectStyles } from "@/components/projects/styles";
import { useSetTabBarHidden } from "@/components/TabBarVisibilityContext";
import ConfirmDeleteModal from "@/components/ui/confirm-delete-modal";
import { useLibrary, type Project } from "@/lib/library";
import { createProject, deleteProjects } from "@/lib/projects";
import { matchMedia, type Filters } from "@/utils/functions/projectPageHelpers";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const defaultFilters: Filters = { range: "all", kind: "all", storage: "all" };

interface FilteredRow {
  p: Project;
  hits: Project["media"];
  show: boolean;
}

export default function ProjectsScreen() {
  const styles = useProjectStyles();
  const { projects, setProjects, loading, error, refresh } = useLibrary();
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [creating, setCreating] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const { projectId: linkProjectId, mediaId: linkMediaId } =
    useLocalSearchParams<{ projectId?: string; mediaId?: string }>();
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const setTabBarHidden = useSetTabBarHidden();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setTabBarHidden(editing);
    return () => setTabBarHidden(false);
  }, [setTabBarHidden, editing]);

  const exitEditing = () => {
    setEditing(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteSelected = async () => {
    setDeleting(true);
    try {
      await deleteProjects([...selectedIds]);
      setConfirming(false);
      exitEditing();
      await refresh();
    } catch (e) {
      Alert.alert(
        "Delete failed",
        e instanceof Error ? e.message : "Try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateProject = async (
    name: string,
    client: string,
    color: string,
  ) => {
    if (savingProject) return;
    setSavingProject(true);
    try {
      const project = await createProject({ name, client, color });
      setProjects((current) => [
        {
          id: project.id,
          name: project.name,
          client: project.client ?? undefined,
          color: project.color,
          created_date: project.created_at,
          folders: [],
          media: [],
        },
        ...current,
      ]);
      setCreating(false);
      setSelectedProjectId(project.id);
    } catch (e) {
      Alert.alert(
        "Couldn't create project",
        e instanceof Error ? e.message : "Try again.",
      );
    } finally {
      setSavingProject(false);
    }
  };

  // Deep links open projects directly, and open media when the camera supplies an ID.
  const linkedProject = linkProjectId
    ? projects.find(
        (p) =>
          p.id === linkProjectId &&
          (!linkMediaId || p.media.some((m) => m.id === linkMediaId)),
      )
    : undefined;
  const effectiveProjectId = selectedProjectId ?? linkedProject?.id ?? null;
  const selectedProject =
    projects.find((p) => p.id === effectiveProjectId) ?? null;

  const query = searchText.trim().toLowerCase();
  const filtering = !!query || Object.values(filters).some((v) => v !== "all");

  const filteredRows: FilteredRow[] = projects
    .map((p) => {
      const nameHit =
        !!query && (p.name + " " + p.client).toLowerCase().includes(query);
      const hits = p.media.filter((m) =>
        matchMedia(m, nameHit ? "" : query, filters),
      );
      return {
        p,
        hits,
        show:
          !filtering || hits.length > 0 || (nameHit && p.media.length === 0),
      };
    })
    .filter((r: FilteredRow) => r.show);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProjectHeader
          projectCount={projects.length}
          onCreatePress={() => setCreating(true)}
          editing={editing}
          onEditPress={() => (editing ? exitEditing() : setEditing(true))}
        />
        <SearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          filters={filters}
          setFilters={setFilters}
          placeholder="Projects, tags, places, dates"
        />
        <View style={styles.projectsListContainer}>
          {loading ? (
            <View style={styles.emptyStateContainer}>
              <ActivityIndicator />
            </View>
          ) : error ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Could not load projects. {error.message}
              </Text>
            </View>
          ) : filteredRows.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No projects match your search.
              </Text>
            </View>
          ) : (
            filteredRows.map(({ p, hits }) => (
              <ProjectCard
                key={p.id}
                project={p}
                filteredMedia={hits}
                isFiltering={filtering}
                selectable={editing}
                selected={selectedIds.has(p.id)}
                onPress={() =>
                  editing ? toggleSelected(p.id) : setSelectedProjectId(p.id)
                }
              />
            ))
          )}
        </View>
        <NewProjectModal
          visible={creating}
          isCreating={savingProject}
          onClose={() => setCreating(false)}
          onCreate={handleCreateProject}
        />
      </ScrollView>
      {editing && (
        <View style={styles.selectBar}>
          <Text style={styles.selectCount}>{selectedIds.size} selected</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete selected projects"
            disabled={selectedIds.size === 0}
            onPress={() => setConfirming(true)}
            style={[
              styles.selectDelete,
              selectedIds.size === 0 && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.selectDeleteText}>Delete</Text>
          </Pressable>
        </View>
      )}
      <ConfirmDeleteModal
        visible={confirming}
        title={`Delete ${selectedIds.size} ${selectedIds.size === 1 ? "project" : "projects"}?`}
        message="This permanently deletes the selected projects and every photo and video in them. This can't be undone."
        deleting={deleting}
        onCancel={() => setConfirming(false)}
        onConfirm={deleteSelected}
      />
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          allProjects={projects}
          onBack={() => {
            setSelectedProjectId(null);
            router.setParams({ projectId: undefined, mediaId: undefined });
          }}
          initialMediaId={linkedProject ? linkMediaId : null}
          onMediaDeleted={refresh}
          onFolderCreated={refresh}
        />
      )}
    </View>
  );
}
