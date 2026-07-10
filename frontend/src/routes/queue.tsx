import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  Ban,
  Download,
  ListMusic,
  MoveRight,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useQueueStore,
  type QueueItem,
  type DownloadStatus,
} from "@/stores/queue";
import { Button } from "@/components/ui";
import { CoverArt } from "@/components/ui/cover-art";
import { Meter } from "@/components/ui/meter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDevConfig } from "@/contexts/DevConfigContext";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { config } from "@/config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/queue")({
  beforeLoad: () => {
    if (config.mode === "hosted") {
      throw redirect({
        to: "/",
      });
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: "/queue",
        },
      });
    }
  },
  component: QueuePage,
});

// ============================================================================
// STATUS MODEL
// ============================================================================

const IN_FLIGHT: DownloadStatus[] = [
  "searching",
  "downloading",
  "processing",
  "converting",
  "embedding",
];

const ACTIVE_FILTER: DownloadStatus[] = ["pending", ...IN_FLIGHT];

/** Eyebrow label + token color per status (rule 3/12: sentence case, tokens only). */
const STATUS_META: Record<DownloadStatus, { label: string; className: string }> = {
  pending: { label: "Queued", className: "text-faint" },
  searching: { label: "Searching", className: "text-warning" },
  downloading: { label: "Downloading", className: "text-primary" },
  processing: { label: "Processing", className: "text-info" },
  converting: { label: "Converting", className: "text-info" },
  embedding: { label: "Embedding", className: "text-info" },
  completed: { label: "Completed", className: "text-success" },
  failed: { label: "Failed", className: "text-destructive" },
  cancelled: { label: "Cancelled", className: "text-muted-foreground" },
};

function isInFlight(status: DownloadStatus) {
  return IN_FLIGHT.includes(status);
}

/** Meter appearance for a row — the only progress visualization (rule 4). */
function meterFor(item: QueueItem): { value: number; active: boolean; color?: string } {
  switch (item.status) {
    case "completed":
      return { value: 100, active: false, color: "var(--success)" };
    case "failed":
      return { value: item.progress, active: false, color: "var(--destructive)" };
    case "cancelled":
      return { value: item.progress, active: false, color: "var(--muted-foreground)" };
    default:
      return { value: item.progress, active: isInFlight(item.status) };
  }
}

// ============================================================================
// CHANNEL ROW
// ============================================================================

function ChannelRow({
  item,
  canDownload,
  reduceMotion,
  onCancel,
  onRetry,
  onRemove,
  onSave,
}: {
  item: QueueItem;
  canDownload: boolean;
  reduceMotion: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const status = STATUS_META[item.status];
  const inFlight = isInFlight(item.status);
  const isFailed = item.status === "failed";
  const isCompleted = item.status === "completed";
  const meter = meterFor(item);
  const showStats = inFlight || isCompleted;

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-lg border border-border bg-card transition-colors",
        "hover:border-faint/50",
        inFlight && "border-primary/30",
        isFailed && "border-l-2 border-l-destructive"
      )}
    >
      <div className="flex items-center gap-4 p-3">
        <CoverArt
          src={item.song.cover_url ?? null}
          alt={item.song.name}
          size="sm"
          fallbackIcon="track"
          className="rounded-md"
        />

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              status.className
            )}
          >
            {status.label}
          </p>
          <Link
            to="/song/$id"
            params={{ id: item.song.platform_id }}
            className="block truncate font-medium text-foreground transition-colors hover:text-primary"
          >
            {item.song.name}
          </Link>
          <p className="truncate text-sm text-muted-foreground">{item.song.artist}</p>

          {/* Source / target / entity context */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs uppercase tracking-wide text-faint">
            <span>{item.song.platform}</span>
            {item.match?.target_platform && (
              <>
                <MoveRight className="size-3" aria-hidden />
                <span>{item.match.target_platform}</span>
              </>
            )}
            {item.entityContext && (
              <span className="truncate normal-case tracking-normal">
                · {item.entityContext.name} ({item.entityContext.position}/
                {item.entityContext.total})
              </span>
            )}
          </div>
        </div>

        {/* Meter (consistent width) */}
        <div className="hidden w-28 shrink-0 sm:block md:w-36">
          <Meter
            cells={16}
            value={meter.value}
            max={100}
            active={meter.active}
            color={meter.color}
            label={`${status.label} ${item.progress}%`}
          />
        </div>

        {/* Mono readouts */}
        <div className="hidden w-16 shrink-0 flex-col items-end gap-0.5 font-mono text-xs tnum sm:flex">
          {showStats && <span className="text-foreground">{item.progress}%</span>}
          {inFlight && item.speed && (
            <span className="text-muted-foreground">{item.speed}</span>
          )}
          {inFlight && item.eta && <span className="text-faint">{item.eta}</span>}
        </div>

        {/* Row actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {inFlight && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cancel download of ${item.song.name}`}
              onClick={onCancel}
            >
              <Ban className="size-4" />
            </Button>
          )}
          {isFailed && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Retry ${item.song.name}`}
              onClick={onRetry}
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
          {isCompleted && canDownload && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Save ${item.song.name} to disk`}
              onClick={onSave}
            >
              <Download className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${item.song.name} from queue`}
            onClick={onRemove}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Failure detail line */}
      {isFailed && item.error && (
        <div className="flex items-start gap-2 border-t border-border px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          <span className="leading-relaxed">{item.error}</span>
        </div>
      )}
    </motion.li>
  );
}

