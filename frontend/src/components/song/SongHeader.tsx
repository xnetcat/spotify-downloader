import { Link, useNavigate } from "@tanstack/react-router";
import { Download, Flag } from "lucide-react";
import { Badge, Button, RefreshMetadataButton } from "@/components/ui";
import { CoverArt } from "@/components/ui/cover-art";
import { PlatformLinksGrid } from "@/components/ui/platform-link";
import { useQueueStore } from "@/stores/queue";
import { useAuthStore } from "@/stores/auth";
import { useDevConfig } from "@/contexts/DevConfigContext";
import type { EnhancedSong } from "@/types";

/** Platforms that support downloading (via yt-dlp or provider hooks) -- shown only in self-hosted mode */
const DOWNLOADABLE_PLATFORMS = new Set(["youtube", "youtube_music", "soundcloud", "bandcamp", "piped"]);

const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function keySignatureLabel(keyNum: number, mode: number | null): string {
  const keyName = KEY_NAMES[keyNum] || "?";
  const modeName = mode === 1 ? "Major" : mode === 0 ? "Minor" : "";
  return modeName ? `${keyName} ${modeName}` : keyName;
}

/** Dot separator for the mono data strip. */
function Dot() {
  return <span className="text-faint">·</span>;
}

interface SongHeaderProps {
  song: EnhancedSong;
  displayMetadata: EnhancedSong | null;
  entityId: string;
  onRefresh: () => Promise<void>;
  onShowReportModal: () => void;
}

export function SongHeader({
  song,
  displayMetadata,
  entityId,
  onRefresh,
  onShowReportModal,
}: SongHeaderProps) {
  const navigate = useNavigate();
  const addItem = useQueueStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();
  const { features } = useDevConfig();

  const platformsForGrid = song.platforms;

  const trackLabel = (() => {
    if (song.track_number && song.disc_number && song.disc_number > 1) {
      return `Disc ${song.disc_number}, track ${song.track_number}`;
    }
    if (song.track_number) return `Track ${song.track_number}`;
    return null;
  })();

  const releaseLine = displayMetadata?.release_date
    ? displayMetadata.release_date
    : displayMetadata?.year
      ? String(displayMetadata.year)
      : null;

  const keyLabel =
    song.audio_features?.key !== null && song.audio_features?.key !== undefined
      ? keySignatureLabel(song.audio_features.key, song.audio_features.mode)
      : null;

  const handleDownload = async () => {
    if (!features.canDownload || !song || !song.platforms[0]) {
      navigate({ to: "/queue" });
      return;
    }

    const downloadable =
      song.platforms.find((p) => DOWNLOADABLE_PLATFORMS.has(p.platform)) || song.platforms[0];

    addItem({
      platform: downloadable.platform,
      platform_id: downloadable.platform_id,
      url: downloadable.url,
      name: song.name,
      artists: song.artists || [song.artist],
      artist: song.artist,
      album_name: song.album_name || undefined,
      duration: song.duration,
      isrc: song.isrc || undefined,
      cover_url: song.cover_url || undefined,
    } as any);
    navigate({ to: "/queue" });
  };

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
      {/* Cover art */}
      <div className="mx-auto w-full max-w-[200px] shrink-0 sm:mx-0">
        <CoverArt
          src={song.cover_url}
          alt={song.name}
          size="hero"
          className="aspect-square w-full rounded-md border border-border"
        />
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1 space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-faint">Track</span>
            {trackLabel && (
              <Badge variant="muted" size="sm">
                {trackLabel}
              </Badge>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {displayMetadata?.name || song.name}
          </h1>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {song.artist_id ? (
              <Link
                to="/artist/$id"
                params={{ id: song.artist_id }}
                className="text-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                {displayMetadata?.artist || song.artist}
              </Link>
            ) : (
              <span className="text-lg text-muted-foreground">
                {displayMetadata?.artist || song.artist}
              </span>
            )}
            {(displayMetadata?.album_name || song.album_name) && (
              <>
                <Dot />
                {song.album_id ? (
                  <Link
                    to="/album/$id"
                    params={{ id: song.album_id }}
                    className="text-base text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {displayMetadata?.album_name || song.album_name}
                  </Link>
                ) : (
                  <span className="text-base text-muted-foreground">
                    {displayMetadata?.album_name || song.album_name}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mono data strip */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs tnum text-muted-foreground">
          <span>{formatDuration(song.duration)}</span>
          {releaseLine && (
            <>
              <Dot />
              <span>{releaseLine}</span>
            </>
          )}
          {keyLabel && (
            <>
              <Dot />
              <span>{keyLabel}</span>
            </>
          )}
          {song.isrc && (
            <>
              <Dot />
              <span>{song.isrc}</span>
            </>
          )}
          {song.explicit && (
            <Badge variant="warning" size="sm" className="ml-1">
              Explicit
            </Badge>
          )}
        </div>

        {/* Platform links */}
        {platformsForGrid.length > 0 && <PlatformLinksGrid platforms={platformsForGrid} />}

        {/* Primary actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {features.canDownload && platformsForGrid.length > 0 && (
            <Button variant="primary" onClick={() => handleDownload()}>
              <Download />
              Download best match
            </Button>
          )}

          <RefreshMetadataButton entityId={entityId} onRefresh={onRefresh} size="md" />

          {isAuthenticated && (
            <Button variant="ghost" onClick={onShowReportModal}>
              <Flag />
              Report issue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
