import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useReportsList, useUpdateReport } from "@/api";
import { Card, Badge, Button, Select, Spinner, Alert, AlertTitle } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import type { MetadataReportStatus, MetadataReportEntityType } from "@/types";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToast();

  const [filters, setFilters] = useState<{
    page: number;
    page_size: number;
    status?: MetadataReportStatus;
    entity_type?: MetadataReportEntityType;
  }>({ page: 1, page_size: 20 });

  const { data, isLoading, error } = useReportsList(
    filters.page,
    filters.page_size,
    filters.status,
    filters.entity_type
  );
  const updateReportMutation = useUpdateReport();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    } else if (user && !user.is_admin) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user, navigate]);

  const handleUpdateStatus = async (reportId: string, status: MetadataReportStatus) => {
    try {
      await updateReportMutation.mutateAsync({ reportId, request: { status } });
      addToast(`Report marked as ${status}`, "success");
    } catch {
      addToast("Failed to update report", "error");
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
      case "fixed":
        return <Badge variant="success" size="sm">Fixed</Badge>;
      case "dismissed":
        return <Badge variant="error" size="sm">Dismissed</Badge>;
      case "reviewed":
        return <Badge variant="info" size="sm">Reviewed</Badge>;
      default:
        return <Badge variant="warning" size="sm">Pending</Badge>;
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Metadata reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{data?.total || 0}</span> total
          reports
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          options={[
            { value: "", label: "All status" },
            { value: "pending", label: "Pending" },
            { value: "reviewed", label: "Reviewed" },
            { value: "fixed", label: "Fixed" },
            { value: "dismissed", label: "Dismissed" },
          ]}
          value={filters.status || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: (e.target.value as MetadataReportStatus) || undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
        <Select
          options={[
            { value: "", label: "All types" },
            { value: "song", label: "Songs" },
            { value: "artist", label: "Artists" },
            { value: "album", label: "Albums" },
            { value: "playlist", label: "Playlists" },
          ]}
          value={filters.entity_type || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              entity_type: (e.target.value as MetadataReportEntityType) || undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load reports</AlertTitle>
        </Alert>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-3">
          {data.reports.map((report) => (
            <Card key={report.id}>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {getStatusBadge(report.status)}
                    <Badge variant="muted" size="sm">
                      {report.entity_type}
                    </Badge>
                    <span className="font-mono text-xs tabular-nums text-faint">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-muted-foreground">
                    Field:{" "}
                    <span className="font-mono text-foreground">{report.field_name}</span>
                  </p>

                  <div className="mb-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-destructive">
                        Current value
                      </p>
                      <p className="break-words text-sm text-foreground">
                        {report.current_value || "(empty)"}
                      </p>
                    </div>
                    <div className="rounded-md border border-success/20 bg-success/10 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-success">
                        Suggested value
                      </p>
                      <p className="break-words text-sm text-foreground">
                        {report.suggested_value || "(empty)"}
                      </p>
                    </div>
                  </div>

                  {report.description && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-faint">
                        Description
                      </p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Reported by{" "}
                    <span className="text-foreground">
                      {report.reporter_username || report.reporter_id}
                    </span>
                    {report.reviewed_by_username && (
                      <>
                        {" "}| Reviewed by{" "}
                        <span className="text-foreground">{report.reviewed_by_username}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  {report.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateStatus(report.id, "fixed")}
                        isLoading={updateReportMutation.isPending}
                      >
                        <Check className="size-4" />
                        Mark fixed
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateStatus(report.id, "reviewed")}
                        isLoading={updateReportMutation.isPending}
                      >
                        Mark reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(report.id, "dismissed")}
                        isLoading={updateReportMutation.isPending}
                      >
                        Dismiss
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateStatus(report.id, "pending")}
                      isLoading={updateReportMutation.isPending}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {data.total > data.page_size && (
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                Page {data.page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page >= totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && data?.reports.length === 0 && (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No reports found
        </div>
      )}
    </motion.div>
  );
}
