import { createFileRoute, Link } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import {
  ApiFile,
  ApiPipelineLog,
  ApiActivity,
  listFiles,
  listPipelines,
  listActivities,
} from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import {
  Files,
  GitBranch,
  Share2,
  ShieldCheck,
  Upload,
  RotateCcw,
  Sparkles,
  Hammer,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — VersaVault" }] }),
  component: Dashboard,
});

const iconMap = {
  upload: Upload,
  new_version: GitBranch,
  restore: RotateCcw,
  share: Share2,
  share_toggle: Share2,
  ai: Sparkles,
  build: Hammer,
  delete: Trash2,
};
import { Trash2 } from "lucide-react";

function Dashboard() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [pipelines, setPipelines] = useState<ApiPipelineLog[]>([]);
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [filesRes, pipelinesRes, activitiesRes] = await Promise.all([
          listFiles(),
          listPipelines(),
          listActivities(),
        ]);
        if (!active) return;

        setFiles(filesRes.files);
        setPipelines(pipelinesRes.pipelines);
        setActivities(activitiesRes.activities);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const versionCount = files.reduce((total, file) => total + file.currentVersionNumber, 0);
    const stableCount = files.filter((file) => file.currentVersionId?.status === "stable").length;
    const latestPipelineStatus = pipelines[0]?.status ?? "unknown";

    return [
      {
        label: "Total files",
        value: String(files.length),
        delta: "Live",
        icon: Files,
        tone: "text-primary bg-primary/10",
      },
      {
        label: "Versions",
        value: versionCount.toLocaleString(),
        delta: "Live",
        icon: GitBranch,
        tone: "text-info bg-info/10",
      },
      {
        label: "Stable files",
        value: String(stableCount),
        delta: "Live",
        icon: ShieldCheck,
        tone: "text-success bg-success/10",
      },
      {
        label: "Latest pipeline",
        value: latestPipelineStatus.toUpperCase(),
        delta: "Live",
        icon: Hammer,
        tone: "text-warning bg-warning/15",
      },
    ];
  }, [files, pipelines]);

  const recentFiles = useMemo(() => files.slice(0, 4), [files]);
  const recentPipelineCards = useMemo(() => pipelines.slice(0, 3), [pipelines]);
  const recentActivity = useMemo(() => activities.slice(0, 5), [activities]);

  return (
    <DashboardLayout>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workspace overview</h1>
          <p className="text-muted-foreground mt-1">
            Live file, version, and pipeline activity across your vault.
          </p>
        </div>
        <Link
          to="/dashboard/files"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 transition-smooth text-sm font-medium"
        >
          <Upload className="w-4 h-4" /> Upload file
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-5 shadow-card animate-pulse"
              >
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="mt-3 h-8 w-20 bg-muted rounded" />
                <div className="mt-2 h-3 w-16 bg-muted rounded" />
              </div>
            ))
          : stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elegant transition-smooth"
                >
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
            <Link to="/dashboard/files" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No files uploaded yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentFiles.map((file) => (
                <li
                  key={file._id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-smooth"
                >
                  <FileIcon type="yaml" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.originalName}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB · updated{" "}
                      {new Date(file.updatedAt).toLocaleDateString()} · {file.currentVersionNumber}{" "}
                      versions
                    </div>
                  </div>
                  <Badge variant={file.currentVersionId?.status ?? "neutral"}>
                    {file.currentVersionId?.status ?? "neutral"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-10 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No recent activity.
            </div>
          ) : (
            <ul className="p-2">
              {recentActivity.map((a) => {
                const Icon = iconMap[a.type as keyof typeof iconMap] || Upload;
                return (
                  <li
                    key={a._id}
                    className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center shrink-0">
                      <Icon className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize">{a.type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.fileName} {a.details}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Pipelines preview */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Pipelines</h2>
          <Link to="/dashboard/devops" className="text-sm text-primary hover:underline">
            Open CI/CD
          </Link>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : pipelines.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No pipeline logs found.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {recentPipelineCards.map((pipeline) => (
              <div
                key={pipeline._id}
                className="rounded-lg border border-border p-4 hover:shadow-card transition-smooth"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{pipeline.pipeline}</div>
                  <Badge
                    variant={
                      pipeline.status === "success"
                        ? "success"
                        : pipeline.status === "failed"
                          ? "failed"
                          : pipeline.status === "running"
                            ? "running"
                            : "neutral"
                    }
                  >
                    {pipeline.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-mono">
                  #{pipeline.buildNumber} · {pipeline.author || "Jenkins"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {pipeline.durationMs ? `${Math.round(pipeline.durationMs / 1000)}s` : "Pending"} ·{" "}
                  {pipeline.startedAt
                    ? new Date(pipeline.startedAt).toLocaleDateString()
                    : "No date"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
