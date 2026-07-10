import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
  MetadataSnapshot,
  ComparisonRow,
  NormalizedMetadata,
} from "@/types/metadata";

// Re-export these for convenience
export type { ComparisonRow };

interface MetadataComparisonTableProps {
  snapshots: MetadataSnapshot[];
  className?: string;
  showOnlyDifferences?: boolean;
  categories?: Array<"basic" | "identifiers" | "audio" | "credits" | "classification">;
}

const SOURCE_LABELS: Record<string, string> = {
  spotify: "Spotify",
  musicbrainz: "MusicBrainz",
  discogs: "Discogs",
  youtube_music: "YouTube Music",
  deezer: "Deezer",
  apple_music: "Apple Music",
};

// Identity-dot color per source (token/platform classes only — no hexes).
const SOURCE_DOTS: Record<string, string> = {
  spotify: "bg-spotify",
  musicbrainz: "bg-info",
  discogs: "bg-warning",
  youtube_music: "bg-ytmusic",
  deezer: "bg-deezer",
  apple_music: "bg-apple",
};

const FIELDS_CONFIG: Array<{
  key: keyof NormalizedMetadata;
  label: string;
  category: "basic" | "identifiers" | "audio" | "credits" | "classification";
  format?: (value: unknown) => string;
}> = [
  { key: "name", label: "Track Name", category: "basic" },
  {
    key: "artists",
    label: "Artists",
    category: "basic",
    format: (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "-")),
  },
  { key: "album_name", label: "Album", category: "basic" },
  { key: "release_date", label: "Release Date", category: "basic" },
  { key: "year", label: "Year", category: "basic" },
  { key: "isrc", label: "ISRC", category: "identifiers" },
  { key: "musicbrainz_id", label: "MusicBrainz ID", category: "identifiers" },
  { key: "discogs_id", label: "Discogs ID", category: "identifiers" },
  {
    key: "genres",
    label: "Genres",
    category: "classification",
    format: (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "-")),
  },
  {
    key: "styles",
    label: "Styles",
    category: "classification",
    format: (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "-")),
  },
  {
    key: "explicit",
    label: "Explicit",
    category: "classification",
    format: (v) => (v === true ? "Yes" : v === false ? "No" : "-"),
  },
  { key: "label", label: "Label", category: "credits" },
  {
    key: "producers",
    label: "Producers",
    category: "credits",
    format: (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "-")),
  },
  {
    key: "writers",
    label: "Writers",
    category: "credits",
    format: (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "-")),
  },
  {
    key: "bpm",
    label: "BPM",
    category: "audio",
    format: (v) => (typeof v === "number" ? v.toFixed(0) : "-"),
  },
  { key: "key", label: "Key", category: "audio" },
  {
    key: "energy",
    label: "Energy",
    category: "audio",
    format: (v) => (typeof v === "number" ? `${(v * 100).toFixed(0)}%` : "-"),
  },
  {
    key: "danceability",
    label: "Danceability",
    category: "audio",
    format: (v) => (typeof v === "number" ? `${(v * 100).toFixed(0)}%` : "-"),
  },
  {
    key: "valence",
    label: "Valence",
    category: "audio",
    format: (v) => (typeof v === "number" ? `${(v * 100).toFixed(0)}%` : "-"),
  },
  { key: "popularity", label: "Popularity", category: "audio" },
];

// Categories whose values read as data (rendered in mono tnum).
const DATA_CATEGORIES = new Set(["identifiers", "audio"]);

function formatValue(value: unknown, formatter?: (v: unknown) => string): string {
  if (formatter) {
    return formatter(value);
  }
  if (value === null || value === undefined) {
    return "-";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return String(value) || "-";
}

function buildComparisonData(
  snapshots: MetadataSnapshot[],
  showOnlyDifferences: boolean,
  categories?: Array<"basic" | "identifiers" | "audio" | "credits" | "classification">
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  for (const field of FIELDS_CONFIG) {
    // Filter by category if specified
    if (categories && !categories.includes(field.category)) {
      continue;
    }

    const values = snapshots.map((snapshot) => ({
      source: snapshot.source,
      value: (snapshot.data as Record<string, unknown>)?.[field.key],
    }));

    // Check if values differ
    if (showOnlyDifferences) {
      const formattedValues = values.map((v) => formatValue(v.value, field.format));
      const uniqueValues = new Set(formattedValues);
      if (uniqueValues.size <= 1) {
        continue;
      }
    }

    rows.push({
      field: field.key,
      label: field.label,
      values,
    });
  }

  return rows;
}

/**
 * Table for comparing metadata across multiple sources side-by-side.
 */
export function MetadataComparisonTable({
  snapshots,
  className,
  showOnlyDifferences = false,
  categories,
}: MetadataComparisonTableProps) {
  const sources = useMemo(() => snapshots.map((s) => s.source), [snapshots]);

  const comparisonData = useMemo(
    () => buildComparisonData(snapshots, showOnlyDifferences, categories),
    [snapshots, showOnlyDifferences, categories]
  );

  if (snapshots.length === 0) {
    return null;
  }

  if (comparisonData.length === 0) {
    return (
      <div className={cn("p-4 text-center text-sm text-muted-foreground", className)}>
        {showOnlyDifferences
          ? "No differences found between sources"
          : "No comparable data available"}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-faint">
                Field
              </th>
              {sources.map((source) => (
                <th key={source} className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        SOURCE_DOTS[source] || "bg-faint"
                      )}
                      aria-hidden
                    />
                    <span>{SOURCE_LABELS[source] || source}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparisonData.map((row) => {
              const fieldConfig = FIELDS_CONFIG.find((f) => f.key === row.field);
              const isData = fieldConfig ? DATA_CATEGORIES.has(fieldConfig.category) : false;
              // How many distinct non-empty values across sources — used to
              // emphasize rows where sources disagree.
              const distinct = new Set(
                row.values
                  .map((v) => formatValue(v.value, fieldConfig?.format))
                  .filter((v) => v !== "-")
              );
              const differs = distinct.size > 1;
              return (
                <tr key={row.field} className="transition-colors hover:bg-elevated/50">
                  <td className="px-4 py-2 font-medium text-muted-foreground">{row.label}</td>
                  {sources.map((source) => {
                    const cellData = row.values.find((v) => v.source === source);
                    const formattedValue = formatValue(cellData?.value, fieldConfig?.format);
                    const isEmpty = formattedValue === "-";
                    return (
                      <td
                        key={source}
                        className={cn(
                          "px-4 py-2",
                          isData && "font-mono tnum",
                          isEmpty
                            ? "text-faint"
                            : differs
                              ? "text-primary"
                              : "text-foreground"
                        )}
                      >
                        {formattedValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MetadataComparisonTable;
