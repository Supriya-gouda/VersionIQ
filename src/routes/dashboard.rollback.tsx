import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import { mockFiles } from "@/lib/mock-data";
import { ShieldCheck, RotateCcw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/rollback")({
  head: () => ({ meta: [{ title: "Smart Rollback — VersaVault" }] }),
  component: Rollback,
});

function Rollback() {
  const [toast, setToast] = useState<string | null>(null);
  function notify(m: string) { setToast(m); setTimeout(() => setToast(null), 2200); }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
          <ShieldCheck className="w-5 h-5 text-primary-foreground" />
        </span>
        Smart Rollback
      </h1>
      <p className="text-muted-foreground mt-1">We score every version on stability, test history, and incident impact — so rollbacks are safe by default.</p>

      <div className="space-y-6 mt-6">
        {mockFiles.filter(f => f.versions.length > 1).map(file => {
          const recommended = file.versions.find(v => v.recommended) || file.versions.find(v => v.status === "stable");
          const current = file.versions[0];
          return (
            <div key={file.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="p-5 flex items-center gap-3 border-b border-border">
                <FileIcon type={file.type} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">Current: <span className="font-mono">{current.number}</span> · <Badge variant={current.status}>{current.status}</Badge></div>
                </div>
                {recommended && current.id !== recommended.id && (
                  <button onClick={() => notify(`Rolled back ${file.name} to ${recommended.number}`)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant">
                    <RotateCcw className="w-4 h-4" /> Roll back to {recommended.number}
                  </button>
                )}
              </div>

              {recommended && (
                <div className="p-5 bg-gradient-to-br from-success/10 to-transparent border-b border-border">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Recommended: <span className="font-mono">{recommended.number}</span></div>
                      <p className="text-sm text-muted-foreground mt-1">
                        This version has been stable for over 36 hours, passed all canary checks, and shows no incident history.
                        It's the safest known good state.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Risk assessment</div>
                <ul className="space-y-2">
                  {file.versions.map(v => (
                    <li key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border ${v.recommended ? "border-success/40 bg-success/5" : "border-border"}`}>
                      <RiskIcon status={v.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-sm">{v.number}</span>
                          <Badge variant={v.status}>{v.status === "stable" ? "Stable" : v.status === "risky" ? "Risky" : "Failed"}</Badge>
                          {v.recommended && <Badge variant="success">recommended</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{v.message} · {v.timestamp}</div>
                      </div>
                      <RiskScore status={v.status} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">{toast}</div>}
    </DashboardLayout>
  );
}

function RiskIcon({ status }: { status: string }) {
  if (status === "stable") return <CheckCircle2 className="w-5 h-5 text-success" />;
  if (status === "risky") return <AlertTriangle className="w-5 h-5 text-warning-foreground" />;
  return <XCircle className="w-5 h-5 text-destructive" />;
}

function RiskScore({ status }: { status: string }) {
  const score = status === "stable" ? 92 : status === "risky" ? 54 : 18;
  const color = status === "stable" ? "bg-success" : status === "risky" ? "bg-warning" : "bg-destructive";
  return (
    <div className="hidden sm:block w-32">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Safety</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
