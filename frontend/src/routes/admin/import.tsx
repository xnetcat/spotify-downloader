import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { Download, Upload, TriangleAlert, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import {
  useExportMatches,
  useExportUsers,
  useExportStatistics,
  useImportMatches,
  useImportUrls,
  usePurgeUnverifiedMatches,
  useResetDatabase,
  type MatchStatus,
} from "@/api";
import {
  Button,
  Select,
  Spinner,
  Input,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/import")({
  component: AdminImportPage,
});

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={cn(
          "text-[0.8125rem] font-semibold uppercase tracking-wider",
          danger ? "text-destructive" : "text-foreground"
        )}
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Tool({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4",
        danger ? "border-destructive/30 bg-destructive/5" : "border-border"
      )}
    >
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warning" | "destructive" }) {
  return (
    <div className="rounded-md bg-elevated p-2 text-center">
      <div
        className={cn(
          "font-mono text-lg font-semibold tabular-nums",
          tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground"
        )}
      >
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-faint">{label}</div>
    </div>
  );
}

function AdminImportPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToast();

  const [matchExportStatus, setMatchExportStatus] = useState<MatchStatus | "">("");
  const [urlInput, setUrlInput] = useState("");
  const [importResult, setImportResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [purgePreview, setPurgePreview] = useState<{ pending: number; rejected: number } | null>(null);
  const [resetPreview, setResetPreview] = useState<{ entities: number; relations: number } | null>(null);
  const [confirmReset, setConfirmReset] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportMatchesMutation = useExportMatches();
  const exportUsersMutation = useExportUsers();
  const exportStatsMutation = useExportStatistics();
  const importMatchesMutation = useImportMatches();
  const importUrlsMutation = useImportUrls();
  const purgeMutation = usePurgeUnverifiedMatches();
  const resetMutation = useResetDatabase();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    } else if (user && !user.is_admin) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user, navigate]);

  const handleExportMatches = async () => {
    try {
      const data = await exportMatchesMutation.mutateAsync(matchExportStatus || undefined);
      downloadJson(
        data,
        `matches-export-${matchExportStatus || "verified"}-${new Date().toISOString().split("T")[0]}.json`
      );
      addToast(`Exported ${data.count} matches`, "success");
    } catch {
      addToast("Failed to export matches", "error");
    }
  };

  const handleExportUsers = async () => {
    try {
      const data = await exportUsersMutation.mutateAsync();
      downloadJson(data, `users-export-${new Date().toISOString().split("T")[0]}.json`);
      addToast(`Exported ${data.count} users`, "success");
    } catch {
      addToast("Failed to export users", "error");
    }
  };

  const handleExportStats = async () => {
    try {
      const data = await exportStatsMutation.mutateAsync();
      downloadJson(data, `statistics-export-${new Date().toISOString().split("T")[0]}.json`);
      addToast("Statistics exported successfully", "success");
    } catch {
      addToast("Failed to export statistics", "error");
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.matches || !Array.isArray(data.matches)) {
        setImportResult({ ok: false, message: "Invalid file format — expected { matches: [...] }" });
        addToast("Invalid file format - expected { matches: [...] }", "error");
        return;
      }

      const result = await importMatchesMutation.mutateAsync({ matches: data.matches });
      const message = `Imported ${result.imported} matches (${result.skipped} skipped)`;
      setImportResult({ ok: true, message });
      addToast(message, "success");
    } catch {
      setImportResult({ ok: false, message: "Failed to import matches" });
      addToast("Failed to import matches", "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBulkUrlImport = async () => {
    const urls = urlInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      addToast("Please enter at least one URL", "error");
      return;
    }

    try {
      const result = await importUrlsMutation.mutateAsync({ urls });
      const message = `Resolved ${result.resolved} songs from ${urls.length} URLs`;
      setImportResult({ ok: true, message });
      addToast(message, "success");
      setUrlInput("");
    } catch {
      setImportResult({ ok: false, message: "Failed to import URLs" });
      addToast("Failed to import URLs", "error");
    }
  };

  const handlePurgePreview = async () => {
    try {
      const result = await purgeMutation.mutateAsync(false);
      setPurgePreview({
        pending: result.pending_matches || 0,
        rejected: result.rejected_matches || 0,
      });
    } catch {
      addToast("Failed to get purge preview", "error");
    }
  };

  const handlePurgeConfirm = async () => {
    try {
      const result = await purgeMutation.mutateAsync(true);
      addToast(`Purged ${result.deleted} unverified matches`, "success");
      setPurgePreview(null);
    } catch {
      addToast("Failed to purge matches", "error");
    }
  };

  const handleResetPreview = async () => {
    try {
      const result = await resetMutation.mutateAsync("");
      setResetPreview({
        entities: result.entities_to_delete || 0,
        relations: result.relations_to_delete || 0,
      });
    } catch {
      addToast("Failed to get reset preview", "error");
    }
  };

  const handleResetConfirm = async () => {
    if (confirmReset !== "RESET") {
      addToast('Type "RESET" to confirm', "error");
      return;
    }
    try {
      await resetMutation.mutateAsync("RESET");
      addToast("Database reset complete", "success");
      setResetPreview(null);
      setConfirmReset("");
    } catch {
      addToast("Failed to reset database", "error");
    }
  };

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Import / export
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage data operations.</p>
      </header>

      {/* Export */}
      <Section title="Export data" description="Download data for backup or migration. All exports are JSON.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tool title="Matches" description="Export matches filtered by status.">
            <div className="flex gap-2">
              <Select
                options={[
                  { value: "", label: "Verified (default)" },
                  { value: "pending", label: "Pending" },
                  { value: "rejected", label: "Rejected" },
                ]}
                value={matchExportStatus}
                onChange={(e) => setMatchExportStatus(e.target.value as MatchStatus | "")}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportMatches}
                isLoading={exportMatchesMutation.isPending}
              >
                <Download className="size-4" />
                Export
              </Button>
            </div>
          </Tool>

          <Tool title="Users" description="Export user data (no emails or passwords).">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportUsers}
              isLoading={exportUsersMutation.isPending}
            >
              <Download className="size-4" />
              Export users
            </Button>
          </Tool>

          <Tool title="Statistics" description="Export analytics and statistics.">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportStats}
              isLoading={exportStatsMutation.isPending}
            >
              <Download className="size-4" />
              Export stats
            </Button>
          </Tool>
        </div>
      </Section>

      {/* Import */}
      <Section title="Import data" description="Import data from backups or other sources.">
        {importResult && (
          <Alert variant={importResult.ok ? "default" : "destructive"} className="mb-3">
            <AlertTitle>{importResult.ok ? "Import complete" : "Import failed"}</AlertTitle>
            <AlertDescription>{importResult.message}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Tool title="Matches" description="Import matches from a JSON file.">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              id="match-file-input"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={importMatchesMutation.isPending}
            >
              <Upload className="size-4" />
              Choose file
            </Button>
          </Tool>

          <Tool title="Bulk URLs" description="Import songs from a URL list (one per line).">
            <Textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={"https://open.spotify.com/track/…\nhttps://open.spotify.com/album/…"}
              rows={4}
              className="mb-3 resize-none font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUrlImport}
              isLoading={importUrlsMutation.isPending}
              disabled={!urlInput.trim()}
            >
              Queue import
            </Button>
          </Tool>
        </div>
      </Section>

      {/* Danger zone */}
      <Section
        title="Danger zone"
        description="These actions are irreversible. Proceed with caution."
        danger
      >
        <div className="space-y-3">
          {/* Purge unverified */}
          <Tool
            title="Purge unverified matches"
            description="Delete all pending and rejected matches. Verified matches remain."
            danger
          >
            {purgePreview && (
              <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
                  <TriangleAlert className="size-4" />
                  Deletion preview
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Pending" value={purgePreview.pending} tone="warning" />
                  <Stat label="Rejected" value={purgePreview.rejected} tone="destructive" />
                  <Stat
                    label="Total"
                    value={purgePreview.pending + purgePreview.rejected}
                    tone="destructive"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              {!purgePreview ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePurgePreview}
                  isLoading={purgeMutation.isPending}
                >
                  Preview
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setPurgePreview(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handlePurgeConfirm}
                    isLoading={purgeMutation.isPending}
                  >
                    Confirm purge
                  </Button>
                </>
              )}
            </div>
          </Tool>

          {/* Reset database */}
          <Tool
            title="Reset database"
            description="Delete ALL songs, artists, albums, playlists, and matches. Users are preserved."
            danger
          >
            {resetPreview && (
              <div className="mb-3 space-y-3">
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
                    <TriangleAlert className="size-4" />
                    Deletion preview
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Entities" value={resetPreview.entities} tone="destructive" />
                    <Stat label="Relations" value={resetPreview.relations} tone="destructive" />
                  </div>
                  <p className="mt-2 text-center text-xs text-faint">
                    + all related artists, albums, and playlists
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder='Type "RESET" to confirm'
                    value={confirmReset}
                    onChange={(e) => setConfirmReset(e.target.value.toUpperCase())}
                    className="w-48 font-mono"
                  />
                  {confirmReset === "RESET" && <Check className="size-5 text-success" />}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              {!resetPreview ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPreview}
                  isLoading={resetMutation.isPending}
                >
                  Preview
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResetPreview(null);
                      setConfirmReset("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleResetConfirm}
                    isLoading={resetMutation.isPending}
                    disabled={confirmReset !== "RESET"}
                  >
                    Reset database
                  </Button>
                </>
              )}
            </div>
          </Tool>
        </div>
      </Section>
    </motion.div>
  );
}
