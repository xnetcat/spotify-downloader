import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Download, Flag, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useInternalArtist, useRefreshEntity } from "@/api/entities";
import { useCreateReport } from "@/api";
import { useQueueStore } from "@/stores/queue";
import { useAuthStore } from "@/stores/auth";
import { Button, RefreshMetadataButton, EntityErrorCard } from "@/components/ui";
import { CoverArt } from "@/components/ui/cover-art";
import { PlatformLinksGrid } from "@/components/ui/platform-link";
import { ReportModal } from "@/components/ui/report-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityHeader, TrackList } from "@/components/entity";
import { useDevConfig } from "@/contexts/DevConfigContext";
import { cn } from "@/lib/utils";
import type {
  InternalSong,
  ArtistSummary,
  AlbumSummary,
  CreateMetadataReportRequest,
} from "@/types";

const TRACKS_PER_PAGE = 50;

export const Route = createFileRoute("/artist/$id")({
  component: ArtistPage,
});

const TARGET_PLATFORMS = ["youtube", "youtube_music", "soundcloud", "bandcamp", "piped"];

type AlbumTypeFilter = "all" | "album" | "single" | "ep" | "compilation";

const ALBUM_TYPE_LABELS: Record<AlbumTypeFilter, string> = {
  all: "All",
  album: "Albums",
  single: "Singles",
  ep: "EPs",
  compilation: "Compilations",
};

function trimDecimal(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

function formatCount(num: number): string {
  if (num >= 1_000_000) return `${trimDecimal(num / 1_000_000)}M`;
  if (num >= 1_000) return `${trimDecimal(num / 1_000)}K`;
  return String(num);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="font-mono text-lg font-semibold tabular-nums text-foreground tnum">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

function ExpandableBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const CHAR_LIMIT = 280;
  const shouldTruncate = bio.length > CHAR_LIMIT;
  const text = expanded || !shouldTruncate ? bio : `${bio.slice(0, CHAR_LIMIT).trim()}…`;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{text}</p>
      {shouldTruncate ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
      ) : null}
    </div>
  );
}

