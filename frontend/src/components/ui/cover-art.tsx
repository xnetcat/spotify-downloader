import { useState, type ReactNode } from "react";
import { Disc3, ListMusic, Music, Play, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoverArtSize, CoverArtShape } from "@/types";

const fallbackIcons: Record<"artist" | "album" | "playlist" | "track", ReactNode> = {
  artist: <User className="size-1/3" />,
  album: <Disc3 className="size-1/3" />,
  playlist: <ListMusic className="size-1/3" />,
  track: <Music className="size-1/3" />,
};

const sizeClasses: Record<CoverArtSize, string> = {
  xs: "w-12 h-12",
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-[150px] h-[150px]",
  xl: "w-[200px] h-[200px]",
  "2xl": "w-[300px] h-[300px]",
  hero: "w-[400px] h-[400px]",
};

const shapeClasses: Record<CoverArtShape, string> = {
  rounded: "rounded-md",
  circle: "rounded-full",
};

export interface CoverArtProps {
  src: string | null;
  alt: string;
  size?: CoverArtSize;
  shape?: CoverArtShape;
  className?: string;
  fallbackIcon?: "artist" | "album" | "playlist" | "track";
  showPlayButton?: boolean;
  onPlay?: () => void;
}

export function CoverArt({
  src,
  alt,
  size = "md",
  shape = "rounded",
  className,
  fallbackIcon = "track",
  showPlayButton = false,
  onPlay,
}: CoverArtProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const showFallback = !src || hasError;

  return (
    <div
      className={cn(
        "group relative flex-shrink-0 overflow-hidden border border-border bg-surface",
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
    >
      {!isLoaded && !showFallback && <div className="absolute inset-0 animate-pulse bg-elevated" />}

      {showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface text-faint">
          {fallbackIcons[fallbackIcon]}
        </div>
      )}

      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-out-expo)]",
            "group-hover:scale-[1.02]",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}

      {showPlayButton && onPlay && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 transition-opacity duration-200",
            "group-hover:opacity-100 focus-visible:opacity-100 outline-none",
            shapeClasses[shape]
          )}
          aria-label={`Play ${alt}`}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-5 translate-x-px fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}

export default CoverArt;
