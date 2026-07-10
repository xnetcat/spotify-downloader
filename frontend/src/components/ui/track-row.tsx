import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/components/ui/cover-art";
import { Button } from "@/components/ui/button";
import type { InternalSong } from "@/types";

export interface TrackRowProps {
  track: InternalSong;
  position?: number;
  showCover?: boolean;
  showAlbum?: boolean;
  showArtist?: boolean;
  showDuration?: boolean;
  isActive?: boolean;
  isPlaying?: boolean;
  onClick?: () => void;
  onDownload?: () => void;
  compact?: boolean;
  className?: string;
}

/** Now-playing indicator rendered as three pulsing meter cells. */
const PlayingIndicator = () => (
  <div className="meter h-4 w-4" style={{ ["--meter-cells" as string]: 3 }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="meter-cell self-end"
        data-active
        style={{ height: ["55%", "100%", "40%"][i], animationDelay: `${i * 0.18}s` }}
      />
    ))}
  </div>
);

// Format seconds to mm:ss
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TrackRow({
  track,
  position,
  showCover = true,
  showAlbum = false,
  showArtist = true,
  showDuration = true,
  isActive = false,
  isPlaying = false,
  onClick,
  onDownload,
  compact = false,
  className,
}: TrackRowProps) {
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload?.();
  };

  const content = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md transition-colors",
        compact ? "px-3 py-2" : "px-4 py-3",
        isActive ? "bg-primary/10" : "hover:bg-elevated/50",
        className
      )}
      onClick={onClick}
    >
      {/* Position number or playing indicator */}
      {position !== undefined && (
        <div className="w-8 flex-shrink-0 text-center">
          {isPlaying ? (
            <PlayingIndicator />
          ) : (
            <span
              className={cn(
                "font-mono tnum text-sm",
                isActive ? "text-primary" : "text-faint group-hover:text-muted-foreground"
              )}
            >
              {String(position).padStart(2, "0")}
            </span>
          )}
        </div>
      )}

      {/* Cover art */}
      {showCover && (
        <CoverArt
          src={track.cover_url}
          alt={track.name}
          size="xs"
          fallbackIcon="track"
          className="flex-shrink-0"
        />
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p
          className={cn(
            "truncate font-medium transition-colors",
            compact ? "text-sm" : "text-base",
            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
          )}
          title={track.name}
        >
          {track.name}
        </p>

        {(showArtist || showAlbum) && (
          <p className={cn("truncate text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {showArtist && track.artist}
            {showArtist && showAlbum && track.album_name && (
              <span className="text-faint"> · </span>
            )}
            {showAlbum && track.album_name && (
              <span className="text-faint">{track.album_name}</span>
            )}
          </p>
        )}
      </div>

      {/* Duration */}
      {showDuration && (
        <span
          className={cn(
            "flex-shrink-0 font-mono tnum text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {formatDuration(track.duration)}
        </span>
      )}

      {/* Download button */}
      {onDownload && (
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDownloadClick}
          className="ml-2 size-8 flex-shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          aria-label={`Download ${track.name}`}
        >
          <Download />
        </Button>
      )}
    </div>
  );

  // If there's an onClick handler, it's already interactive — don't wrap in Link.
  if (onClick) {
    return (
      <div
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to="/song/$id"
      params={{ id: track.id }}
      className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
    >
      {content}
    </Link>
  );
}

// Variant with dividers for list usage
export interface TrackRowListProps {
  tracks: InternalSong[];
  showCover?: boolean;
  showAlbum?: boolean;
  showArtist?: boolean;
  showDuration?: boolean;
  activeTrackId?: string;
  playingTrackId?: string;
  onTrackClick?: (track: InternalSong, index: number) => void;
  onDownload?: (track: InternalSong) => void;
  compact?: boolean;
  className?: string;
}

export function TrackRowList({
  tracks,
  showCover = true,
  showAlbum = false,
  showArtist = true,
  showDuration = true,
  activeTrackId,
  playingTrackId,
  onTrackClick,
  onDownload,
  compact = false,
  className,
}: TrackRowListProps) {
  return (
    <div className={cn("divide-y divide-border", className)}>
      {tracks.map((track, index) => (
        <TrackRow
          key={track.id}
          track={track}
          position={index + 1}
          showCover={showCover}
          showAlbum={showAlbum}
          showArtist={showArtist}
          showDuration={showDuration}
          isActive={track.id === activeTrackId}
          isPlaying={track.id === playingTrackId}
          onClick={onTrackClick ? () => onTrackClick(track, index) : undefined}
          onDownload={onDownload ? () => onDownload(track) : undefined}
          compact={compact}
        />
      ))}
    </div>
  );
}

export default TrackRow;
