import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Download, Info, Flag, Disc3, Copyright } from "lucide-react";
import { useInternalAlbum, useRefreshEntity } from "@/api/entities";
import { useCreateReport } from "@/api";
import { useQueueStore } from "@/stores/queue";
import { useAuthStore } from "@/stores/auth";
import { Button, RefreshMetadataButton, EntityErrorCard } from "@/components/ui";
import { PlatformLinksGrid } from "@/components/ui/platform-link";
import { MetadataPanel, MetadataField } from "@/components/ui/metadata-source-badge";
import { ReportModal } from "@/components/ui/report-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityHeader, TrackList } from "@/components/entity";
import { useDevConfig } from "@/contexts/DevConfigContext";
import type { InternalSong, CreateMetadataReportRequest } from "@/types";

export const Route = createFileRoute("/album/$id")({
  component: AlbumPage,
});

const TARGET_PLATFORMS = ["youtube", "youtube_music", "soundcloud", "bandcamp", "piped"];

/** Album tracks arrive with track/disc numbers the base InternalSong type omits. */
type AlbumSong = InternalSong & { track_number?: number | null; disc_number?: number | null };

const ALBUM_TYPE_LABEL: Record<string, string> = {
  album: "Album",
  single: "Single",
  ep: "EP",
  compilation: "Compilation",
};

const ALBUM_TYPE_INFO: Record<string, { title: string; detail: string }> = {
  single: { title: "Single Release", detail: "1-3 tracks" },
  ep: { title: "Extended Play", detail: "4-6 tracks" },
  compilation: { title: "Compilation Album", detail: "Various artists or greatest hits" },
};

function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function StatCard({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div
        className={
          mono
            ? "font-mono text-lg font-semibold tabular-nums text-foreground tnum"
            : "font-display text-lg font-semibold text-foreground"
        }
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Skeleton className="mx-auto size-[200px] rounded-md sm:mx-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <p className="text-sm text-faint">Loading album…</p>
    </div>
  );
}

function AlbumPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: album, isLoading, error } = useInternalAlbum(id);
  const createReportMutation = useCreateReport();
  const refreshMetadata = useRefreshEntity();
  const { addItem, addBulkItems } = useQueueStore();
  const { isAuthenticated } = useAuthStore();
  const { features } = useDevConfig();

  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const reportableFields = useMemo(() => {
    if (!album) return [];
    return [
      { name: "name", label: "Album Name", currentValue: album.name },
      { name: "artist_name", label: "Artist Name", currentValue: album.artist_name },
      { name: "year", label: "Release Year", currentValue: String(album.year || "") },
      { name: "release_date", label: "Release Date", currentValue: album.release_date || "" },
      { name: "label", label: "Record Label", currentValue: album.label || "" },
      { name: "album_type", label: "Album Type", currentValue: album.album_type || "" },
      { name: "genres", label: "Genres", currentValue: album.genres?.join(", ") || "" },
      { name: "copyright_text", label: "Copyright", currentValue: album.copyright_text || "" },
    ];
  }, [album]);

  // Group songs by disc number (single-disc albums collapse to one group).
  const discGroups = useMemo(() => {
    const songs = (album?.songs ?? []) as AlbumSong[];
    if (!songs.length) return [];

    const byTrack = (a: AlbumSong, b: AlbumSong) =>
      (a.track_number || 0) - (b.track_number || 0);

    const hasMultipleDiscs = songs.some((s) => (s.disc_number ?? 1) > 1);
    if (!hasMultipleDiscs) {
      return [{ discNumber: 1, songs: [...songs].sort(byTrack), isMultiDisc: false }];
    }

    const groups: Record<number, AlbumSong[]> = {};
    songs.forEach((s) => {
      const disc = s.disc_number || 1;
      (groups[disc] ??= []).push(s);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([disc, list]) => ({
        discNumber: Number(disc),
        songs: [...list].sort(byTrack),
        isMultiDisc: true,
      }));
  }, [album?.songs]);

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
    if (!features.canDownload || !album?.songs.length) {
      navigate({ to: "/queue" });
      return;
    }
    const songsToAdd = album.songs
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
        type: "album",
        name: album.name,
        url: album.platforms[0]?.url || "",
      });
      toast.success(`Queued ${songsToAdd.length} tracks`);
      navigate({ to: "/queue" });
    }
  };

  if (isLoading) return <AlbumSkeleton />;
  if (error || !album) {
    return <EntityErrorCard entityType="album" error={error ?? null} entityId={id} />;
  }

  const totalDuration = album.songs.reduce((sum, song) => sum + song.duration, 0);
  const typeLabel = ALBUM_TYPE_LABEL[album.album_type] || ALBUM_TYPE_LABEL.album;
  const typeInfo = ALBUM_TYPE_INFO[album.album_type];
  const isPopular = album.popularity != null && album.popularity >= 70;

  const facts = [
    album.release_date ? formatDate(album.release_date) : album.year ? String(album.year) : null,
    `${album.total_tracks} ${album.total_tracks === 1 ? "track" : "tracks"}`,
    formatTotalDuration(totalDuration),
    discGroups.length > 1 ? `${discGroups.length} discs` : null,
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
        type="album"
        name={album.name}
        imageUrl={album.cover_url}
        eyebrow={typeLabel}
        badges={
          isPopular ? (
            <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              Popular
            </span>
          ) : null
        }
        byline={
          album.artist_id ? (
            <Link
              to="/artist/$id"
              params={{ id: album.artist_id }}
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              {album.artist_name}
            </Link>
          ) : (
            album.artist_name
          )
        }
        facts={facts}
        actions={
          <>
            {features.canDownload && album.songs.length > 0 && (
              <Button variant="primary" onClick={handleDownloadAll}>
                <Download />
                Download album
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetails((v) => !v)}>
              <Info />
              {showDetails ? "Hide details" : "Show details"}
            </Button>
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
        {album.genres && album.genres.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {album.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted-foreground"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}
        {album.label ? (
          <p className="text-sm text-faint">
            Label · <span className="text-muted-foreground">{album.label}</span>
          </p>
        ) : null}
      </EntityHeader>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-3">
        <StatCard label="Tracks" value={album.total_tracks} />
        <StatCard label="Duration" value={formatTotalDuration(totalDuration)} mono />
        {discGroups.length > 1 ? <StatCard label="Discs" value={discGroups.length} /> : null}
      </div>

      {/* Track list */}
      {album.songs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Tracks <span className="font-mono text-sm font-normal text-faint tnum">{album.total_tracks}</span>
          </h2>
          <TrackList<AlbumSong>
            groups={discGroups.map((g) => ({
              key: g.discNumber,
              label: `Disc ${g.discNumber}`,
              count: g.isMultiDisc ? g.songs.length : undefined,
              tracks: g.songs as AlbumSong[],
            }))}
            numbering="track"
            subtitle={(t) => (t.artist !== album.artist_name ? t.artist : null)}
            onDownload={handleDownloadTrack}
            canDownload={features.canDownload}
          />
        </section>
      ) : null}

      {/* Listen on */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Listen on</h2>
        <PlatformLinksGrid platforms={album.platforms} />
      </section>

      {/* Album type info */}
      {typeInfo ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface text-primary">
            <Disc3 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{typeInfo.title}</p>
            <p className="text-xs text-faint">{typeInfo.detail}</p>
          </div>
        </div>
      ) : null}

      {/* Details */}
      {showDetails ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <MetadataPanel title="Album Details" defaultOpen>
            <div className="space-y-3">
              <MetadataField label="Title" value={album.name} />
              <MetadataField label="Artist" value={album.artist_name} />
              <MetadataField label="Type" value={typeLabel} />
              {album.release_date ? (
                <MetadataField label="Release date" value={formatDate(album.release_date)} />
              ) : album.year ? (
                <MetadataField label="Release year" value={String(album.year)} />
              ) : null}
              {album.label ? <MetadataField label="Label" value={album.label} /> : null}
              <MetadataField label="Tracks" value={String(album.total_tracks)} />
              {discGroups.length > 1 ? (
                <MetadataField label="Discs" value={String(discGroups.length)} />
              ) : null}
              <MetadataField
                label="Duration"
                value={<span className="font-mono tnum">{formatTotalDuration(totalDuration)}</span>}
              />
              {album.popularity != null ? (
                <MetadataField label="Popularity" value={`${album.popularity}%`} />
              ) : null}
              {album.genres && album.genres.length > 0 ? (
                <MetadataField label="Genres" value={album.genres.join(", ")} />
              ) : null}
            </div>
          </MetadataPanel>

          {album.copyright_text ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground">
                <Copyright className="size-4 text-faint" />
                Rights Information
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {album.copyright_text}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        entityType="album"
        entityId={id}
        entityName={album.name}
        fields={reportableFields}
      />
    </motion.div>
  );
}