function RelatedArtistsRow({ artists }: { artists: ArtistSummary[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
        Related Artists
      </h2>
      <div className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
        {artists.map((artist) => (
          <Link
            key={artist.id}
            to="/artist/$id"
            params={{ id: artist.id }}
            className="group w-24 shrink-0 text-center"
          >
            <CoverArt
              src={artist.image_url}
              alt={artist.name}
              size="md"
              shape="circle"
              fallbackIcon="artist"
              className="mx-auto border border-border transition-colors group-hover:border-primary/50"
            />
            <p className="mt-2 truncate text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {artist.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AlbumCard({ album }: { album: AlbumSummary }) {
  const inner = (
    <>
      <CoverArt
        src={album.cover_url}
        alt={album.name}
        size="lg"
        fallbackIcon="album"
        className="w-full rounded-md border border-border transition-transform group-hover:scale-[1.02]"
      />
      <div className="mt-2 min-w-0">
        <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {album.name}
        </p>
        <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-faint tnum">
          {album.year ?? "—"}
          {album.album_type && album.album_type !== "album" ? ` · ${album.album_type}` : ""}
        </p>
      </div>
    </>
  );

  if (!album.id) {
    return <div className="group block cursor-default opacity-60">{inner}</div>;
  }
  return (
    <Link to="/album/$id" params={{ id: album.id }} className="group block">
      {inner}
    </Link>
  );
}

function PaginatedTracks({
  songs,
  onDownload,
  canDownload,
}: {
  songs: InternalSong[];
  onDownload: (song: InternalSong) => void;
  canDownload: boolean;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(songs.length / TRACKS_PER_PAGE);
  const start = (page - 1) * TRACKS_PER_PAGE;
  const pageSongs = useMemo(
    () => songs.slice(start, start + TRACKS_PER_PAGE),
    [songs, start]
  );

  return (
    <div className="space-y-3">
      <TrackList
        tracks={pageSongs}
        numbering="index"
        startIndex={start}
        subtitle={(t) => t.album_name}
        onDownload={onDownload}
        canDownload={canDownload}
      />
      {totalPages > 1 ? (
        <div className="flex items-center justify-between px-2">
          <span className="font-mono text-xs text-faint tnum">
            {start + 1}–{Math.min(start + TRACKS_PER_PAGE, songs.length)} of {songs.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
            </Button>
            <span className="px-1 font-mono text-xs text-muted-foreground tnum">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next page"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Skeleton className="mx-auto size-[200px] rounded-full sm:mx-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <p className="text-sm text-faint">Loading artist…</p>
    </div>
  );
}

function ArtistPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: artist, isLoading, error } = useInternalArtist(id);
  const refreshMetadata = useRefreshEntity();
  const { addItem, addBulkItems } = useQueueStore();
  const { isAuthenticated } = useAuthStore();
  const { features } = useDevConfig();

  const [showReportModal, setShowReportModal] = useState(false);
  const [albumFilter, setAlbumFilter] = useState<AlbumTypeFilter>("all");
  const createReportMutation = useCreateReport();

  const albumCounts = useMemo(() => {
    const counts: Record<AlbumTypeFilter, number> = {
      all: 0,
      album: 0,
      single: 0,
      ep: 0,
      compilation: 0,
    };
    if (!artist?.albums) return counts;
    counts.all = artist.albums.length;
    artist.albums.forEach((album) => {
      const type = album.album_type;
      if (type && type in counts) counts[type as AlbumTypeFilter]++;
      else counts.album++;
    });
    return counts;
  }, [artist?.albums]);

  const filteredAlbums = useMemo(() => {
    if (!artist?.albums) return [];
    if (albumFilter === "all") return artist.albums;
    return artist.albums.filter(
      (album) => album.album_type === albumFilter || (!album.album_type && albumFilter === "album")
    );
  }, [artist?.albums, albumFilter]);

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
    if (!features.canDownload || !artist?.songs.length) {
      navigate({ to: "/queue" });
      return;
    }
    const songsToAdd = artist.songs
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
        type: "artist",
        name: artist.name,
        url: artist.platforms[0]?.url || "",
      });
      toast.success(`Queued ${songsToAdd.length} tracks`);
      navigate({ to: "/queue" });
    }
  };

  if (isLoading) return <ArtistSkeleton />;
  if (error || !artist) {
    return <EntityErrorCard entityType="artist" error={error ?? null} entityId={id} />;
  }

  const originParts = [artist.origin_city, artist.origin_country].filter(Boolean).join(", ");
  const bylineBits = [
    originParts,
    artist.formed_year ? `Active since ${artist.formed_year}` : "",
  ].filter(Boolean);

  const availableFilters = (["all", "album", "single", "ep", "compilation"] as AlbumTypeFilter[]).filter(
    (f) => f === "all" || albumCounts[f] > 0
  );

  const handleReportSubmit = async (report: CreateMetadataReportRequest) => {
    await createReportMutation.mutateAsync(report);
  };

  const reportFields = [
    { name: "name", label: "Artist Name", currentValue: artist.name },
    ...(artist.genres.length > 0
      ? [{ name: "genres", label: "Genres", currentValue: artist.genres.join(", ") }]
      : []),
    ...(artist.bio ? [{ name: "bio", label: "Biography", currentValue: artist.bio }] : []),
    ...(artist.origin_country
      ? [{ name: "origin_country", label: "Country", currentValue: artist.origin_country }]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <EntityHeader
        type="artist"
        name={artist.name}
        imageUrl={artist.image_url}
        byline={bylineBits.length > 0 ? bylineBits.join(" · ") : null}
        actions={
          <>
            {features.canDownload && artist.songs.length > 0 && (
              <Button variant="primary" onClick={handleDownloadAll}>
                <Download />
                Download all songs
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
        {artist.genres.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {artist.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted-foreground"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}
      </EntityHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
        {artist.monthly_listeners != null ? (
          <StatCard label="Monthly Listeners" value={formatCount(artist.monthly_listeners)} />
        ) : null}
        {artist.popularity != null ? <StatCard label="Popularity" value={artist.popularity} /> : null}
        <StatCard label="Songs" value={artist.total_songs} />
        <StatCard label="Albums" value={artist.total_albums} />
      </div>

      {/* Listen on */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Listen on</h2>
        <PlatformLinksGrid platforms={artist.platforms} showFollowers />
      </section>

      {/* About */}
      {artist.bio ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">About</h2>
          <ExpandableBio bio={artist.bio} />
        </section>
      ) : null}

      {/* Related artists */}
      {artist.related_artists && artist.related_artists.length > 0 ? (
        <RelatedArtistsRow artists={artist.related_artists} />
      ) : null}

      {/* Discography */}
      {artist.albums.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Discography
            </h2>
            <span className="font-mono text-xs text-faint tnum">
              {artist.albums.length} releases
            </span>
          </div>

          {availableFilters.length > 2 ? (
            <div className="flex flex-wrap gap-1.5">
              {availableFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={albumFilter === filter}
                  onClick={() => setAlbumFilter(filter)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    albumFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground hover:bg-elevated hover:text-foreground"
                  )}
                >
                  {ALBUM_TYPE_LABELS[filter]}
                  {filter !== "all" ? (
                    <span className="ml-1.5 font-mono tnum opacity-70">{albumCounts[filter]}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {filteredAlbums.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredAlbums.map((album, i) => (
                <AlbumCard key={album.id ?? `${album.name}-${i}`} album={album} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-faint">
              No {ALBUM_TYPE_LABELS[albumFilter].toLowerCase()} found.
            </p>
          )}
        </section>
      ) : null}

      {/* Top tracks */}
      {artist.songs.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Top Tracks
            </h2>
            <span className="font-mono text-xs text-faint tnum">{artist.songs.length} songs</span>
          </div>
          <PaginatedTracks
            songs={artist.songs}
            onDownload={handleDownloadTrack}
            canDownload={features.canDownload}
          />
        </section>
      ) : null}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        entityType="artist"
        entityId={id}
        entityName={artist.name}
        fields={reportFields}
      />
    </motion.div>
  );
}
