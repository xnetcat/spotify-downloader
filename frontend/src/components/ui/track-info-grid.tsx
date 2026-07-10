import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnhancedSong } from "@/types";
import { Badge } from "./badge";
import { Meter } from "./meter";
import { AudioFeaturesSummary } from "./audio-features-panel";

export interface TrackInfoGridProps {
  /** Enhanced song data */
  track: EnhancedSong;
  /** Whether to show audio features summary */
  showAudioFeatures?: boolean;
  /** Whether to show technical information (ISRC, Platform IDs) */
  showTechnical?: boolean;
  /** Additional class names */
  className?: string;
}

// Format duration in mm:ss
function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Format release date
function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}

function InfoItem({ label, value, mono = false, className }: InfoItemProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-faint">{label}</span>
      <span className={cn("text-sm text-foreground", mono && "font-mono tnum")}>
        {value || "--"}
      </span>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  className?: string;
}

function SectionHeader({ title, className }: SectionHeaderProps) {
  return (
    <h4
      className={cn("mb-3 text-xs font-medium uppercase tracking-wider text-faint", className)}
    >
      {title}
    </h4>
  );
}

/**
 * Reusable grid layout for track information.
 */
export function TrackInfoGrid({
  track,
  showAudioFeatures = true,
  showTechnical = true,
  className,
}: TrackInfoGridProps) {
  const hasTrackPosition = track.track_number !== null || track.disc_number !== null;
  const hasGenres = track.genres && track.genres.length > 0;
  const hasLabelInfo = track.label || track.copyright_text;
  const hasPlatformIds = track.platforms && track.platforms.length > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 transition-colors hover:border-faint/50",
        className
      )}
    >
      {/* Basic info */}
      <section className="mb-5">
        <SectionHeader title="Track info" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem label="Duration" value={formatDuration(track.duration)} mono />
          <InfoItem label="Release date" value={formatReleaseDate(track.release_date)} />
          {track.year && <InfoItem label="Year" value={track.year} mono />}
          {track.popularity !== null && (
            <InfoItem
              label="Popularity"
              value={
                <div className="flex items-center gap-2">
                  <span className="font-mono tnum">{track.popularity}</span>
                  <Meter
                    value={track.popularity}
                    max={100}
                    cells={10}
                    className="max-w-[60px] flex-1"
                    label={`Popularity ${track.popularity}%`}
                  />
                </div>
              }
            />
          )}
        </div>
      </section>

      {/* Track position */}
      {hasTrackPosition && (
        <section className="mb-5">
          <SectionHeader title="Track position" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {track.track_number !== null && (
              <InfoItem label="Track #" value={track.track_number} mono />
            )}
            {track.disc_number !== null && (
              <InfoItem label="Disc #" value={track.disc_number} mono />
            )}
            {track.album_name && <InfoItem label="Album" value={track.album_name} />}
          </div>
        </section>
      )}

      {/* Technical info */}
      {showTechnical && (
        <section className="mb-5">
          <SectionHeader title="Technical" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {track.isrc && (
              <InfoItem
                label="ISRC"
                value={
                  <span className="rounded bg-surface px-2 py-1 font-mono tnum text-xs">
                    {track.isrc}
                  </span>
                }
              />
            )}
            {hasPlatformIds && (
              <InfoItem
                label="Platform IDs"
                value={
                  <div className="flex flex-wrap gap-1">
                    {track.platforms.slice(0, 3).map((p) => (
                      <span
                        key={`${p.platform}-${p.platform_id}`}
                        className="rounded bg-surface px-2 py-0.5 font-mono tnum text-xs"
                        title={`${p.platform}: ${p.platform_id}`}
                      >
                        {p.platform.charAt(0).toUpperCase()}: {p.platform_id.slice(0, 8)}…
                      </span>
                    ))}
                    {track.platforms.length > 3 && (
                      <span className="text-xs text-faint">
                        +{track.platforms.length - 3} more
                      </span>
                    )}
                  </div>
                }
              />
            )}
            <InfoItem
              label="Matches"
              value={<span className="font-mono tnum text-success">{track.matches_count}</span>}
            />
          </div>
        </section>
      )}

      {/* Label & copyright */}
      {hasLabelInfo && (
        <section className="mb-5">
          <SectionHeader title="Label & copyright" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {track.label && <InfoItem label="Label" value={track.label} />}
            {track.copyright_text && (
              <InfoItem
                label="Copyright"
                value={<span className="text-xs text-muted-foreground">{track.copyright_text}</span>}
              />
            )}
          </div>
        </section>
      )}

      {/* Genres */}
      {hasGenres && (
        <section className="mb-5">
          <SectionHeader title="Genres" />
          <div className="flex flex-wrap gap-2">
            {track.genres.map((genre) => (
              <Badge key={genre} variant="default" size="sm">
                {genre}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Flags */}
      <section className="mb-5">
        <SectionHeader title="Flags" />
        <div className="flex flex-wrap gap-2">
          {track.explicit ? (
            <Badge variant="warning" size="sm">
              Explicit
            </Badge>
          ) : (
            <Badge variant="muted" size="sm">
              Clean
            </Badge>
          )}
        </div>
      </section>

      {/* Audio features summary */}
      {showAudioFeatures && track.audio_features && (
        <section>
          <SectionHeader title="Audio features" />
          <AudioFeaturesSummary features={track.audio_features} />
        </section>
      )}
    </div>
  );
}

/**
 * Compact track info row for use in lists.
 */
export interface TrackInfoRowProps {
  track: EnhancedSong;
  showDuration?: boolean;
  showYear?: boolean;
  showExplicit?: boolean;
  className?: string;
}

export function TrackInfoRow({
  track,
  showDuration = true,
  showYear = true,
  showExplicit = true,
  className,
}: TrackInfoRowProps) {
  return (
    <div className={cn("flex items-center gap-3 text-sm text-muted-foreground", className)}>
      {showDuration && <span className="font-mono tnum">{formatDuration(track.duration)}</span>}
      {showYear && track.year && (
        <>
          <span className="text-faint">/</span>
          <span className="font-mono tnum">{track.year}</span>
        </>
      )}
      {showExplicit && track.explicit && (
        <Badge variant="warning" size="sm">
          E
        </Badge>
      )}
      {track.isrc && (
        <>
          <span className="text-faint">/</span>
          <span className="font-mono tnum text-xs">{track.isrc}</span>
        </>
      )}
    </div>
  );
}

/**
 * Mini track card for compact displays.
 */
export interface MiniTrackCardProps {
  track: EnhancedSong;
  onClick?: () => void;
  className?: string;
}

export function MiniTrackCard({ track, onClick, className }: MiniTrackCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-faint/50",
        onClick && "cursor-pointer hover:bg-elevated/60",
        className
      )}
      onClick={onClick}
    >
      <div className="flex size-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Music className="size-5 text-faint" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-foreground">{track.name}</h4>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>

      <span className="flex-shrink-0 font-mono tnum text-xs text-faint">
        {formatDuration(track.duration)}
      </span>
    </div>
  );
}

export default TrackInfoGrid;
