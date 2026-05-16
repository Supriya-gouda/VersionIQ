import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Files,
  GitBranch,
  Sparkles,
  ShieldCheck,
  Boxes,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  GitMerge,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Upload,
  RotateCcw,
  Trash2,
  Share2,
} from "lucide-react";
import { getQuota, listActivities, type ApiQuota, type ApiActivity } from "@/lib/api";
import { useAuth } from "./AuthContext";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/files", label: "Files", icon: Files },
  { to: "/dashboard/versions", label: "Versions", icon: GitBranch },
  { to: "/dashboard/ai-summary", label: "AI Summary", icon: Sparkles },
  { to: "/dashboard/rollback", label: "Smart Rollback", icon: ShieldCheck },
  { to: "/dashboard/devops", label: "DevOps CI/CD", icon: Boxes },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [quota, setQuota] = useState<ApiQuota | null>(null);
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    getQuota()
      .then((res) => setQuota(res.quota))
      .catch((err) => console.error("Failed to load quota", err));

    listActivities()
      .then((res) => setActivities(res.activities))
      .catch((err) => console.error("Failed to load activities", err));
  }, [path]); // Refresh on navigation

  const usedGb = quota ? (quota.used / 1024 ** 3).toFixed(1) : "0.0";
  const limitGb = quota ? (quota.limit / 1024 ** 3).toFixed(0) : "10";
  const percent = quota ? quota.percent : 0;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
        return <Upload className="w-3.5 h-3.5 text-blue-500" />;
      case "restore":
        return <RotateCcw className="w-3.5 h-3.5 text-green-500" />;
      case "delete":
        return <Trash2 className="w-3.5 h-3.5 text-destructive" />;
      case "share_toggle":
        return <Share2 className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-elegant">
            <GitMerge className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg">VersaVault</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((n) => {
            const active = path === n.to || (n.to !== "/dashboard" && path.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-smooth ${
                  active
                    ? "bg-sidebar-accent text-white shadow-elegant"
                    : "hover:bg-sidebar-accent/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-lg p-3 bg-sidebar-accent/50">
            <div className="text-xs text-sidebar-foreground/70 mb-1">Storage</div>
            <div className="h-1.5 rounded-full bg-sidebar-border overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-smooth"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-xs mt-2 text-sidebar-foreground/70">
              {usedGb} GB of {limitGb} GB used
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 sticky top-0 z-20 glass border-b border-border flex items-center gap-3 px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1 max-w-xl relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search files, versions, pipelines..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring focus:outline-none text-sm transition-smooth"
            />
          </div>
          {/* Notifications Menu */}
          <div className="relative">
            <button
              onClick={() => setNotifsOpen(!notifsOpen)}
              className="p-2 rounded-lg hover:bg-muted relative transition-smooth"
              aria-label="Notifications"
            >
              <Bell className={`w-5 h-5 transition-colors ${notifsOpen ? "text-primary" : ""}`} />
              {activities.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-background animate-in zoom-in duration-300" />
              )}
            </button>

            {notifsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifsOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-elegant z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifications</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase text-muted-foreground tracking-wider">
                      {activities.length} New
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {activities.length === 0 ? (
                      <div className="p-10 text-center">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-20">
                          <Bell className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-muted-foreground italic">No new notifications</p>
                      </div>
                    ) : (
                      activities.map((notif) => (
                        <div
                          key={notif._id}
                          className="p-4 border-b border-border/50 hover:bg-muted/30 transition-smooth cursor-pointer group"
                        >
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              {getActivityIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate leading-none mb-1.5">
                                {notif.fileName}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                                {notif.details}
                              </div>
                              <div className="text-[10px] text-muted-foreground/60 font-medium">
                                {formatTime(notif.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-muted/30 border-t border-border">
                    <Link
                      to="/dashboard"
                      onClick={() => setNotifsOpen(false)}
                      className="block w-full py-2 text-center text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-smooth uppercase tracking-wider"
                    >
                      View All Activity
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-smooth"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-sm font-semibold shadow-elegant">
                {initials}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-elegant z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="font-semibold text-sm truncate">
                      {user?.name || "Guest User"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user?.email || "No email provided"}
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-smooth"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-smooth"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
