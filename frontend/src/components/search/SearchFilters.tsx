import { LayoutGrid, Music2, User, Disc3, ListMusic } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EntityType } from "@/types";

interface SearchFiltersProps {
  activeFilter: EntityType | "all";
  onFilterChange: (filter: EntityType | "all") => void;
}

const filters: Array<{ value: EntityType | "all"; label: string; icon: React.ReactNode }> = [
  { value: "all", label: "All", icon: <LayoutGrid className="size-4" /> },
  { value: "track", label: "Songs", icon: <Music2 className="size-4" /> },
  { value: "artist", label: "Artists", icon: <User className="size-4" /> },
  { value: "album", label: "Albums", icon: <Disc3 className="size-4" /> },
  { value: "playlist", label: "Playlists", icon: <ListMusic className="size-4" /> },
];

export function SearchFilters({ activeFilter, onFilterChange }: SearchFiltersProps) {
  return (
    <ToggleGroup
      type="single"
      value={activeFilter}
      onValueChange={(value) => {
        // Radix emits "" when the active item is re-selected; keep the current filter.
        if (value) onFilterChange(value as EntityType | "all");
      }}
      variant="outline"
      className="flex-wrap justify-start gap-1.5"
    >
      {filters.map((filter) => (
        <ToggleGroupItem key={filter.value} value={filter.value} aria-label={filter.label} className="px-3">
          {filter.icon}
          <span>{filter.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
