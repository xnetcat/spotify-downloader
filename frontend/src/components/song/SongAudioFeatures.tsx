import { ChevronDown } from "lucide-react";
import { Meter } from "@/components/ui/meter";
import { cn } from "@/lib/utils";
import type { AudioFeatures } from "@/types";

interface FeatureRow {
  id: string;
  label: string;
  value: number | null;
  max: number;
  displayFn?: (v: number) => string;
}

interface TechnicalRow {
  id: string;
  label: string;
  value: number | null;
  displayFn: (v: number) => string;
}

/** A single labeled feature meter. */
function FeatureMeter({ label, value, max, displayFn }: FeatureRow) {
  const display = displayFn ? displayFn(value as number) : `${Math.round(((value as number) / max) * 100)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tnum text-foreground">{display}</span>
      </div>
      <Meter value={value as number} max={max} cells={16} size="sm" label={label} />
    </div>
  );
}

interface SongAudioFeaturesProps {
  features: AudioFeatures;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function SongAudioFeatures({ features, expanded, onToggleExpand }: SongAudioFeaturesProps) {
  const primaryFeatures: FeatureRow[] = [
    { id: "bpm", label: "BPM", value: features.bpm, max: 200, displayFn: (v) => `${Math.round(v)}` },
    { id: "energy", label: "Energy", value: features.energy !== null ? features.energy * 100 : null, max: 100 },
    { id: "danceability", label: "Danceability", value: features.danceability !== null ? features.danceability * 100 : null, max: 100 },
    { id: "valence", label: "Valence", value: features.valence !== null ? features.valence * 100 : null, max: 100 },
  ];

  const secondaryFeatures: FeatureRow[] = [
    { id: "speechiness", label: "Speechiness", value: features.speechiness !== null ? features.speechiness * 100 : null, max: 100 },
    { id: "acousticness", label: "Acousticness", value: features.acousticness !== null ? features.acousticness * 100 : null, max: 100 },
    { id: "instrumentalness", label: "Instrumentalness", value: features.instrumentalness !== null ? features.instrumentalness * 100 : null, max: 100 },
    { id: "liveness", label: "Liveness", value: features.liveness !== null ? features.liveness * 100 : null, max: 100 },
  ];

  const technicalFeatures: TechnicalRow[] = [
    { id: "loudness", label: "Loudness", value: features.loudness, displayFn: (v) => `${v.toFixed(1)} dB` },
    { id: "time_signature", label: "Time Signature", value: features.time_signature, displayFn: (v) => `${v}/4` },
  ];

  const hasSecondaryFeatures = secondaryFeatures.some((f) => f.value !== null);
  const hasTechnicalFeatures = technicalFeatures.some((f) => f.value !== null);
  const canExpand = hasSecondaryFeatures || hasTechnicalFeatures;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-faint">Audio Features</h2>
      </div>

      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {primaryFeatures.map(
          (feature) => feature.value !== null && <FeatureMeter key={feature.id} {...feature} />
        )}

        {expanded &&
          secondaryFeatures.map(
            (feature) => feature.value !== null && <FeatureMeter key={feature.id} {...feature} />
          )}
      </div>

      {expanded && hasTechnicalFeatures && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {technicalFeatures.map(
            (feature) =>
              feature.value !== null && (
                <div key={feature.id} className="rounded-md border border-border bg-surface p-3 text-center">
                  <p className="font-mono tnum text-lg font-semibold text-foreground">
                    {feature.displayFn(feature.value)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{feature.label}</p>
                </div>
              )
          )}
        </div>
      )}

      {canExpand && (
        <button
          onClick={onToggleExpand}
          className={cn(
            "flex w-full items-center justify-center gap-1 py-1 text-sm text-muted-foreground",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          )}
        >
          {expanded ? "Show less" : "Show all features"}
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </section>
  );
}
