import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformInfo } from "@/types";

// Platform identity: a display name, a colored identity dot, and a hover border
// tint. Platform brand colors are used ONLY for the dot + tint (design rule 12).
interface PlatformConfig {
  name: string;
  dot: string;
  hover: string;
}

const platformConfigs: Record<string, PlatformConfig> = {
  spotify: { name: "Spotify", dot: "bg-spotify", hover: "hover:border-spotify/40" },
  apple_music: { name: "Apple Music", dot: "bg-apple", hover: "hover:border-apple/40" },
  deezer: { name: "Deezer", dot: "bg-deezer", hover: "hover:border-deezer/40" },
  youtube: { name: "YouTube", dot: "bg-youtube", hover: "hover:border-youtube/40" },
  youtube_music: { name: "YouTube Music", dot: "bg-ytmusic", hover: "hover:border-ytmusic/40" },
  soundcloud: { name: "SoundCloud", dot: "bg-soundcloud", hover: "hover:border-soundcloud/40" },
  bandcamp: { name: "Bandcamp", dot: "bg-bandcamp", hover: "hover:border-bandcamp/40" },
  tidal: { name: "TIDAL", dot: "bg-tidal", hover: "hover:border-tidal/40" },
  amazon: { name: "Amazon Music", dot: "bg-amazon", hover: "hover:border-amazon/40" },
};

const fallbackConfig: PlatformConfig = {
  name: "Link",
  dot: "bg-faint",
  hover: "hover:border-faint/50",
};

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export interface PlatformLinkProps {
  /** Platform info */
  platform: PlatformInfo;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show followers count */
  showFollowers?: boolean;
  /** Additional class names */
  className?: string;
}

export function PlatformLink({
  platform,
  size = "md",
  showFollowers = false,
  className,
}: PlatformLinkProps) {
  const config = platformConfigs[platform.platform] ?? {
    ...fallbackConfig,
    name: platform.platform,
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1.5",
    md: "px-3 py-2 text-sm gap-2",
    lg: "px-4 py-2.5 text-base gap-2.5",
  };

  if (!isValidUrl(platform.url)) return null;

  return (
    <a
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center rounded-md border border-border bg-surface font-medium text-foreground transition-colors",
        config.hover,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", config.dot)} aria-hidden />
      <span>{config.name}</span>
      {showFollowers && platform.followers && (
        <span className="font-mono tnum text-xs text-muted-foreground">
          {formatNumber(platform.followers)}
        </span>
      )}
      <ExternalLink className="size-3.5 text-faint transition-colors group-hover:text-muted-foreground" />
    </a>
  );
}

/**
 * Grid of platform links.
 */
export interface PlatformLinksGridProps {
  platforms: PlatformInfo[];
  size?: "sm" | "md" | "lg";
  showFollowers?: boolean;
  className?: string;
}

export function PlatformLinksGrid({
  platforms,
  size = "md",
  showFollowers = false,
  className,
}: PlatformLinksGridProps) {
  const validPlatforms = platforms.filter((p) => isValidUrl(p.url));
  if (validPlatforms.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {validPlatforms.map((platform, index) => (
        <PlatformLink
          key={`${platform.platform}-${index}`}
          platform={platform}
          size={size}
          showFollowers={showFollowers}
        />
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default PlatformLink;
