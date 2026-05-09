import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import { mockFiles } from "@/lib/mock-data";
import { useState } from "react";
import { Sparkles, Plus, Minus, Pencil, FileSearch } from "lucide-react";

export const Route = createFileRoute("/dashboard/ai-summary")({
  head: () => ({ meta: [{ title: "AI Change Summary — VersaVault" }] }),
  component: AISummary,
});

function AISummary() {
  const [fileId, setFileId] = useState(mockFiles[0].id);
  const file = mockFiles.find(f => f.id === fileId)!;
  const [vId, setVId] = useState(file.versions[0].id);
  const v = file.versions.find(x => x.id === vId) || file.versions[0];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </span>
        AI Change Summary
      </h1>
      <p className="text-muted-foreground mt-1">Plain-English explanations of what changed between any two versions.</p>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <div className="text-sm font-medium mb-3">Pick a file</div>
          <ul className="space-y-1.5">
            {mockFiles.map(f => (
              <li key={f.id}>
                <button
                  onClick={() => { setFileId(f.id); setVId(f.versions[0].id); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-smooth ${fileId === f.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                >
                  <FileIcon type={f.type} size="sm" />
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.versions.length} versions</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="text-sm font-medium mt-6 mb-3">Versions</div>
          <ul className="space-y-1.5">
            {file.versions.map(ver => (
              <li key={ver.id}>
                <button
                  onClick={() => setVId(ver.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-smooth ${vId === ver.id ? "bg-accent" : "hover:bg-muted/50"}`}
                >
                  <span className="font-mono text-sm">{ver.number}</span>
                  <Badge variant={ver.status}>{ver.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/40 via-card to-card shadow-elegant p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant shrink-0">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">AI Summary</div>
                <div className="font-semibold text-lg">{file.name} · {v.number}</div>
                <p className="mt-3 text-base leading-relaxed">{v.summary}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Pill icon={Plus} color="text-success bg-success/10">{v.changes.added} additions</Pill>
                  <Pill icon={Minus} color="text-destructive bg-destructive/10">{v.changes.removed} removals</Pill>
                  <Pill icon={Pencil} color="text-warning-foreground bg-warning/15">{v.changes.modified} modifications</Pill>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <DetailBox tone="success" title="Added" items={v.highlights.added} />
            <DetailBox tone="destructive" title="Removed" items={v.highlights.removed} />
            <DetailBox tone="warning" title="Modified" items={v.highlights.modified} />
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileSearch className="w-4 h-4 text-primary" />
              <span className="font-semibold">Diff preview</span>
            </div>
            <pre className="rounded-lg bg-muted/50 border border-border p-4 text-xs font-mono overflow-x-auto leading-6">
{v.highlights.removed.map(l => `- ${l}`).join("\n") || "- (no removals)"}{"\n"}
{v.highlights.added.map(l => `+ ${l}`).join("\n") || "+ (no additions)"}{"\n"}
{v.highlights.modified.map(l => `~ ${l}`).join("\n") || "~ (no modifications)"}
            </pre>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Pill({ icon: Icon, color, children }: { icon: any; color: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}><Icon className="w-3 h-3" /> {children}</span>;
}

function DetailBox({ tone, title, items }: { tone: "success" | "destructive" | "warning"; title: string; items: string[] }) {
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
        <ul className="space-y-1.5 text-sm font-mono">
          {items.map(i => <li key={i} className="truncate">{i}</li>)}
        </ul>
      )}
    </div>
  );
}
