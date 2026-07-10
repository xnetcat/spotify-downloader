import { useState, useEffect, useRef, useMemo } from "react";
import { BadgeCheck, Check, Clock, Copy, Maximize2, Minimize2, Music4 } from "lucide-react";
import type { Lyrics, LyricsLine, ParsedLyrics, LyricsSource as LyricsSourceType } from "@/types";
import type { LyricsSource as MultiLyricsSource, LyricsProviderSource } from "@/types/metadata";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

// Source display labels
const sourceLabels: Record<LyricsSourceType | LyricsProviderSource, string> = {
  genius: "Genius",
  musixmatch: "MusixMatch",
  azlyrics: "AZLyrics",
  synced: "Synced",
  lrclib: "LRCLIB",
};

// Source identity colours mapped onto tokens (no brand hexes)
const sourceColors: Record<LyricsSourceType | LyricsProviderSource, string> = {
  genius: "var(--warning)",
  musixmatch: "var(--destructive)",
  azlyrics: "var(--info)",
  synced: "var(--success)",
  lrclib: "var(--success)",
};

/**
 * Parse LRC format to structured lyrics lines
 */
function parseLRC(lrc: string): LyricsLine[] {
  const lines: LyricsLine[] = [];
  const lrcLines = lrc.split("\n");

  for (const line of lrcLines) {
    const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const hundredths = match[3] ? parseInt(match[3], 10) : 0;
      const text = match[4].trim();
      const timestamp = (minutes * 60 + seconds) * 1000 + hundredths * 10;
      if (text) {
        lines.push({ timestamp, text });
      }
    }
  }

  return lines.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
}

/**
 * Parse plain text lyrics to structured format
 */
function parsePlainLyrics(text: string): LyricsLine[] {
  return text
    .split("\n")
    .map((line) => ({ timestamp: null, text: line.trim() }))
    .filter((line) => line.text.length > 0);
}

// Shared empty/loading/error shell
function LyricsShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-16 text-center",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface LyricsDisplayProps {
  /** Lyrics data */
  lyrics: Lyrics | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Current playback time in milliseconds (for synced lyrics) */
  currentTime?: number;
  /** Callback when a synced line is clicked */
  onSeek?: (timestamp: number) => void;
  /** Whether to auto-scroll to current line */
  autoScroll?: boolean;
  /** Maximum height before requiring scroll */
  maxHeight?: string;
  /** Additional class names */
  className?: string;
}

