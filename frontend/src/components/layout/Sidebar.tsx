import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  ArrowDownToLine,
  Settings,
  ShieldCheck,
  LogIn,
  LogOut,
  UserRound,
  ChevronsUpDown,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config";
import { useAuthStore } from "@/stores/auth";
import { useLogout } from "@/api/auth";
import { useDevConfig } from "@/contexts/DevConfigContext";
import { useSettingsStore } from "@/stores/settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  adminOnly?: boolean;
  requiresAuth?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface SidebarProps {
  queueCount?: number;
}

/** Wordmark: three meter cells + spotDL in the display face. */
function Wordmark({ expanded }: { expanded: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="spotDL home">
      <span className="flex size-8 shrink-0 items-end justify-center gap-[3px] rounded-md bg-primary p-[7px]">
        <span className="w-[3px] h-2/5 rounded-[1px] bg-primary-foreground/80" />
        <span className="w-[3px] h-full rounded-[1px] bg-primary-foreground" />
        <span className="w-[3px] h-3/5 rounded-[1px] bg-primary-foreground/80" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight whitespace-nowrap transition-opacity duration-200",
          expanded ? "opacity-100" : "opacity-0"
        )}
      >
        spot<span className="text-primary">DL</span>
      </span>
    </Link>
  );
}

export function Sidebar({ queueCount = 0 }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { features } = useDevConfig();
  const logoutMutation = useLogout();
  const compactSidebar = useSettingsStore((s) => s.compactSidebar);

  const expanded = isMobileOpen || (isHovered && !compactSidebar);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate({ to: "/auth/login" });
  };

  const groups: NavGroup[] = [
    {
      label: "Discover",
      items: [{ to: "/", label: "Home", icon: <Home className="size-5" /> }],
    },
    {
      label: "Library",
      items: features.hasQueue
        ? [
            {
              to: "/queue",
              label: "Queue",
              icon: <ArrowDownToLine className="size-5" />,
              badge: queueCount > 0 ? queueCount : undefined,
              requiresAuth: true,
            },
          ]
        : [],
    },
    {
      label: "System",
      items: [
        ...(features.hasDownloadSettings
          ? [
              {
                to: "/settings",
                label: "Settings",
                icon: <Settings className="size-5" />,
                requiresAuth: true,
              },
            ]
          : []),
        {
          to: "/admin",
          label: "Admin",
          icon: <ShieldCheck className="size-5" />,
          adminOnly: true,
        },
      ],
    },
  ];

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.adminOnly && !user?.is_admin) return false;
        if (item.requiresAuth && !isAuthenticated) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "transition-[width,transform] duration-200 ease-out",
          expanded ? "w-60" : "w-16",
          "md:translate-x-0",
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Wordmark */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Wordmark expanded={expanded} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p
                className={cn(
                  "px-2 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-faint whitespace-nowrap",
                  "transition-opacity duration-200",
                  expanded ? "opacity-100" : "opacity-0"
                )}
                aria-hidden={!expanded}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-1 py-1.5 transition-colors",
                      isActive(item.to)
                        ? "bg-sidebar-accent text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center">
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "flex-1 whitespace-nowrap text-sm font-medium transition-opacity duration-200",
                        expanded ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {item.label}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={cn(
                          "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5",
                          "font-mono text-[11px] font-semibold text-primary-foreground tnum",
                          "transition-opacity duration-200",
                          expanded ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: version + user */}
        <div className="border-t border-sidebar-border">
          <p
            className={cn(
              "px-4 pt-3 font-mono text-[10px] text-faint whitespace-nowrap transition-opacity duration-200",
              expanded ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!expanded}
          >
            v{config.version}
          </p>
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex w-full items-center px-4 py-3 text-left transition-colors",
                    "hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-elevated font-mono text-xs font-semibold text-primary">
                    {user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      "ml-3 min-w-0 flex-1 transition-opacity duration-200",
                      expanded ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <span className="block truncate text-sm font-medium">{user.username}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                  <ChevronsUpDown
                    className={cn(
                      "ml-2 size-4 shrink-0 text-faint transition-opacity duration-200",
                      expanded ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <UserRound className="size-4" />
                    Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={logoutMutation.isPending}
                  onSelect={() => void handleLogout()}
                >
                  <LogOut className="size-4" />
                  {logoutMutation.isPending ? "Logging out…" : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth/login"
              className="flex items-center px-4 py-3 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-elevated">
                <LogIn className="size-4" />
              </span>
              <span
                className={cn(
                  "ml-3 whitespace-nowrap text-sm font-medium transition-opacity duration-200",
                  expanded ? "opacity-100" : "opacity-0"
                )}
              >
                Sign in
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation"
        className={cn(
          "fixed bottom-6 left-6 z-40 flex size-12 items-center justify-center rounded-md md:hidden",
          "bg-primary text-primary-foreground shadow-lg active:translate-y-px"
        )}
      >
        <Menu className="size-5" />
      </button>

      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation"
          className="fixed right-4 top-4 z-50 flex size-10 items-center justify-center rounded-md bg-elevated text-muted-foreground md:hidden"
        >
          <X className="size-5" />
        </button>
      )}
    </>
  );
}

export default Sidebar;
