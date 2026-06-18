import type { MarketplaceDeal, XhsCreatorProfile } from "./types";

export const MERCHANT_USERNAME = "admin";
export const MERCHANT_PASSWORD = "xiaohuangque2026";
export const TEST_MERCHANT_KEY = "test_merchant";

export const applicationStatusLabels: Record<string, string> = {
  pending_contact: "待联系",
  contacted: "已联系",
  selected: "已选中",
  rejected: "不合适"
};

export const applicationStatusOptions = [
  { value: "pending_contact", label: "待联系" },
  { value: "contacted", label: "已联系" },
  { value: "selected", label: "已选中" },
  { value: "rejected", label: "不合适" }
];

export const defaultTrackOptions = ["教育成长", "青少年成长", "家庭教育", "本地生活", "校园生活", "咖啡甜品", "健康健身", "母婴亲子"];

export function formatCurrency(value: number | undefined | null) {
  if (value === undefined || value === null) return "-";
  return `¥${new Intl.NumberFormat("zh-CN").format(Math.round(value))}`;
}

export function formatNumber(value: number | undefined | null) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function creatorQuoteRange(followers: number) {
  const base = Math.max(20, followers / 100);
  return {
    base: Math.round(base),
    low: roundQuote(base * 0.8),
    high: roundQuote(base * 2)
  };
}

export function creatorQuoteRangeFromProfile(profile: XhsCreatorProfile | null) {
  return creatorQuoteRange(profile?.follower_count || 5000);
}

export function buildDealShareText(deal: MarketplaceDeal, url: string) {
  const tracks = deal.target_tracks.length ? deal.target_tracks.join(" / ") : "不限赛道";
  const contact = normalizeShareContact(deal.contact_wechat);
  const contactLine = contact ? `运营微信：${contact}` : "报名方式：打开链接填写微信和账号主页，无需注册";
  const brief = deal.brief?.trim();
  return [
    "【小黄雀商单｜达人招募】",
    `${deal.city}｜${deal.brand_name}「${deal.title}」`,
    ``,
    `预算：${formatCurrency(deal.budget_min)} - ${formatCurrency(deal.budget_max)} / 条`,
    `适合达人：${deal.target_audience}`,
    `赛道：${tracks}`,
    `交付：${deal.deliverable}`,
    brief ? `补充：${brief}` : "",
    ``,
    "有兴趣接这个商单，直接打开链接报名：",
    url,
    contactLine,
    "预算和交付要求已公开，报名后由商家/运营继续沟通。"
  ].filter(Boolean).join("\n");
}

function normalizeShareContact(contactWechat: string | undefined | null) {
  const contact = contactWechat?.trim();
  if (!contact) return "";
  if (contact.toLowerCase() === "xiaohuangque") return "";
  return contact;
}

export function uniqueTracks(deals: MarketplaceDeal[]) {
  const tracks = new Set<string>();
  deals.forEach((deal) => deal.target_tracks.forEach((track) => tracks.add(track)));
  return Array.from(tracks).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function uniqueCities(deals: MarketplaceDeal[]) {
  return Array.from(new Set(deals.map((deal) => deal.city))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function roundQuote(value: number) {
  const step = value < 300 ? 10 : value < 1000 ? 50 : 100;
  return Math.max(20, Math.round(value / step) * step);
}
