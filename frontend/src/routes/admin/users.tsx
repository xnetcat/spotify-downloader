import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useAdminUsers, useUpdateAdminUser } from "@/api";
import {
  Badge,
  Button,
  Input,
  Select,
  Spinner,
  Alert,
  AlertTitle,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import type { AdminUserListRequest } from "@/types";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

const TH = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-faint";

function AdminUsersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToast();

  const [filters, setFilters] = useState<AdminUserListRequest>({
    page: 1,
    per_page: 20,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, error } = useAdminUsers(filters);
  const updateUserMutation = useUpdateAdminUser();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    } else if (user && !user.is_admin) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  };

  const handleToggleAdmin = async (userId: string, currentValue: boolean) => {
    try {
      await updateUserMutation.mutateAsync({ userId, data: { is_admin: !currentValue } });
      addToast(`User ${currentValue ? "demoted from" : "promoted to"} admin`, "success");
    } catch {
      addToast("Failed to update user", "error");
    }
  };

  const handleToggleActive = async (userId: string, currentValue: boolean) => {
    try {
      await updateUserMutation.mutateAsync({ userId, data: { is_active: !currentValue } });
      addToast(`User ${currentValue ? "disabled" : "enabled"}`, "success");
    } catch {
      addToast("Failed to update user", "error");
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
      className="space-y-6"
    >
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          User management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{data?.total || 0}</span> total
          users
        </p>
      </header>

      {/* Toolbar */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input
            type="text"
            placeholder="Search username or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: "", label: "All users" },
            { value: "true", label: "Admins only" },
            { value: "false", label: "Non-admins" },
          ]}
          value={filters.is_admin?.toString() || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              is_admin: e.target.value ? e.target.value === "true" : undefined,
              page: 1,
            }))
          }
          className="w-36"
        />
        <Select
          options={[
            { value: "", label: "All status" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
          value={filters.is_active?.toString() || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              is_active: e.target.value ? e.target.value === "true" : undefined,
              page: 1,
            }))
          }
          className="w-36"
        />
        <Select
          options={[
            { value: "created_at", label: "Join date" },
            { value: "username", label: "Username" },
            { value: "reputation_score", label: "Reputation" },
          ]}
          value={filters.sort_by || "created_at"}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sort_by: e.target.value as AdminUserListRequest["sort_by"] }))
          }
          className="w-36"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load users</AlertTitle>
        </Alert>
      )}

      {!isLoading && !error && data && data.users.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface">
                <tr className="border-b border-border">
                  <th className={TH}>User</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Reputation</th>
                  <th className={TH}>Activity</th>
                  <th className={TH}>Joined</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-t border-border transition-colors hover:bg-elevated/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-md bg-elevated font-mono text-sm font-semibold text-foreground">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{u.username}</p>
                          <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.is_admin && <Badge variant="warning" size="sm">Admin</Badge>}
                        <Badge variant={u.is_active ? "success" : "error"} size="sm">
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono tabular-nums text-foreground">
                        {u.reputation_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <p>{u.matches_submitted} matches</p>
                      <p>{u.votes_cast} votes</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {u.id !== user.id ? (
                          <>
                            <Button
                              size="sm"
                              variant={u.is_admin ? "outline" : "secondary"}
                              onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                              isLoading={updateUserMutation.isPending}
                            >
                              {u.is_admin ? "Remove admin" : "Make admin"}
                            </Button>
                            <Button
                              size="sm"
                              variant={u.is_active ? "ghost" : "primary"}
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                              isLoading={updateUserMutation.isPending}
                            >
                              {u.is_active ? "Disable" : "Enable"}
                            </Button>
                          </>
                        ) : (
                          <Badge variant="muted" size="sm">You</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
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

      {!isLoading && !error && data?.users.length === 0 && (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No users found
        </div>
      )}
    </motion.div>
  );
}
