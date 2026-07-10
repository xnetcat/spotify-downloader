import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetadataSourceName } from "@/types";

// Source labels and identity-dot color (token/platform classes only — no hexes).
const sourceConfig: Record<MetadataSourceName, { label: string; dot: string }> = {
  spotify: { label: "Spotify", dot: "bg-spotify" },
  musicbrainz: { label: "MusicBrainz", dot: "bg-info" },
  discogs: { label: "Discogs", dot: "bg-warning" },
  deezer: { label: "Deezer", dot: "bg-deezer" },
  apple_music: { label: "Apple Music", dot: "bg-apple" },
};

export interface MetadataSourceBadgeProps {
  /** The data source */
  source: MetadataSourceName;
  /** Optional confidence score (0-100) */
  confidence?: number;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

export function MetadataSourceBadge({
  source,
  confidence,
  size = "sm",
  className,
}: MetadataSourceBadgeProps) {
  const config = sourceConfig[source];
  if (!config) return null;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface font-medium text-muted-foreground",
        sizeClasses[size],
        className
      )}
      title={
        confidence !== undefined ? `${config.label} (${confidence}% confidence)` : config.label
      }
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", config.dot)} aria-hidden />
      {config.label}
      {confidence !== undefined && (
        <span className="font-mono tnum text-faint">{confidence}%</span>
      )}
    </span>
  );
}

/**
 * Display a metadata field with its source.
 */
export interface MetadataFieldProps {
  /** Field label */
  label: string;
  /** Field value */
  value: React.ReactNode;
  /** Source of the data */
  source?: MetadataSourceName;
  /** Confidence score (0-100) */
  confidence?: number;
  /** Additional class names */
  className?: string;
}

export function MetadataField({ label, value, source, confidence, className }: MetadataFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-faint">{label}</span>
        {source && <MetadataSourceBadge source={source} confidence={confidence} size="sm" />}
      </div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}

/**
 * Grid layout for metadata fields.
 */
export interface MetadataGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetadataGrid({ children, columns = 2, className }: MetadataGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={cn("grid gap-4", gridCols[columns], className)}>{children}</div>;
}

/**
 * Collapsible panel for technical metadata.
 */
export interface MetadataPanelProps {
  /** Panel title */
  title: string;
  /** Whether the panel is initially open */
  defaultOpen?: boolean;
  /** Panel content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export function MetadataPanel({
  title,
  defaultOpen = false,
  children,
  className,
}: MetadataPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-elevated/50"
      >
        {title}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && <div className="border-t border-border px-4 py-4">{children}</div>}
    </div>
  );
}

export default MetadataSourceBadge;
