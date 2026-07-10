import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search as SearchIcon, SearchX } from "lucide-react";
import { useUniversalSearchMutation } from "@/api/entities";
import { Button, Input, Skeleton } from "@/components/ui";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SearchFilters, EntitySearchResultCard } from "@/components/search";
import type { EntityType, SearchResult } from "@/types";

interface SearchParams {
  q?: string;
  type?: EntityType;
}

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: (search.q as string) || "",
    type: (search.type as EntityType) || undefined,
  }),
});

const SECTION_ORDER: EntityType[] = ["track", "artist", "album", "playlist"];
const SECTION_LABELS: Record<EntityType, string> = {
  artist: "Artists",
  album: "Albums",
  track: "Songs",
  playlist: "Playlists",
  all: "All",
};

function ResultSkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="size-12 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const { q, type } = Route.useSearch();
  const [searchInput, setSearchInput] = useState(q || "");
  const [activeFilter, setActiveFilter] = useState<EntityType | "all">(type || "all");

  const searchMutation = useUniversalSearchMutation();

  // Run the search whenever the URL query or type changes.
  useEffect(() => {
    if (q) {
      setSearchInput(q);
      searchMutation.mutate({
        query: q,
        entity_types: type && type !== "all" ? [type] : undefined,
        limit: 30,
      });
    }
  }, [q, type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    navigate({
      to: "/search",
      search: {
        q: query,
        type: activeFilter !== "all" ? activeFilter : undefined,
      },
    });
  };

  const handleFilterChange = (filter: EntityType | "all") => {
    setActiveFilter(filter);
    if (searchInput.trim()) {
      navigate({
        to: "/search",
        search: {
          q: searchInput.trim(),
          type: filter !== "all" ? filter : undefined,
        },
      });
    }
  };

  const handleAddToQueue = async (_result: SearchResult) => {
    navigate({ to: "/queue" });
  };

  const retry = () => {
    if (q) {
      searchMutation.mutate({
        query: q,
        entity_types: type && type !== "all" ? [type] : undefined,
        limit: 30,
      });
    }
  };

  const results = searchMutation.data?.results ?? [];
  const isLoading = searchMutation.isPending;
  const error = searchMutation.error;

  const grouped = SECTION_ORDER.map((entityType) => ({
    type: entityType,
    items: results.filter((r) => r.entity_type === entityType),
  })).filter(
    (section) =>
      section.items.length > 0 && (activeFilter === "all" || activeFilter === section.type)
  );

  const hasResults = grouped.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Search</h1>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search artists, albums, songs, or paste a URL"
              className="pl-9"
            />
          </div>
          <Button type="submit" isLoading={isLoading} disabled={!searchInput.trim()}>
            Search
          </Button>
        </form>
      </div>

      {/* Filters + results console */}
      <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
        <aside className="space-y-4">
          <SearchFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />
          {hasResults && !isLoading && (
            <p className="hidden text-xs text-faint lg:block">
              <span className="font-mono tabular-nums text-muted-foreground tnum">
                {results.length}
              </span>{" "}
              {results.length === 1 ? "result" : "results"}
              {searchMutation.data?.entities_created
                ? ` · ${searchMutation.data.entities_created} new`
                : ""}
            </p>
          )}
        </aside>

        <div className="min-w-0">
          {/* Loading */}
          {isLoading && (
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {Array.from({ length: 6 }, (_, i) => (
                <ResultSkeletonRow key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <Alert variant="destructive">
              <AlertTitle>Search failed</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Something went wrong while searching."}
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={retry}>
                    Try again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {!isLoading && !error && hasResults && (
            <div className="space-y-6">
              {grouped.map((section) => (
                <section key={section.type} className="space-y-1">
                  <div className="flex items-baseline justify-between px-3">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-faint">
                      {SECTION_LABELS[section.type]}
                    </h2>
                    <span className="font-mono text-xs tabular-nums text-faint tnum">
                      {section.items.length}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-1">
                    {section.items.map((result) => (
                      <EntitySearchResultCard
                        key={result.id}
                        result={result}
                        onAddToQueue={handleAddToQueue}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* No results for a query */}
          {!isLoading && !error && q && !hasResults && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchX className="size-8 text-faint" />
              <p className="mt-4 text-sm text-muted-foreground">
                No results for &ldquo;{q}&rdquo;. Try a different term or paste a URL.
              </p>
            </div>
          )}

          {/* Idle empty state */}
          {!isLoading && !error && !q && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchIcon className="size-8 text-faint" />
              <p className="mt-4 text-sm text-muted-foreground">
                Search for an artist, album, song, or paste a URL to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
