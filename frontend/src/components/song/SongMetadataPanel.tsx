import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { EnhancedSong } from "@/types";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** A definition-grid entry: eyebrow key + value. */
function Field({ label, mono, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wider text-faint">{label}</dt>
      <dd className={cn("text-sm text-foreground", mono && "font-mono tnum")}>{children}</dd>
    </div>
  );
}

/** A key/value row inside the technical block. */
function TechRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

interface SongMetadataPanelProps {
  song: EnhancedSong;
  displayMetadata: EnhancedSong | null;
  entityId: string;
  activeMetadataSource: string | null;
}

export function SongMetadataPanel({
  song,
  displayMetadata,
  entityId,
  activeMetadataSource,
}: SongMetadataPanelProps) {
  const [showTechnicalMetadata, setShowTechnicalMetadata] = useState(false);

  const platformsForGrid = song.platforms;

  const albumName = displayMetadata?.album_name || song.album_name;
  const releaseDate = displayMetadata?.release_date || song.release_date;
  const year = displayMetadata?.year || song.year;
  const label = displayMetadata?.label || song.label;
  const genres = displayMetadata?.genres || song.genres;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-faint">Metadata</h2>
      </div>

      {/* Definition grid */}
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Field label="Title">{displayMetadata?.name || song.name}</Field>
        <Field label="Artist">{displayMetadata?.artist || song.artist}</Field>
        {albumName && <Field label="Album">{albumName}</Field>}
        <Field label="Duration" mono>
          {formatDuration(song.duration)}
        </Field>
        {releaseDate ? (
          <Field label="Release date" mono>
            {releaseDate}
          </Field>
        ) : (
          year && (
            <Field label="Year" mono>
              {String(year)}
            </Field>
          )
        )}
        {label && <Field label="Label">{label}</Field>}
        {genres && genres.length > 0 && (
          <Field label="Genres">
            <div className="flex flex-wrap gap-1.5">
              {genres.map((genre) => (
                <Badge key={genre} variant="muted" size="sm">
                  {genre}
                </Badge>
              ))}
            </div>
          </Field>
        )}
        {song.popularity !== null && song.popularity !== undefined && (
          <Field label="Popularity" mono>
            {song.popularity}%
          </Field>
        )}
        {activeMetadataSource && activeMetadataSource !== "spotify" && (
          <Field label="Source">
            <Badge variant="muted" size="sm">
              {activeMetadataSource}
            </Badge>
          </Field>
        )}
      </dl>

      {/* Rights information */}
      {(label || song.copyright_text) && (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-faint">Rights Information</h3>
          {label && (
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-wider text-faint">Label</p>
              <p className="text-sm text-foreground">{label}</p>
            </div>
          )}
          {song.copyright_text && (
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-wider text-faint">Copyright</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{song.copyright_text}</p>
            </div>
          )}
        </div>
      )}

      {/* Technical info (collapsible) */}
      <div className="border-t border-border pt-4">
        <button
          onClick={() => setShowTechnicalMetadata(!showTechnicalMetadata)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-expanded={showTechnicalMetadata}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-faint">Technical Info</span>
          <ChevronDown
            className={cn(
              "size-4 text-faint transition-transform",
              showTechnicalMetadata && "rotate-180"
            )}
          />
        </button>

        {showTechnicalMetadata && (
          <div className="mt-4 space-y-3">
            {song.isrc && (
              <TechRow label="ISRC">
                <code className="rounded bg-surface px-2 py-1 font-mono text-sm text-info">
                  {song.isrc}
                </code>
              </TechRow>
            )}
            {platformsForGrid.map((p) => (
              <TechRow key={p.platform} label={`${p.platform} ID`}>
                <code className="max-w-[180px] truncate rounded bg-surface px-2 py-1 font-mono text-sm text-muted-foreground">
                  {p.platform_id}
                </code>
              </TechRow>
            ))}
            <TechRow label="Internal ID">
              <code className="max-w-[180px] truncate rounded bg-surface px-2 py-1 font-mono text-sm text-faint">
                {entityId}
              </code>
            </TechRow>

            {(song.musicbrainz_id || song.discogs_id) && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs uppercase tracking-wider text-faint">External IDs</p>
                {song.musicbrainz_id && (
                  <TechRow label="MusicBrainz">
                    <a
                      href={`https://musicbrainz.org/recording/${song.musicbrainz_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[180px] truncate rounded bg-surface px-2 py-1 font-mono text-sm text-info hover:underline"
                    >
                      {song.musicbrainz_id.slice(0, 8)}...
                    </a>
                  </TechRow>
                )}
                {song.discogs_id && (
                  <TechRow label="Discogs">
                    <a
                      href={`https://www.discogs.com/release/${song.discogs_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-surface px-2 py-1 font-mono text-sm text-info hover:underline"
                    >
                      {song.discogs_id}
                    </a>
                  </TechRow>
                )}
              </div>
            )}

            {song.field_sources && Object.keys(song.field_sources).length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs uppercase tracking-wider text-faint">Data sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(song.field_sources).map(([field, source]) => (
                    <Badge key={field} variant="muted" size="sm" title={`${field} from ${source}`}>
                      {field}: {source as string}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {song.enriched_at && (
              <TechRow label="Last enriched">
                <span className="font-mono tnum text-xs text-muted-foreground">
                  {new Date(song.enriched_at).toLocaleDateString()}
                </span>
              </TechRow>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
