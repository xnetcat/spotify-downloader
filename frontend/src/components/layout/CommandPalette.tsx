import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UserRound, Disc3, ListMusic, Music, Search, LayoutGrid, Loader2 } from "lucide-react";
import { useUniversalSearch } from "@/api";
import type { SearchResult, EntityType } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

const entityIcons: Record<EntityType, React.ReactNode> = {
  artist: <UserRound className="size-4" />,
  album: <Disc3 className="size-4" />,
  playlist: <ListMusic className="size-4" />,
  track: <Music className="size-4" />,
  all: <LayoutGrid className="size-4" />,
};

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 200);

  const { data: searchData, isLoading } = useUniversalSearch(
    { query: debouncedQuery, limit: 8 },
    { enabled: debouncedQuery.length >= 2 }
  );

  const results = useMemo(() => searchData?.results ?? [], [searchData]);

  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = (result: SearchResult) => {
    const routes: Record<EntityType, string> = {
      artist: `/artist/${result.id}`,
      album: `/album/${result.id}`,
      playlist: `/playlist/${result.id}`,
      track: `/song/${result.id}`,
      all: `/search`,
    };
    navigate({ to: routes[result.entity_type] ?? "/search" });
    onClose();
  };

  const handleSearchAll = () => {
    if (query.length === 0) return;
    navigate({ to: "/search", search: { q: query } });
    onClose();
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Search"
      description="Search artists, albums, playlists, and songs"
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search artists, albums, songs…"
      />
      <CommandList>
        {query.length < 2 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </p>
        ) : isLoading ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Searching…
          </p>
        ) : (
          <>
            <CommandEmpty>
              No results for “{query}”. Try an artist, album, or song name.
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result)}
                    className="gap-3"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center overflow-hidden border border-border bg-elevated text-faint",
                        result.entity_type === "artist" ? "rounded-full" : "rounded-md"
                      )}
                    >
                      {result.image_url ? (
                        <img
                          src={result.image_url}
                          alt=""
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        entityIcons[result.entity_type]
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{result.name}</span>
                      {result.subtitle && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-faint">
                      {result.entity_type}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {query.length >= 2 && (
              <CommandGroup heading="Actions">
                <CommandItem value="__search_all" onSelect={handleSearchAll} className="gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-elevated text-faint">
                    <Search className="size-4" />
                  </span>
                  <span className="flex-1 text-sm">
                    Search everywhere for “{query}”
                  </span>
                  <Kbd>↵</Kbd>
                </CommandItem>
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
      <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-faint">
        <span className="flex items-center gap-1.5">
          <Kbd>↑↓</Kbd> Navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> Open
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Esc</Kbd> Close
        </span>
      </div>
    </CommandDialog>
  );
}

/** Global ⌘K / Ctrl-K state for the palette. */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

export default CommandPalette;
