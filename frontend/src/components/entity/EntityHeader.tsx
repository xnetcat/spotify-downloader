import type { ReactNode } from "react";
import { CoverArt } from "@/components/ui/cover-art";
import { cn } from "@/lib/utils";
import type { DisplayEntityType } from "@/types";

const TYPE_LABEL: Record<DisplayEntityType, string> = {
  artist: "Artist",
  album: "Album",
  playlist: "Playlist",
  track: "Track",
};

const FALLBACK_ICON: Record<DisplayEntityType, "artist" | "album" | "playlist" | "track"> = {
  artist: "artist",
  album: "album",
  playlist: "playlist",
  track: "track",
};

interface EntityHeaderProps {
  type: DisplayEntityType;
  name: string;
  imageUrl?: string | null;
  /** Eyebrow text; defaults to the entity-type label. */
  eyebrow?: string;
  /** Extra pills beside the eyebrow (e.g. "Popular"). */
  badges?: ReactNode;
  /** Byline under the title — links or origin text. */
  byline?: ReactNode;
  /** Mono fact strip items, joined with middots. */
  facts?: ReactNode[];
  /** Extra content below facts (genres, description). */
  children?: ReactNode;
  /** Action row (download, refresh, report). */
  actions?: ReactNode;
}

/**
 * Shared collection-page header: cover/avatar on the left (circular for
 * artists, bordered rounded thumb otherwise), stacked eyebrow · title ·
 * byline · mono fact strip · actions on the right.
 */
export function EntityHeader({
  type,
  name,
  imageUrl,
  eyebrow,
  badges,
  byline,
  facts,
  children,
  actions,
}: EntityHeaderProps) {
  const isArtist = type === "artist";
  const visibleFacts = facts?.filter(Boolean) ?? [];

  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <CoverArt
        src={imageUrl ?? null}
        alt={name}
        size="xl"
        shape={isArtist ? "circle" : "rounded"}
        fallbackIcon={FALLBACK_ICON[type]}
        className={cn("mx-auto shrink-0 border border-border sm:mx-0", !isArtist && "rounded-md")}
      />

      <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="text-xs font-medium uppercase tracking-wider text-faint">
            {eyebrow ?? TYPE_LABEL[type]}
          </span>
          {badges}
        </div>

        <h1 className="break-words font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {name}
        </h1>

        {byline ? <div className="text-base text-muted-foreground">{byline}</div> : null}

        {visibleFacts.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-faint tnum sm:justify-start">
            {visibleFacts.map((fact, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 ? (
                  <span aria-hidden className="text-faint/50">
                    ·
                  </span>
                ) : null}
                {fact}
              </span>
            ))}
          </div>
        ) : null}

        {children}

        {actions ? (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
