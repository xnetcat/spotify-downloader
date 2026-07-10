import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KeySignatureBadgeProps {
  /** Key number 0-11 (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) */
  keyNum: number | null;
  /** Mode: 0 = minor, 1 = major */
  mode: number | null;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

// Key number to note name mapping
const KEY_NAMES: Record<number, string> = {
  0: "C",
  1: "C#",
  2: "D",
  3: "D#",
  4: "E",
  5: "F",
  6: "F#",
  7: "G",
  8: "G#",
  9: "A",
  10: "A#",
  11: "B",
};

// Alternative names for sharp keys (using flats)
const KEY_NAMES_FLAT: Record<number, string> = {
  1: "Db",
  3: "Eb",
  6: "Gb",
  8: "Ab",
  10: "Bb",
};

// Key families for color coding
// Natural keys: C, F, G -> success · common (D, A, E) -> primary · chromatic -> info
type KeyFamily = "natural" | "common" | "chromatic";

const KEY_FAMILIES: Record<number, KeyFamily> = {
  0: "natural", // C
  1: "chromatic", // C#
  2: "common", // D
  3: "chromatic", // D#
  4: "common", // E
  5: "natural", // F
  6: "chromatic", // F#
  7: "natural", // G
  8: "chromatic", // G#
  9: "common", // A
  10: "chromatic", // A#
  11: "chromatic", // B
};

const familyColors: Record<KeyFamily, string> = {
  natural: "bg-success/10 text-success border-success/30",
  common: "bg-primary/10 text-primary border-primary/30",
  chromatic: "bg-info/10 text-info border-info/30",
};

// Minor keys read slightly quieter
const familyColorsMinor: Record<KeyFamily, string> = {
  natural: "bg-success/5 text-success/80 border-success/20",
  common: "bg-primary/5 text-primary/80 border-primary/20",
  chromatic: "bg-info/5 text-info/80 border-info/20",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

const iconSize = {
  sm: "size-3",
  md: "size-3.5",
  lg: "size-4",
};

/**
 * Badge displaying musical key signature (e.g., "C major", "A minor"),
 * colour-coded by key family with muted tones for minor keys.
 */
export function KeySignatureBadge({ keyNum, mode, size = "md", className }: KeySignatureBadgeProps) {
  if (keyNum === null || keyNum < 0 || keyNum > 11) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border font-mono font-medium",
          "bg-surface text-muted-foreground border-border",
          sizeClasses[size],
          className
        )}
      >
        Unknown
      </span>
    );
  }

  const keyName = KEY_NAMES[keyNum];
  const isMajor = mode === 1;
  const modeName = isMajor ? "major" : "minor";
  const family = KEY_FAMILIES[keyNum];
  const colors = isMajor ? familyColors[family] : familyColorsMinor[family];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors",
        colors,
        sizeClasses[size],
        className
      )}
      title={`Key: ${keyName} ${isMajor ? "Major" : "Minor"}`}
    >
      <Music2 className={cn("shrink-0", iconSize[size])} aria-hidden />
      <span className="font-mono font-semibold tnum">{keyName}</span>
      <span className="opacity-70">{modeName}</span>
    </span>
  );
}

/**
 * Get human-readable key signature string
 */
export function getKeySignatureString(keyNum: number | null, mode: number | null): string {
  if (keyNum === null || keyNum < 0 || keyNum > 11) {
    return "Unknown";
  }
  const keyName = KEY_NAMES[keyNum];
  const modeName = mode === 1 ? "Major" : "Minor";
  return `${keyName} ${modeName}`;
}

/**
 * Get alternate key name (flat instead of sharp)
 */
export function getAlternateKeyName(keyNum: number): string | null {
  return KEY_NAMES_FLAT[keyNum] || null;
}

export default KeySignatureBadge;
