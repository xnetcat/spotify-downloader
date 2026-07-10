import { useState, useEffect, useCallback } from "react";
import { Radio, RefreshCw, Music, Download, Database, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Spinner } from "./spinner";
import { apiClient } from "@/api/client";

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionState = "connected" | "connecting" | "disconnected" | "error";

export interface ServiceStatus {
  name: string;
  displayName: string;
  state: ConnectionState;
  latency?: number; // ms
  error?: string;
  icon?: React.ReactNode;
}

interface ServiceStatusItem {
  name: string;
  display_name: string;
  state: string;
  latency: number | null;
  error: string | null;
}

interface ServiceStatusResponse {
  sources: ServiceStatusItem[];
  targets: ServiceStatusItem[];
  metadata: ServiceStatusItem[];
  capabilities?: Record<string, ServiceStatusItem[]>;
  overall_state: string;
}

// ============================================================================
// SERVICE STATUS HOOK - Uses real API
// ============================================================================

function useServiceStatus(): {
  services: ServiceStatus[];
  sources: ServiceStatus[];
  targets: ServiceStatus[];
  metadata: ServiceStatus[];
  capabilities: Record<string, ServiceStatus[]>;
  isLoading: boolean;
  refetch: () => void;
} {
  const [sources, setSources] = useState<ServiceStatus[]>([]);
  const [targets, setTargets] = useState<ServiceStatus[]>([]);
  const [metadata, setMetadata] = useState<ServiceStatus[]>([]);
  const [capabilities, setCapabilities] = useState<Record<string, ServiceStatus[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const mapApiToStatus = (item: ServiceStatusItem): ServiceStatus => ({
    name: item.name,
    displayName: item.display_name,
    state: item.state as ConnectionState,
    latency: item.latency ?? undefined,
    error: item.error ?? undefined,
  });

  const checkServices = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.get<ServiceStatusResponse>("/health/services");
      const data = response.data;

      setSources(data.sources.map(mapApiToStatus));
      setTargets(data.targets.map(mapApiToStatus));
      setMetadata(data.metadata.map(mapApiToStatus));
      const capabilityGroups: Record<string, ServiceStatus[]> = {};
      for (const [capability, items] of Object.entries(data.capabilities || {})) {
        capabilityGroups[capability] = items.map(mapApiToStatus);
      }
      setCapabilities(capabilityGroups);
    } catch {
      // On error, show all services as unknown/error state
      setSources([
        { name: "spotify", displayName: "Spotify", state: "error", error: "Check failed" },
        { name: "youtube_music", displayName: "YouTube Music", state: "error", error: "Check failed" },
        { name: "soundcloud", displayName: "SoundCloud", state: "error", error: "Check failed" },
        { name: "bandcamp", displayName: "Bandcamp", state: "error", error: "Check failed" },
      ]);
      setTargets([
        { name: "youtube", displayName: "YouTube", state: "error", error: "Check failed" },
        { name: "youtube_music", displayName: "YouTube Music", state: "error", error: "Check failed" },
        { name: "soundcloud", displayName: "SoundCloud", state: "error", error: "Check failed" },
        { name: "bandcamp", displayName: "Bandcamp", state: "error", error: "Check failed" },
        { name: "piped", displayName: "Piped", state: "error", error: "Check failed" },
      ]);
      setMetadata([
        { name: "musicbrainz", displayName: "MusicBrainz", state: "error", error: "Check failed" },
        { name: "discogs", displayName: "Discogs", state: "error", error: "Check failed" },
        { name: "genius", displayName: "Genius (Lyrics)", state: "error", error: "Check failed" },
        { name: "musixmatch", displayName: "MusixMatch (Lyrics)", state: "error", error: "Check failed" },
      ]);
      setCapabilities({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 60000);
    return () => clearInterval(interval);
  }, [checkServices]);

  return {
    services: [...sources, ...targets, ...metadata],
    sources,
    targets,
    metadata,
    capabilities,
    isLoading,
    refetch: checkServices,
  };
}

// ============================================================================
// STATUS INDICATOR - Single status dot
// ============================================================================

const dotColor: Record<ConnectionState, string> = {
  connected: "bg-success",
  connecting: "bg-warning",
  disconnected: "bg-faint",
  error: "bg-destructive",
};

function StatusDot({ state, size = "sm" }: { state: ConnectionState; size?: "xs" | "sm" | "md" }) {
  const sizeClasses = { xs: "size-1.5", sm: "size-2", md: "size-2.5" };

  return (
    <span className="relative flex">
      <span className={cn(sizeClasses[size], "rounded-full", dotColor[state])} />
      {(state === "connected" || state === "connecting") && (
        <span
          className={cn(
            sizeClasses[size],
            "absolute inset-0 animate-ping rounded-full opacity-50",
            dotColor[state]
          )}
        />
      )}
    </span>
  );
}

