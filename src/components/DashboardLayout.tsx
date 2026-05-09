import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard, Files, GitBranch, Sparkles, ShieldCheck, Boxes,
  Settings, Search, Bell, Menu, X, GitMerge,
} from "lucide-react";

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
              <div className="h-full bg-gradient-primary" style={{ width: "62%" }} />
            </div>
            <div className="text-xs mt-2 text-sidebar-foreground/70">6.2 GB of 10 GB used</div>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
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
          <button className="p-2 rounded-lg hover:bg-muted relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-sm font-semibold">
            AS
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
