import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import {
  listPipelines,
  syncPipelines,
  getPipelineStats,
  type ApiPipelineLog,
  type ApiPipelineStats,
} from "@/lib/api";
import {
  Boxes,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Container,
  Activity,
  RefreshCw,
  GitBranch,
  GitCommit,
  User,
  Timer,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/dashboard/devops")({
  head: () => ({ meta: [{ title: "DevOps CI/CD — VersionIQ" }] }),
  component: Devops,
});

// ─── Docker service definitions (static — reflects docker-compose.yml) ───────
const DOCKER_SERVICES = [
  { name: "version-vault-backend",  image: "backend:latest",      port: "4000", role: "Express API" },
  { name: "version-vault-frontend", image: "frontend:latest",     port: "3000", role: "React SPA" },
  { name: "version-vault-mongodb",  image: "mongo:7.0-alpine",    port: "27017", role: "MongoDB" },
];

// ─── CI/CD stage definitions (mirrors Jenkinsfile stages) ────────────────────
const PIPELINE_STAGES = [
  "Checkout",
  "Install Dependencies",
  "Lint & Syntax Check",
  "Tests",
  "Build",
  "Security Audit",
  "Docker: Build Images",
  "Docker: Deploy Stack",
  "Health Checks",
  "Record Pipeline Status",
];

