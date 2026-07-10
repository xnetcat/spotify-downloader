import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Download, Flag, User } from "lucide-react";
import { useInternalPlaylist, useRefreshEntity } from "@/api/entities";
import { useCreateReport } from "@/api";
import { useQueueStore } from "@/stores/queue";
import { useAuthStore } from "@/stores/auth";
import { Button, RefreshMetadataButton, EntityErrorCard } from "@/components/ui";
import { PlatformLinksGrid } from "@/components/ui/platform-link";
import { ReportModal } from "@/components/ui/report-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityHeader, TrackList } from "@/components/entity";
import { useDevConfig } from "@/contexts/DevConfigContext";
import type { InternalSong, CreateMetadataReportRequest } from "@/types";

export const Route = createFileRoute("/playlist/$id")({
  component: PlaylistPage,
});

const TARGET_PLATFORMS = ["youtube", "youtube_music", "soundcloud", "bandcamp", "piped"];

function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&#x27;": "'",
  "&#x2F;": "/",
};

/** Strip HTML tags and decode a small set of entities. */
function sanitizeDescription(text: string | null): string {
  if (!text) return "";
  let sanitized = text.replace(/<[^>]*>/g, "");
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    sanitized = sanitized.replace(new RegExp(entity, "g"), char);
  }
  return sanitized.replace(/\s+/g, " ").trim();
}

function PlaylistSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Skeleton className="mx-auto size-[200px] rounded-md sm:mx-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <p className="text-sm text-faint">Loading playlist…</p>
    </div>
  );
}

function PlaylistPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: playlist, isLoading, error } = useInternalPlaylist(id);
  const refreshMetadata = useRefreshEntity();
  const { addItem, addBulkItems } = useQueueStore();
  const { isAuthenticated } = useAuthStore();
  const createReportMutation = useCreateReport();
  const { features } = useDevConfig();

  const [showReportModal, setShowReportModal] = useState(false);

  const description = useMemo(
    () => sanitizeDescription(playlist?.description ?? null),
    [playlist?.description]
  );

  const handleDownloadTrack = (track: InternalSong) => {
    if (!features.canDownload || !track.platforms[0]) {
      navigate({ to: "/queue" });
      return;
    }
    const downloadable =
      track.platforms.find((p) => TARGET_PLATFORMS.includes(p.platform)) || track.platforms[0];
    addItem({
      platform: downloadable.platform,
      platform_id: downloadable.platform_id,
      url: downloadable.url,
      name: track.name,
      artists: track.artists || [track.artist],
      artist: track.artist,
      album_name: track.album_name,
      duration: track.duration,
      isrc: track.isrc,
      cover_url: track.cover_url,
    } as any);
    toast.success("Added to download queue");
    navigate({ to: "/queue" });
  };

  const handleDownloadAll = () => {
    if (!features.canDownload || !playlist?.songs.length) {
      navigate({ to: "/queue" });
      return;
    }
    const songsToAdd = playlist.songs
      .filter((song) => song.platforms[0])
      .map((song) => ({
        platform: song.platforms[0].platform,
        platform_id: song.platforms[0].platform_id,
        url: song.platforms[0].url,
        name: song.name,
        artists: song.artists,
        artist: song.artist,
        album_name: song.album_name,
        duration: song.duration,
        isrc: song.isrc,
        cover_url: song.cover_url,
      }));
    if (songsToAdd.length > 0 && addBulkItems) {
      addBulkItems(songsToAdd, {
        type: "playlist",
        name: playlist.name,
        url: playlist.platforms[0]?.url || "",
      });
      toast.success(`Queued ${songsToAdd.length} tracks`);
      navigate({ to: "/queue" });
    }
  };

  if (isLoading) return <PlaylistSkeleton />;
  if (error || !playlist) {
    return <EntityErrorCard entityType="playlist" error={error ?? null} entityId={id} />;
  }

  const totalDuration = playlist.songs.reduce((sum, song) => sum + song.duration, 0);

  const facts = [
    `${playlist.total_tracks} ${playlist.total_tracks === 1 ? "track" : "tracks"}`,
    formatTotalDuration(totalDuration),
  ];

  const reportFields = [
    { name: "name", label: "Playlist Name", currentValue: playlist.name },
    ...(playlist.owner_name
      ? [{ name: "owner_name", label: "Owner Name", currentValue: playlist.owner_name }]
      : []),
    ...(description ? [{ name: "description", label: "Description", currentValue: description }] : []),
  ];

  const handleReportSubmit = async (report: CreateMetadataReportRequest) => {
    await createReportMutation.mutateAsync(report);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <EntityHeader
        type="playlist"
        name={playlist.name}
        imageUrl={playlist.cover_url}
        byline={
          playlist.owner_name ? (
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-faint" />
              <span className="font-medium text-foreground">{playlist.owner_name}</span>
            </span>
          ) : null
        }
        facts={facts}
        actions={
          <>
            {features.canDownload && playlist.songs.length > 0 && (
              <Button variant="primary" onClick={handleDownloadAll}>
                <Download />
                Download playlist
              </Button>
            )}
            <RefreshMetadataButton
              entityId={id}
              onRefresh={async () => {
                await refreshMetadata.mutateAsync(id);
              }}
            />
            {isAuthenticated && (
              <Button variant="ghost" onClick={() => setShowReportModal(true)}>
                <Flag />
                Report issue
              </Button>
            )}
          </>
        }
      >
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </EntityHeader>

      {/* Track list */}
      {playlist.songs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Tracks{" "}
            <span className="font-mono text-sm font-normal text-faint tnum">
              {playlist.total_tracks}
            </span>
          </h2>
          <TrackList
            tracks={playlist.songs}
            numbering="index"
            subtitle={(t) => t.artist}
            albumColumn
            onDownload={handleDownloadTrack}
            canDownload={features.canDownload}
          />
        </section>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Download className="size-8 text-faint" />
          <p className="text-sm text-muted-foreground">This playlist has no tracks yet.</p>
        </div>
      )}

      {/* Listen on */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Listen on</h2>
        {playlist.platforms.length > 0 ? (
          <PlatformLinksGrid platforms={playlist.platforms} showFollowers />
        ) : (
          <p className="text-sm text-faint">No platform links available.</p>
        )}
      </section>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        entityType="playlist"
        entityId={id}
        entityName={playlist.name}
        fields={reportFields}
      />
    </motion.div>
  );
}
