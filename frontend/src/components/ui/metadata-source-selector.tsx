import { cn } from "@/lib/utils";
import type { MetadataSnapshot as TypedMetadataSnapshot } from "@/types/metadata";

// Simple utility to format distance to now without date-fns
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  return "just now";
}

export interface MetadataSnapshot {
  id: string;
  source: string;
  snapshot_data?: Record<string, unknown>;
  data?: Record<string, unknown>;
  fetched_at?: string;
  fetchedAt?: string;
  confidence: number;
}

export interface MetadataSourceSelectorProps {
  sources: string[];
  activeSource: string;
  onSourceChange: (source: string) => void;
  snapshots?: MetadataSnapshot[] | TypedMetadataSnapshot[];
  className?: string;
  showConfidence?: boolean;
  showTimestamp?: boolean;
  size?: "sm" | "md" | "lg";
}

const SOURCE_LABELS: Record<string, string> = {
  spotify: "Spotify",
  musicbrainz: "MusicBrainz",
  discogs: "Discogs",
  youtube_music: "YouTube Music",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
  deezer: "Deezer",
  apple_music: "Apple Music",
  tidal: "Tidal",
};

/** Platform brand color for the identity dot (tokens only). */
const SOURCE_DOT: Record<string, string> = {
  spotify: "bg-spotify",
  youtube_music: "bg-ytmusic",
  youtube: "bg-youtube",
  soundcloud: "bg-soundcloud",
  bandcamp: "bg-bandcamp",
  deezer: "bg-deezer",
  apple_music: "bg-apple",
  tidal: "bg-tidal",
};

function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, " ");
}

/**
 * Tab-style selector for switching between metadata sources on entity pages.
 * Only displays when multiple sources are available.
 */
export function MetadataSourceSelector({
  sources,
  activeSource,
  onSourceChange,
  snapshots,
  className,
  showConfidence = true,
  showTimestamp = false,
  size = "md",
}: MetadataSourceSelectorProps) {
  // Don't render if no sources
  if (sources.length === 0) {
    return null;
  }

  // Create maps of source to confidence and timestamp
  const confidenceMap = new Map<string, number>();
  const timestampMap = new Map<string, string>();
  if (snapshots) {
    for (const snapshot of snapshots) {
      confidenceMap.set(snapshot.source, snapshot.confidence);
      const timestamp =
        (snapshot as MetadataSnapshot).fetched_at || (snapshot as TypedMetadataSnapshot).fetchedAt;
      if (timestamp) {
        timestampMap.set(snapshot.source, timestamp);
      }
    }
  }

  // Sort sources by confidence (highest first)
  const sortedSources = [...sources].sort((a, b) => {
    const confA = confidenceMap.get(a) ?? 0;
    const confB = confidenceMap.get(b) ?? 0;
    return confB - confA;
  });

  const sizeClasses = {
    sm: "h-7 px-2 text-xs",
    md: "h-8 px-3 text-sm",
    lg: "h-9 px-4 text-sm",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-faint">
        Metadata source
      </span>
      <div className="flex flex-wrap gap-1.5">
        {sortedSources.map((source) => {
          const isActive = source === activeSource;
          const confidence = confidenceMap.get(source);
          const timestamp = timestampMap.get(source);

          return (
            <button
              key={source}
              type="button"
              onClick={() => onSourceChange(source)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                sizeClasses[size],
                isActive
                  ? "border-border bg-elevated text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={
                timestamp
                  ? `Last fetched ${formatDistanceToNow(new Date(timestamp))}`
                  : undefined
              }
            >
              <span
                className={cn("size-1.5 shrink-0 rounded-full", SOURCE_DOT[source] || "bg-faint")}
                aria-hidden
              />
              <span>{getSourceLabel(source)}</span>
              {showConfidence && confidence !== undefined && confidence < 1 && (
                <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] tnum text-faint">
                  {Math.round(confidence * 100)}%
                </span>
              )}
              {showTimestamp && timestamp && (
                <span className="font-mono text-[10px] tnum text-faint">
                  {formatDistanceToNow(new Date(timestamp))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MetadataSourceSelector;
