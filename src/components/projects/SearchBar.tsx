import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { Search, X, SlidersHorizontal } from "lucide-react-native";
import { useState } from "react";
import BottomSheetModal from "@/components/ui/bottom-sheet-modal";
import { type Filters } from "@/utils/functions/projectPageHelpers";
import { useInk } from "@/hooks/use-themed-styles";
import { useProjectStyles } from "./styles";

const defaultFilters: Filters = { range: "all", kind: "all", storage: "all" };

interface SearchBarProps {
  searchText: string;
  setSearchText: (searchText: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  placeholder: string;
}

function FilterChip<K extends keyof Filters>({
  value,
  label,
  filterKey,
  selected,
  onSelect,
}: {
  value: Filters[K];
  label: string;
  filterKey: K;
  selected: boolean;
  onSelect: (filterKey: K, value: Filters[K]) => void;
}) {
  const styles = useProjectStyles();
  return (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipActive]}
      onPress={() => onSelect(filterKey, value)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={[styles.filterChipText, selected && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SearchBar({
  searchText,
  setSearchText,
  filters,
  setFilters,
  placeholder,
}: SearchBarProps) {
  const styles = useProjectStyles();
  const t = useInk();
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== "all",
  ).length;

  const handleFilterChange = <K extends keyof Filters>(
    key: K,
    value: Filters[K],
  ) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <View style={styles.searchBarContainer}>
      <BottomSheetModal
        visible={showFilters}
        title="Filters"
        onClose={() => setShowFilters(false)}
      >
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Date</Text>
          <View style={styles.filterChipsRow}>
            <FilterChip
              value="all"
              label="Any time"
              filterKey="range"
              selected={filters.range === "all"}
              onSelect={handleFilterChange}
            />
            <FilterChip
              value="7"
              label="7 days"
              filterKey="range"
              selected={filters.range === "7"}
              onSelect={handleFilterChange}
            />
            <FilterChip
              value="30"
              label="30 days"
              filterKey="range"
              selected={filters.range === "30"}
              onSelect={handleFilterChange}
            />
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.filterChipsRow}>
            <FilterChip
              value="all"
              label="All"
              filterKey="kind"
              selected={filters.kind === "all"}
              onSelect={handleFilterChange}
            />
            <FilterChip
              value="photo"
              label="Photos"
              filterKey="kind"
              selected={filters.kind === "photo"}
              onSelect={handleFilterChange}
            />
            <FilterChip
              value="video"
              label="Videos"
              filterKey="kind"
              selected={filters.kind === "video"}
              onSelect={handleFilterChange}
            />
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Saved to</Text>
          <View style={styles.filterChipsRow}>
            <FilterChip
              value="all"
              label="Anywhere"
              filterKey="storage"
              selected={filters.storage === "all"}
              onSelect={handleFilterChange}
            />
            <FilterChip
              value="cloud"
              label="Cloud"
              filterKey="storage"
              selected={filters.storage === "cloud"}
              onSelect={handleFilterChange}
            />
            <FilterChip
              value="local"
              label="Device"
              filterKey="storage"
              selected={filters.storage === "local"}
              onSelect={handleFilterChange}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setFilters(defaultFilters)}
          disabled={activeFilterCount === 0}
          style={[
            styles.resetButton,
            activeFilterCount === 0 && styles.resetButtonHidden,
          ]}
          accessibilityElementsHidden={activeFilterCount === 0}
          importantForAccessibility={
            activeFilterCount === 0 ? "no-hide-descendants" : "auto"
          }
        >
          <Text style={styles.resetButtonText}>Reset filters</Text>
        </TouchableOpacity>
      </BottomSheetModal>

      <View style={styles.searchInputContainer}>
        <View style={styles.searchInput}>
          <Search size={16} color={t.ink(0.5)} />
          <TextInput
            style={styles.searchInputField}
            placeholder={placeholder}
            placeholderTextColor={t.ink(0.4)}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <X size={16} color={t.ink(0.5)} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showFilters && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          accessibilityState={{ expanded: showFilters }}
        >
          <SlidersHorizontal size={16} color={t.text} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default SearchBar;
