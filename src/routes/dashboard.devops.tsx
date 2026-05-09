import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { pipelineRuns, dockerDeployments } from "@/lib/mock-data";
import { Boxes, CheckCircle2, XCircle, Loader2, Clock, Container, Activity, Terminal } from "lucide-react";

export const Route = createFileRoute("/dashboard/devops")({
  head: () => ({ meta: [{ title: "DevOps CI/CD — VersaVault" }] }),
  component: Devops,
});

const summary = [
  { label: "Pipelines today", value: "37", sub: "32 success · 3 failed · 2 running", icon: Activity },
  { label: "Avg duration", value: "3m 42s", sub: "↓ 12% vs last week", icon: Clock },
  { label: "Success rate", value: "94.5%", sub: "rolling 7 days", icon: CheckCircle2 },
  { label: "Active deploys", value: "12", sub: "across 4 environments", icon: Container },
];

function Devops() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
          <Boxes className="w-5 h-5 text-primary-foreground" />
        </span>
        DevOps & CI/CD
      </h1>
      <p className="text-muted-foreground mt-1">Live view of every pipeline run and Docker deployment, tied to the artifacts they ship.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {summary.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Pipelines */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Jenkins pipelines</h2>
              <p className="text-xs text-muted-foreground">Recent runs across services</p>
            </div>
            <Badge variant="info">live</Badge>
          </div>
          <ul className="divide-y divide-border">
            {pipelineRuns.map(p => (
              <li key={p.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition-smooth">
                <PipelineStatusIcon status={p.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{p.pipeline}</span>
                    <span className="text-xs text-muted-foreground font-mono">#{p.id.replace("p", "48")}</span>
                    <Badge variant={p.status}>{p.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">{p.branch} · {p.commit} · {p.author}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground hidden sm:block">
                  <div>{p.duration}</div>
                  <div>{p.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Deployment timeline</h2>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </div>
          <ol className="p-4 relative pl-8 before:absolute before:left-5 before:top-4 before:bottom-4 before:w-px before:bg-border">
            {[
              { t: "12 min ago", c: "service-api 2.3.4 → production", v: "success" as const },
              { t: "1h ago", c: "worker 1.7.2 → staging", v: "running" as const },
              { t: "3h ago", c: "web-frontend 5.1.0 → production", v: "success" as const },
              { t: "5h ago", c: "ml-inference 0.9.1 → staging", v: "failed" as const },
              { t: "yesterday", c: "service-api 2.3.3 → production", v: "success" as const },
            ].map((e, i) => (
              <li key={i} className="relative pb-4 last:pb-0">
                <span className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full ${
                  e.v === "success" ? "bg-success" : e.v === "failed" ? "bg-destructive" : "bg-info animate-pulse"
                }`} />
                <div className="text-sm">{e.c}</div>
                <div className="text-xs text-muted-foreground">{e.t}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Docker */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2"><Container className="w-4 h-4" /> Docker deployments</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {dockerDeployments.map(d => (
            <div key={d.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{d.service}</span>
                <Badge variant={d.status === "healthy" ? "success" : d.status === "degraded" ? "risky" : "running"}>{d.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2 font-mono truncate">{d.image}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div><div className="text-muted-foreground">Env</div><div className="font-medium">{d.env}</div></div>
                <div><div className="text-muted-foreground">Replicas</div><div className="font-medium">{d.replicas}</div></div>
                <div><div className="text-muted-foreground">Uptime</div><div className="font-medium">{d.uptime}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Terminal className="w-4 h-4" /> Logs preview · service-api #4821</h2>
          <Badge variant="success">success</Badge>
        </div>
        <pre className="bg-sidebar text-sidebar-foreground text-xs font-mono p-5 overflow-x-auto leading-6">
{`[10:14:02] Starting pipeline service-api on main
[10:14:03] ▶ Step 1/5 — Checkout (a3f9d2c)
[10:14:08] ✓ Checkout complete
[10:14:09] ▶ Step 2/5 — Install dependencies
[10:14:42] ✓ 1284 packages installed
[10:14:43] ▶ Step 3/5 — Lint & test
[10:15:31] ✓ 482 tests passed (0 failed)
[10:15:32] ▶ Step 4/5 — Build Docker image
[10:17:04] ✓ Image app:2.3.4 built (412 MB)
[10:17:05] ▶ Step 5/5 — Deploy to production
[10:18:12] ✓ Deployed 8/8 replicas · canary OK
[10:18:14] ✔ Pipeline succeeded in 4m 12s`}
        </pre>
      </div>
    </DashboardLayout>
  );
}

function PipelineStatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="w-5 h-5 text-success shrink-0" />;
  if (status === "failed") return <XCircle className="w-5 h-5 text-destructive shrink-0" />;
  if (status === "running") return <Loader2 className="w-5 h-5 text-info animate-spin shrink-0" />;
  return <Clock className="w-5 h-5 text-muted-foreground shrink-0" />;
}
