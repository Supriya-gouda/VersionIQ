const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const TOKEN_STORAGE_KEY = "version_vault_token";

type HttpMethod = "GET" | "POST" | "DELETE" | "PUT";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  notifications: {
    uploads: boolean;
    builds: boolean;
    rollbacks: boolean;
    weekly: boolean;
  };
  createdAt: string;
};

export type ApiFile = {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  owner: string;
  currentVersionNumber: number;
  updatedAt: string;
  shareToken?: string;
  isPublic?: boolean;
  currentVersionId?: {
    _id: string;
    versionNumber: number;
    status: "stable" | "risky" | "failed";
    summary: string;
    summarySource?: "gemini" | "openai" | "local";
    summaryModel?: string;
    diffStats: { added: number; removed: number; modified: number };
    createdAt: string;
  } | null;
};

export type ApiVersion = {
  _id: string;
  versionNumber: number;
  status: "stable" | "risky" | "failed";
  summary: string;
  summarySource?: "gemini" | "openai" | "local";
  summaryModel?: string;
  diffStats: { added: number; removed: number; modified: number };
  aiDetails?: {
    topicSummary?: string;
    extraNotes?: string;
    addedLines?: string[];
    removedLines?: string[];
    modifiedLines?: string[];
  };
  createdAt: string;
};

export type ApiRecommendation = {
  recommendedVersionId: string;
  versionNumber: number;
  status: "stable" | "risky" | "failed";
  score: number;
  rationale: string;
};

export type ApiPipelineLog = {
  _id: string;
  pipeline: string;
  buildNumber: number;
  status: "success" | "failed" | "running" | "queued" | "aborted" | "unknown";
  branch: string;
  commit: string;
  author: string;
  durationMs: number;
  startedAt: string | null;
  finishedAt: string | null;
  url: string;
};

export type ApiPipelineStats = {
  total: number;
  success: number;
  failed: number;
  unstable: number;
  aborted: number;
  successRate: string | number;
  averageDurationMs: number;
};

export type ApiActivity = {
  _id: string;
  type: "upload" | "restore" | "delete" | "share";
  fileId?: string;
  fileName: string;
  details: string;
  createdAt: string;
};

export type ApiQuota = {
  used: number;
  limit: number;
  percent: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  if (!isBrowser()) return "";
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

export function setAccessToken(token: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

async function apiRequest<T>(
  path: string,
  method: HttpMethod,
  body?: BodyInit | object,
  isFormData = false,
): Promise<T> {
  const headers: HeadersInit = {};
  const token = getAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body;
  } else if (body && isFormData) {
    finalBody = body as BodyInit;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: finalBody,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Backend error responses may use either `message` or `error.message`.
    // Normalize so callers receive the most informative message available.
    // Examples:
    // - { message: '...' }
    // - { success: false, error: { message: '...' } }
    const message =
      (data && ((data as any).message || (data as any).error?.message)) ?? "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export function register(payload: { name: string; email: string; password: string }) {
  return apiRequest<{ token: string; user: ApiUser }>("/auth/register", "POST", payload);
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<{ token: string; user: ApiUser }>("/auth/login", "POST", payload);
}

export function me() {
  return apiRequest<{ user: ApiUser }>("/auth/me", "GET");
}

export function updateProfile(payload: Partial<ApiUser>) {
  return apiRequest<{ user: ApiUser }>("/auth/me", "PUT", payload);
}

export function uploadAvatar(payload: FormData) {
  return apiRequest<{ user: ApiUser }>("/auth/avatar", "POST", payload);
}

export function listFiles() {
  return apiRequest<{ files: ApiFile[] }>("/files", "GET");
}

export function uploadFile(payload: FormData) {
  return apiRequest<{ file: ApiFile; version: ApiVersion }>("/files/upload", "POST", payload, true);
}

export function deleteFile(fileId: string) {
  return apiRequest<{ message: string }>(`/files/${fileId}`, "DELETE");
}

export function getFile(fileId: string) {
  return apiRequest<{ file: ApiFile; currentVersion?: ApiVersion }>(`/files/${fileId}`, "GET");
}

export function listVersions(fileId: string) {
  return apiRequest<{ versions: ApiVersion[] }>(`/files/${fileId}/versions`, "GET");
}

export function restoreVersion(fileId: string, versionId: string) {
  return apiRequest<{ message: string; file: ApiFile; version: ApiVersion }>(
    `/files/${fileId}/restore/${versionId}`,
    "POST",
  );
}

export function compareVersions(fileId: string, v1: string, v2: string) {
  return apiRequest<{
    diff: {
      v1: { id: string; number: number; summary: string };
      v2: { id: string; number: number; summary: string };
      diffStats: { added: number; removed: number; modified: number };
      textDiff: string;
      semanticSummary?: {
        summary: string;
        source?: string;
        model?: string;
        aiDetails?: {
          topicSummary?: string;
          extraNotes?: string;
          addedLines?: string[];
          removedLines?: string[];
          modifiedLines?: string[];
        };
      };
    };
  }>(`/files/${fileId}/compare/${v1}/${v2}`, "GET");
}

export function getSummary(fileId: string, versionId?: string) {
  const query = versionId ? `?versionId=${versionId}` : "";
  return apiRequest<{
    summary: {
      fileId: string;
      versionId: string;
      versionNumber: number;
      status: "stable" | "risky" | "failed";
      diffStats: { added: number; removed: number; modified: number };
      text: string;
      source?: "gemini" | "openai" | "local";
      model?: string;
      aiDetails?: ApiVersion["aiDetails"];
    };
  }>(`/files/${fileId}/summary${query}`, "GET");
}

export function getRecommendation(fileId: string) {
  return apiRequest<{ recommendation: ApiRecommendation }>(
    `/files/${fileId}/recommendation`,
    "GET",
  );
}

export function listPipelines() {
  return apiRequest<{ pipelines: ApiPipelineLog[]; count: number; timestamp: string }>(
    "/pipelines/status",
    "GET",
  );
}

export function syncPipelines() {
  return apiRequest<{
    sync: { synced: number; skipped: boolean; message?: string };
    pipelines: ApiPipelineLog[];
    count: number;
  }>("/pipelines/sync", "POST");
}

export function getPipelineStats(days = 7) {
  return apiRequest<{ stats: ApiPipelineStats; days: number }>(
    `/pipelines/stats?days=${days}`,
    "GET",
  );
}

export function getQuota() {
  return apiRequest<{ quota: ApiQuota }>("/files/quota", "GET");
}

export function shareFile(fileId: string, isPublic: boolean) {
  return apiRequest<{ file: ApiFile }>(`/files/${fileId}/share`, "POST", { isPublic });
}

export function listActivities() {
  return apiRequest<{ activities: ApiActivity[] }>("/files/activities", "GET");
}

export function getSharedInfo(token: string) {
  return apiRequest<{
    file: {
      originalName: string;
      size: number;
      updatedAt: string;
      versionNumber: number;
      summary: string;
    };
  }>(`/public/share/${token}`, "GET");
}

export function downloadSharedFile(token: string) {
  window.open(`${API_BASE_URL}/public/share/${token}/download`, "_blank");
}

export function downloadFile(fileId: string) {
  const token = getAccessToken();
  const url = `${API_BASE_URL}/files/${fileId}/download`;
  if (!isBrowser()) return;

  fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = "download";
    a.click();
    URL.revokeObjectURL(objectUrl);
  });
}
