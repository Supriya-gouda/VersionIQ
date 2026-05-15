import { createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/Badge";
import { FileIcon } from "@/components/FileIcon";
import { ApiFile, deleteFile, downloadFile, listFiles, uploadFile, shareFile } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  Share2,
  X,
  GitBranch,
  CloudUpload,
  FileText,
  Globe,
} from "lucide-react";

type FileType = "pdf" | "docx" | "txt" | "png" | "yaml";
type RiskLevel = "stable" | "risky" | "failed";

type FileViewModel = {
  id: string;
  name: string;
  type: FileType;
  size: string;
  updated: string;
  owner: string;
  versionCount: number;
  latestStatus: RiskLevel;
  latestVersionLabel: string;
  isPublic: boolean;
  shareToken?: string;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function relativeUpdatedTime(timestamp: string) {
  const input = new Date(timestamp).getTime();
  const now = Date.now();
  const deltaMinutes = Math.max(1, Math.floor((now - input) / (1000 * 60)));

  if (deltaMinutes < 60) return `${deltaMinutes} min ago`;
  if (deltaMinutes < 60 * 24) return `${Math.floor(deltaMinutes / 60)} hours ago`;
  return `${Math.floor(deltaMinutes / (60 * 24))} days ago`;
}

function mapFileType(mimeType: string, originalName: string): FileType {
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";

  if (mimeType.includes("pdf") || extension === "pdf") return "pdf";
  if (mimeType.includes("word") || extension === "docx") return "docx";
  if (mimeType.startsWith("text") || extension === "txt") return "txt";
  if (mimeType.startsWith("image") || extension === "png") return "png";
  return "yaml";
}

function toViewModel(file: ApiFile): FileViewModel {
  const latestStatus = file.currentVersionId?.status ?? "stable";
  const latestVersionLabel = `v${file.currentVersionNumber}`;

  return {
    id: file._id,
    name: file.originalName,
    type: mapFileType(file.mimeType, file.originalName),
    size: formatFileSize(file.size),
    updated: relativeUpdatedTime(file.updatedAt),
    owner: "You",
    versionCount: file.currentVersionNumber,
    latestStatus,
    latestVersionLabel,
    isPublic: !!file.isPublic,
    shareToken: file.shareToken,
  };
}

export const Route = createFileRoute("/dashboard/files")({
  head: () => ({ meta: [{ title: "Files — VersaVault" }] }),
  component: FilesPage,
});

function FilesPage() {
  const [files, setFiles] = useState<FileViewModel[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [selected, setSelected] = useState<FileViewModel | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetFileId, setTargetFileId] = useState<string | null>(null);

  async function loadFiles() {
    try {
      const response = await listFiles();
      const mapped = response.files.map(toViewModel);
      setFiles(mapped);
      if (selected) {
        const updatedSelected = mapped.find((item) => item.id === selected.id) ?? null;
        setSelected(updatedSelected);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const filtered = useMemo(
    () =>
      files.filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) && (type === "all" || f.type === type),
      ),
    [files, query, type],
  );

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  async function remove(id: string) {
    try {
      await deleteFile(id);
      setFiles((previous) => previous.filter((file) => file.id !== id));
      if (selected?.id === id) setSelected(null);
      notify("File deleted");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Delete failed");
    }
  }

  async function handleShare(id: string, isPublic: boolean) {
    try {
      const response = await shareFile(id, isPublic);
      const updated = toViewModel(response.file);
      setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
      if (selected?.id === id) setSelected(updated);

      if (isPublic) {
        const shareLink = `${window.location.origin}/shared/${response.file.shareToken}`;
        navigator.clipboard.writeText(shareLink);
        notify("Public link copied to clipboard");
      } else {
        notify("File set to private");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Sharing failed");
    }
  }

  async function onUploadSelected(file: File, fileId?: string) {
    // Validate file size (e.g., 50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      notify("File size exceeds 50MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (fileId) {
      formData.append("fileId", fileId);
    }

    try {
      await uploadFile(formData);
      await loadFiles();
      notify(fileId ? `New version of ${file.name} created` : "File uploaded successfully");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-muted-foreground mt-1">
            Upload, version, and share — every save is a snapshot.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90 transition-smooth text-sm font-medium"
        >
          <Upload className="w-4 h-4" /> Upload file
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-60">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["all", "pdf", "docx", "txt", "png", "yaml"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-smooth ${
                type === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "lg:grid-cols-3" : ""}`}>
        <div
          className={`${selected ? "lg:col-span-2" : ""} rounded-xl border border-border bg-card shadow-card overflow-hidden`}
        >
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading files...</div>
          ) : filtered.length === 0 ? (
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
                  {filtered.map((f) => (
                    <tr
                      key={f.id}
                      className={`border-t border-border hover:bg-muted/40 transition-smooth cursor-pointer ${selected?.id === f.id ? "bg-accent/30" : ""}`}
                      onClick={() => setSelected(f)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <FileIcon type={f.type} size="sm" />
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              {f.name}
                              {f.isPublic && <Globe className="w-3 h-3 text-primary" />}
                            </div>
                            <div className="text-xs text-muted-foreground">{f.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{f.owner}</td>
                      <td className="px-5 py-3">
                        <Badge variant={f.latestStatus}>{f.latestStatus}</Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{f.updated}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <GitBranch className="w-3.5 h-3.5" /> {f.versionCount}
                        </span>
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              downloadFile(f.id);
                              notify("Download started");
                            }}
                            className="p-2 rounded-lg hover:bg-muted"
                            aria-label="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShare(f.id, !f.isPublic)}
                            className={`p-2 rounded-lg hover:bg-muted ${f.isPublic ? "text-primary" : ""}`}
                            aria-label="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(f.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                  <div className="text-xs text-muted-foreground">
                    {selected.size} · {selected.type.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                title="Close details"
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-muted/50 border border-border p-4 grid place-items-center h-40">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Owner</dt>
                <dd>{selected.owner}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{selected.updated}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Versions</dt>
                <dd>{selected.versionCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Latest</dt>
                <dd>
                  <Badge variant={selected.latestStatus}>{selected.latestVersionLabel}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Public</dt>
                <dd>{selected.isPublic ? "Yes" : "No"}</dd>
              </div>
            </dl>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  downloadFile(selected.id);
                  notify("Download started");
                }}
                className="flex-1 h-9 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setTargetFileId(selected.id);
                  setShowUpload(true);
                }}
                className="h-9 px-3 rounded-lg border border-border hover:bg-muted text-sm flex items-center gap-2"
              >
                <CloudUpload className="w-4 h-4" /> New version
              </button>
              <button
                onClick={() => handleShare(selected.id, !selected.isPublic)}
                className={`h-9 px-3 rounded-lg border border-border hover:bg-muted text-sm ${selected.isPublic ? "text-primary border-primary/30" : ""}`}
              >
                Share
              </button>
            </div>
            {selected.isPublic && selected.shareToken && (
              <div className="mt-3 p-2 rounded bg-muted text-[10px] font-mono break-all border border-border">
                {window.location.origin}/shared/{selected.shareToken}
              </div>
            )}
          </aside>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => {
            setShowUpload(false);
            setTargetFileId(null);
          }}
          targetFileName={targetFileId ? selected?.name : undefined}
          onDone={async (file) => {
            await onUploadSelected(file, targetFileId || undefined);
            setShowUpload(false);
            setTargetFileId(null);
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-foreground text-background shadow-elegant text-sm">
          {toast}
        </div>
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
      <p className="text-sm text-muted-foreground mt-1">
        Upload your first file to start versioning.
      </p>
      <button
        onClick={onUpload}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant"
      >
        <Upload className="w-4 h-4" /> Upload file
      </button>
    </div>
  );
}

function UploadModal({
  onClose,
  onDone,
  targetFileName,
}: {
  onClose: () => void;
  onDone: (file: File) => Promise<void>;
  targetFileName?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function start() {
    if (!file) return;
    setUploading(true);

    // Simulate initial phase
    setProgress(20);
    setTimeout(() => setProgress(60), 500);

    await onDone(file);

    setProgress(100);
    setTimeout(() => {
      setUploading(false);
    }, 300);
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-elegant p-6 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">
              {targetFileName ? "Upload new version" : "Upload file"}
            </h3>
            {targetFileName && (
              <p className="text-xs text-muted-foreground">
                Updating: <span className="font-medium text-primary">{targetFileName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            title="Close upload dialog"
            className="p-1.5 rounded-lg hover:bg-muted transition-smooth"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-smooth ${file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
        >
          <CloudUpload
            className={`w-10 h-10 mx-auto mb-3 transition-smooth ${file ? "text-primary" : "text-muted-foreground"}`}
          />
          <div className="text-sm font-medium">{file ? file.name : "Drop your file here"}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {file ? formatFileSize(file.size) : "PDF, DOCX, TXT, PNG, YAML up to 50MB"}
          </div>

          <input
            id="upload-file-input"
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          {!file ? (
            <label
              htmlFor="upload-file-input"
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium cursor-pointer transition-smooth"
            >
              Select file
            </label>
          ) : (
            <div className="mt-4 flex gap-2 justify-center">
              <label
                htmlFor="upload-file-input"
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium cursor-pointer"
              >
                Change
              </label>
              <button
                onClick={() => setFile(null)}
                className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <button
          onClick={start}
          disabled={uploading || !file}
          className="mt-6 w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-elegant disabled:opacity-50 disabled:shadow-none hover:opacity-90 transition-smooth flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>{targetFileName ? "Create Version" : "Start Upload"}</span>
            </>
          )}
        </button>

        {uploading && (
          <div className="mt-5">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 text-center italic">
              Generating AI snapshot & computing diffs...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
