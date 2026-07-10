import { createRootRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Search, Sun, Moon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  Breadcrumb,
  CommandPalette,
  useCommandPalette,
  buildBreadcrumbsFromPath,
} from "@/components/layout";
import { Kbd } from "@/components/ui/kbd";
import { Meter } from "@/components/ui/meter";
import { Toaster } from "@/components/ui/sonner";
import { ToastProvider } from "@/components/ui/toast";
import { DevModePanel } from "@/components/dev";
import { DevConfigProvider, useDevConfig } from "@/contexts/DevConfigContext";
import { useSettingsStore } from "@/stores/settings";
import { useQueueStore } from "@/stores/queue";
import { config } from "@/config";

export const Route = createRootRoute({
  component: RootLayout,
});

const ACTIVE_STATUSES = new Set(["pending", "searching", "downloading", "converting", "embedding"]);

/** Live download activity pill — appears in the header while the queue is working. */
function QueuePill() {
  const items = useQueueStore((s) => s.items);
  const { features } = useDevConfig();

  const active = useMemo(() => items.filter((i) => ACTIVE_STATUSES.has(i.status)), [items]);

  if (!features.hasQueue || active.length === 0) return null;

  const avgProgress =
    active.reduce((sum, item) => sum + (item.progress ?? 0), 0) / active.length;

  return (
    <Link
      to="/queue"
      className={cn(
        "hidden sm:flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-1.5",
        "transition-colors hover:border-primary/50"
      )}
      aria-label={`${active.length} active downloads`}
    >
      <span className="font-mono text-xs text-primary tnum">{active.length}</span>
      <Meter value={avgProgress} max={100} cells={8} size="sm" active className="w-16" />
    </Link>
  );
}

function ThemeToggle() {
  const theme = useSettingsStore((s) => s.theme);
  const update = useSettingsStore((s) => s.update);
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => update("theme", isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "flex size-9 items-center justify-center rounded-md text-muted-foreground",
        "transition-colors hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function TopBar({
  onSearchClick,
  breadcrumbs,
}: {
  onSearchClick: () => void;
  breadcrumbs: import("@/types").BreadcrumbItem[];
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 px-6",
        "border-b border-border bg-background/90 backdrop-blur-sm"
      )}
    >
      <Breadcrumb items={breadcrumbs} className="min-w-0" />

      <div className="flex items-center gap-2">
        <QueuePill />
        <button
          onClick={onSearchClick}
          className={cn(
            "flex items-center gap-3 rounded-md border border-border bg-card px-3 py-1.5",
            "text-sm text-muted-foreground transition-colors",
            "hover:border-faint/60 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "min-w-[180px] sm:min-w-[260px]"
          )}
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
        </button>
        <ThemeToggle />
        <a
          href={config.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="spotDL on GitHub"
          className={cn(
            "hidden sm:flex h-9 items-center gap-1.5 rounded-md px-2.5 text-muted-foreground",
            "transition-colors hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <span className="font-mono text-xs">GitHub</span>
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </header>
  );
}

function RootLayout() {
  return (
    <DevConfigProvider>
      <RootLayoutContent />
    </DevConfigProvider>
  );
}

function RootLayoutContent() {
  const location = useLocation();
  const { isOpen: isPaletteOpen, open: openPalette, close: closePalette } = useCommandPalette();
  const { features } = useDevConfig();
  const theme = useSettingsStore((s) => s.theme);
  const enableAnimations = useSettingsStore((s) => s.enableAnimations);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const queueItems = useQueueStore((s) => s.items);

  const activeCount = useMemo(
    () => queueItems.filter((i) => ACTIVE_STATUSES.has(i.status)).length,
    [queueItems]
  );

  // Theme: .dark class on <html>, following the setting (system tracks the OS)
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);

  // Motion preferences
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduce-motion", !enableAnimations || reduceMotion);
  }, [enableAnimations, reduceMotion]);

  const breadcrumbs = buildBreadcrumbsFromPath(location.pathname);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar queueCount={activeCount} />

        <div className="flex min-h-screen flex-col md:ml-16">
          {features.isHosted && (
            <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-center">
              <p className="text-sm text-muted-foreground">
                This is the hosted spotDL catalog — metadata, matching, and lyrics.{" "}
                <a
                  href={config.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Self-host
                </a>{" "}
                to enable downloads.
              </p>
            </div>
          )}

          <TopBar onSearchClick={openPalette} breadcrumbs={breadcrumbs} />

          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
              <Outlet />
            </div>
          </main>
        </div>

        <CommandPalette isOpen={isPaletteOpen} onClose={closePalette} />
        <Toaster />
        <DevModePanel />
      </div>
    </ToastProvider>
  );
}
