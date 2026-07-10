import { Clock, Volume2 } from "lucide-react";
import type { AudioFeatures } from "@/types";
import { cn } from "@/lib/utils";
import { Meter } from "./meter";
import { KeySignatureBadge } from "./key-signature-badge";
import { TempoVisualizer, TempoLabel } from "./tempo-visualizer";

export interface AudioFeaturesPanelProps {
  /** Audio features data */
  features: AudioFeatures;
  /** Display variant */
  variant?: "full" | "compact";
  /** Additional class names */
  className?: string;
}

// Feature metadata for display
interface FeatureInfo {
  key: keyof AudioFeatures;
  label: string;
  tooltip: string;
  isPercentage: boolean;
}

const FEATURE_INFO: FeatureInfo[] = [
  { key: "energy", label: "Energy", tooltip: "How intense and active the track feels", isPercentage: true },
  { key: "danceability", label: "Danceability", tooltip: "How suitable for dancing based on tempo, rhythm, and beat", isPercentage: true },
  { key: "valence", label: "Valence", tooltip: "Musical positiveness — high is happy, low is sad", isPercentage: true },
  { key: "speechiness", label: "Speechiness", tooltip: "Presence of spoken words", isPercentage: true },
  { key: "acousticness", label: "Acousticness", tooltip: "Confidence the track is acoustic", isPercentage: true },
  { key: "instrumentalness", label: "Instrumentalness", tooltip: "Whether the track has no vocals", isPercentage: true },
  { key: "liveness", label: "Liveness", tooltip: "Probability of a live audience", isPercentage: true },
];

const COMPACT_FEATURES: (keyof AudioFeatures)[] = ["energy", "danceability", "valence", "acousticness"];

// Meter colour by intensity level
function getIntensityColor(value: number): string {
  const percentage = value * 100;
  if (percentage <= 33) return "var(--info)";
  if (percentage <= 66) return "var(--warning)";
  return "var(--primary)";
}

function formatTimeSignature(timeSig: number | null): string {
  if (timeSig === null) return "--/4";
  return `${timeSig}/4`;
}

// Feature meter row
interface FeatureBarProps {
  label: string;
  value: number | null;
  tooltip: string;
}

function FeatureBar({ label, value, tooltip }: FeatureBarProps) {
  const displayValue = value ?? 0;
  const percentage = displayValue * 100;
  const color = getIntensityColor(displayValue);

  return (
    <div className="group" title={tooltip}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-faint">{label}</span>
        <span className="font-mono text-xs font-medium tnum" style={{ color }}>
          {value !== null ? `${Math.round(percentage)}%` : "--"}
        </span>
      </div>
      <Meter value={displayValue} max={1} cells={10} color={color} size="sm" label={label} />
    </div>
  );
}

/**
 * Comprehensive panel showing audio features as labelled meters.
 */
export function AudioFeaturesPanel({ features, variant = "full", className }: AudioFeaturesPanelProps) {
  const featuresToShow =
    variant === "compact" ? FEATURE_INFO.filter((f) => COMPACT_FEATURES.includes(f.key)) : FEATURE_INFO;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-5", className)}>
      {/* Header with tempo, key, time signature, loudness */}
      <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-border pb-4">
        <div className="shrink-0">
          {variant === "full" ? (
            <TempoVisualizer bpm={features.bpm} size="md" animated />
          ) : (
            <TempoLabel bpm={features.bpm} showCategory={false} />
          )}
        </div>

        <KeySignatureBadge keyNum={features.key} mode={features.mode} size={variant === "full" ? "md" : "sm"} />

        <div
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-muted-foreground"
          title="Time signature"
        >
          <Clock className="size-3.5 opacity-70" aria-hidden />
          <span className="font-mono text-sm font-medium tnum">{formatTimeSignature(features.time_signature)}</span>
        </div>

        {variant === "full" && features.loudness !== null && (
          <div
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-muted-foreground"
            title="Average loudness (dB)"
          >
            <Volume2 className="size-3.5 opacity-70" aria-hidden />
            <span className="font-mono text-sm font-medium tnum">{Math.round(features.loudness)} dB</span>
          </div>
        )}
      </div>

      {/* Feature meters */}
      <div className={cn("grid gap-4", variant === "full" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        {featuresToShow.map((featureInfo) => (
          <FeatureBar
            key={featureInfo.key}
            label={featureInfo.label}
            value={features[featureInfo.key] as number | null}
            tooltip={featureInfo.tooltip}
          />
        ))}
      </div>

      {variant === "compact" && (
        <p className="mt-4 text-center text-xs text-faint">
          {FEATURE_INFO.length - COMPACT_FEATURES.length} more features available
        </p>
      )}
    </div>
  );
}

/**
 * Compact inline feature summary
 */
export interface AudioFeaturesSummaryProps {
  features: AudioFeatures;
  className?: string;
}

export function AudioFeaturesSummary({ features, className }: AudioFeaturesSummaryProps) {
  const highlights = [
    { label: "Energy", value: features.energy },
    { label: "Danceability", value: features.danceability },
    { label: "Valence", value: features.valence },
  ].filter((h) => h.value !== null);

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {features.bpm !== null && (
        <span className="font-mono text-sm tnum text-muted-foreground">
          <span className="font-semibold">{Math.round(features.bpm)}</span> BPM
        </span>
      )}

      {features.key !== null && <KeySignatureBadge keyNum={features.key} mode={features.mode} size="sm" />}

      {highlights.map((h) => (
        <span key={h.label} className="text-sm text-muted-foreground">
          <span className="font-medium">{h.label}:</span>{" "}
          <span className="font-mono tnum" style={{ color: getIntensityColor(h.value!) }}>
            {Math.round(h.value! * 100)}%
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Single audio feature display for use in grids/lists
 */
export interface SingleFeatureProps {
  label: string;
  value: number | null;
  tooltip?: string;
  showBar?: boolean;
  className?: string;
}

export function SingleFeature({ label, value, tooltip, showBar = true, className }: SingleFeatureProps) {
  const displayValue = value ?? 0;
  const percentage = displayValue * 100;
  const color = getIntensityColor(displayValue);

  return (
    <div className={cn("flex flex-col", className)} title={tooltip}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-faint">{label}</span>
        <span className="font-mono text-xs font-medium tnum" style={{ color }}>
          {value !== null ? `${Math.round(percentage)}%` : "--"}
        </span>
      </div>
      {showBar && <Meter value={displayValue} max={1} cells={10} color={color} size="sm" label={label} />}
    </div>
  );
}

export default AudioFeaturesPanel;
