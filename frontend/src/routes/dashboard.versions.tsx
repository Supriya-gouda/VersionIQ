import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import {
  listFiles,
  listVersions,
  restoreVersion,
  compareVersions,
  type ApiFile,
  type ApiVersion,
} from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { GitCommit, RotateCcw, GitCompare, Plus, Minus, Pencil, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/versions")({
  head: () => ({ meta: [{ title: "Version History � VersaVault" }] }),
  component: VersionsPage,
});

function VersionsPage() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [versions, setVersions] = useState<ApiVersion[]>([]);
  const [fileId, setFileId] = useState("");
  const [selected, setSelected] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  async function loadVersions(nextFileId: string) {
    const response = await listVersions(nextFileId);
    setVersions(response.versions);
    const first = response.versions[0];
    setSelected(first?._id ?? "");
    setCompareWith(null);
  }

  async function loadInitialData() {
    const response = await listFiles();
    setFiles(response.files);
    const initialFile = response.files[0];
    if (!initialFile) {
      setLoading(false);
      return;
    }
    setFileId(initialFile._id);
    await loadVersions(initialFile._id);
    setLoading(false);
  }

  useEffect(() => {
    loadInitialData().catch((error) => {
      notify(error instanceof Error ? error.message : "Failed to load version data");
      setLoading(false);
    });
  }, []);

  const file = useMemo(() => files.find((item) => item._id === fileId), [files, fileId]);
  const selectedVersion = versions.find((item) => item._id === selected) ?? versions[0];
  const compareVersion = compareWith ? versions.find((item) => item._id === compareWith) : null;

  async function handleRestore(versionId: string) {
    if (!fileId) return;
    try {
      const response = await restoreVersion(fileId, versionId);
      notify(response.message);
      await loadVersions(fileId);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Restore failed");
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold">Version history</h1>
      <p className="text-muted-foreground mt-1">
        Browse the timeline, compare versions, and restore in one click.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">Loading versions...</span>
        ) : null}
        <select
          value={fileId}
          title="Select file"
          onChange={async (e) => {
            setFileId(e.target.value);
            await loadVersions(e.target.value);
          }}
          className="h-10 px-3 rounded-lg border border-border bg-card text-sm"
        >
          {files.map((item) => (
            <option key={item._id} value={item._id}>
              {item.originalName}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setCompareMode(!compareMode);
            setCompareWith(null);
          }}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-smooth ${compareMode ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}
        >
          <GitCompare className="w-4 h-4" />{" "}
          {compareMode ? "Pick a version to compare" : "Compare versions"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <FileIcon type="txt" size="sm" />
            <div className="min-w-0">
              <div className="font-semibold truncate">
                {file?.originalName ?? "No file selected"}
              </div>
              <div className="text-xs text-muted-foreground">{versions.length} versions</div>
            </div>
          </div>
          <ol className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {versions.map((version) => {
              const active = version._id === selected;
              const isCmp = version._id === compareWith;
              return (
                <li key={version._id} className="relative pb-5 last:pb-0">
                  <span
                    className={`absolute -left-4.5 top-1 w-3.5 h-3.5 rounded-full border-2 ${active ? "bg-primary border-primary" : isCmp ? "bg-info border-info" : "bg-card border-border"}`}
                  />
                  <button
                    onClick={async () => {
                      if (compareMode && version._id !== selected) {
                        setCompareWith(version._id);
                        try {
                          const res = await compareVersions(fileId, selected, version._id);
                          setDiffResult(res.diff);
                        } catch (err) {
                          notify("Comparison failed");
                        }
                      } else {
                        setSelected(version._id);
                        setCompareWith(null);
                        setDiffResult(null);
                      }
                    }}
                    className={`w-full text-left rounded-lg p-3 transition-smooth border ${active ? "border-primary bg-primary/5" : isCmp ? "border-info bg-info/5" : "border-transparent hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">
                        v{version.versionNumber}
                      </span>
                      <Badge variant={version.status}>{version.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm mt-1.5 leading-relaxed">
                      {(() => {
                        const text = version.summary || "No summary";
                        const parts = text.split(/(\*\*.*?\*\*)/g);
                        return parts.map((part: string, i: number) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <span key={i} className="font-bold text-primary">
                                {part.slice(2, -2)}
                              </span>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        });
                      })()}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-card p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-medium">
                    v{selectedVersion?.versionNumber ?? 0}
                  </span>
                  <Badge variant={selectedVersion?.status ?? "stable"}>
                    {selectedVersion?.status ?? "stable"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedVersion ? new Date(selectedVersion.createdAt).toLocaleString() : ""}
                  </div>
                  {selectedVersion?.summarySource && (
                    <Badge
                      variant={selectedVersion.summarySource === "local" ? "outline" : "secondary"}
                      className="text-[10px] uppercase"
                    >
                      {selectedVersion.summarySource}{" "}
                      {selectedVersion.summaryModel && `(${selectedVersion.summaryModel})`}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 text-sm leading-relaxed">
                  {(() => {
                    const text = selectedVersion?.summary ?? "No version selected";
                    const parts = text.split(/(\*\*.*?\*\*)/g);
                    return parts.map((part: string, i: number) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <span key={i} className="font-bold text-primary">
                            {part.slice(2, -2)}
                          </span>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    });
                  })()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => notify(`Selected v${selectedVersion?.versionNumber ?? 0}`)}
                  className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm"
                >
                  Select
                </button>
                <button
                  onClick={() => selectedVersion && handleRestore(selectedVersion._id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant"
                >
                  <RotateCcw className="w-4 h-4" /> Restore
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
              <Stat
                icon={Plus}
                color="text-success"
                label="Added"
                value={selectedVersion?.diffStats.added ?? 0}
              />
              <Stat
                icon={Minus}
                color="text-destructive"
                label="Removed"
                value={selectedVersion?.diffStats.removed ?? 0}
              />
              <Stat
                icon={Pencil}
                color="text-warning-foreground"
                label="Modified"
                value={selectedVersion?.diffStats.modified ?? 0}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-linear-to-br from-accent/30 via-card to-card shadow-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-elegant">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">AI change summary</div>
                <div className="text-xs text-muted-foreground">
                  Auto-generated � what changed in v{selectedVersion?.versionNumber ?? 0}
                </div>
              </div>
            </div>
            <div className="text-sm leading-relaxed">
              {(() => {
                const text = selectedVersion?.summary ?? "No summary available";
                const parts = text.split(/(\*\*.*?\*\*)/g);
                return parts.map((part: string, i: number) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <span key={i} className="font-bold text-primary">
                        {part.slice(2, -2)}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                });
              })()}
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-5">
              <HighlightBox
                tone="success"
                title="Added"
                value={selectedVersion?.diffStats.added ?? 0}
              />
              <HighlightBox
                tone="destructive"
                title="Removed"
                value={selectedVersion?.diffStats.removed ?? 0}
              />
              <HighlightBox
                tone="warning"
                title="Modified"
                value={selectedVersion?.diffStats.modified ?? 0}
              />
            </div>
          </div>

          {compareVersion && selectedVersion && (
            <div className="rounded-xl border border-info/40 bg-info/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <GitCompare className="w-4 h-4 text-info" />
                <span className="font-medium">
                  Comparing <span className="font-mono">v{selectedVersion.versionNumber}</span> vs{" "}
                  <span className="font-mono">v{compareVersion.versionNumber}</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Net difference:{" "}
                <span className="text-success">
                  +{selectedVersion.diffStats.added - compareVersion.diffStats.added}
                </span>{" "}
                <span className="text-destructive">
                  -{Math.abs(selectedVersion.diffStats.removed - compareVersion.diffStats.removed)}
                </span>{" "}
                · Status changed from{" "}
                <Badge variant={compareVersion.status}>{compareVersion.status}</Badge> to{" "}
                <Badge variant={selectedVersion.status}>{selectedVersion.status}</Badge>
              </p>

              <div className="mt-4 p-4 rounded-lg bg-info/10 border border-info/20">
                <div className="flex items-center gap-2 mb-2 text-info">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Semantic Summary
                  </span>
                </div>
                <p className="text-sm italic">
                  "
                  {(() => {
                    const text = selectedVersion.summary;
                    const parts = text.split(/(\*\*.*?\*\*)/g);
                    return parts.map((part: string, i: number) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <span key={i} className="font-bold text-primary">
                            {part.slice(2, -2)}
                          </span>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    });
                  })()}
                  "
                </p>
              </div>

              {diffResult?.textDiff && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto">
                  <div className="text-xs font-mono whitespace-pre leading-relaxed">
                    {diffResult.textDiff.split("\n").map((line: string, i: number) => (
                      <div
                        key={i}
                        className={
                          line.startsWith("+")
                            ? "text-success bg-success/5"
                            : line.startsWith("-")
                              ? "text-destructive bg-destructive/5"
                              : ""
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">
          {toast}
        </div>
      )}
    </DashboardLayout>
  );
}

function Stat({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: any;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function HighlightBox({
  tone,
  title,
  value,
}: {
  tone: "success" | "destructive" | "warning";
  title: string;
  value: number;
}) {
  const map = {
    success: "border-success/30 bg-success/5 text-success",
    destructive: "border-destructive/30 bg-destructive/5 text-destructive",
    warning: "border-warning/40 bg-warning/5 text-warning-foreground",
  };
  return (
    <div className={`rounded-lg border p-3 ${map[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">
        {title}
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
    </div>
  );
}
