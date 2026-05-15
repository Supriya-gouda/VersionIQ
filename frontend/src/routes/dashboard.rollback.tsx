import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import {
  getRecommendation,
  listFiles,
  listVersions,
  restoreVersion,
  type ApiFile,
  type ApiVersion,
  type ApiRecommendation,
} from "@/lib/api";
import { ShieldCheck, RotateCcw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/rollback")({
  head: () => ({ meta: [{ title: "Smart Rollback � VersaVault" }] }),
  component: Rollback,
});

function Rollback() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [versionsByFile, setVersionsByFile] = useState<Record<string, ApiVersion[]>>({});
  const [recommendations, setRecommendations] = useState<Record<string, ApiRecommendation>>({});
  const [toast, setToast] = useState<string | null>(null);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await listFiles();
        setFiles(response.files);
        for (const file of response.files) {
          if (file.currentVersionNumber <= 1) continue;
          const versions = await listVersions(file._id);
          setVersionsByFile((previous) => ({ ...previous, [file._id]: versions.versions }));
          const rec = await getRecommendation(file._id);
          setRecommendations((previous) => ({ ...previous, [file._id]: rec.recommendation }));
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "Failed to load rollback data");
      }
    })();
  }, []);

  async function rollBack(fileId: string, versionId: string) {
    try {
      const response = await restoreVersion(fileId, versionId);
      notify(response.message);
      const refreshed = await listVersions(fileId);
      setVersionsByFile((previous) => ({ ...previous, [fileId]: refreshed.versions }));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Rollback failed");
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
          <ShieldCheck className="w-5 h-5 text-primary-foreground" />
        </span>
        Smart Rollback
      </h1>
      <p className="text-muted-foreground mt-1">
        We score every version on stability, test history, and incident impact � so rollbacks are
        safe by default.
      </p>

      <div className="space-y-6 mt-6">
        {files
          .filter((file) => file.currentVersionNumber > 1)
          .map((file) => {
            const versions = versionsByFile[file._id] ?? [];
            const recommended = recommendations[file._id];
            const current = versions[0];

            return (
              <div
                key={file._id}
                className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
              >
                <div className="p-5 flex items-center gap-3 border-b border-border">
                  <FileIcon type="txt" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{file.originalName}</div>
                    <div className="text-xs text-muted-foreground">
                      Current: <span className="font-mono">v{file.currentVersionNumber}</span> �{" "}
                      <Badge variant={current?.status ?? "stable"}>
                        {current?.status ?? "stable"}
                      </Badge>
                    </div>
                  </div>
                  {recommended && current && current._id !== recommended.recommendedVersionId && (
                    <button
                      onClick={() => rollBack(file._id, recommended.recommendedVersionId)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant"
                    >
                      <RotateCcw className="w-4 h-4" /> Roll back to v{recommended.versionNumber}
                    </button>
                  )}
                </div>

                {recommended && (
                  <div className="p-5 bg-linear-to-br from-success/10 to-transparent border-b border-border">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">
                          Recommended:{" "}
                          <span className="font-mono">v{recommended.versionNumber}</span> � Score{" "}
                          {recommended.score}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {recommended.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                    Risk assessment
                  </div>
                  <ul className="space-y-2">
                    {versions.map((version) => (
                      <li
                        key={version._id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${recommended?.recommendedVersionId === version._id ? "border-success/40 bg-success/5" : "border-border"}`}
                      >
                        <RiskIcon status={version.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-medium text-sm">
                              v{version.versionNumber}
                            </span>
                            <Badge variant={version.status}>
                              {version.status === "stable"
                                ? "Stable"
                                : version.status === "risky"
                                  ? "Risky"
                                  : "Failed"}
                            </Badge>
                            {recommended?.recommendedVersionId === version._id && (
                              <Badge variant="success">recommended</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {version.summary}
                          </div>
                        </div>
                        <button
                          onClick={() => rollBack(file._id, version._id)}
                          className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm"
                        >
                          Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">
          {toast}
        </div>
      )}
    </DashboardLayout>
  );
}

function RiskIcon({ status }: { status: string }) {
  if (status === "stable") return <CheckCircle2 className="w-5 h-5 text-success" />;
  if (status === "risky") return <AlertTriangle className="w-5 h-5 text-warning-foreground" />;
  return <XCircle className="w-5 h-5 text-destructive" />;
}
