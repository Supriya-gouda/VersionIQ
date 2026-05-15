import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import {
  getSummary,
  listFiles,
  listVersions,
  compareVersions,
  type ApiFile,
  type ApiVersion,
} from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Plus, Minus, Pencil, FileSearch } from "lucide-react";

export const Route = createFileRoute("/dashboard/ai-summary")({
  head: () => ({ meta: [{ title: "AI Change Summary � VersaVault" }] }),
  component: AISummary,
});

function AISummary() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [versions, setVersions] = useState<ApiVersion[]>([]);
  const [fileId, setFileId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [summary, setSummary] = useState<any>({ text: "", source: "", model: "", aiDetails: {} });
  const [diffResult, setDiffResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  async function loadFileData(nextFileId: string, nextVersionId?: string) {
    const vRes = await listVersions(nextFileId);
    setVersions(vRes.versions);

    const targetVersion = nextVersionId
      ? vRes.versions.find((v) => v._id === nextVersionId)
      : vRes.versions[0];

    if (targetVersion) {
      setVersionId(targetVersion._id);
      const detail = await getSummary(nextFileId, targetVersion._id);
      setSummary({
        text: detail.summary.text,
        source: detail.summary.source || "local",
        model: detail.summary.model || "",
        aiDetails: detail.summary.aiDetails,
      });

      // Also load diff if not the first version
      const vIndex = vRes.versions.findIndex((v) => v._id === targetVersion._id);
      const prevVersion = vRes.versions[vIndex + 1]; // sorted by desc
      if (prevVersion) {
        const diffRes = await compareVersions(nextFileId, prevVersion._id, targetVersion._id);
        setDiffResult(diffRes.diff);
      } else {
        setDiffResult(null);
      }
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await listFiles();
        setFiles(response.files);
        const firstFile = response.files[0];
        if (firstFile) {
          setFileId(firstFile._id);
          await loadFileData(firstFile._id);
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "Failed to load summaries");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeFile = useMemo(() => files.find((item) => item._id === fileId), [files, fileId]);
  const activeVersion = versions.find((item) => item._id === versionId) ?? versions[0];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </span>
        AI Change Summary
      </h1>
      <p className="text-muted-foreground mt-1">
        Plain-English explanations of what changed between any two versions.
      </p>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <div className="text-sm font-medium mb-3">Pick a file</div>
          {loading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}
          <ul className="space-y-1.5">
            {files.map((file) => (
              <li key={file._id}>
                <button
                  onClick={async () => {
                    setFileId(file._id);
                    await loadFileData(file._id);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-smooth ${fileId === file._id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                >
                  <FileIcon type="txt" size="sm" />
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-medium truncate">{file.originalName}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.currentVersionNumber} versions
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="text-sm font-medium mt-6 mb-3">Versions</div>
          <ul className="space-y-1.5">
            {versions.map((version) => (
              <li key={version._id}>
                <button
                  onClick={async () => {
                    await loadFileData(fileId, version._id);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-smooth ${versionId === version._id ? "bg-accent" : "hover:bg-muted/50"}`}
                >
                  <span className="font-mono text-sm">v{version.versionNumber}</span>
                  <Badge variant={version.status}>{version.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-linear-to-br from-accent/40 via-card to-card shadow-elegant p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant shrink-0">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    AI Summary
                  </div>
                  {summary.source && (
                    <Badge
                      variant={summary.source === "local" ? "outline" : "secondary"}
                      className="text-[10px] uppercase h-5"
                    >
                      Powered by {summary.source} {summary.model && `(${summary.model})`}
                    </Badge>
                  )}
                </div>
                <div className="font-semibold text-lg">
                  {activeFile?.originalName ?? "Select a file"} - v
                  {activeVersion?.versionNumber ?? 0}
                </div>

                {summary.aiDetails?.topicSummary && (
                  <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm font-medium text-primary flex items-center gap-2 italic">
                    <FileSearch className="w-4 h-4" /> {summary.aiDetails.topicSummary}
                  </div>
                )}

                <p className="mt-4 text-base leading-relaxed font-medium">
                  {summary.text || activeVersion?.summary || "No summary available"}
                </p>

                {summary.aiDetails?.extraNotes && (
                  <p className="mt-2 text-sm text-muted-foreground border-l-2 border-border pl-3">
                    {summary.aiDetails.extraNotes}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <Pill icon={Plus} color="text-success bg-success/10">
                    {activeVersion?.diffStats.added ?? 0} additions
                  </Pill>
                  <Pill icon={Minus} color="text-destructive bg-destructive/10">
                    {activeVersion?.diffStats.removed ?? 0} removals
                  </Pill>
                  <Pill icon={Pencil} color="text-warning-foreground bg-warning/15">
                    {activeVersion?.diffStats.modified ?? 0} modifications
                  </Pill>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <DetailBox
              tone="success"
              title="Significant Additions"
              items={summary.aiDetails?.addedLines || []}
            />
            <DetailBox
              tone="destructive"
              title="Significant Removals"
              items={summary.aiDetails?.removedLines || []}
            />
            <DetailBox
              tone="warning"
              title="Logical Modifications"
              items={summary.aiDetails?.modifiedLines || []}
            />
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-primary" />
                <span className="font-semibold">Version Change Diff</span>
              </div>
              <div className="flex items-center gap-3">
                {diffResult && (
                  <div className="text-[10px] text-muted-foreground uppercase font-mono hidden sm:block">
                    v{diffResult.v1.number} <span className="mx-1">{"->"}</span> v
                    {diffResult.v2.number}
                  </div>
                )}
                <Badge variant="outline" className="text-[10px] uppercase">
                  {showDiff ? "Hide Details" : "Show Details"}
                </Badge>
              </div>
            </button>

            {showDiff && (
              <div className="p-6 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                <pre className="rounded-lg bg-muted/50 border border-border p-4 text-xs font-mono overflow-x-auto leading-6 max-h-[400px]">
                  {diffResult?.textDiff ? (
                    diffResult.textDiff.split("\n").map((line: string, i: number) => (
                      <div
                        key={i}
                        className={
                          line.startsWith("+")
                            ? "text-success"
                            : line.startsWith("-")
                              ? "text-destructive"
                              : ""
                        }
                      >
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground italic">
                      Initial version - no previous version to compare against.
                    </div>
                  )}
                </pre>
              </div>
            )}
          </div>
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

function Pill({
  icon: Icon,
  color,
  children,
}: {
  icon: any;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="w-3 h-3" /> {children}
    </span>
  );
}

function DetailBox({
  tone,
  title,
  items,
}: {
  tone: "success" | "destructive" | "warning";
  title: string;
  items: string[];
}) {
  const map = {
    success: "border-success/30 bg-success/5",
    destructive: "border-destructive/30 bg-destructive/5",
    warning: "border-warning/40 bg-warning/5",
  };
  return (
    <div className={`rounded-xl border p-4 ${map[tone]}`}>
      <div className="font-medium mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No changes</div>
      ) : (
        <ul className="space-y-2 text-sm font-medium">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 leading-snug">
              <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-current opacity-40" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
