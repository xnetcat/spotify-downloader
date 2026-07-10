import { useState, useMemo, useEffect } from "react";
import { Columns3 } from "lucide-react";
import { useMetadataSnapshots } from "@/api/entities";
import { Button } from "@/components/ui";
import { MetadataSourceSelector } from "@/components/ui/metadata-source-selector";
import { MetadataComparisonTable } from "@/components/ui/metadata-comparison";
import type { EnhancedSong, NormalizedMetadata } from "@/types";
import type { MetadataSnapshot } from "@/types/metadata";

interface SongSnapshotsSectionProps {
  songId: string;
  hasSong: boolean;
  /** Callback to notify parent of the active snapshot for display metadata merging */
  onSnapshotChange?: (snapshot: SnapshotInfo) => void;
}

export interface SnapshotInfo {
  activeSource: string | null;
  activeSnapshot: {
    source: string;
    confidence: number;
    data: NormalizedMetadata;
    fetched_at?: string;
    fetchedAt?: string;
  } | null;
  snapshots: MetadataSnapshot[];
  sources: string[];
}

export function SongSnapshotsSection({ songId, hasSong, onSnapshotChange }: SongSnapshotsSectionProps) {
  const [activeMetadataSource, setActiveMetadataSource] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const { data: snapshotsData } = useMetadataSnapshots(songId, {
    enabled: hasSong,
  });

  // Set default source when snapshots load
  useEffect(() => {
    if (snapshotsData?.snapshots?.length && !activeMetadataSource) {
      const sorted = [...snapshotsData.snapshots].sort((a, b) => b.confidence - a.confidence);
      setActiveMetadataSource(sorted[0].source);
    }
  }, [snapshotsData, activeMetadataSource]);

  const extendedSnapshotsInfo = useMemo(() => {
    const backendSnapshots = snapshotsData?.snapshots || [];
    const allSources = Array.from(new Set([...(snapshotsData?.sources || [])]));

    return {
      snapshots: backendSnapshots,
      sources: allSources,
    };
  }, [snapshotsData]);

  const activeSnapshot = useMemo(() => {
    if (!activeMetadataSource) return extendedSnapshotsInfo.snapshots[0] || null;
    return extendedSnapshotsInfo.snapshots.find((s) => s.source === activeMetadataSource) || null;
  }, [extendedSnapshotsInfo, activeMetadataSource]);

  // Notify parent when snapshot state changes
  useEffect(() => {
    onSnapshotChange?.({
      activeSource: activeMetadataSource,
      activeSnapshot: activeSnapshot as SnapshotInfo["activeSnapshot"],
      snapshots: extendedSnapshotsInfo.snapshots,
      sources: extendedSnapshotsInfo.sources,
    });
  }, [activeMetadataSource, activeSnapshot, extendedSnapshotsInfo, onSnapshotChange]);

  if (!extendedSnapshotsInfo.snapshots.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-faint">Metadata sources</h2>
        {extendedSnapshotsInfo.snapshots.length > 1 && (
          <Button
            variant={showComparison ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
          >
            <Columns3 />
            {showComparison ? "Hide comparison" : "Compare sources"}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <MetadataSourceSelector
          sources={extendedSnapshotsInfo.sources}
          activeSource={activeMetadataSource || ""}
          onSourceChange={setActiveMetadataSource}
          snapshots={extendedSnapshotsInfo.snapshots as any}
          showConfidence={true}
          size="md"
        />

        {activeSnapshot && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>Viewing data from</span>
            <span className="font-medium text-foreground">{activeMetadataSource}</span>
            <span className="text-faint">·</span>
            <span className="font-mono tnum">
              {Math.round(activeSnapshot.confidence * 100)}% confidence
            </span>
            <span className="text-faint">·</span>
            <span className="font-mono tnum">
              {new Date(
                (activeSnapshot as any).fetched_at || (activeSnapshot as any).fetchedAt || new Date()
              ).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {showComparison && extendedSnapshotsInfo.snapshots.length > 1 && (
        <MetadataComparisonTable
          snapshots={extendedSnapshotsInfo.snapshots as any}
          showOnlyDifferences={false}
        />
      )}
    </section>
  );
}

/**
 * Build display metadata by merging the active snapshot data with the song.
 */
export function buildDisplayMetadata(
  song: EnhancedSong,
  snapshotInfo: SnapshotInfo | null,
): EnhancedSong {
  if (!snapshotInfo?.activeSnapshot?.data) return song;

  const data = snapshotInfo.activeSnapshot.data;

  return {
    ...song,
    name: data.name || song.name,
    artist: data.album_artist || data.artists?.[0] || song.artist,
    album_name: data.album_name || song.album_name,
    genres: data.genres || song.genres,
    label: data.label || song.label,
    release_date: data.release_date || song.release_date,
    year: data.year || song.year,
    audio_features: song.audio_features
      ? {
          ...song.audio_features,
          bpm: data.bpm ?? song.audio_features.bpm,
          energy: data.energy ?? song.audio_features.energy,
          danceability: data.danceability ?? song.audio_features.danceability,
          valence: data.valence ?? song.audio_features.valence,
        }
      : song.audio_features,
  };
}
