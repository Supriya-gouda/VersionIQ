export type FileType = "pdf" | "docx" | "txt" | "png" | "yaml";
export type RiskLevel = "stable" | "risky" | "failed";

export interface Version {
  id: string;
  number: string;
  timestamp: string;
  author: string;
  status: RiskLevel;
  message: string;
  changes: { added: number; removed: number; modified: number };
  summary: string;
  highlights: { added: string[]; removed: string[]; modified: string[] };
  recommended?: boolean;
}

export interface MockFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  updated: string;
  shared: boolean;
  owner: string;
  versions: Version[];
}

export const mockFiles: MockFile[] = [
  {
    id: "f1",
    name: "deployment-config.yaml",
    type: "yaml",
    size: "12.4 KB",
    updated: "2 hours ago",
    shared: true,
    owner: "Aarav Sharma",
    versions: [
      {
        id: "v5", number: "v1.4.2", timestamp: "2026-05-09 10:14",
        author: "Aarav Sharma", status: "risky",
        message: "Increase replica count and add new env vars",
        changes: { added: 18, removed: 4, modified: 6 },
        summary: "Scaled deployment from 3 to 8 replicas and introduced 2 new environment variables. Liveness probe interval reduced — may cause restarts under load.",
        highlights: {
          added: ["replicas: 8", "env: REDIS_URL", "env: FEATURE_FLAGS"],
          removed: ["replicas: 3"],
          modified: ["livenessProbe.periodSeconds: 30 → 10"],
        },
      },
      {
        id: "v4", number: "v1.4.1", timestamp: "2026-05-07 16:42",
        author: "Priya Mehta", status: "stable", recommended: true,
        message: "Patch resource limits and image tag",
        changes: { added: 6, removed: 2, modified: 3 },
        summary: "Bumped image to 2.3.4 and tightened CPU/memory limits. All canary checks passed; production stable for 36h.",
        highlights: {
          added: ["resources.limits.cpu: 1500m"],
          removed: ["resources.limits.cpu: 1000m"],
          modified: ["image: app:2.3.3 → app:2.3.4"],
        },
      },
      {
        id: "v3", number: "v1.4.0", timestamp: "2026-05-04 09:18",
        author: "Diego Alvarez", status: "failed",
        message: "Initial rollout of new ingress rules",
        changes: { added: 24, removed: 1, modified: 2 },
        summary: "Introduced new ingress configuration. Caused 5xx spike on /api/v2 — rolled back automatically by canary watcher.",
        highlights: {
          added: ["ingress: api-v2"],
          removed: ["legacy redirect"],
          modified: ["host rules"],
        },
      },
      {
        id: "v2", number: "v1.3.9", timestamp: "2026-04-30 13:01",
        author: "Aarav Sharma", status: "stable",
        message: "Cleanup unused secrets",
        changes: { added: 0, removed: 8, modified: 1 },
        summary: "Removed deprecated secrets and tightened RBAC.",
        highlights: { added: [], removed: ["secret: legacy-token"], modified: ["rbac role"] },
      },
      {
        id: "v1", number: "v1.3.8", timestamp: "2026-04-22 11:25",
        author: "Maya Wong", status: "stable",
        message: "Initial commit",
        changes: { added: 120, removed: 0, modified: 0 },
        summary: "Baseline configuration created.",
        highlights: { added: ["initial config"], removed: [], modified: [] },
      },
    ],
  },
  {
    id: "f2", name: "Q2-product-roadmap.pdf", type: "pdf",
    size: "3.8 MB", updated: "Yesterday", shared: true, owner: "Priya Mehta",
    versions: [
      { id: "v3", number: "v3.0", timestamp: "2026-05-08 18:00", author: "Priya Mehta", status: "stable", recommended: true, message: "Final approved roadmap", changes: { added: 4, removed: 1, modified: 2 }, summary: "Locked Q2 milestones; approved by leadership.", highlights: { added: ["AI assistant GA"], removed: ["legacy export"], modified: ["timeline"] } },
      { id: "v2", number: "v2.1", timestamp: "2026-05-02 12:30", author: "Aarav Sharma", status: "risky", message: "Draft with stretch goals", changes: { added: 12, removed: 3, modified: 5 }, summary: "Added ambitious stretch goals — capacity may be tight.", highlights: { added: ["mobile beta"], removed: [], modified: ["dates"] } },
      { id: "v1", number: "v1.0", timestamp: "2026-04-15 09:00", author: "Maya Wong", status: "stable", message: "Initial draft", changes: { added: 30, removed: 0, modified: 0 }, summary: "First draft circulated for review.", highlights: { added: ["overview"], removed: [], modified: [] } },
    ],
  },
  {
    id: "f3", name: "auth-service-spec.docx", type: "docx",
    size: "248 KB", updated: "3 days ago", shared: false, owner: "Diego Alvarez",
    versions: [
      { id: "v2", number: "v2.0", timestamp: "2026-05-06 15:10", author: "Diego Alvarez", status: "stable", recommended: true, message: "OAuth2 + PKCE flow", changes: { added: 22, removed: 5, modified: 4 }, summary: "Switched to PKCE, deprecated implicit flow.", highlights: { added: ["PKCE"], removed: ["implicit"], modified: ["scopes"] } },
      { id: "v1", number: "v1.0", timestamp: "2026-04-20 10:00", author: "Diego Alvarez", status: "stable", message: "Initial spec", changes: { added: 80, removed: 0, modified: 0 }, summary: "Baseline auth spec.", highlights: { added: ["intro"], removed: [], modified: [] } },
    ],
  },
  {
    id: "f4", name: "release-notes.txt", type: "txt",
    size: "8.2 KB", updated: "5 days ago", shared: true, owner: "Maya Wong",
    versions: [
      { id: "v1", number: "v1.0", timestamp: "2026-05-04 11:00", author: "Maya Wong", status: "stable", recommended: true, message: "Notes for 2.3.4", changes: { added: 14, removed: 0, modified: 0 }, summary: "Release notes for app 2.3.4.", highlights: { added: ["bugfixes"], removed: [], modified: [] } },
    ],
  },
  {
    id: "f5", name: "architecture-diagram.png", type: "png",
    size: "1.1 MB", updated: "1 week ago", shared: false, owner: "Aarav Sharma",
    versions: [
      { id: "v2", number: "v2.0", timestamp: "2026-05-01 14:30", author: "Aarav Sharma", status: "stable", recommended: true, message: "Updated to microservices view", changes: { added: 1, removed: 0, modified: 1 }, summary: "Refreshed diagram to reflect new microservice boundaries.", highlights: { added: ["queue layer"], removed: [], modified: ["service edges"] } },
      { id: "v1", number: "v1.0", timestamp: "2026-04-10 09:00", author: "Aarav Sharma", status: "stable", message: "Initial diagram", changes: { added: 1, removed: 0, modified: 0 }, summary: "Initial system overview.", highlights: { added: ["overview"], removed: [], modified: [] } },
    ],
  },
];

