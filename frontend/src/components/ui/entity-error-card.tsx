import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SearchX, AlertTriangle, Search, Home, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ────────────────────────────────────────────────────────────────────────────
// Error classification
// ────────────────────────────────────────────────────────────────────────────

export type EntityErrorKind = "not_found" | "load_failed";

export interface ClassifiedEntityError {
  kind: EntityErrorKind;
  heading: string;
  description: string;
  rawMessage: string;
}

const NOT_FOUND_PATTERNS = ["not a valid uuid", "could not resolve", "invalid entity id"];

function isNotFoundError(message: string): boolean {
  const lower = message.toLowerCase();
  return NOT_FOUND_PATTERNS.some((p) => lower.includes(p));
}

export function classifyEntityError(
  error: unknown,
  entityLabel: string
): ClassifiedEntityError {
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? "An error occurred");

  if (isNotFoundError(rawMessage)) {
    return {
      kind: "not_found",
      heading: `${entityLabel} not found`,
      description:
        "The ID in the URL doesn't match any known entity in the database. Try searching for the entity by name or paste a Spotify / YouTube URL in the search bar.",
      rawMessage,
    };
  }

  // HTTP 404 pattern from API client
  if (rawMessage.includes("404") || rawMessage.toLowerCase().includes("not found")) {
    return {
      kind: "not_found",
      heading: `${entityLabel} not found`,
      description: `This ${entityLabel.toLowerCase()} doesn't exist or may have been removed. You can search for it by name or URL.`,
      rawMessage,
    };
  }

  return {
    kind: "load_failed",
    heading: `Failed to load ${entityLabel.toLowerCase()}`,
    description:
      "Something went wrong while fetching the data. Please try again — if the problem persists, the service may be temporarily unavailable.",
    rawMessage,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// EntityErrorCard component
// ────────────────────────────────────────────────────────────────────────────

type EntityType = "album" | "artist" | "song" | "playlist";

const ENTITY_LABELS: Record<EntityType, string> = {
  album: "Album",
  artist: "Artist",
  song: "Track",
  playlist: "Playlist",
};

interface EntityErrorCardProps {
  entityType: EntityType;
  /** Pass `null` for "entity not found" (query returned nothing, no error object). */
  error: unknown;
  entityId: string;
}

export function EntityErrorCard({ entityType, error, entityId }: EntityErrorCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const entityLabel = ENTITY_LABELS[entityType];

  const classified =
    error != null
      ? classifyEntityError(error, entityLabel)
      : {
          kind: "not_found" as EntityErrorKind,
          heading: `${entityLabel} not found`,
          description: `This ${entityLabel.toLowerCase()} doesn't exist or may have been removed. Try searching for it by name or paste a URL in the search bar.`,
          rawMessage: "",
        };

  const isNotFound = classified.kind === "not_found";
  const Icon = isNotFound ? SearchX : AlertTriangle;

  return (
    <Card
      variant="bordered"
      className={cn("mx-auto max-w-xl", !isNotFound && "border-destructive/40")}
    >
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <Icon className={cn("size-8", isNotFound ? "text-faint" : "text-destructive")} />

        <div className="space-y-2">
          <h2
            className={cn(
              "font-display text-lg font-semibold tracking-tight",
              isNotFound ? "text-foreground" : "text-destructive"
            )}
          >
            {classified.heading}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {classified.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Button asChild variant="secondary" size="sm">
            <Link to="/search" search={{ q: entityId } as Record<string, string>}>
              <Search />
              Search instead
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <Home />
              Back to home
            </Link>
          </Button>
        </div>

        <div className="w-full pt-1">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-faint transition-colors hover:text-muted-foreground"
          >
            <ChevronDown className={cn("size-3 transition-transform", showDetails && "rotate-180")} />
            {showDetails ? "Hide details" : "Show details"}
          </button>
          {showDetails && (
            <div className="mt-3 space-y-1.5 rounded-md border border-border bg-surface p-3 text-left">
              <p className="text-xs text-muted-foreground">
                <span className="text-faint">ID: </span>
                <code className="break-all font-mono text-muted-foreground">{entityId}</code>
              </p>
              {classified.rawMessage && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-faint">Error: </span>
                  <code className="break-all font-mono text-muted-foreground">
                    {classified.rawMessage}
                  </code>
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
