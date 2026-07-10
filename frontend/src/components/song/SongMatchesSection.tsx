import { Search, ThumbsUp, ThumbsDown, Radar } from "lucide-react";
import { useMatchesForSong, useDiscoverMatchesMutation } from "@/api/matches";
import { useVote } from "@/api/votes";
import { useAuthStore } from "@/stores/auth";
import { Badge, Button, ScoreBadge, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Match } from "@/types";

const MATCH_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  verified: { label: "Verified", className: "text-success bg-success/15" },
  rejected: { label: "Rejected", className: "text-destructive bg-destructive/15" },
  pending: { label: "Pending", className: "text-muted-foreground bg-muted" },
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  youtube_music: "YT Music",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  deezer: "Deezer",
  bandcamp: "Bandcamp",
  tidal: "Tidal",
  apple_music: "Apple Music",
};

function formatDurationMatch(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function MatchRow({ match, isAuthenticated }: { match: Match; isAuthenticated: boolean }) {
  const { vote, userVote, isLoading: voteLoading } = useVote(match.id!);
  const status = match.status ?? "pending";
  const statusStyle = MATCH_STATUS_STYLES[status] ?? MATCH_STATUS_STYLES.pending;
  const rawScore = match.score ?? 0;
  const score = rawScore > 1 ? Math.round(rawScore) : Math.round(rawScore * 100);

  return (
    <div className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-elevated/50">
      <ScoreBadge score={score} className="shrink-0" />

      <div className="min-w-0 flex-1">
        {match.result.url ? (
          <a
            href={match.result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {match.result.name}
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-foreground">{match.result.name}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{PLATFORM_LABELS[match.result.platform] ?? match.result.platform}</span>
          {match.result.duration > 0 && (
            <>
              <span className="text-faint">·</span>
              <span className="font-mono tnum">{formatDurationMatch(match.result.duration)}</span>
            </>
          )}
          {match.submitted_by_username && (
            <>
              <span className="text-faint">·</span>
              <span>by {match.submitted_by_username}</span>
            </>
          )}
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
          statusStyle.className
        )}
      >
        {statusStyle.label}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <button
          disabled={!isAuthenticated || voteLoading}
          onClick={() => vote("up")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
            userVote === "up"
              ? "bg-success/15 text-success"
              : "text-muted-foreground hover:bg-accent hover:text-success disabled:pointer-events-none disabled:opacity-40"
          )}
          title={isAuthenticated ? "Upvote" : "Log in to vote"}
          aria-label="Upvote match"
        >
          <ThumbsUp className="size-3.5" />
          <span className="font-mono tnum">{match.upvotes ?? 0}</span>
        </button>
        <button
          disabled={!isAuthenticated || voteLoading}
          onClick={() => vote("down")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
            userVote === "down"
              ? "bg-destructive/15 text-destructive"
              : "text-muted-foreground hover:bg-accent hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
          )}
          title={isAuthenticated ? "Downvote" : "Log in to vote"}
          aria-label="Downvote match"
        >
          <ThumbsDown className="size-3.5" />
          <span className="font-mono tnum">{match.downvotes ?? 0}</span>
        </button>
      </div>
    </div>
  );
}

interface SongMatchesSectionProps {
  songId: string;
}

export function SongMatchesSection({ songId }: SongMatchesSectionProps) {
  const { isAuthenticated } = useAuthStore();
  const { data: matchesData, isLoading: matchesLoading } = useMatchesForSong(songId);
  const discoverMatches = useDiscoverMatchesMutation(songId);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-faint">Matches</h2>
          {matchesData && matchesData.length > 0 && (
            <Badge variant="muted" size="sm">
              {matchesData.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          isLoading={discoverMatches.isPending}
          onClick={() => discoverMatches.mutate(undefined)}
        >
          {!discoverMatches.isPending && <Search />}
          Discover
        </Button>
      </div>

      {matchesLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Skeleton className="h-6 w-10 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : matchesData && matchesData.length > 0 ? (
        <div className="divide-y divide-border rounded-lg border border-border">
          {matchesData.map((match) => (
            <MatchRow key={match.id} match={match} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Radar className="size-8 text-faint" />
          <p className="text-sm text-muted-foreground">No audio matches found for this track yet.</p>
          <Button
            size="sm"
            variant="primary"
            isLoading={discoverMatches.isPending}
            onClick={() => discoverMatches.mutate(undefined)}
          >
            {!discoverMatches.isPending && <Search />}
            Discover matches
          </Button>
        </div>
      )}
    </section>
  );
}