function Devops() {
  const [pipelines, setPipelines]   = useState<ApiPipelineLog[]>([]);
  const [stats, setStats]           = useState<ApiPipelineStats | null>(null);
  const [toast, setToast]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [selectedRun, setSelectedRun] = useState<ApiPipelineLog | null>(null);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function refresh() {
    const [pipelineRes, statsRes] = await Promise.all([
      listPipelines(),
      getPipelineStats(7).catch(() => null),
    ]);
    setPipelines(pipelineRes.pipelines);
    if (statsRes) setStats(statsRes.stats);
  }

  useEffect(() => {
    refresh()
      .catch((err) => notify(err instanceof Error ? err.message : "Failed to load pipeline data"))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const success  = pipelines.filter((p) => p.status === "success").length;
    const failed   = pipelines.filter((p) => p.status === "failed").length;
    const running  = pipelines.filter((p) => p.status === "running").length;
    const avgDurS  = pipelines.length
      ? Math.round(pipelines.reduce((a, p) => a + p.durationMs, 0) / pipelines.length / 1000)
      : 0;
    const rate     = pipelines.length ? Math.round((success / pipelines.length) * 100) : 0;

    return [
      {
        label: "Total runs",
        value: String(pipelines.length),
        sub: `${success} success · ${failed} failed · ${running} running`,
        icon: Activity,
        color: "text-primary",
      },
      {
        label: "Avg duration",
        value: avgDurS >= 60 ? `${Math.floor(avgDurS / 60)}m ${avgDurS % 60}s` : `${avgDurS}s`,
        sub: "across recent builds",
        icon: Timer,
        color: "text-info",
      },
      {
        label: "Success rate",
        value: `${rate}%`,
        sub: stats ? `last 7 days · ${stats.total} runs` : "latest synced logs",
        icon: TrendingUp,
        color: rate >= 80 ? "text-success" : rate >= 50 ? "text-warning" : "text-destructive",
      },
      {
        label: "Docker services",
        value: String(DOCKER_SERVICES.length),
        sub: "backend · frontend · mongodb",
        icon: Container,
        color: "text-primary",
      },
    ];
  }, [pipelines, stats]);

  async function syncNow() {
    setSyncing(true);
    try {
      const response = await syncPipelines();
      setPipelines(response.pipelines);
      const statsRes = await getPipelineStats(7).catch(() => null);
      if (statsRes) setStats(statsRes.stats);
      notify(
        response.sync.skipped
          ? "Jenkins not configured — showing stored logs"
          : `Synced ${response.sync.synced} pipeline run${response.sync.synced !== 1 ? "s" : ""}`
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  // Build a terminal-style log from the selected run or all runs
  const logLines = useMemo(() => {
    const runs = selectedRun ? [selectedRun] : pipelines.slice(0, 10);
    return runs.map((p) => {
      const ts  = p.startedAt ? new Date(p.startedAt).toISOString() : "pending";
      const dur = p.durationMs ? `${Math.round(p.durationMs / 1000)}s` : "—";
      const icon = p.status === "success" ? "✓" : p.status === "failed" ? "✗" : "~";
      return `[${ts}] ${icon} ${p.pipeline} #${p.buildNumber}  status=${p.status}  duration=${dur}  branch=${p.branch || "main"}  commit=${p.commit?.substring(0, 8) || "n/a"}  author=${p.author || "Jenkins"}`;
    });
  }, [pipelines, selectedRun]);

  return (
    <DashboardLayout>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
              <Boxes className="w-5 h-5 text-primary-foreground" />
            </span>
            DevOps &amp; CI/CD
          </h1>
          <p className="text-muted-foreground mt-1">
            Live view of every Jenkins pipeline run and Docker deployment.
          </p>
        </div>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-elegant disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync Jenkins"}
        </button>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="mt-2 text-2xl font-semibold">{item.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Pipeline list + Deployment timeline ────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">

        {/* Pipeline runs */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Jenkins pipeline runs</h2>
              <p className="text-xs text-muted-foreground">Most recent builds — click a row to inspect</p>
            </div>
            <Badge variant="info">live</Badge>
          </div>

          {loading ? (
            <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading pipeline data…
            </div>
          ) : pipelines.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No pipeline runs yet. Click <strong>Sync Jenkins</strong> to pull from Jenkins, or push a build via the webhook.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {pipelines.map((p) => (
                <li
                  key={`${p.pipeline}-${p.buildNumber}`}
                  onClick={() => setSelectedRun(selectedRun?._id === p._id ? null : p)}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                    selectedRun?._id === p._id ? "bg-muted/60" : "hover:bg-muted/30"
                  }`}
                >
                  <PipelineStatusIcon status={p.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{p.pipeline}</span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">#{p.buildNumber}</span>
                      <Badge variant={pipelineStatusVariant(p.status)}>{p.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />{p.branch || "main"}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <GitCommit className="w-3 h-3" />{p.commit?.substring(0, 8) || "n/a"}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />{p.author || "Jenkins"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground hidden sm:block shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {p.durationMs ? `${Math.round(p.durationMs / 1000)}s` : "—"}
                    </div>
                    <div className="mt-0.5">
                      {p.startedAt ? new Date(p.startedAt).toLocaleString() : "pending"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Deployment timeline */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Deployment timeline</h2>
            <p className="text-xs text-muted-foreground">Last 5 builds</p>
          </div>
          {pipelines.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ol className="p-4 relative pl-8 before:absolute before:left-5 before:top-4 before:bottom-4 before:w-px before:bg-border">
              {pipelines.slice(0, 5).map((p) => (
                <li key={`${p.pipeline}-${p.buildNumber}`} className="relative pb-4 last:pb-0">
                  <span
                    className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-background ${
                      p.status === "success"
                        ? "bg-success"
                        : p.status === "failed"
                        ? "bg-destructive"
                        : p.status === "running"
                        ? "bg-info animate-pulse"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <div className="text-sm font-medium">
                    {p.pipeline} <span className="text-muted-foreground font-mono">#{p.buildNumber}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.startedAt ? new Date(p.startedAt).toLocaleString() : "pending"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.branch || "main"} · {p.durationMs ? `${Math.round(p.durationMs / 1000)}s` : "—"}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* ── CI/CD Pipeline stages reference ────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" /> Jenkins Pipeline Stages
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stages defined in Jenkinsfile — runs on every push
          </p>
        </div>
        <div className="p-5 flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((stage, i) => (
            <div
              key={stage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
            >
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono grid place-items-center shrink-0">
                {i + 1}
              </span>
              {stage}
            </div>
          ))}
        </div>
      </div>

      {/* ── Docker services ─────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Container className="w-4 h-4" /> Docker Services
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defined in docker-compose.yml · run <code className="font-mono">docker compose up --build -d</code>
          </p>
        </div>
        <div className="divide-y divide-border">
          {DOCKER_SERVICES.map((svc) => (
            <div key={svc.name} className="p-4 flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-success shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm font-mono">{svc.name}</div>
                <div className="text-xs text-muted-foreground">{svc.role} · {svc.image}</div>
              </div>
              <div className="text-xs text-muted-foreground font-mono shrink-0">:{svc.port}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border bg-muted/30 rounded-b-xl">
          <p className="text-xs text-muted-foreground">
            Health checks: backend <code className="font-mono">GET /health</code> · frontend <code className="font-mono">GET /</code> · mongodb <code className="font-mono">mongosh ping</code>
          </p>
        </div>
      </div>

      {/* ── Stats panel (7-day) ─────────────────────────────────────────────── */}
      {stats && (
        <div className="mt-6 rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> 7-Day Build Statistics
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 p-5">
            {[
              { label: "Total",    value: stats.total,                       color: "" },
              { label: "Success",  value: stats.success,                     color: "text-success" },
              { label: "Failed",   value: stats.failed,                      color: "text-destructive" },
              { label: "Unstable", value: stats.unstable,                    color: "text-warning" },
              { label: "Aborted",  value: stats.aborted,                     color: "text-muted-foreground" },
              { label: "Rate",     value: `${stats.successRate}%`,           color: Number(stats.successRate) >= 80 ? "text-success" : "text-warning" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          {stats.averageDurationMs > 0 && (
            <div className="px-5 pb-4 text-xs text-muted-foreground">
              Average build duration: {Math.round(stats.averageDurationMs / 1000)}s
            </div>
          )}
        </div>
      )}

      {/* ── Terminal log preview ────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" /> Pipeline log preview
            {selectedRun && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                — {selectedRun.pipeline} #{selectedRun.buildNumber}
              </span>
            )}
          </h2>
          {selectedRun && (
            <button
              onClick={() => setSelectedRun(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Show all
            </button>
          )}
        </div>
        <pre className="bg-sidebar text-sidebar-foreground text-xs font-mono p-5 overflow-x-auto leading-6 rounded-b-xl max-h-64 overflow-y-auto">
          {logLines.length > 0
            ? logLines.join("\n")
            : "No pipeline data synced yet. Click 'Sync Jenkins' or trigger a build."}
        </pre>
      </div>

      {/* ── Setup guide (shown when no data) ───────────────────────────────── */}
      {!loading && pipelines.length === 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card shadow-card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" /> Getting started with CI/CD
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Set <code className="font-mono text-foreground">JENKINS_BASE_URL</code>, <code className="font-mono text-foreground">JENKINS_USER</code>, and <code className="font-mono text-foreground">JENKINS_TOKEN</code> in <code className="font-mono text-foreground">backend/.env</code></li>
            <li>Set <code className="font-mono text-foreground">JENKINS_JOB_NAME</code> to match your Jenkins job (default: <code className="font-mono text-foreground">VersionIQ</code>)</li>
            <li>Click <strong>Sync Jenkins</strong> to pull existing build history</li>
            <li>Or configure the Jenkins job to POST to <code className="font-mono text-foreground">POST /pipelines/webhook</code> after each build</li>
            <li>Run <code className="font-mono text-foreground">docker compose up --build -d</code> to start the full stack in Docker</li>
          </ol>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm z-50">
          {toast}
        </div>
      )}
    </DashboardLayout>
  );
}

function PipelineStatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="w-5 h-5 text-success shrink-0" />;
  if (status === "failed")  return <XCircle      className="w-5 h-5 text-destructive shrink-0" />;
  if (status === "running") return <Loader2      className="w-5 h-5 text-info animate-spin shrink-0" />;
  return <Clock className="w-5 h-5 text-muted-foreground shrink-0" />;
}

/** Map pipeline status to a Badge variant that exists in the Badge component. */
function pipelineStatusVariant(status: string): "success" | "failed" | "running" | "pending" | "neutral" {
  switch (status) {
    case "success":  return "success";
    case "failed":   return "failed";
    case "running":  return "running";
    case "queued":   return "pending";
    default:         return "neutral";
  }
}
