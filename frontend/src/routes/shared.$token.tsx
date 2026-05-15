import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSharedInfo, downloadSharedFile } from "@/lib/api";
import { FileIcon } from "@/components/FileIcon";
import { Badge } from "@/components/Badge";
import { Download, ShieldCheck, Clock, FileText, Globe } from "lucide-react";

export const Route = createFileRoute("/shared/$token")({
  component: SharedFileView,
});

function SharedFileView() {
  const { token } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSharedInfo(token)
      .then((res) => setData(res.file))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Fetching shared file...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full grid place-items-center mx-auto mb-6">
            <Globe className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            {error || "This link is no longer active or the file has been made private."}
          </p>
          <a href="/" className="mt-8 inline-block text-primary font-medium hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">VersionIQ</span>
        </div>

        <div className="rounded-3xl border border-border bg-card shadow-elegant overflow-hidden">
          <div className="p-8 md:p-12 text-center border-b border-border bg-linear-to-b from-primary/5 to-transparent">
            <div className="w-24 h-24 bg-card rounded-2xl shadow-card grid place-items-center mx-auto mb-6 border border-border">
              <FileIcon type="yaml" size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{data.originalName}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>{(data.size / 1024).toFixed(1)} KB</span>
              <span>•</span>
              <span>Version {data.versionNumber}</span>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Last Updated
                </div>
                <div className="text-lg font-medium">
                  {new Date(data.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> AI Summary
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  "{data.summary}"
                </p>
              </div>
            </div>

            <button
              onClick={() => downloadSharedFile(token)}
              className="w-full h-14 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-elegant hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Download className="w-6 h-6" /> Download File
            </button>

            <p className="text-center text-[10px] text-muted-foreground mt-6 uppercase tracking-[0.2em] font-medium opacity-50">
              Securely served by VersionIQ • End-to-end versioning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
