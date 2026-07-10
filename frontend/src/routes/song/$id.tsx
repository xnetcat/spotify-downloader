import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { useInternalSong, useRefreshEntity } from "@/api/entities";
import { useCreateReport } from "@/api";
import { EntityErrorCard, Skeleton } from "@/components/ui";
import { ReportModal } from "@/components/ui/report-modal";
import {
  SongHeader,
  SongAudioFeatures,
  SongLyricsSection,
  SongMatchesSection,
  SongSnapshotsSection,
  SongMetadataPanel,
  buildDisplayMetadata,
} from "@/components/song";
import type { SnapshotInfo } from "@/components/song";
import type { CreateMetadataReportRequest } from "@/types";

export const Route = createFileRoute("/song/$id")({
  component: SongPage,
});

function SongPageSkeleton() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <Skeleton className="mx-auto aspect-square w-full max-w-[200px] rounded-md sm:mx-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3.5 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-24" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SongPage() {
  const { id } = Route.useParams();
  const { data: song, isLoading, error } = useInternalSong(id);

  const createReportMutation = useCreateReport();
  const refreshMetadata = useRefreshEntity();

  const [showReportModal, setShowReportModal] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [snapshotInfo, setSnapshotInfo] = useState<SnapshotInfo | null>(null);

  const handleSnapshotChange = useCallback((info: SnapshotInfo) => {
    setSnapshotInfo(info);
  }, []);

  const displayMetadata = useMemo(() => {
    if (!song) return null;
    return buildDisplayMetadata(song, snapshotInfo);
  }, [song, snapshotInfo]);

  const handleReportSubmit = async (report: CreateMetadataReportRequest) => {
    await createReportMutation.mutateAsync(report);
  };

  const reportableFields = useMemo(() => {
    if (!song) return [];
    return [
      { name: "name", label: "Song Name", currentValue: song.name },
      { name: "artist", label: "Artist", currentValue: song.artist },
      { name: "album_name", label: "Album", currentValue: song.album_name || "" },
      { name: "year", label: "Year", currentValue: String(song.year || "") },
      { name: "release_date", label: "Release Date", currentValue: song.release_date || "" },
      { name: "label", label: "Record Label", currentValue: song.label || "" },
      { name: "genres", label: "Genres", currentValue: song.genres?.join(", ") || "" },
      { name: "isrc", label: "ISRC", currentValue: song.isrc || "" },
      { name: "track_number", label: "Track Number", currentValue: String(song.track_number || "") },
      { name: "disc_number", label: "Disc Number", currentValue: String(song.disc_number || "") },
    ];
  }, [song]);

  const handleRefresh = useCallback(async () => {
    await refreshMetadata.mutateAsync(id);
  }, [id, refreshMetadata]);

  if (isLoading) {
    return <SongPageSkeleton />;
  }

  if (error || !song) {
    return <EntityErrorCard entityType="song" error={error ?? null} entityId={id} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      <SongHeader
        song={song}
        displayMetadata={displayMetadata}
        entityId={id}
        onRefresh={handleRefresh}
        onShowReportModal={() => setShowReportModal(true)}
      />

      <SongSnapshotsSection songId={id} hasSong={!!song} onSnapshotChange={handleSnapshotChange} />

      <SongMetadataPanel
        song={song}
        displayMetadata={displayMetadata}
        entityId={id}
        activeMetadataSource={snapshotInfo?.activeSource ?? null}
      />

      {displayMetadata?.audio_features && (
        <SongAudioFeatures
          features={displayMetadata.audio_features}
          expanded={showAllFeatures}
          onToggleExpand={() => setShowAllFeatures(!showAllFeatures)}
        />
      )}

      <SongMatchesSection songId={id} />

      <SongLyricsSection songId={id} hasSong={!!song} />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        entityType="song"
        entityId={id}
        entityName={song.name}
        fields={reportableFields}
      />
    </motion.div>
  );
}