export function LyricsDisplay({
  lyrics,
  isLoading = false,
  error = null,
  currentTime = 0,
  onSeek,
  autoScroll = true,
  maxHeight = "400px",
  className,
}: LyricsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const parsedLyrics: ParsedLyrics | null = useMemo(() => {
    if (!lyrics) return null;

    if (lyrics.lyrics_synced) {
      const lines = parseLRC(lyrics.lyrics_synced);
      if (lines.length > 0) {
        return { lines, isSynced: true, source: lyrics.source };
      }
    }

    const lines = parsePlainLyrics(lyrics.lyrics_text);
    return { lines, isSynced: false, source: lyrics.source };
  }, [lyrics]);

  const currentLineIndex = useMemo(() => {
    if (!parsedLyrics?.isSynced) return -1;

    let index = -1;
    for (let i = 0; i < parsedLyrics.lines.length; i++) {
      const timestamp = parsedLyrics.lines[i].timestamp;
      if (timestamp !== null && timestamp <= currentTime) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [parsedLyrics, currentTime]);

  useEffect(() => {
    if (autoScroll && activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      const isVisible = lineRect.top >= containerRect.top && lineRect.bottom <= containerRect.bottom;
      if (!isVisible) {
        activeLine.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentLineIndex, autoScroll]);

  const handleCopy = async () => {
    if (!parsedLyrics) return;
    const text = parsedLyrics.lines.map((l) => l.text).join("\n");
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatTimestamp = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <LyricsShell className={className}>
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading lyrics…</p>
      </LyricsShell>
    );
  }

  if (error) {
    return (
      <LyricsShell className={className}>
        <Music4 className="size-8 text-faint" aria-hidden />
        <p className="text-destructive">{error}</p>
      </LyricsShell>
    );
  }

  if (!parsedLyrics || parsedLyrics.lines.length === 0) {
    return (
      <LyricsShell className={className}>
        <Music4 className="size-8 text-faint" aria-hidden />
        <p className="text-muted-foreground">No lyrics available</p>
      </LyricsShell>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-base font-semibold tracking-tight">Lyrics</h3>
          <span
            className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium"
            style={{ color: sourceColors[parsedLyrics.source] }}
          >
            {sourceLabels[parsedLyrics.source]}
          </span>
          {parsedLyrics.isSynced && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              Synced
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            aria-label="Copy lyrics"
            title="Copy lyrics"
          >
            {isCopied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Lyrics content */}
      <div
        ref={containerRef}
        className="overflow-y-auto px-6 py-4"
        style={{ maxHeight: isExpanded ? "none" : maxHeight }}
      >
        {parsedLyrics.lines.map((line, index) => {
          const isActive = parsedLyrics.isSynced && index === currentLineIndex;
          const isPast = parsedLyrics.isSynced && index < currentLineIndex;

          return (
            <div
              key={index}
              ref={isActive ? activeLineRef : undefined}
              className={cn(
                "-mx-2 rounded-md px-2 py-1 transition-colors duration-200",
                parsedLyrics.isSynced && "cursor-pointer hover:text-foreground",
                isActive && "bg-primary/10 font-medium text-primary",
                isPast && "text-faint",
                !isActive && !isPast && "text-muted-foreground"
              )}
              onClick={() => {
                if (parsedLyrics.isSynced && line.timestamp !== null && onSeek) {
                  onSeek(line.timestamp);
                }
              }}
            >
              {parsedLyrics.isSynced && line.timestamp !== null && (
                <span className="mr-4 inline-block w-12 font-mono text-xs tnum text-faint">
                  {formatTimestamp(line.timestamp)}
                </span>
              )}
              <span>{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LyricsDisplay;

// ====== MULTI-SOURCE LYRICS DISPLAY ======

export interface MultiSourceLyricsDisplayProps {
  /** Array of lyrics from multiple sources */
  lyricsSources: MultiLyricsSource[];
  /** Active source to display */
  activeSource?: string;
  /** Callback when source changes */
  onSourceChange?: (source: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Current playback time in milliseconds (for synced lyrics) */
  currentTime?: number;
  /** Callback when a synced line is clicked */
  onSeek?: (timestamp: number) => void;
  /** Whether to auto-scroll to current line */
  autoScroll?: boolean;
  /** Maximum height before requiring scroll */
  maxHeight?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Multi-source lyrics display with source selector tabs.
 * Allows switching between lyrics from different providers.
 */
export function MultiSourceLyricsDisplay({
  lyricsSources,
  activeSource,
  onSourceChange,
  isLoading = false,
  currentTime = 0,
  onSeek,
  autoScroll = true,
  maxHeight = "400px",
  className,
}: MultiSourceLyricsDisplayProps) {
  const sortedSources = useMemo(() => {
    return [...lyricsSources].sort((a, b) => {
      if (a.lyricsSynced && !b.lyricsSynced) return -1;
      if (!a.lyricsSynced && b.lyricsSynced) return 1;
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
    });
  }, [lyricsSources]);

  const [internalSource, setInternalSource] = useState<string | null>(null);
  const effectiveSource = activeSource ?? internalSource ?? sortedSources[0]?.source ?? null;

  useEffect(() => {
    if (!activeSource && !internalSource && sortedSources.length > 0) {
      setInternalSource(sortedSources[0].source);
    }
  }, [sortedSources, activeSource, internalSource]);

  const activeLyrics = useMemo(() => {
    return sortedSources.find((l) => l.source === effectiveSource) || sortedSources[0] || null;
  }, [sortedSources, effectiveSource]);

  const handleSourceChange = (source: string) => {
    if (onSourceChange) {
      onSourceChange(source);
    } else {
      setInternalSource(source);
    }
  };

  if (isLoading) {
    return (
      <LyricsShell className={className}>
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading lyrics…</p>
      </LyricsShell>
    );
  }

  if (!lyricsSources || lyricsSources.length === 0) {
    return (
      <LyricsShell className={className}>
        <Music4 className="size-8 text-faint" aria-hidden />
        <p className="text-muted-foreground">No lyrics available</p>
      </LyricsShell>
    );
  }

  const lyricsForDisplay: Lyrics | null = activeLyrics
    ? {
        entity_id: "",
        lyrics_text: activeLyrics.lyricsText,
        lyrics_synced: activeLyrics.lyricsSynced ?? null,
        source: activeLyrics.source as LyricsSourceType,
        fetched_at: "",
      }
    : null;

  return (
    <div className={cn("space-y-0", className)}>
      {/* Source selector */}
      {sortedSources.length >= 1 && (
        <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-border bg-card px-4 pb-2 pt-4">
          <span className="mr-2 text-xs uppercase tracking-wider text-faint">
            {sortedSources.length > 1 ? "Source" : "Data from"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sortedSources.map((source) => {
              const isActive = source.source === effectiveSource;
              const hasSynced = !!source.lyricsSynced;
              const color = sourceColors[source.source] || "var(--muted-foreground)";

              return (
                <button
                  key={source.source}
                  onClick={() => handleSourceChange(source.source)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "border-current bg-surface"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-elevated hover:text-foreground"
                  )}
                  style={isActive ? { color } : undefined}
                >
                  <span>{sourceLabels[source.source] || source.source}</span>
                  {hasSynced && <Clock className="size-3" aria-label="Synced lyrics available" />}
                  {source.isVerified && <BadgeCheck className="size-3" aria-label="Verified lyrics" />}
                  {source.qualityScore !== null && source.qualityScore < 0.8 && (
                    <span className="rounded bg-elevated px-1 py-0.5 font-mono text-[9px] tnum">
                      {Math.round(source.qualityScore * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lyrics display */}
      <LyricsDisplay
        lyrics={lyricsForDisplay}
        currentTime={currentTime}
        onSeek={onSeek}
        autoScroll={autoScroll}
        maxHeight={maxHeight}
        className={cn(sortedSources.length >= 1 && "rounded-t-none border-t-0")}
      />

      {/* Source info footer */}
      {activeLyrics && (
        <div className="flex items-center justify-between rounded-b-lg border border-t-0 border-border bg-card px-4 py-2 text-[10px] text-faint">
          <div className="flex items-center gap-3">
            <span>
              Source: <span className="text-muted-foreground">{sourceLabels[activeLyrics.source]}</span>
            </span>
            {activeLyrics.language && (
              <span>
                Language: <span className="text-muted-foreground">{activeLyrics.language}</span>
              </span>
            )}
            {activeLyrics.hasTranslations && <span className="text-info">Translations available</span>}
          </div>
          <div className="flex items-center gap-2">
            {activeLyrics.lyricsSynced && (
              <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">Synced</span>
            )}
            {activeLyrics.isVerified && (
              <span className="rounded bg-info/10 px-1.5 py-0.5 text-info">Verified</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
