import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/components/ui/cover-art";
import { Badge } from "@/components/ui/badge";
import type { AlbumSummary } from "@/types";

type AlbumFilter = "all" | "album" | "single" | "ep" | "compilation";

export interface AlbumSummaryWithType extends Omit<AlbumSummary, "album_type"> {
  album_type?: "album" | "single" | "ep" | "compilation" | null;
}

export interface DiscographyGridProps {
  albums: AlbumSummaryWithType[];
  showFilters?: boolean;
  defaultFilter?: AlbumFilter;
  onAlbumClick?: (albumId: string) => void;
  className?: string;
}

const filterTabs: { value: AlbumFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "album", label: "Albums" },
  { value: "single", label: "Singles" },
  { value: "ep", label: "EPs" },
  { value: "compilation", label: "Compilations" },
];

export function DiscographyGrid({
  albums,
  showFilters = true,
  defaultFilter = "all",
  onAlbumClick,
  className,
}: DiscographyGridProps) {
  const [activeFilter, setActiveFilter] = useState<AlbumFilter>(defaultFilter);

  const filteredAlbums = useMemo(() => {
    if (activeFilter === "all") return albums;
    return albums.filter((album) => album.album_type === activeFilter);
  }, [albums, activeFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<AlbumFilter, number> = {
      all: albums.length,
      album: 0,
      single: 0,
      ep: 0,
      compilation: 0,
    };
    albums.forEach((album) => {
      const type = album.album_type || "album";
      if (type in counts) counts[type as AlbumFilter]++;
    });
    return counts;
  }, [albums]);

  const visibleFilters = filterTabs.filter(
    (tab) => tab.value === "all" || filterCounts[tab.value] > 0
  );

  return (
    <div className={cn("space-y-6", className)}>
      {showFilters && visibleFilters.length > 2 && (
        <div className="flex flex-wrap gap-1">
          {visibleFilters.map((tab) => {
            const active = activeFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
                  "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active
                    ? "bg-elevated text-foreground"
                    : "text-muted-foreground hover:bg-elevated/60 hover:text-foreground"
                )}
              >
                {tab.label}
                <span className="font-mono text-xs tnum text-faint">
                  {filterCounts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredAlbums.map((album, index) => (
            <AlbumCard
              key={album.id ?? album.name}
              album={album}
              index={index}
              onAlbumClick={onAlbumClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState filter={activeFilter} />
      )}
    </div>
  );
}

interface AlbumCardProps {
  album: AlbumSummaryWithType;
  index: number;
  onAlbumClick?: (albumId: string) => void;
}

function AlbumCard({ album, index, onAlbumClick }: AlbumCardProps) {
  const handleClick = () => {
    if (onAlbumClick && album.id) onAlbumClick(album.id);
  };

  const showType = album.album_type && album.album_type !== "album";

  const content = (
    <div
      className="group space-y-3 rounded-lg p-2 transition-colors hover:bg-elevated/50 animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <CoverArt
        src={album.cover_url}
        alt={album.name}
        size="lg"
        fallbackIcon="album"
        className="w-full aspect-square"
      />
      <div className="space-y-1">
        <p
          className="truncate font-medium text-foreground transition-colors group-hover:text-primary"
          title={album.name}
        >
          {album.name}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {album.year && <span className="font-mono tnum text-faint">{album.year}</span>}
          {album.year && album.total_tracks > 0 && <span className="text-faint">·</span>}
          {album.total_tracks > 0 && <span>{album.total_tracks} tracks</span>}
        </div>
        {showType && (
          <Badge variant="muted" size="sm" className="capitalize">
            {album.album_type}
          </Badge>
        )}
      </div>
    </div>
  );

  if (onAlbumClick) {
    return (
      <button
        onClick={handleClick}
        disabled={!album.id}
        className="w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-default disabled:opacity-60"
      >
        {content}
      </button>
    );
  }

  if (!album.id) {
    return <div className="cursor-default rounded-lg opacity-60">{content}</div>;
  }

  return (
    <Link
      to="/album/$id"
      params={{ id: album.id }}
      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {content}
    </Link>
  );
}

interface EmptyStateProps {
  filter: AlbumFilter;
}

function EmptyState({ filter }: EmptyStateProps) {
  const filterLabels: Record<AlbumFilter, string> = {
    all: "releases",
    album: "albums",
    single: "singles",
    ep: "EPs",
    compilation: "compilations",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Disc3 className="mb-3 size-8 text-faint" />
      <p className="font-medium text-foreground">No {filterLabels[filter]} found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {filter === "all" ? "This artist has no releases yet" : "Try selecting a different filter"}
      </p>
    </div>
  );
}

export default DiscographyGrid;