function groupState(connected: number, total: number): ConnectionState {
  if (total > 0 && connected === total) return "connected";
  if (connected > 0) return "connecting";
  return "error";
}

// ============================================================================
// COMPACT CONNECTION STATUS - For home page
// ============================================================================

export function ConnectionStatusCompact({ className }: { className?: string }) {
  const { sources, targets, metadata, isLoading } = useServiceStatus();

  const connectedSources = sources.filter((s) => s.state === "connected").length;
  const connectedTargets = targets.filter((s) => s.state === "connected").length;
  const connectedMetadata = metadata.filter((s) => s.state === "connected").length;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Spinner size="sm" />
        <span>Checking connections</span>
      </div>
    );
  }

  const groups: { label: string; connected: number; total: number }[] = [
    { label: "Resolve", connected: connectedSources, total: sources.length },
    { label: "Match/Download", connected: connectedTargets, total: targets.length },
    { label: "Enrich/Lyrics", connected: connectedMetadata, total: metadata.length },
  ];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {groups.map((g, i) => (
        <div key={g.label} className="flex items-center gap-4">
          {i > 0 && <div className="h-4 w-px bg-border" />}
          <div className="flex items-center gap-2">
            <StatusDot state={groupState(g.connected, g.total)} />
            <span className="text-xs text-muted-foreground">
              <span className="font-mono tnum text-foreground">
                {g.connected}/{g.total}
              </span>{" "}
              {g.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SERVICE ROW - Individual service in detailed view
// ============================================================================

function ServiceRow({ service }: { service: ServiceStatus }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-elevated/50">
      <div className="flex items-center gap-3">
        <StatusDot state={service.state} size="md" />
        <div>
          <p className="text-sm font-medium text-foreground">{service.displayName}</p>
          {service.error && <p className="text-xs text-destructive">{service.error}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {service.latency !== undefined && (
          <span className="font-mono tnum text-xs text-faint">{service.latency}ms</span>
        )}
        <Badge
          variant={
            service.state === "connected"
              ? "success"
              : service.state === "connecting"
                ? "warning"
                : "error"
          }
          size="sm"
        >
          {service.state === "connected"
            ? "Online"
            : service.state === "connecting"
              ? "Connecting"
              : "Offline"}
        </Badge>
      </div>
    </div>
  );
}

function ServiceGroup({
  title,
  icon: Icon,
  services,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  services: ServiceStatus[];
}) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-faint">
        <Icon className="size-4" />
        {title}
      </h4>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {services.map((service) => (
          <ServiceRow key={service.name} service={service} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DETAILED CONNECTION STATUS - For settings page
// ============================================================================

export function ConnectionStatusDetailed({ className }: { className?: string }) {
  const { services, sources, targets, metadata, capabilities, isLoading, refetch } =
    useServiceStatus();

  const totalConnected = services.filter((s) => s.state === "connected").length;
  const overallState: ConnectionState =
    totalConnected === services.length
      ? "connected"
      : totalConnected > services.length / 2
        ? "connecting"
        : totalConnected > 0
          ? "error"
          : "disconnected";

  return (
    <Card variant="bordered" className={cn("animate-slide-up", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-elevated">
              <Radio className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Service connections</CardTitle>
              <CardDescription>Status of all connected platforms and services</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                overallState === "connected"
                  ? "success"
                  : overallState === "connecting"
                    ? "warning"
                    : "error"
              }
              size="sm"
              pulse={overallState === "connecting"}
            >
              {totalConnected}/{services.length} online
            </Badge>
            <button
              onClick={refetch}
              disabled={isLoading}
              className={cn(
                "rounded-md p-2 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
              )}
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <Spinner size="md" />
            <span className="text-muted-foreground">Checking service connections</span>
          </div>
        ) : (
          <>
            <ServiceGroup title="Resolve providers" icon={Music} services={sources} />
            <ServiceGroup title="Match & download providers" icon={Download} services={targets} />
            <ServiceGroup title="Enrich & lyrics providers" icon={Database} services={metadata} />

            {Object.keys(capabilities).length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-faint">
                  <LayoutGrid className="size-4" />
                  Capability matrix
                </h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {Object.entries(capabilities).map(([capability, items]) => {
                    const online = items.filter((item) => item.state === "connected").length;
                    return (
                      <div
                        key={capability}
                        className="rounded-md border border-border bg-surface px-3 py-2"
                      >
                        <p className="text-[11px] uppercase tracking-wider text-faint">
                          {capability}
                        </p>
                        <p className="mt-1 font-mono tnum text-sm text-foreground">
                          {online}/{items.length}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default {
  ConnectionStatusCompact,
  ConnectionStatusDetailed,
};
