import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { GitMerge } from "lucide-react";

export default function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative bg-gradient-hero items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/10" />
        <div className="relative max-w-md text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
              <GitMerge className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-xl">VersaVault</span>
          </Link>
          <h2 className="text-3xl font-bold leading-tight">Version every file. Rollback with confidence.</h2>
          <p className="mt-3 text-muted-foreground">AI-powered change summaries, smart rollback, and CI/CD — all in one workspace.</p>
          <div className="mt-10 rounded-2xl bg-card border border-border p-5 shadow-elegant text-left animate-float">
            <div className="text-xs text-muted-foreground">Latest summary</div>
            <div className="mt-1 text-sm font-medium">v1.4.2 · deployment-config.yaml</div>
            <p className="text-xs text-muted-foreground mt-2">Scaled to 8 replicas, added 2 env vars. Rollback to v1.4.1 recommended.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary grid place-items-center shadow-elegant">
              <GitMerge className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">VersaVault</span>
          </Link>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label, type = "text", placeholder, value, onChange, error, autoComplete,
}: {
  label: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; error?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 w-full h-11 px-3.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-smooth ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
