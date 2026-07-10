import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useAdminMatches, useUpdateMatchStatus, type MatchStatus } from "@/api";
import { Card, Badge, Button, Select, Spinner, Alert, AlertTitle } from "@/components/ui";
import { MatchScoreGauge } from "@/components/ui/match-gauge";
import { useToast } from "@/components/ui/toast";
import type { AdminMatchListRequest } from "@/types";

export const Route = createFileRoute("/admin/matches")({
  component: AdminMatchesPage,
});

function AdminMatchesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToast();

  const [filters, setFilters] = useState<AdminMatchListRequest>({ page: 1, per_page: 20 });

  const { data, isLoading, error } = useAdminMatches(filters);
  const updateStatusMutation = useUpdateMatchStatus();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    } else if (user && !user.is_admin) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user, navigate]);

  const handleUpdateStatus = async (matchId: string, status: MatchStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ matchId, data: { status } });
      addToast(
        `Match ${status}`,
        status === "verified" ? "success" : status === "rejected" ? "error" : "info"
      );
    } catch {
      addToast("Failed to update match", "error");
    }
  };

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success" size="sm">Verified</Badge>;
      case "rejected":
        return <Badge variant="error" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="warning" size="sm">Pending</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Match moderation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{data?.total || 0}</span> total
          matches
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          options={[
            { value: "", label: "All status" },
            { value: "pending", label: "Pending" },
            { value: "verified", label: "Verified" },
            { value: "rejected", label: "Rejected" },
          ]}
          value={filters.status || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: (e.target.value as MatchStatus) || undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
        <Select
          options={[
            { value: "", label: "All types" },
            { value: "system", label: "System" },
            { value: "user", label: "User submitted" },
          ]}
          value={filters.match_type || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              match_type: (e.target.value as "system" | "user") || undefined,
              page: 1,
            }))
          }
          className="w-44"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load matches</AlertTitle>
        </Alert>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-3">
          {data.matches.map((match) => (
            <Card key={match.id}>
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <MatchScoreGauge score={match.score || 0} size="md" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {getStatusBadge(match.status || "pending")}
                    <Badge variant="muted" size="sm">
                      {match.match_type}
                    </Badge>
                    <span className="font-mono text-xs tabular-nums text-faint">
                      {match.created_at ? new Date(match.created_at).toLocaleString() : "Unknown"}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-faint">
                      Source ({match.source_platform})
                    </p>
                    <a
                      href={match.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-foreground hover:text-info"
                    >
                      {match.source_url}
                    </a>
                  </div>

                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-faint">
                      Target ({match.target_platform})
                    </p>
                    <a
                      href={match.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-foreground hover:text-info"
                    >
                      {match.target_url}
                    </a>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-success">+{match.upvotes}</span>
                      <span className="text-faint">/</span>
                      <span className="text-destructive">-{match.downvotes}</span>
                    </div>
                    {match.discovered_by && (
                      <span className="text-muted-foreground">
                        by <span className="text-foreground">{match.discovered_by}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  {match.status !== "verified" && match.id && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(match.id!, "verified")}
                      isLoading={updateStatusMutation.isPending}
                    >
                      <Check className="size-4" />
                      Verify
                    </Button>
                  )}
                  {match.status !== "rejected" && match.id && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleUpdateStatus(match.id!, "rejected")}
                      isLoading={updateStatusMutation.isPending}
                    >
                      <X className="size-4" />
                      Reject
                    </Button>
                  )}
                  {match.status !== "pending" && match.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateStatus(match.id!, "pending")}
                      isLoading={updateStatusMutation.isPending}
                    >
                      <RotateCcw className="size-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {data.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                Page {data.page} of {data.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page >= data.total_pages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && data?.matches.length === 0 && (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No matches found
        </div>
      )}
    </motion.div>
  );
}
