import { ReactNode } from "react";

type Variant =
  | "stable"
  | "risky"
  | "failed"
  | "running"
  | "pending"
  | "success"
  | "info"
  | "neutral";

const variants: Record<Variant, string> = {
  stable: "bg-success/15 text-success border-success/30",
  success: "bg-success/15 text-success border-success/30",
  risky: "bg-warning/15 text-warning-foreground border-warning/40",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  running: "bg-info/15 text-info border-info/30",
  pending: "bg-muted text-muted-foreground border-border",
  info: "bg-info/15 text-info border-info/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
