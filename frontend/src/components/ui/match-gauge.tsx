import { cn } from "@/lib/utils";
import { Meter, scoreColor } from "./meter";

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

export interface MatchScoreGaugeProps {
  /** Score value from 0 to 100 */
  score: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show the score label */
  showLabel?: boolean;
  /** Animate the gauge fill on mount */
  animated?: boolean;
  /** Additional class names */
  className?: string;
}

const gaugeConfig = {
  sm: { cells: 12, meter: "sm" as const, value: "text-sm", gap: "gap-1" },
  md: { cells: 16, meter: "md" as const, value: "text-xl", gap: "gap-1.5" },
  lg: { cells: 20, meter: "lg" as const, value: "text-3xl", gap: "gap-2" },
};

/**
 * Match-quality readout rendered in the Control Room meter language: a score
 * number over a segmented meter, colored by `scoreColor`. No radial gauge.
 */
export function MatchScoreGauge({
  score,
  size = "md",
  showLabel = true,
  animated = true,
  className,
}: MatchScoreGaugeProps) {
  const value = clampScore(score);
  const color = scoreColor(value);
  const config = gaugeConfig[size];

  return (
    <div
      className={cn("inline-flex flex-col items-center", config.gap, animated && "animate-fade-in", className)}
      data-score={value}
    >
      {showLabel && (
        <span
          className={cn("font-mono font-semibold tnum leading-none", config.value)}
          style={{ color }}
        >
          {Math.round(value)}
        </span>
      )}
      <Meter
        value={value}
        max={100}
        cells={config.cells}
        color={color}
        size={config.meter}
        className="w-full min-w-16"
        label={`Match score ${Math.round(value)} percent`}
      />
    </div>
  );
}

export interface MatchScoreBarProps {
  score: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  className?: string;
}

/** Horizontal match-score meter row with optional label and percentage. */
export function MatchScoreBar({
  score,
  showLabel = false,
  showPercentage = true,
  className,
}: MatchScoreBarProps) {
  const value = clampScore(score);
  const color = scoreColor(value);

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || showPercentage) && (
        <div className="mb-1 flex items-center justify-between">
          {showLabel && (
            <span className="text-xs font-medium uppercase tracking-wider text-faint">
              Match score
            </span>
          )}
          {showPercentage && (
            <span className="font-mono text-xs font-medium tnum" style={{ color }}>
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}
      <Meter
        value={value}
        max={100}
        cells={16}
        color={color}
        size="md"
        label={`Match score ${Math.round(value)} percent`}
      />
    </div>
  );
}

export interface ScoreBadgeProps {
  score: number;
  className?: string;
}

/** Compact score pill for lists; hue follows `scoreColor`. */
export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const value = clampScore(score);
  const color = scoreColor(value);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5",
        "font-mono text-xs font-semibold tnum",
        className
      )}
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {Math.round(value)}%
    </span>
  );
}

export default MatchScoreGauge;
