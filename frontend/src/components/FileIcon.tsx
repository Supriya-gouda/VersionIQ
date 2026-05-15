import { FileText, FileImage, FileCode2, FileType2, FileCheck2 } from "lucide-react";

export type FileType = "pdf" | "docx" | "txt" | "png" | "yaml";

const map: Record<FileType, { icon: typeof FileText; color: string; bg: string }> = {
  pdf: { icon: FileText, color: "text-destructive", bg: "bg-destructive/10" },
  docx: { icon: FileType2, color: "text-info", bg: "bg-info/10" },
  txt: { icon: FileCheck2, color: "text-muted-foreground", bg: "bg-muted" },
  png: { icon: FileImage, color: "text-success", bg: "bg-success/10" },
  yaml: { icon: FileCode2, color: "text-primary", bg: "bg-primary/10" },
};

export function FileIcon({ type, size = "md" }: { type: FileType; size?: "sm" | "md" | "lg" }) {
  const cfg = map[type];
  const Icon = cfg.icon;
  const sz = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const ic = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  return (
    <div className={`${sz} ${cfg.bg} rounded-lg grid place-items-center shrink-0`}>
      <Icon className={`${ic} ${cfg.color}`} />
    </div>
  );
}
