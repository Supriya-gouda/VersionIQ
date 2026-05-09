import { createFileRoute, Link } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import { mockFiles, recentActivity, pipelineRuns } from "@/lib/mock-data";
import { Files, GitBranch, Share2, ShieldCheck, Upload, RotateCcw, Sparkles, Hammer, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — VersaVault" }] }),
  component: Dashboard,
});

const stats = [
  { label: "Total files", value: "248", delta: "+12", icon: Files, tone: "text-primary bg-primary/10" },
  { label: "Versions", value: "1,924", delta: "+86", icon: GitBranch, tone: "text-info bg-info/10" },
  { label: "Shared files", value: "42", delta: "+4", icon: Share2, tone: "text-warning bg-warning/15" },
  { label: "Stable releases", value: "98.4%", delta: "+0.6%", icon: ShieldCheck, tone: "text-success bg-success/10" },
];

const iconMap = { upload: Upload, rollback: RotateCcw, share: Share2, ai: Sparkles, build: Hammer };

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, Aarav</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your workspace.</p>
        </div>
        <Link to="/dashboard/files" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 transition-smooth text-sm font-medium">
          <Upload className="w-4 h-4" /> Upload file
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elegant transition-smooth">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg grid place-items-center ${s.tone}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</div>
              <div className="mt-1 text-xs text-success flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> {s.delta} this week
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Recent files */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Recent files</h2>
            <Link to="/dashboard/files" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border">
            {mockFiles.slice(0, 4).map(f => (
              <li key={f.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-smooth">
                <FileIcon type={f.type} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.size} · updated {f.updated} · {f.versions.length} versions</div>
                </div>
                <Badge variant={f.versions[0].status}>{f.versions[0].status}</Badge>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          <ul className="p-2">
            {recentActivity.map(a => {
              const Icon = iconMap[a.icon as keyof typeof iconMap];
              return (
                <li key={a.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth">
                  <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center shrink-0">
                    <Icon className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm">{a.text}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.time}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Pipelines preview */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Pipelines</h2>
          <Link to="/dashboard/devops" className="text-sm text-primary hover:underline">Open CI/CD</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {pipelineRuns.slice(0, 3).map(p => (
            <div key={p.id} className="rounded-lg border border-border p-4 hover:shadow-card transition-smooth">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{p.pipeline}</div>
                <Badge variant={p.status}>{p.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2 font-mono">{p.branch} · {p.commit}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.duration} · {p.time}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
