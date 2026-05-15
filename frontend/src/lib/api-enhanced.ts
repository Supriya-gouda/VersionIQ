/**
 * Advanced API client with retry logic, error handling, and timeout management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const TOKEN_STORAGE_KEY = "version_vault_token";
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * API Error class with detailed information
 */
export class ApiErrorResponse extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiErrorResponse";
  }

  get isNetworkError(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.code === "UNAUTHORIZED";
  }

  get isValidationError(): boolean {
    return this.status === 422 || this.code === "VALIDATION_ERROR";
  }
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = RETRY_DELAY,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) except 429 and 503
      if (error instanceof ApiErrorResponse) {
        if (error.status === 429 || error.status === 503) {
          // Too many requests or service unavailable - can retry
        } else if (error.isClientError) {
          throw error; // Don't retry other client errors
        }
      }

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Request timeout handler
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = DEFAULT_TIMEOUT): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
    ),
  ]);
}

/**
 * Perform HTTP request with error handling and retry logic
 */
export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: BodyInit | object,
  options: {
    isFormData?: boolean;
    retries?: number;
    timeout?: number;
  } = {},
): Promise<T> {
  const { isFormData = false, retries = MAX_RETRIES, timeout = DEFAULT_TIMEOUT } = options;

  return retryWithBackoff(async () => {
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

    const response = await withTimeout(
      fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: finalBody,
      }),
      timeout,
    );

    let data: unknown = {};
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = {};
      }
    }

    if (!response.ok) {
      const error = data as { error?: { code?: string; message?: string; details?: unknown } };
      const code = error.error?.code || `HTTP_${response.status}`;
      const message = error.error?.message || `Request failed with status ${response.status}`;

      // Handle auth errors
      if (response.status === 401) {
        clearAccessToken();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      throw new ApiErrorResponse(response.status, code, message, error.error?.details);
    }

    return data as T;
  }, retries);
}

/**
 * Token management
 */

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string {
  if (!isBrowser()) return "";
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

export function setAccessToken(token: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

/**
 * Type definitions
 */

export type ApiFile = {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  owner: string;
  currentVersionNumber: number;
  updatedAt: string;
  currentVersionId?: {
    _id: string;
    versionNumber: number;
    status: "stable" | "risky" | "failed";
    summary: string;
    diffStats: { added: number; removed: number; modified: number };
    createdAt: string;
  } | null;
};

export type ApiVersion = {
  _id: string;
  versionNumber: number;
  status: "stable" | "risky" | "failed";
  summary: string;
  diffStats: { added: number; removed: number; modified: number };
  createdAt: string;
};

export type ApiRecommendation = {
  recommendedVersionId: string;
  versionNumber: number;
  status: "stable" | "risky" | "failed";
  score: number;
  rationale: string;
  reasons?: string[];
  confidence?: "high" | "medium" | "low";
  confidenceScore?: number;
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

/**
 * API Methods
 */

export function register(payload: { name: string; email: string; password: string }) {
  return apiRequest<{ token: string; user: { id: string; name: string; email: string } }>(
    "/auth/register",
    "POST",
    payload,
  );
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<{ token: string; user: { id: string; name: string; email: string } }>(
    "/auth/login",
    "POST",
    payload,
  );
}

export function me() {
  return apiRequest<{ user: { id: string; name: string; email: string } }>("/auth/me", "GET");
}

export function listFiles() {
  return apiRequest<{ files: ApiFile[] }>("/files", "GET", undefined, {
    retries: 2,
  });
}

export function uploadFile(payload: FormData) {
  return apiRequest<{ file: ApiFile; version: ApiVersion }>("/files/upload", "POST", payload, {
    isFormData: true,
    retries: 1,
    timeout: 60000, // 60 seconds for upload
  });
}

export function deleteFile(fileId: string) {
  return apiRequest<{ message: string }>(`/files/${fileId}`, "DELETE", undefined, {
    retries: 2,
  });
}

export function getFile(fileId: string) {
  return apiRequest<{ file: ApiFile; currentVersion?: ApiVersion }>(
    `/files/${fileId}`,
    "GET",
    undefined,
    {
      retries: 2,
    },
  );
}

export function listVersions(fileId: string) {
  return apiRequest<{ versions: ApiVersion[] }>(`/files/${fileId}/versions`, "GET", undefined, {
    retries: 2,
  });
}

export function restoreVersion(fileId: string, versionId: string) {
  return apiRequest<{ message: string; file: ApiFile; version: ApiVersion }>(
    `/files/${fileId}/restore/${versionId}`,
    "POST",
    undefined,
    {
      retries: 2,
    },
  );
}

export function getSummary(fileId: string) {
  return apiRequest<{
    summary: {
      fileId: string;
      versionId: string;
      versionNumber: number;
      status: "stable" | "risky" | "failed";
      diffStats: { added: number; removed: number; modified: number };
      text: string;
    };
  }>(`/files/${fileId}/summary`, "GET", undefined, {
    retries: 2,
  });
}

export function getRecommendation(fileId: string) {
  return apiRequest<{ recommendation: ApiRecommendation }>(
    `/files/${fileId}/recommendation`,
    "GET",
    undefined,
    {
      retries: 2,
    },
  );
}

export function listPipelines() {
  return apiRequest<{ pipelines: ApiPipelineLog[] }>("/pipelines/status", "GET", undefined, {
    retries: 2,
  });
}

export function syncPipelines() {
  return apiRequest<{
    sync: { synced: number; skipped: boolean };
    pipelines: ApiPipelineLog[];
  }>("/pipelines/sync", "POST", undefined, {
    retries: 1,
    timeout: 45000, // 45 seconds for sync
  });
}

export function downloadFile(fileId: string) {
  if (!isBrowser()) return;

  const token = getAccessToken();
  const url = `${API_BASE_URL}/files/${fileId}/download`;

  withTimeout(
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
    60000, // 60 seconds for download
  )
    .then(async (response) => {
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
    })
    .catch((error) => {
      console.error("Download failed:", error);
    });
}
