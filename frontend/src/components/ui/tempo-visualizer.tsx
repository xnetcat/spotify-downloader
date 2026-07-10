import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TempoVisualizerProps {
  /** Beats per minute */
  bpm: number | null;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to animate the beat indicator */
  animated?: boolean;
  /** Additional class names */
  className?: string;
}

// Tempo categories based on Italian tempo markings
type TempoCategory = {
  name: string;
  minBpm: number;
  maxBpm: number;
};

const TEMPO_CATEGORIES: TempoCategory[] = [
  { name: "Grave", minBpm: 0, maxBpm: 60 },
  { name: "Largo", minBpm: 60, maxBpm: 66 },
  { name: "Adagio", minBpm: 66, maxBpm: 76 },
  { name: "Andante", minBpm: 76, maxBpm: 108 },
  { name: "Moderato", minBpm: 108, maxBpm: 120 },
  { name: "Allegro", minBpm: 120, maxBpm: 156 },
  { name: "Vivace", minBpm: 156, maxBpm: 176 },
  { name: "Presto", minBpm: 176, maxBpm: 999 },
];

function getTempoCategory(bpm: number): string {
  for (const category of TEMPO_CATEGORIES) {
    if (bpm >= category.minBpm && bpm < category.maxBpm) {
      return category.name;
    }
  }
  return "Presto";
}

// Meter/text colour by tempo (slower = cooler, faster = warmer)
function getTempoColor(bpm: number): string {
  if (bpm < 76) return "var(--info)";
  if (bpm < 120) return "var(--success)";
  if (bpm < 156) return "var(--warning)";
  return "var(--primary)";
}

const sizeConfig = {
  sm: {
    container: "gap-1.5",
    bpmText: "text-lg",
    bpmLabel: "text-[10px]",
    categoryText: "text-xs",
    dot: "size-2",
  },
  md: {
    container: "gap-2.5",
    bpmText: "text-2xl",
    bpmLabel: "text-xs",
    categoryText: "text-sm",
    dot: "size-2.5",
  },
  lg: {
    container: "gap-3",
    bpmText: "text-4xl",
    bpmLabel: "text-sm",
    categoryText: "text-base",
    dot: "size-3",
  },
};

/**
 * Tempo visualiser: mono BPM readout with a beat-synced indicator dot.
 */
export function TempoVisualizer({ bpm, size = "md", animated = true, className }: TempoVisualizerProps) {
  const config = sizeConfig[size];
  const [isPulsing, setIsPulsing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!animated || bpm === null || bpm <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const beatInterval = (60 / bpm) * 1000;
    intervalRef.current = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), Math.min(beatInterval * 0.3, 150));
    }, beatInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bpm, animated]);

  if (bpm === null) {
    return (
      <div className={cn("inline-flex items-center", config.container, className)}>
        <div className="flex flex-col items-center">
          <span className={cn("font-mono font-bold tnum text-muted-foreground", config.bpmText)}>--</span>
          <span className={cn("uppercase tracking-wider text-faint", config.bpmLabel)}>BPM</span>
        </div>
      </div>
    );
  }

  const category = getTempoCategory(bpm);
  const color = getTempoColor(bpm);
  const roundedBpm = Math.round(bpm);

  return (
    <div className={cn("inline-flex items-center", config.container, className)}>
      {animated && (
        <span
          className={cn("rounded-full transition-opacity duration-100", config.dot)}
          style={{ backgroundColor: color, opacity: isPulsing ? 1 : 0.4 }}
          aria-hidden
        />
      )}

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={cn("font-mono font-bold tnum tracking-tight", config.bpmText)} style={{ color }}>
            {roundedBpm}
          </span>
          <span className={cn("uppercase tracking-wider text-faint", config.bpmLabel)}>BPM</span>
        </div>
        <span className={cn("font-medium opacity-80", config.categoryText)} style={{ color }}>
          {category}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact tempo display without animation
 */
export interface TempoLabelProps {
  bpm: number | null;
  showCategory?: boolean;
  className?: string;
}

export function TempoLabel({ bpm, showCategory = true, className }: TempoLabelProps) {
  if (bpm === null) {
    return <span className={cn("font-mono text-sm text-muted-foreground", className)}>-- BPM</span>;
  }

  const category = getTempoCategory(bpm);
  const color = getTempoColor(bpm);
  const roundedBpm = Math.round(bpm);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-mono text-sm tnum", className)}
      style={{ color }}
    >
      <span className="font-semibold">{roundedBpm} BPM</span>
      {showCategory && <span className="opacity-70">({category})</span>}
    </span>
  );
}

/**
 * Get tempo category name for a given BPM
 */
export function getTempoName(bpm: number | null): string {
  if (bpm === null) return "Unknown";
  return getTempoCategory(bpm);
}

export default TempoVisualizer;
