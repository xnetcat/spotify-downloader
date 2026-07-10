import { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/components/ui/cover-art";
import { Badge } from "@/components/ui/badge";
import type { ArtistSummary } from "@/types";

export interface RelatedArtistsCarouselProps {
  artists: ArtistSummary[];
  onArtistClick?: (artistId: string) => void;
  className?: string;
}

export function RelatedArtistsCarousel({
  artists,
  onArtistClick,
  className,
}: RelatedArtistsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, [artists]);

  const scrollByDir = (dir: -1 | 1) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: dir * container.clientWidth * 0.8, behavior: "smooth" });
  };

  if (artists.length === 0) return null;

  return (
    <div className={cn("group/carousel relative", className)}>
      {canScrollLeft && (
        <button
          onClick={() => scrollByDir(-1)}
          className={cn(
            "absolute left-0 top-1/2 z-10 -ml-4 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full md:flex",
            "border border-border bg-card text-muted-foreground shadow-lg",
            "opacity-0 transition-opacity hover:text-foreground group-hover/carousel:opacity-100",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scrollByDir(1)}
          className={cn(
            "absolute right-0 top-1/2 z-10 -mr-4 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full md:flex",
            "border border-border bg-card text-muted-foreground shadow-lg",
            "opacity-0 transition-opacity hover:text-foreground group-hover/carousel:opacity-100",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="-mb-2 flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
      >
        {artists.map((artist, index) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            index={index}
            onArtistClick={onArtistClick}
          />
        ))}
      </div>
    </div>
  );
}

interface ArtistCardProps {
  artist: ArtistSummary;
  index: number;
  onArtistClick?: (artistId: string) => void;
}

function ArtistCard({ artist, index, onArtistClick }: ArtistCardProps) {
  const displayGenres = artist.genres.slice(0, 2);

  const content = (
    <div
      className="group w-32 flex-shrink-0 space-y-3 rounded-lg p-2 text-center transition-colors hover:bg-elevated/50 sm:w-36 animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <CoverArt
        src={artist.image_url}
        alt={artist.name}
        size="lg"
        shape="circle"
        fallbackIcon="artist"
        className="mx-auto"
      />
      <div className="space-y-1.5 px-1">
        <p
          className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary"
          title={artist.name}
        >
          {artist.name}
        </p>
        {displayGenres.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {displayGenres.map((genre) => (
              <Badge key={genre} variant="muted" size="sm" className="max-w-full truncate">
                {genre}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (onArtistClick) {
    return (
      <button
        onClick={() => onArtistClick(artist.id)}
        className="rounded-lg text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to="/artist/$id"
      params={{ id: artist.id }}
      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {content}
    </Link>
  );
}

export default RelatedArtistsCarousel;
