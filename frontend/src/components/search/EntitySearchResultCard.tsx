import { useNavigate } from "@tanstack/react-router";
import { Download, Plus, ChevronRight } from "lucide-react";
import { CoverArt } from "@/components/ui/cover-art";
import { useFeatures } from "@/contexts/DevConfigContext";
import { cn } from "@/lib/utils";
import type { SearchResult, EntityType, PlatformInfo } from "@/types";

interface EntitySearchResultCardProps {
  result: SearchResult;
  /** Queue/download the entity. When provided (and downloads are enabled) a hover action appears. */
  onAddToQueue?: (result: SearchResult) => void;
}

const entityTypeLabels: Record<EntityType, string> = {
  artist: "Artist",
  album: "Album",
  playlist: "Playlist",
  track: "Song",
  all: "All",
};

/** Platform identity dot colors — the only place platform colors are allowed (DESIGN.md rule 12). */
const PLATFORM_DOT: Record<string, string> = {
  spotify: "bg-spotify",
  apple_music: "bg-apple",
  deezer: "bg-deezer",
  youtube: "bg-youtube",
  youtube_music: "bg-ytmusic",
  soundcloud: "bg-soundcloud",
  bandcamp: "bg-bandcamp",
  tidal: "bg-tidal",
  amazon: "bg-amazon",
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function PlatformDots({ platforms }: { platforms: PlatformInfo[] }) {
  if (platforms.length === 0) return null;
  return (
    <div className="flex items-center gap-1" aria-label={`On ${platforms.map((p) => p.platform.replace("_", " ")).join(", ")}`}>
      {platforms.slice(0, 5).map((p) => (
        <span
          key={p.platform}
          className={cn("size-1.5 rounded-full", PLATFORM_DOT[p.platform] ?? "bg-faint")}
          title={p.platform.replace("_", " ")}
        />
      ))}
    </div>
  );
}

/**
 * Dense Control Room search result row: thumb, entity-type eyebrow, name + subtitle,
 * platform dots, and right-aligned mono metadata. Hover lifts to `bg-elevated`.
 */
export function EntitySearchResultCard({ result, onAddToQueue }: EntitySearchResultCardProps) {
  const navigate = useNavigate();
  const features = useFeatures();

  const go = () => {
    switch (result.entity_type) {
      case "artist":
        navigate({ to: "/artist/$id", params: { id: result.id } });
        break;
      case "album":
        navigate({ to: "/album/$id", params: { id: result.id } });
        break;
      case "playlist":
        navigate({ to: "/playlist/$id", params: { id: result.id } });
        break;
      case "track":
      default:
        navigate({ to: "/song/$id", params: { id: result.id } });
    }
  };

  const showAction = features.canDownload && !!onAddToQueue;
  const isArtist = result.entity_type === "artist";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5",
        "transition-colors hover:bg-elevated",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <CoverArt
        src={result.image_url}
        alt={result.name}
        size="xs"
        shape={isArtist ? "circle" : "rounded"}
        fallbackIcon={result.entity_type === "all" ? "track" : result.entity_type}
        className={isArtist ? undefined : "rounded-md"}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-faint">
            {entityTypeLabels[result.entity_type]}
          </span>
          <PlatformDots platforms={result.platforms} />
        </div>
        <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
          {result.name}
        </p>
        {result.subtitle && (
          <p className="truncate text-sm text-muted-foreground">{result.subtitle}</p>
        )}
      </div>

      {result.duration ? (
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground tnum">
          {formatDuration(result.duration)}
        </span>
      ) : null}

      {showAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue?.(result);
          }}
          aria-label={result.entity_type === "track" ? "Add to queue" : "Download"}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground",
            "opacity-0 transition-all group-hover:opacity-100",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {result.entity_type === "track" ? <Plus className="size-4" /> : <Download className="size-4" />}
        </button>
      )}

      <ChevronRight className="size-4 shrink-0 text-faint transition-colors group-hover:text-muted-foreground" />
    </div>
  );
}