export const recentActivity = [
  { id: "a1", icon: "upload", text: "Aarav uploaded deployment-config.yaml v1.4.2", time: "2h ago" },
  { id: "a2", icon: "rollback", text: "Priya rolled back auth-service-spec.docx to v2.0", time: "5h ago" },
  { id: "a3", icon: "share", text: "Maya shared Q2-product-roadmap.pdf with team-leads", time: "Yesterday" },
  { id: "a4", icon: "ai", text: "AI flagged v1.4.0 as risky for deployment-config.yaml", time: "Yesterday" },
  { id: "a5", icon: "build", text: "Pipeline #482 succeeded for service-api", time: "2d ago" },
];

export interface PipelineRun {
  id: string;
  pipeline: string;
  branch: string;
  status: "success" | "failed" | "running" | "pending";
  duration: string;
  commit: string;
  author: string;
  time: string;
}

export const pipelineRuns: PipelineRun[] = [
  { id: "p1", pipeline: "service-api", branch: "main", status: "success", duration: "4m 12s", commit: "a3f9d2c", author: "Aarav", time: "10 min ago" },
  { id: "p2", pipeline: "web-frontend", branch: "feat/ai-summary", status: "running", duration: "2m 04s", commit: "f81e0aa", author: "Priya", time: "running" },
  { id: "p3", pipeline: "worker", branch: "main", status: "failed", duration: "1m 38s", commit: "9c2b771", author: "Diego", time: "1h ago" },
  { id: "p4", pipeline: "service-api", branch: "release/2.3", status: "success", duration: "5m 02s", commit: "44ab120", author: "Maya", time: "3h ago" },
  { id: "p5", pipeline: "web-frontend", branch: "main", status: "pending", duration: "—", commit: "queued", author: "—", time: "queued" },
  { id: "p6", pipeline: "worker", branch: "fix/retry", status: "success", duration: "2m 18s", commit: "70de9aa", author: "Aarav", time: "Yesterday" },
];

export const dockerDeployments = [
  { id: "d1", service: "service-api", image: "app:2.3.4", env: "production", status: "healthy", replicas: "8/8", uptime: "36h" },
  { id: "d2", service: "web-frontend", image: "web:5.1.0", env: "production", status: "healthy", replicas: "4/4", uptime: "12d" },
  { id: "d3", service: "worker", image: "worker:1.7.2", env: "staging", status: "degraded", replicas: "2/3", uptime: "4h" },
  { id: "d4", service: "ml-inference", image: "ml:0.9.1", env: "staging", status: "deploying", replicas: "1/2", uptime: "—" },
];
