import type { DashboardSummary, Job, Keyword, Post, Project, Creator, PgyCreator, XhsCreatorProfile, XhsTrackAnalysis } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:18000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...(init?.headers || {}) }
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardSummary>("/analytics/dashboard-summary"),
  projects: () => request<Project[]>("/projects"),
  createProject: (payload: Pick<Project, "name" | "description" | "sensitive_level">) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(payload) }),
  keywords: (projectId: number) => request<Keyword[]>(`/projects/${projectId}/keywords`),
  createKeyword: (projectId: number, payload: Partial<Keyword>) =>
    request<Keyword>(`/projects/${projectId}/keywords`, { method: "POST", body: JSON.stringify(payload) }),
  runKeyword: (keywordId: number) => request<Job>(`/keywords/${keywordId}/run`, { method: "POST" }),
  posts: (query = "") => request<{ items: Post[]; total: number }>(`/posts${query}`),
  creators: (query = "") => request<{ items: Creator[]; total: number }>(`/creators${query}`),
  pgyCreators: (track: string, limit = 20) =>
    request<{ track: string; items: PgyCreator[] }>(
      `/marketplace/pgy-creators?track=${encodeURIComponent(track)}&limit=${limit}`
    ),
  jobs: () => request<Job[]>("/jobs"),
  xhsCreatorProfile: (userId: string) => request<XhsCreatorProfile>(`/dataflow/xhs/users/${encodeURIComponent(userId)}`),
  xhsTrackAnalysis: (userId: string) => request<XhsTrackAnalysis>(`/dataflow/xhs/users/${encodeURIComponent(userId)}/track-analysis`),
  keywordTrend: () => request<{ date: string; keyword?: string; platform?: string; count: number }[]>("/analytics/keyword-trend"),
  postGrowth: () => request<{ post_id: number; title?: string; platform: string; like_growth_24h: number; comment_growth_24h: number }[]>("/analytics/post-growth"),
  importCsv: (projectId: number, file: File, keywordId?: number) => {
    const form = new FormData();
    form.append("project_id", String(projectId));
    if (keywordId) form.append("keyword_id", String(keywordId));
    form.append("file", file);
    return request<Job>("/import/csv", { method: "POST", body: form });
  },
  importJson: (projectId: number, file: File, keywordId?: number) => {
    const form = new FormData();
    form.append("project_id", String(projectId));
    if (keywordId) form.append("keyword_id", String(keywordId));
    form.append("file", file);
    return request<Job>("/import/json", { method: "POST", body: form });
  }
};

export function formatNumber(value: number | undefined | null) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
