import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Minimal track shape the list needs — a superset of InternalSong. */
export interface TrackListTrack {
  id: string;
  name: string;
  artist: string;
  album_name?: string | null;
  album_id?: string | null;
  duration: number;
  explicit?: boolean;
  track_number?: number | null;
  matches_count?: number;
}

export interface TrackGroup<T extends TrackListTrack> {
  key: string | number;
  /** Rendered verbatim as the group's eyebrow (e.g. "Disc 1"). */
  label: string;
  count?: number;
  tracks: T[];
}

interface TrackListProps<T extends TrackListTrack> {
  /** Flat list of rows. Ignored when `groups` is provided. */
  tracks?: T[];
  /** Grouped rows with a subheader per group (disc grouping). */
  groups?: TrackGroup<T>[];
  /** Numbering source. `track` uses `track_number`; `index` counts positionally. */
  numbering?: "index" | "track";
  /** Offset added to positional numbering (pagination). */
  startIndex?: number;
  /** Secondary line beneath the title (artist, album, …). */
  subtitle?: (track: T) => ReactNode;
  /** Dedicated album column, shown from `md` up (playlist view). */
  albumColumn?: boolean;
  onDownload?: (track: T) => void;
  canDownload?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function TrackRow<T extends TrackListTrack>({
  track,
  position,
  subtitle,
  albumColumn,
  onDownload,
  canDownload,
}: {
  track: T;
  position: number;
  subtitle?: (track: T) => ReactNode;
  albumColumn?: boolean;
  onDownload?: (track: T) => void;
  canDownload?: boolean;
}) {
  const secondary = subtitle?.(track);

  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-elevated">
      <span className="w-8 shrink-0 text-right font-mono text-xs text-faint tnum">
        {String(position).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            to="/song/$id"
            params={{ id: track.id }}
            className="truncate font-medium text-foreground transition-colors hover:text-primary"
          >
            {track.name}
          </Link>
          {track.explicit && (
            <span
              aria-label="Explicit"
              title="Explicit"
              className="shrink-0 rounded-sm border border-border px-1 font-mono text-[10px] leading-4 text-faint"
            >
              E
            </span>
          )}
          {track.matches_count ? (
            <span
              title={`${track.matches_count} cross-platform matches`}
              className="hidden shrink-0 items-center gap-0.5 font-mono text-[11px] text-info tnum sm:inline-flex"
            >
              <Link2 className="size-3" />
              {track.matches_count}
            </span>
          ) : null}
        </div>
        {secondary ? (
          <div className="truncate text-sm text-muted-foreground">{secondary}</div>
        ) : null}
      </div>

      {albumColumn ? (
        <div className="hidden w-40 shrink-0 truncate text-sm text-muted-foreground md:block">
          {track.album_id ? (
            <Link
              to="/album/$id"
              params={{ id: track.album_id }}
              className="transition-colors hover:text-foreground"
            >
              {track.album_name}
            </Link>
          ) : (
            track.album_name
          )}
        </div>
      ) : null}

      <span className="w-12 shrink-0 text-right font-mono text-xs text-faint tnum">
        {formatDuration(track.duration)}
      </span>

      {canDownload ? (
        <div className="w-8 shrink-0">
          {onDownload ? (
            <button
              type="button"
              onClick={() => onDownload(track)}
              aria-label={`Download ${track.name}`}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-muted-foreground",
                "opacity-0 transition-colors hover:bg-accent hover:text-accent-foreground",
                "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              )}
            >
              <Download className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Dense, numbered track table in the Control Room language: mono index and
 * duration columns with tabular figures, hairline column header, per-row
 * download that appears on hover (and stays visible on touch).
 */
export function TrackList<T extends TrackListTrack>({
  tracks,
  groups,
  numbering = "index",
  startIndex = 0,
  subtitle,
  albumColumn = false,
  onDownload,
  canDownload = false,
}: TrackListProps<T>) {
  const positionFor = (track: T, absolute: number) =>
    numbering === "track" ? track.track_number ?? absolute + 1 : startIndex + absolute + 1;

  const renderRows = (list: T[], offset: number) =>
    list.map((track, i) => (
      <TrackRow
        key={track.id}
        track={track}
        position={positionFor(track, offset + i)}
        subtitle={subtitle}
        albumColumn={albumColumn}
        onDownload={onDownload}
        canDownload={canDownload}
      />
    ));

  let running = 0;
  const showGroupLabels = (groups?.length ?? 0) > 1;

  return (
    <div>
      {/* Column header */}
      <div className="flex items-center gap-3 border-b border-border px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-faint">
        <span className="w-8 shrink-0 text-right">#</span>
        <span className="flex-1">Title</span>
        {albumColumn ? <span className="hidden w-40 shrink-0 md:block">Album</span> : null}
        <span className="w-12 shrink-0 text-right">Time</span>
        {canDownload ? <span className="w-8 shrink-0" aria-hidden /> : null}
      </div>

      <div className="mt-1 space-y-0.5">
        {groups
          ? groups.map((group) => {
              const offset = running;
              running += group.tracks.length;
              return (
                <div key={group.key}>
                  {showGroupLabels ? (
                    <div className="flex items-center gap-2 px-2 pt-3 pb-1 text-xs font-medium uppercase tracking-wider text-faint">
                      <span>{group.label}</span>
                      {group.count != null ? (
                        <span className="font-mono text-faint/70 tnum">{group.count}</span>
                      ) : null}
                    </div>
                  ) : null}
                  {renderRows(group.tracks, offset)}
                </div>
              );
            })
          : renderRows(tracks ?? [], 0)}
      </div>
    </div>
  );
}