// ============================================================================
// SUMMARY STRIP
// ============================================================================

type Filter = "all" | "active" | "completed" | "failed";

function StatChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/50 bg-elevated"
          : "border-border bg-card hover:border-faint/60"
      )}
    >
      <span className="font-mono text-sm font-semibold tnum text-foreground">{count}</span>
      <span className="text-xs font-medium uppercase tracking-wider text-faint">{label}</span>
    </button>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

function QueuePage() {
  const items = useQueueStore((s) => s.items);
  const removeItem = useQueueStore((s) => s.removeItem);
  const cancelDownload = useQueueStore((s) => s.cancelDownload);
  const retryFailed = useQueueStore((s) => s.retryFailed);
  const downloadFile = useQueueStore((s) => s.downloadFile);
  const clearCompleted = useQueueStore((s) => s.clearCompleted);
  const clearFailed = useQueueStore((s) => s.clearFailed);
  const clearAll = useQueueStore((s) => s.clearAll);

  const { features } = useDevConfig();
  const enableAnimations = useSettingsStore((s) => s.enableAnimations);
  const reduceMotionSetting = useSettingsStore((s) => s.reduceMotion);
  const prefersReduced = useReducedMotion();
  const reduceMotion = !enableAnimations || reduceMotionSetting || Boolean(prefersReduced);

  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const count = (statuses: DownloadStatus[]) =>
      items.filter((i) => statuses.includes(i.status)).length;
    return {
      total: items.length,
      active: count(ACTIVE_FILTER),
      completed: count(["completed"]),
      failed: count(["failed", "cancelled"]),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "active":
        return items.filter((i) => ACTIVE_FILTER.includes(i.status));
      case "completed":
        return items.filter((i) => i.status === "completed");
      case "failed":
        return items.filter((i) => i.status === "failed" || i.status === "cancelled");
      default:
        return items;
    }
  }, [items, filter]);

  const toggleFilter = (next: Filter) =>
    setFilter((current) => (current === next ? "all" : next));

  const pageTransition = reduceMotion
    ? undefined
    : { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={pageTransition}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Download queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stats.total === 0
            ? "Nothing queued yet"
            : `${stats.total} ${stats.total === 1 ? "track" : "tracks"} on the console`}
        </p>
      </div>

      {stats.total > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <StatChip
            label="All"
            count={stats.total}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <StatChip
            label="Active"
            count={stats.active}
            active={filter === "active"}
            onClick={() => toggleFilter("active")}
          />
          <StatChip
            label="Completed"
            count={stats.completed}
            active={filter === "completed"}
            onClick={() => toggleFilter("completed")}
          />
          <StatChip
            label="Failed"
            count={stats.failed}
            active={filter === "failed"}
            onClick={() => toggleFilter("failed")}
          />

          <div className="ml-auto flex items-center gap-1">
            {stats.completed > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear completed
              </Button>
            )}
            {stats.failed > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFailed}>
                Clear failed
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear the entire queue?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all {stats.total}{" "}
                    {stats.total === 1 ? "track" : "tracks"}, including any active
                    downloads. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button variant="danger" onClick={clearAll}>
                      Clear all
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Channel list */}
      {filteredItems.length > 0 ? (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {filteredItems.map((item) => (
              <ChannelRow
                key={item.id}
                item={item}
                canDownload={features.canDownload}
                reduceMotion={reduceMotion}
                onCancel={() => cancelDownload(item.id)}
                onRetry={() => retryFailed(item.id)}
                onRemove={() => removeItem(item.id)}
                onSave={() => downloadFile(item.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <ListMusic className="size-8 text-faint" aria-hidden />
          <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">
            {filter === "all" ? "Queue is empty" : `No ${filter} downloads`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "all"
              ? "Find music and add it to start downloading."
              : "Nothing here right now."}
          </p>
          {filter === "all" ? (
            <Button asChild variant="primary" className="mt-4">
              <Link to="/search">Find music</Link>
            </Button>
          ) : (
            <Button variant="outline" className="mt-4" onClick={() => setFilter("all")}>
              Show all
            </Button>
          )}
        </div>
      )}

      {/* Output notice */}
      {features.canDownload && stats.completed > 0 && (
        <p className="text-center text-xs text-faint">
          Completed downloads are saved to your configured output directory.
        </p>
      )}
    </motion.div>
  );
}
