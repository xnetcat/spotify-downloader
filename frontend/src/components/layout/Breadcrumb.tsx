import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  entityKeys,
  getSongById,
  getAlbumById,
  getArtistById,
  getPlaylistById,
  isUuid,
} from "@/api/entities";
import type { BreadcrumbItem } from "@/types";

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon as first item */
  showHome?: boolean;
  /** Home link path */
  homePath?: string;
  /** Additional class names */
  className?: string;
  /** Separator element */
  separator?: React.ReactNode;
  /** Maximum items to show before collapsing */
  maxItems?: number;
}

export function Breadcrumb({
  items,
  showHome = true,
  homePath = "/",
  className,
  separator = <ChevronRight className="size-3.5" />,
  maxItems,
}: BreadcrumbProps) {
  const displayItems =
    maxItems && items.length > maxItems
      ? [items[0], { label: "…", href: undefined }, ...items.slice(-(maxItems - 2))]
      : items;

  return (
    <nav aria-label="Breadcrumb" className={cn(className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {showHome && (
          <>
            <li>
              <Link
                to={homePath}
                className="flex items-center text-muted-foreground transition-colors duration-150 hover:text-foreground"
                aria-label="Home"
              >
                <Home className="size-4" />
              </Link>
            </li>
            {items.length > 0 && <li className="text-faint">{separator}</li>}
          </>
        )}

        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === "…";

          return (
            <li key={index} className="flex items-center gap-1.5">
              {isEllipsis ? (
                <span className="text-faint">…</span>
              ) : item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  {item.icon && <item.icon className="size-4" />}
                  <span className="max-w-[150px] truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    isLast ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon && <item.icon className="size-4" />}
                  <span className="max-w-[200px] truncate">{item.label}</span>
                </span>
              )}

              {!isLast && <span className="text-faint">{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Component to display a dynamic entity label using React Query
 */
function DynamicEntityLabel({
  type,
  id,
  fallback,
}: {
  type: string;
  id: string;
  fallback: string;
}) {
  const { data } = useQuery({
    queryKey:
      type === "song"
        ? entityKeys.song(id)
        : type === "album"
          ? entityKeys.album(id)
          : type === "artist"
            ? entityKeys.artist(id)
            : entityKeys.playlist(id),
    queryFn: async () => {
      if (type === "song") return getSongById(id);
      if (type === "album") return getAlbumById(id);
      if (type === "artist") return getArtistById(id);
      return getPlaylistById(id);
    },
    enabled: isUuid(id) && ["song", "album", "artist", "playlist"].includes(type),
    staleTime: 1000 * 60 * 5,
  });

  if (data && "name" in data) {
    return <span className="animate-fade-in">{data.name}</span>;
  }

  return <span>{fallback}</span>;
}

/**
 * Build breadcrumb items from a route path
 */
export function buildBreadcrumbsFromPath(
  pathname: string,
  labelMap?: Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    let href: string | undefined = currentPath;
    const prevSegment = i > 0 ? segments[i - 1] : null;
    const nextSegment = i + 1 < segments.length ? segments[i + 1] : null;

    // Make intermediate entity segments (e.g., /song when followed by an ID) unclickable
    if (
      ["song", "album", "artist", "playlist"].includes(segment) &&
      nextSegment &&
      isUuid(nextSegment)
    ) {
      href = undefined;
    }

    let label: React.ReactNode = labelMap?.[segment];
    if (!label) {
      if (
        prevSegment &&
        ["song", "album", "artist", "playlist"].includes(prevSegment) &&
        isUuid(segment)
      ) {
        label = (
          <DynamicEntityLabel
            type={prevSegment}
            id={segment}
            fallback={formatSegmentLabel(segment)}
          />
        );
      } else {
        label = formatSegmentLabel(segment);
      }
    }

    items.push({ label, href });
  }

  return items;
}

/**
 * Format a URL segment as a human-readable label
 */
function formatSegmentLabel(segment: string): string {
  if (isUuid(segment)) {
    return segment.slice(0, 8) + "…";
  }

  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default Breadcrumb;
