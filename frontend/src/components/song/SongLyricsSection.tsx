import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import {
  useAllLyrics,
  fetchAllLyrics,
  useSubmitLyrics,
  entityKeys,
} from "@/api/entities";
import { useLyrics, hasLyrics, toLyrics } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { Badge, Button, Skeleton, useToast } from "@/components/ui";
import { LyricsDisplay, MultiSourceLyricsDisplay } from "@/components/ui/lyrics-display";
import { SubmitLyricsModal } from "@/components/ui/submit-lyrics-modal";

interface SongLyricsSectionProps {
  songId: string;
  hasSong: boolean;
}

export function SongLyricsSection({ songId, hasSong }: SongLyricsSectionProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { success: showSuccess, error: showError } = useToast();

  const { data: lyricsData, isLoading: lyricsLoading } = useLyrics(songId, { enabled: hasSong });
  const { data: allLyricsData, isLoading: allLyricsLoading } = useAllLyrics(songId, { enabled: hasSong });
  const submitLyricsMutation = useSubmitLyrics();

  const [activeLyricsSource, setActiveLyricsSource] = useState<string | null>(null);
  const [fetchingAllLyrics, setFetchingAllLyrics] = useState(false);
  const [showSubmitLyrics, setShowSubmitLyrics] = useState(false);

  const lyrics = lyricsData && hasLyrics(lyricsData) ? toLyrics(lyricsData) : null;

  const handleFetchAll = async () => {
    setFetchingAllLyrics(true);
    try {
      await fetchAllLyrics(songId);
      queryClient.invalidateQueries({ queryKey: [...entityKeys.song(songId), "all-lyrics"] });
      showSuccess("Fetched lyrics from all sources");
    } catch {
      showError("Failed to fetch lyrics");
    } finally {
      setFetchingAllLyrics(false);
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wider text-faint">Lyrics</h2>
            {allLyricsData && allLyricsData.lyrics.length > 1 && (
              <Badge variant="muted" size="sm">
                {allLyricsData.lyrics.length} sources
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button size="sm" variant="primary" onClick={() => setShowSubmitLyrics(true)}>
                Add lyrics
              </Button>
            )}
            {hasSong && (
              <Button
                size="sm"
                variant="secondary"
                isLoading={fetchingAllLyrics}
                onClick={handleFetchAll}
              >
                Fetch all sources
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface [&_*]:leading-loose">
          {lyricsLoading || allLyricsLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-3.5" style={{ width: `${55 + ((i * 13) % 40)}%` }} />
              ))}
            </div>
          ) : allLyricsData && allLyricsData.lyrics.length > 0 ? (
            <MultiSourceLyricsDisplay
              lyricsSources={allLyricsData.lyrics}
              activeSource={activeLyricsSource || undefined}
              onSourceChange={setActiveLyricsSource}
              maxHeight="400px"
            />
          ) : lyrics ? (
            <LyricsDisplay lyrics={lyrics} maxHeight="400px" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <FileText className="size-8 text-faint" />
              <p className="text-sm text-muted-foreground">No lyrics available</p>
              <p className="text-xs text-faint">Lyrics couldn't be found for this track</p>
            </div>
          )}
        </div>
      </section>

      <SubmitLyricsModal
        isOpen={showSubmitLyrics}
        onClose={() => setShowSubmitLyrics(false)}
        onSubmit={(data) => {
          submitLyricsMutation.mutate(
            { songId, ...data },
            { onSuccess: () => setShowSubmitLyrics(false) }
          );
        }}
        isSubmitting={submitLyricsMutation.isPending}
      />
    </>
  );
}
