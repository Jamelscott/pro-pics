export type Filters = {
  range: "all" | "7" | "30";
  kind: "all" | "photo" | "video";
  storage: "all" | "cloud" | "local";
};

interface MatchableMedia {
  kind: "photo" | "video";
  storage: "cloud" | "local";
  date: string;
  tags?: string[];
}

export const matchMedia = (
  media: MatchableMedia,
  query: string,
  filters: Filters,
): boolean => {
  if (filters.kind !== "all" && media.kind !== filters.kind) return false;
  if (filters.storage !== "all" && media.storage !== filters.storage)
    return false;

  if (filters.range !== "all") {
    const days = parseInt(filters.range);
    const mediaDate = new Date(media.date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - mediaDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > days) return false;
  }

  if (query) {
    return !!media.tags?.some((tag) => tag.toLowerCase().includes(query));
  }

  return true;
};