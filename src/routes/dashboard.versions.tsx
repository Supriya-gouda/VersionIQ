import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import { mockFiles } from "@/lib/mock-data";
import { useState } from "react";
import { GitCommit, RotateCcw, GitCompare, Plus, Minus, Pencil, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/versions")({
  head: () => ({ meta: [{ title: "Version History — VersaVault" }] }),
  component: VersionsPage,
});

function VersionsPage() {
  const [fileId, setFileId] = useState(mockFiles[0].id);
  const file = mockFiles.find(f => f.id === fileId)!;
  const [selected, setSelected] = useState(file.versions[0].id);
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function notify(m: string) { setToast(m); setTimeout(() => setToast(null), 2200); }

  const v = file.versions.find(x => x.id === selected)!;
  const cmp = compareWith ? file.versions.find(x => x.id === compareWith) : null;

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold">Version history</h1>
      <p className="text-muted-foreground mt-1">Browse the timeline, compare versions, and restore in one click.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={fileId}
          onChange={e => { setFileId(e.target.value); const f = mockFiles.find(x => x.id === e.target.value)!; setSelected(f.versions[0].id); setCompareWith(null); }}
          className="h-10 px-3 rounded-lg border border-border bg-card text-sm"
        >
          {mockFiles.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button
          onClick={() => { setCompareMode(!compareMode); setCompareWith(null); }}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-smooth ${compareMode ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}
        >
          <GitCompare className="w-4 h-4" /> {compareMode ? "Pick a version to compare" : "Compare versions"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <FileIcon type={file.type} size="sm" />
            <div className="min-w-0">
              <div className="font-semibold truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground">{file.versions.length} versions</div>
            </div>
          </div>
          <ol className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {file.versions.map(ver => {
              const active = ver.id === selected;
              const isCmp = ver.id === compareWith;
              return (
                <li key={ver.id} className="relative pb-5 last:pb-0">
                  <span className={`absolute -left-[18px] top-1 w-3.5 h-3.5 rounded-full border-2 ${active ? "bg-primary border-primary" : isCmp ? "bg-info border-info" : "bg-card border-border"}`} />
                  <button
                    onClick={() => {
                      if (compareMode && ver.id !== selected) { setCompareWith(ver.id); }
                      else { setSelected(ver.id); setCompareWith(null); }
                    }}
                    className={`w-full text-left rounded-lg p-3 transition-smooth border ${active ? "border-primary bg-primary/5" : isCmp ? "border-info bg-info/5" : "border-transparent hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">{ver.number}</span>
                      <Badge variant={ver.status}>{ver.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{ver.timestamp} · {ver.author}</div>
                    <div className="text-sm mt-1.5">{ver.message}</div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-card p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-medium">{v.number}</span>
                  <Badge variant={v.status}>{v.status}</Badge>
                  {v.recommended && <Badge variant="info">recommended</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{v.timestamp} · by {v.author}</div>
                <p className="mt-3 text-sm">{v.message}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => notify(`Selected ${v.number}`)} className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm">Select</button>
                <button onClick={() => notify(`Restored to ${v.number}`)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant">
                  <RotateCcw className="w-4 h-4" /> Restore
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
              <Stat icon={Plus} color="text-success" label="Added" value={v.changes.added} />
              <Stat icon={Minus} color="text-destructive" label="Removed" value={v.changes.removed} />
              <Stat icon={Pencil} color="text-warning-foreground" label="Modified" value={v.changes.modified} />
            </div>
          </div>

          {/* AI summary */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-accent/30 via-card to-card shadow-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-elegant">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">AI change summary</div>
                <div className="text-xs text-muted-foreground">Auto-generated · what changed in {v.number}</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{v.summary}</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-5">
              <HighlightBox tone="success" title="Added" items={v.highlights.added} />
              <HighlightBox tone="destructive" title="Removed" items={v.highlights.removed} />
              <HighlightBox tone="warning" title="Modified" items={v.highlights.modified} />
            </div>
          </div>

          {cmp && (
            <div className="rounded-xl border border-info/40 bg-info/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <GitCompare className="w-4 h-4 text-info" />
                <span className="font-medium">Comparing <span className="font-mono">{v.number}</span> ↔ <span className="font-mono">{cmp.number}</span></span>
              </div>
              <p className="text-sm text-muted-foreground">
                Net difference: <span className="text-success">+{v.changes.added - cmp.changes.added}</span>{" "}
                <span className="text-destructive">−{Math.abs(v.changes.removed - cmp.changes.removed)}</span> ·
                Status changed from <Badge variant={cmp.status}>{cmp.status}</Badge> to <Badge variant={v.status}>{v.status}</Badge>
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">{toast}</div>}
    </DashboardLayout>
  );
}

function Stat({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={`w-3.5 h-3.5 ${color}`} /> {label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function HighlightBox({ tone, title, items }: { tone: "success" | "destructive" | "warning"; title: string; items: string[] }) {
  const map = {
    success: "border-success/30 bg-success/5",
    destructive: "border-destructive/30 bg-destructive/5",
    warning: "border-warning/40 bg-warning/5",
  };
  return (
    <div className={`rounded-lg border p-3 ${map[tone]}`}>
      <div className="text-xs font-medium mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : (
        <ul className="space-y-1 text-xs font-mono">
          {items.map(i => <li key={i} className="truncate">{i}</li>)}
        </ul>
      )}
    </div>
  );
}
