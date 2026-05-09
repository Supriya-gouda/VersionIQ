import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import { mockFiles, MockFile } from "@/lib/mock-data";
import { useState } from "react";
import { Upload, Search, Filter, Download, Trash2, Share2, X, GitBranch, CloudUpload, FileText } from "lucide-react";

export const Route = createFileRoute("/dashboard/files")({
  head: () => ({ meta: [{ title: "Files — VersaVault" }] }),
  component: FilesPage,
});

function FilesPage() {
  const [files, setFiles] = useState(mockFiles);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [selected, setSelected] = useState<MockFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase()) &&
    (type === "all" || f.type === type)
  );

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function remove(id: string) {
    setFiles(files.filter(f => f.id !== id));
    if (selected?.id === id) setSelected(null);
    notify("File deleted");
  }

  return (
    <DashboardLayout>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-muted-foreground mt-1">Upload, version, and share — every save is a snapshot.</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 transition-smooth text-sm font-medium">
          <Upload className="w-4 h-4" /> Upload file
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search files..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["all", "pdf", "docx", "txt", "png", "yaml"].map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-smooth ${
                type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "lg:grid-cols-3" : ""}`}>
        <div className={`${selected ? "lg:col-span-2" : ""} rounded-xl border border-border bg-card shadow-card overflow-hidden`}>
          {filtered.length === 0 ? (
            <EmptyState onUpload={() => setShowUpload(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="text-left font-medium px-5 py-3">Name</th>
                    <th className="text-left font-medium px-5 py-3">Owner</th>
                    <th className="text-left font-medium px-5 py-3">Status</th>
                    <th className="text-left font-medium px-5 py-3">Updated</th>
                    <th className="text-left font-medium px-5 py-3">Versions</th>
                    <th className="text-right font-medium px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f.id} className={`border-t border-border hover:bg-muted/40 transition-smooth cursor-pointer ${selected?.id === f.id ? "bg-accent/30" : ""}`} onClick={() => setSelected(f)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <FileIcon type={f.type} size="sm" />
                          <div>
                            <div className="font-medium">{f.name}</div>
                            <div className="text-xs text-muted-foreground">{f.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{f.owner}</td>
                      <td className="px-5 py-3"><Badge variant={f.versions[0].status}>{f.versions[0].status}</Badge></td>
                      <td className="px-5 py-3 text-muted-foreground">{f.updated}</td>
                      <td className="px-5 py-3"><span className="inline-flex items-center gap-1 text-muted-foreground"><GitBranch className="w-3.5 h-3.5" /> {f.versions.length}</span></td>
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => notify("Download started")} className="p-2 rounded-lg hover:bg-muted" aria-label="Download"><Download className="w-4 h-4" /></button>
                          <button onClick={() => notify("Share link copied")} className="p-2 rounded-lg hover:bg-muted" aria-label="Share"><Share2 className="w-4 h-4" /></button>
                          <button onClick={() => remove(f.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <aside className="rounded-xl border border-border bg-card shadow-card p-5 h-fit sticky top-20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon type={selected.type} size="lg" />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.size} · {selected.type.toUpperCase()}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="mt-5 rounded-lg bg-muted/50 border border-border p-4 grid place-items-center h-40">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Owner</dt><dd>{selected.owner}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated</dt><dd>{selected.updated}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Versions</dt><dd>{selected.versions.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Latest</dt><dd><Badge variant={selected.versions[0].status}>{selected.versions[0].number}</Badge></dd></div>
            </dl>

            <div className="mt-5 flex gap-2">
              <button onClick={() => notify("Download started")} className="flex-1 h-9 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant">Download</button>
              <button onClick={() => notify("Share link copied")} className="h-9 px-3 rounded-lg border border-border hover:bg-muted text-sm">Share</button>
            </div>
          </aside>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); notify("File uploaded · v1.0 created"); }} />}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">{toast}</div>
      )}
    </DashboardLayout>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent grid place-items-center mx-auto mb-4">
        <CloudUpload className="w-7 h-7 text-accent-foreground" />
      </div>
      <h3 className="font-semibold">No files yet</h3>
      <p className="text-sm text-muted-foreground mt-1">Upload your first file to start versioning.</p>
      <button onClick={onUpload} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant">
        <Upload className="w-4 h-4" /> Upload file
      </button>
    </div>
  );
}

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  function start() {
    setUploading(true);
    let p = 0;
    const t = setInterval(() => {
      p += 12; setProgress(p);
      if (p >= 100) { clearInterval(t); setTimeout(onDone, 300); }
    }, 120);
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-elegant p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Upload file</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-smooth">
          <CloudUpload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium">Drop your file here</div>
          <div className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, PNG, YAML up to 50MB</div>
          <button onClick={start} disabled={uploading} className="mt-4 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant disabled:opacity-60">
            {uploading ? "Uploading..." : "Choose file"}
          </button>
        </div>
        {uploading && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-primary transition-smooth" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-2">{progress}% · creating version snapshot...</div>
          </div>
        )}
      </div>
    </div>
  );
}
