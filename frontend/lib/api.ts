import type {
  DashboardSummary,
  DealApplication,
  DealApplicationCreate,
  DealApplicationListResponse,
  Job,
  Keyword,
  MarketplaceDeal,
  MarketplaceDealCreate,
  MarketplaceDealListResponse,
  MerchantProfile,
  Post,
  Project,
  Creator,
  PgyCreator,
  XhsCreatorProfile,
  XhsResolvedUser,
  XhsTrackAnalysis
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...(init?.headers || {}) }
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(formatApiError(error, response.statusText));
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
  marketplaceDeals: (query = "") => request<MarketplaceDealListResponse>(`/marketplace/deals${query}`),
  marketplaceDeal: (dealId: number | string) => request<MarketplaceDeal>(`/marketplace/deals/${encodeURIComponent(String(dealId))}`),
  createMarketplaceDeal: (payload: MarketplaceDealCreate) =>
    request<MarketplaceDeal>("/marketplace/deals", { method: "POST", body: JSON.stringify(payload) }),
  merchantProfile: () => request<MerchantProfile>("/marketplace/merchant-profile"),
  updateMerchantProfile: (displayName: string) =>
    request<MerchantProfile>("/marketplace/merchant-profile", { method: "PATCH", body: JSON.stringify({ display_name: displayName }) }),
  submitDealApplication: (dealId: number | string, payload: DealApplicationCreate) =>
    request<DealApplication>(`/marketplace/deals/${encodeURIComponent(String(dealId))}/applications`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  dealApplications: (query = "") => request<DealApplicationListResponse>(`/marketplace/applications${query}`),
  updateDealApplicationStatus: (applicationId: number, status: DealApplication["status"]) =>
    request<DealApplication>(`/marketplace/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  jobs: () => request<Job[]>("/jobs"),
  resolveXhsUser: (value: string) => request<XhsResolvedUser>(`/dataflow/xhs/resolve-user?value=${encodeURIComponent(value)}`),
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

function formatApiError(errorText: string, fallback: string) {
  const parsed = parseJsonValue(errorText);
  const detail = pickErrorDetail(parsed) ?? errorText;
  const nested = typeof detail === "string" ? parseJsonValue(detail) : detail;
  const nestedDetail = pickErrorDetail(nested);
  const message = nestedDetail ?? detail;

  if (typeof message === "string") return message;
  if (message && typeof message === "object") {
    const record = message as Record<string, unknown>;
    if (typeof record.message_zh === "string") return record.message_zh;
    if (typeof record.message === "string") return record.message;
    if (typeof record.msg === "string") return record.msg;
  }
  return fallback;
}

function pickErrorDetail(value: unknown) {
  if (!value || typeof value !== "object") return typeof value === "string" ? value : null;
  const record = value as Record<string, unknown>;
  return record.detail ?? record.message_zh ?? record.message ?? record.msg ?? null;
}

function parseJsonValue(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function formatNumber(value: number | undefined | null) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
