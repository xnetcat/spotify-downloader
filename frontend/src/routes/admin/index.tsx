import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  GitCompareArrows,
  Flag,
  DatabaseZap,
  Activity,
  ShieldCheck,
  Music,
  Disc3,
  ListMusic,
  Mic2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useSystemStats } from "@/api";
import { Card, Badge, Spinner, Alert, AlertTitle, AlertDescription } from "@/components/ui";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

const QUICK_LINKS = [
  { to: "/admin/users", icon: Users, label: "Users", hint: "Manage accounts" },
  { to: "/admin/matches", icon: GitCompareArrows, label: "Matches", hint: "Moderate matches" },
  { to: "/admin/reports", icon: Flag, label: "Reports", hint: "Review metadata" },
  { to: "/admin/import", icon: DatabaseZap, label: "Import/Export", hint: "Manage data" },
] as const;

function ActivityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { data: stats, isLoading, error } = useSystemStats();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    } else if (user && !user.is_admin) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertTitle>Failed to load dashboard</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "An error occurred"}
        </AlertDescription>
      </Alert>
    );
  }

  const uptime = stats?.uptime_seconds ?? 0;
  const uptimeLabel = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users, matches, and system settings.
          </p>
        </div>
        <Badge variant="warning">
          <ShieldCheck className="size-4" />
          Admin only
        </Badge>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {QUICK_LINKS.map(({ to, icon: Icon, label, hint }) => (
          <Link key={to} to={to}>
            <Card hover className="h-full">
              <Icon className="size-5 text-primary" />
              <h3 className="mt-3 font-medium text-foreground">{label}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-faint">
          Database overview
        </h2>
        <StatCardGrid columns={3}>
          <StatCard
            label="Songs"
            value={formatNumber(stats?.entities.songs || 0)}
            icon={<Music className="size-4" />}
            variant="success"
            trend={
              stats?.growth.entities_this_week
                ? { value: stats.growth.entities_this_week, label: "this week" }
                : undefined
            }
          />
          <StatCard
            label="Artists"
            value={formatNumber(stats?.entities.artists || 0)}
            icon={<Mic2 className="size-4" />}
            variant="warning"
          />
          <StatCard
            label="Albums"
            value={formatNumber(stats?.entities.albums || 0)}
            icon={<Disc3 className="size-4" />}
            variant="info"
          />
          <StatCard
            label="Playlists"
            value={formatNumber(stats?.entities.playlists || 0)}
            icon={<ListMusic className="size-4" />}
            variant="default"
          />
          <StatCard
            label="Matches"
            value={formatNumber(stats?.entities.relations || 0)}
            icon={<GitCompareArrows className="size-4" />}
            variant="default"
            trend={
              stats?.growth.relations_this_week
                ? { value: stats.growth.relations_this_week, label: "this week" }
                : undefined
            }
          />
          <StatCard
            label="Users"
            value={formatNumber(stats?.entities.users || 0)}
            icon={<Users className="size-4" />}
            variant="success"
            trend={
              stats?.growth.new_users_this_week
                ? { value: stats.growth.new_users_this_week, label: "this week" }
                : undefined
            }
          />
        </StatCardGrid>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-4 text-success" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-faint">
              Today's activity
            </h2>
          </div>
          <div className="space-y-3">
            <ActivityRow label="New songs" value={`+${stats?.growth.entities_today || 0}`} />
            <ActivityRow label="New matches" value={`+${stats?.growth.relations_today || 0}`} />
            <ActivityRow label="New users" value={`+${stats?.growth.new_users_today || 0}`} />
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-4 text-info" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-faint">
              System status
            </h2>
          </div>
          <div className="space-y-3">
            <ActivityRow label="Uptime" value={uptimeLabel} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API status</span>
              <Badge variant="success">Online</Badge>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
