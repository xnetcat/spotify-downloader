import { Link } from "@tanstack/react-router";
import { Home, ChevronRight, User, Disc3, Music, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types";

export interface EntityBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function EntityBreadcrumb({ items, className }: EntityBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1.5 text-sm", className)}
    >
      <Link
        to="/"
        className={cn(
          "flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        )}
        aria-label="Home"
      >
        <Home className="size-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={index} className="flex items-center gap-1.5">
            <ChevronRight className="size-4 flex-shrink-0 text-faint" />

            {isLast || !item.href ? (
              <span
                className={cn(
                  "flex items-center gap-1.5 truncate",
                  isLast ? "font-medium text-foreground" : "text-muted-foreground",
                  "max-w-[150px] sm:max-w-[200px] md:max-w-none"
                )}
                aria-current={isLast ? "page" : undefined}
                title={typeof item.label === "string" ? item.label : undefined}
              >
                {Icon && <Icon className="size-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  "max-w-[150px] sm:max-w-[200px] md:max-w-none"
                )}
                title={typeof item.label === "string" ? item.label : undefined}
              >
                {Icon && <Icon className="size-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export interface EntityBreadcrumbPresetProps {
  entityType: "artist" | "album" | "song" | "playlist";
  entityName: string;
  parentEntity?: {
    type: "artist" | "album";
    id: string;
    name: string;
  };
  className?: string;
}

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  artist: User,
  album: Disc3,
  song: Music,
  playlist: ListMusic,
};

export function EntityBreadcrumbPreset({
  entityType,
  entityName,
  parentEntity,
  className,
}: EntityBreadcrumbPresetProps) {
  const items: BreadcrumbItem[] = [];

  if (parentEntity) {
    items.push({
      label: parentEntity.name,
      href: `/${parentEntity.type}/${parentEntity.id}`,
      icon: entityIcons[parentEntity.type],
    });
  }

  items.push({
    label: entityName,
    icon: entityIcons[entityType],
  });

  return <EntityBreadcrumb items={items} className={className} />;
}

export default EntityBreadcrumb;
