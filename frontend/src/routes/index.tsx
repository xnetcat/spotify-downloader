import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Search as SearchIcon, ListMusic, Settings, ExternalLink, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useFeatures } from "@/contexts/DevConfigContext";
import { cn } from "@/lib/utils";
import { config } from "@/config";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// ============================================================================
// Recent searches (localStorage)
// ============================================================================

const RECENT_SEARCHES_KEY = "spotdl_recent_searches";
const MAX_RECENT_SEARCHES = 10;

interface RecentSearch {
  query: string;
  timestamp: number;
}

function getRecentSearches(): RecentSearch[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string): void {
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter((s) => s.query.toLowerCase() !== query.toLowerCase());
    const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail
  }
}

function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently fail
  }
}

// ============================================================================
// Home
// ============================================================================

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const line = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
} as const;

function HomePage() {
  const navigate = useNavigate();
  const features = useFeatures();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const runSearch = useCallback(
    (query: string) => {
      const searchTerm = query.trim();
      if (!searchTerm) return;
      addRecentSearch(searchTerm);
      navigate({ to: "/search", search: { q: searchTerm } });
    },
    [navigate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-12 sm:py-20">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full space-y-6 text-center"
      >
        <motion.p
          variants={line}
          className="text-xs font-medium uppercase tracking-wider text-faint"
        >
          Music catalog console
        </motion.p>

        <motion.h1
          variants={line}
          className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
        >
          Download music from anywhere
        </motion.h1>

        <motion.p variants={line} className="mx-auto max-w-lg text-muted-foreground">
          Search across Spotify, YouTube, SoundCloud and more. Paste a link or type an artist
          and song to begin.
        </motion.p>

        <motion.form variants={line} onSubmit={handleSubmit} className="pt-2">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Paste a URL or search for a song"
                aria-label="Search"
                className="h-12 pl-11 text-base"
              />
            </div>
            <Button type="submit" size="lg" disabled={!searchQuery.trim()} className="h-12">
              Search
            </Button>
          </div>
        </motion.form>
      </motion.div>

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
          className="mt-8 w-full"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-medium uppercase tracking-wider text-faint">Recent</h2>
            <button
              onClick={handleClearRecent}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3" />
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 8).map((search) => (
              <button
                key={search.timestamp}
                onClick={() => runSearch(search.query)}
                className={cn(
                  "rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground",
                  "transition-colors hover:bg-elevated hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {search.query}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
        className="mt-10 flex flex-wrap items-center justify-center gap-2"
      >
        {features.hasQueue && (
          <QuickLink to="/queue" icon={<ListMusic className="size-4" />} label="Download queue" />
        )}
        <QuickLink to="/settings" icon={<Settings className="size-4" />} label="Settings" />
        <a
          href={config.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={quickLinkClasses}
        >
          <ExternalLink className="size-4" />
          GitHub
        </a>
      </motion.div>
    </div>
  );
}

const quickLinkClasses = cn(
  "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground",
  "transition-colors hover:bg-elevated hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
);

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className={quickLinkClasses}>
      {icon}
      {label}
    </Link>
  );
}
