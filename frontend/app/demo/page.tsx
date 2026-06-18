"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileText,
  Handshake,
  Printer,
  ReceiptText,
  RefreshCw,
  Scale,
  Search,
  Target,
  TrendingUp,
  UserRound,
  Users,
  WalletCards
} from "lucide-react";
import { api } from "@/lib/api";
import type { XhsCreatorProfile } from "@/lib/types";
import { primaryBrand } from "@/src/data/mockBrands";
import { featuredCreator, mockCreators, type CreatorProfile } from "@/src/data/mockCreators";
import { defaultDeal, mockDeals, type Deal } from "@/src/data/mockDeals";
import { industryDataByTrack, industryTracks, type IndustryTrack } from "@/src/data/mockIndustry";
import {
  educationMarketplaceTracks,
  type EducationMarketplaceTrack,
  type PgyEducationCreator
} from "@/src/data/mockPgyCreators";
import { generatedPgyCreators } from "@/src/data/generatedPgyCreators";

const tabs = [
  { id: "creator", label: "达人视角", href: "/demo/creator", icon: UserRound },
  { id: "brand", label: "品牌方视角", href: "/demo/brand", icon: Building2 },
  { id: "industry", label: "赛道看板", href: "/demo/industry", icon: BarChart3 },
  { id: "trade", label: "透明交易", href: "/demo/trade", icon: Scale },
  { id: "report", label: "一键报告", href: "/demo/report", icon: FileText }
] as const;

type TabId = (typeof tabs)[number]["id"];

const tradeStatuses = ["待确认", "待支付", "已支付托管", "达人已交付", "品牌已验收", "已结算"];
const DEMO_REPORTS_PATH = "/api/demo-track-report";
const REPORT_GENERATION_DELAY_MS = 5000;
const SESSION_STORAGE_KEY = "xiaohuangque-demo-role";
const ROLE_CHANGE_EVENT = "xiaohuangque-demo-role-change";

type DemoTrackReport = {
  track: IndustryTrack;
  title: string;
  markdown: string;
};

type DemoTrackReports = Partial<Record<IndustryTrack, DemoTrackReport>>;
type DemoRole = "guest" | "creator" | "brand";

const allowedTabsByRole: Record<DemoRole, TabId[]> = {
  guest: ["creator"],
  creator: ["creator", "trade"],
  brand: ["brand", "industry", "trade", "report"]
};

export default function MatchmakingDemoPage() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getTabFromPathname(pathname);
  const isHome = pathname === "/demo";
  const [role, setRole] = useState<DemoRole>("guest");
  const [selectedDeal, setSelectedDeal] = useState<Deal>(defaultDeal);
  const [routeDealId, setRouteDealId] = useState("");
  const [tradeStep, setTradeStep] = useState(0);
  const routeDeal = routeDealId ? mockDeals.find((deal) => deal.id === routeDealId) : null;
  const activeDeal = routeDeal || selectedDeal;
  const visibleTabs = tabs.filter((tab) => allowedTabsByRole[role].includes(tab.id));
  const canAccessActiveTab = isHome || allowedTabsByRole[role].includes(activeTab);

  useEffect(() => {
    setRouteDealId(new URLSearchParams(window.location.search).get("deal") || "");
  }, [pathname]);

  useEffect(() => {
    const stored = readStoredDemoRole();
    if (stored === "creator" || stored === "brand") {
      setRole(stored);
    }
  }, []);

  useEffect(() => {
    function syncRole() {
      setRole(readStoredDemoRole() || "guest");
    }

    window.addEventListener("storage", syncRole);
    window.addEventListener(ROLE_CHANGE_EVENT, syncRole);
    return () => {
      window.removeEventListener("storage", syncRole);
      window.removeEventListener(ROLE_CHANGE_EVENT, syncRole);
    };
  }, []);

  function login(nextRole: "brand") {
    writeStoredDemoRole(nextRole);
    setRole(nextRole);
    router.push("/demo");
  }

  function logout() {
    clearStoredDemoRole();
    setRole("guest");
    setSelectedDeal(defaultDeal);
    setTradeStep(0);
    router.push("/demo");
  }

  function acceptDeal(deal: Deal) {
    setSelectedDeal(deal);
    setTradeStep(0);
    router.push(`/demo/trade?deal=${encodeURIComponent(deal.id)}`);
  }

  function advanceTradeStatus() {
    setTradeStep((current) => Math.min(current + 1, tradeStatuses.length - 1));
  }

  return (
    <div className="space-y-5">
      <div className="border-b border-line pb-5">
        <div>
          <p className="text-sm font-semibold text-teal">小黄雀达人商单匹配 Demo</p>
          <h1 className="mt-2 max-w-5xl text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            没有中间商赚差价，达人知道自己的真实价值，品牌方知道每一分钱花在哪里。
          </h1>
        </div>
      </div>

      <div className="demo-tabs flex gap-2 overflow-x-auto rounded-lg border border-line bg-white p-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = !isHome && activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition ${
                active ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              data-testid={`demo-tab-${tab.id}`}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {isHome ? <HomeView role={role} onAcceptDeal={acceptDeal} /> : null}
      {!isHome && !canAccessActiveTab ? <AccessGate role={role} requestedTab={activeTab} onLogin={login} /> : null}
      {!isHome && canAccessActiveTab && activeTab === "creator" ? <CreatorView onAcceptDeal={acceptDeal} /> : null}
      {!isHome && canAccessActiveTab && activeTab === "brand" ? <BrandView /> : null}
      {!isHome && canAccessActiveTab && activeTab === "industry" ? <IndustryView /> : null}
      {!isHome && canAccessActiveTab && activeTab === "trade" ? (
        <TradeView selectedDeal={activeDeal} tradeStep={tradeStep} onAdvance={advanceTradeStatus} />
      ) : null}
      {!isHome && canAccessActiveTab && activeTab === "report" ? <ReportView selectedDeal={activeDeal} /> : null}
    </div>
  );
}

function getTabFromPathname(pathname: string): TabId {
  const section = pathname.split("/").filter(Boolean).pop();
  if (section === "brand" || section === "industry" || section === "trade" || section === "report") {
    return section;
  }
  return "creator";
}

function readStoredDemoRole(): DemoRole | null {
  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored === "brand") return stored;
    if (stored === "creator") window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

function writeStoredDemoRole(role: "brand") {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, role);
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  } catch {
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
    // The demo still works in restricted browser contexts where localStorage is unavailable.
  }
}

function clearStoredDemoRole() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  } catch {
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
    // Ignore storage errors; visible role state is enough for the local demo.
  }
}

function HomeView({ role, onAcceptDeal }: { role: DemoRole; onAcceptDeal: (deal: Deal) => void }) {
  if (role === "creator") return <CreatorWorkspace />;
  if (role === "brand") return <BrandWorkspace />;
  return <GuestMarketplaceView onAcceptDeal={onAcceptDeal} />;
}

function GuestMarketplaceView({ onAcceptDeal }: { onAcceptDeal: (deal: Deal) => void }) {
  const [profileUrl, setProfileUrl] = useState("");
  const [profile, setProfile] = useState<XhsCreatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resolvedBy, setResolvedBy] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dealBatchIndex, setDealBatchIndex] = useState(0);
  const baseCreators = useMemo(() => mockCreators.map(buildMockDisplayCreator), []);
  const searchedCreator = useMemo(() => (profile ? buildDisplayCreator(profile) : null), [profile]);
  const creators = useMemo(() => (searchedCreator ? [searchedCreator, ...baseCreators] : baseCreators), [baseCreators, searchedCreator]);
  const activeIndex = Math.min(selectedIndex, creators.length - 1);
  const activeCreator = creators[activeIndex] || buildDisplayCreator(null);
  const pricing = useMemo(() => buildPricingBreakdown(activeCreator), [activeCreator]);
  const matchedDeals = useMemo(() => buildMatchedDeals(activeCreator, dealBatchIndex), [activeCreator, dealBatchIndex]);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(creators.length - 1, 0)));
  }, [creators.length]);

  useEffect(() => {
    if (profile || creators.length <= 1) return;
    const timer = window.setInterval(() => {
      setSelectedIndex((current) => (current + 1) % creators.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [creators.length, profile]);

  async function searchCreator() {
    const query = profileUrl.trim();
    if (!query) {
      setMessage("请输入小红书主页链接、user_id 或小红书号");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      setResolvedBy("");
      const resolved = await api.resolveXhsUser(query);
      setResolvedBy(resolved.match_type);
      setProfile(await api.xhsCreatorProfile(resolved.user_id));
      setSelectedIndex(0);
      setDealBatchIndex(0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "达人数据获取失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] md:items-start">
        <div className="panel relative overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal via-amber-400 to-coral" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle icon={UserRound} title="达人基础信息" />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {profile && activeIndex === 0 ? "搜索结果" : `${activeIndex + 1} / ${creators.length}`}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">一次展示一个达人。自动切换或手动切换后，右侧报价和下方商单会同步更新。</p>

          <article
            key={`${activeCreator.nickname}-${activeIndex}`}
            className="creator-card-in mt-4 rounded-lg border border-teal bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_62%,#fff7ed_100%)] p-4 shadow-[0_22px_55px_rgba(15,118,110,0.18)] ring-2 ring-teal/10"
          >
            <div className="flex items-start gap-3">
              {activeCreator.avatarUrl ? (
                <img className="h-16 w-16 rounded-lg border border-line object-cover" src={activeCreator.avatarUrl} alt="" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-teal/30 bg-teal text-2xl font-semibold text-white">
                  {activeCreator.nickname.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-xl font-semibold text-ink">{activeCreator.nickname}</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {searchedCreator && activeIndex === 0 ? "搜索结果" : "样本达人"}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {activeCreator.platform}
                  {activeCreator.location ? ` · ${activeCreator.location}` : ""}
                  {activeCreator.redId ? ` · 小红书号 ${activeCreator.redId}` : ""}
                </div>
                {activeCreator.bio ? <p className="mt-3 text-sm leading-6 text-slate-600">{activeCreator.bio}</p> : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="粉丝数" value={activeCreator.followersDisplay} />
              <Metric label="近30天曝光" value={activeCreator.exposureDisplay} />
              <Metric label="近30天互动" value={activeCreator.interactionsDisplay} />
              <Metric label="互动率" value={`${activeCreator.engagementRate}%`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeCreator.tracks.slice(0, 4).map((track) => (
                <span key={track} className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                  {track}
                </span>
              ))}
            </div>
          </article>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {creators.map((creator, index) => (
                <button
                  key={`${creator.nickname}-dot-${index}`}
                  aria-label={`切换到 ${creator.nickname}`}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-9 bg-teal" : "w-2 bg-slate-300 hover:bg-slate-400"}`}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(index);
                    setDealBatchIndex(0);
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className="btn secondary min-h-9 px-3"
                type="button"
                onClick={() => {
                  setSelectedIndex((current) => (current - 1 + creators.length) % creators.length);
                  setDealBatchIndex(0);
                }}
              >
                <ArrowRight className="rotate-180" size={15} />
                上一个
              </button>
              <button
                className="btn min-h-9 px-3"
                type="button"
                onClick={() => {
                  setSelectedIndex((current) => (current + 1) % creators.length);
                  setDealBatchIndex(0);
                }}
              >
                下一个
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="panel relative overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-teal to-slate-700" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SectionTitle icon={WalletCards} title="达人当前身价" />
              <p className="mt-2 text-sm leading-6 text-slate-600">报价随左侧达人实时同步，也可以直接搜索小红书达人完成身价测算。</p>
            </div>
            <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">隐藏差价 ¥0</span>
          </div>

          <div className="mt-4 rounded-lg border border-teal/20 bg-teal/5 p-3">
            <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">小红书达人搜索</span>
                <input
                  className="control w-full"
                  placeholder="粘贴主页链接 / 输入 user_id / 输入小红书号"
                  value={profileUrl}
                  onChange={(event) => setProfileUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchCreator();
                  }}
                />
              </label>
              <button className="btn justify-center md:mt-5" disabled={loading} onClick={searchCreator} type="button">
                <Search size={16} />
                {loading ? "查询中" : "查询达人"}
              </button>
            </div>
            {message ? <div className="mt-3 rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-sm text-coral">{message}</div> : null}
            {profile ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-white px-2.5 py-1 font-medium text-teal">已同步到左侧达人卡片</span>
                {profile.source ? <span>来源: {profile.source === "tikhub" ? "TikHub" : profile.source}</span> : null}
                {resolvedBy ? <span>匹配方式: {formatResolvedBy(resolvedBy)}</span> : null}
                <span>UID: {profile.user_id}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px] md:items-stretch">
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="text-sm text-slate-500">当前商单参考报价</div>
              <div className="mt-2 text-3xl font-semibold leading-tight text-ink">
                {formatCurrency(activeCreator.quoteRange[0])} - {formatCurrency(activeCreator.quoteRange[1])}
              </div>
              <div className="mt-2 text-sm text-slate-500">按粉丝、曝光、互动资产和赛道标签综合测算 / 条</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-700">建议报价</div>
              <div className="mt-2 text-3xl font-semibold text-amber-800">{formatCurrency(activeCreator.suggestedQuote)}</div>
              <div className="mt-2 text-sm text-amber-700">品牌支付即达人到账</div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-white">
            {pricing.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-medium text-ink">
                  {item.prefix || ""}
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 bg-slate-50 px-3 py-3 text-sm font-semibold">
              <span>最终建议报价</span>
              <span>{formatCurrency(activeCreator.suggestedQuote)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Highlight label="品牌支付给达人" value={formatCurrency(activeCreator.suggestedQuote)} />
            <Highlight label="达人实际到账" value={formatCurrency(activeCreator.suggestedQuote)} />
            <Highlight label="隐藏差价" value="¥0" danger />
          </div>
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader title="匹配商单" description={`当前基于「${activeCreator.nickname}」的赛道、城市、报价和互动资产推荐合作。`} />
          <button className="btn secondary justify-center" onClick={() => setDealBatchIndex((current) => current + 1)} type="button">
            <RefreshCw size={16} />
            换一批
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {matchedDeals.map((deal) => (
            <article key={deal.id} className="flex flex-col rounded-lg border border-line bg-white p-4 transition hover:-translate-y-1 hover:border-teal/35 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">品牌</div>
                  <h3 className="mt-1 text-lg font-semibold text-ink">{deal.brandName}</h3>
                </div>
                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">{deal.keywordMatch}% 匹配</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {deal.reasonTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <InfoLine label="合作主题" value={deal.theme} />
                <InfoLine label="预算区间" value={`${formatCurrency(deal.budgetMin)} - ${formatCurrency(deal.budgetMax)} / 条`} />
                <InfoLine label="交付要求" value={deal.deliverable} />
                <InfoLine label="推荐理由" value={buildDealReason(deal, activeCreator)} />
                <InfoLine label="达人预计到账" value={formatCurrency(deal.creatorPayout)} strong />
              </dl>
              <button className="btn mt-5 justify-center" data-testid={`guest-accept-${deal.id}`} onClick={() => onAcceptDeal(deal)} type="button">
                <CheckCircle2 size={16} />
                接受合作
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <DealPlaza activeCreator={activeCreator} onAcceptDeal={onAcceptDeal} />
    </div>
  );
}

function DealPlaza({
  activeCreator,
  onAcceptDeal
}: {
  activeCreator: DisplayCreator;
  onAcceptDeal: (deal: Deal) => void;
}) {
  const [trackFilter, setTrackFilter] = useState("全部赛道");
  const [cityFilter, setCityFilter] = useState("全部城市");
  const [query, setQuery] = useState("");
  const trackOptions = useMemo(() => {
    const tracks = new Set<string>();
    mockDeals.forEach((deal) => deal.targetTracks.forEach((track) => tracks.add(track)));
    return ["全部赛道", ...Array.from(tracks).sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }, []);
  const cityOptions = useMemo(() => {
    const cities = new Set(mockDeals.map((deal) => deal.city));
    return ["全部城市", ...Array.from(cities).sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }, []);
  const plazaDeals = useMemo(() => {
    const keyword = normalizeMatchText(query);
    return mockDeals
      .filter((deal) => {
        const matchTrack = trackFilter === "全部赛道" || deal.targetTracks.includes(trackFilter);
        const matchCity = cityFilter === "全部城市" || deal.city === cityFilter;
        const searchable = normalizeMatchText([deal.brandName, deal.theme, deal.audience, deal.deliverable, ...deal.targetTracks, ...deal.reasonTags].join(" "));
        const matchQuery = !keyword || searchable.includes(keyword);
        return matchTrack && matchCity && matchQuery;
      })
      .map((deal) => scoreDealForCreator(deal, activeCreator))
      .sort((a, b) => b.keywordMatch - a.keywordMatch || b.budgetMax - a.budgetMax);
  }, [activeCreator, cityFilter, query, trackFilter]);
  const featuredDeals = plazaDeals.slice(0, 9);
  const totalBudget = featuredDeals.reduce((sum, deal) => sum + deal.creatorPayout, 0);

  return (
    <section id="deal-plaza" className="panel scroll-mt-20 overflow-hidden">
      <div className="border-b border-line p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionTitle icon={Clipboard} title="商单广场" />
            <p className="mt-2 text-sm leading-6 text-slate-600">
              公开展示可申请商单，预算、交付要求和预计到账都明示。当前按「{activeCreator.nickname}」重新计算匹配度。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[720px]">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-500">搜索商单</span>
              <input
                className="control w-full"
                placeholder="品牌 / 主题 / 关键词"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-500">赛道</span>
              <select className="control w-full" value={trackFilter} onChange={(event) => setTrackFilter(event.target.value)}>
                {trackOptions.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-500">城市</span>
              <select className="control w-full" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Highlight label="可申请商单" value={`${plazaDeals.length} 个`} />
          <Highlight label="当前展示预计到账" value={formatCurrency(totalBudget)} />
          <Highlight label="隐藏差价" value="¥0" danger />
        </div>
      </div>

      {featuredDeals.length ? (
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {featuredDeals.map((deal) => (
            <article key={deal.id} className="flex flex-col rounded-lg border border-line bg-white p-4 transition hover:-translate-y-1 hover:border-teal/35 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">{deal.city} · 公开商单</div>
                  <h3 className="mt-1 text-lg font-semibold leading-6 text-ink">{deal.brandName}</h3>
                </div>
                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">{deal.keywordMatch}% 匹配</span>
              </div>
              <p className="mt-3 text-sm font-medium leading-6 text-ink">{deal.theme}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {deal.targetTracks.slice(0, 4).map((track) => (
                  <span key={track} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {track}
                  </span>
                ))}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <InfoLine label="预算区间" value={`${formatCurrency(deal.budgetMin)} - ${formatCurrency(deal.budgetMax)} / 条`} />
                <InfoLine label="交付要求" value={deal.deliverable} />
                <InfoLine label="目标人群" value={deal.audience} />
                <InfoLine label="预计到账" value={formatCurrency(deal.creatorPayout)} strong />
              </dl>
              <button className="btn mt-5 justify-center" onClick={() => onAcceptDeal(deal)} type="button">
                <Handshake size={16} />
                申请合作
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Search className="mx-auto text-slate-400" size={30} />
          <div className="mt-3 font-medium text-ink">暂无匹配商单</div>
          <p className="mt-2 text-sm text-slate-500">换一个赛道、城市或关键词继续查看。</p>
        </div>
      )}
    </section>
  );
}

function CreatorWorkspace() {
  const activeDeals = mockDeals.slice(0, 3);
  const totalPayout = activeDeals.reduce((sum, deal) => sum + deal.creatorPayout, 0);

  return (
    <div className="space-y-5">
      <section className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SectionTitle icon={UserRound} title="达人接单情况" />
            <p className="mt-2 text-sm leading-6 text-slate-600">深圳校园生活小林的待处理商单、预计到账和透明结算状态。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href="/demo/creator">
              <Search size={16} />
              查询与匹配
            </Link>
            <Link className="btn secondary" href="/demo/trade">
              <Scale size={16} />
              透明交易
            </Link>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Highlight label="可接商单" value={`${activeDeals.length} 个`} />
          <Highlight label="预计到账" value={formatCurrency(totalPayout)} />
          <Highlight label="平台隐藏差价" value="¥0" danger />
          <Highlight label="当前状态" value="待确认" />
        </div>
      </section>

      <section className="panel table-scroll">
        <div className="border-b border-line p-4">
          <SectionTitle icon={Clipboard} title="我的商单" />
        </div>
        <table className="app-table">
          <thead>
            <tr>
              <th>品牌</th>
              <th>合作主题</th>
              <th>达人到账</th>
              <th>交付要求</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {activeDeals.map((deal) => (
              <tr key={deal.id}>
                <td className="font-medium text-ink">{deal.brandName}</td>
                <td>{deal.theme}</td>
                <td className="font-semibold text-teal">{formatCurrency(deal.creatorPayout)}</td>
                <td>{deal.deliverable}</td>
                <td>
                  <Link className="text-teal" href={`/demo/trade?deal=${encodeURIComponent(deal.id)}`}>
                    查看交易
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function BrandWorkspace() {
  return (
    <div className="space-y-5">
      <section className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SectionTitle icon={Building2} title="商家投放工作台" />
            <p className="mt-2 text-sm leading-6 text-slate-600">从品牌需求、达人推荐、赛道判断到透明交易和客户报告，按投放流程推进。</p>
          </div>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">隐藏差价 ¥0</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <WorkspaceLink href="/demo/brand" icon={Users} title="品牌方视角" description="查看推荐达人、报价和推荐理由" />
          <WorkspaceLink href="/demo/industry" icon={BarChart3} title="赛道看板" description="判断内容阵地、竞品和热词趋势" />
          <WorkspaceLink href="/demo/trade" icon={Scale} title="透明交易" description="确认品牌支付、达人到账和服务费" />
          <WorkspaceLink href="/demo/report" icon={FileText} title="一键报告" description="生成可发给客户的投放报告" />
        </div>
      </section>
    </div>
  );
}

function WorkspaceLink({
  href,
  icon: Icon,
  title,
  description
}: {
  href: string;
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <Link className="rounded-lg border border-line bg-white p-4 transition hover:border-teal/40 hover:bg-teal/5" href={href}>
      <Icon className="text-teal" size={20} />
      <div className="mt-3 font-semibold text-ink">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}

function AccessGate({
  role,
  requestedTab,
  onLogin
}: {
  role: DemoRole;
  requestedTab: TabId;
  onLogin: (role: "brand") => void;
}) {
  const requestedLabel = tabs.find((tab) => tab.id === requestedTab)?.label || "当前页面";
  return (
    <section className="panel flex min-h-64 items-center justify-center p-6 text-center">
      <div className="max-w-lg">
        <Scale className="mx-auto text-slate-400" size={34} />
        <h2 className="mt-3 text-lg font-semibold text-ink">需要切换身份查看{requestedLabel}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {role === "creator"
            ? "达人账号只能查看接单情况、达人视角和透明交易。"
            : role === "brand"
              ? "商家账号只能查看品牌方视角、赛道看板、透明交易和一键报告。"
              : "未登录状态只开放标语展示和达人查询匹配体验。"}
        </p>
        {role === "guest" ? (
          <div className="mt-4 flex justify-center">
            <button className="btn" onClick={() => onLogin("brand")} type="button">
              <Building2 size={16} />
              商家登录
            </button>
          </div>
        ) : (
          <Link className="btn mt-4 justify-center" href="/demo">
            返回工作台
          </Link>
        )}
      </div>
    </section>
  );
}

function CreatorView({ onAcceptDeal }: { onAcceptDeal: (deal: Deal) => void }) {
  const [profileUrl, setProfileUrl] = useState("");
  const [profile, setProfile] = useState<XhsCreatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resolvedBy, setResolvedBy] = useState("");
  const [dealBatchIndex, setDealBatchIndex] = useState(0);
  const displayCreator = useMemo(() => buildDisplayCreator(profile), [profile]);
  const pricing = useMemo(() => buildPricingBreakdown(displayCreator), [displayCreator]);
  const matchedDeals = useMemo(() => buildMatchedDeals(displayCreator, dealBatchIndex), [displayCreator, dealBatchIndex]);

  async function searchCreator() {
    const query = profileUrl.trim();
    if (!query) {
      setMessage("请输入小红书主页链接、user_id 或小红书号");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      setResolvedBy("");
      const resolved = await api.resolveXhsUser(query);
      setResolvedBy(resolved.match_type);
      setProfile(await api.xhsCreatorProfile(resolved.user_id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "达人数据获取失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="panel p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <SectionTitle icon={Search} title="小红书达人搜索" />
            <p className="mt-2 text-sm text-slate-600">输入达人主页链接、user_id 或小红书号，系统会自动解析并更新当前身价测算。</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="control min-w-80"
              placeholder="粘贴主页链接 / 输入 user_id / 输入小红书号"
              value={profileUrl}
              onChange={(event) => setProfileUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") searchCreator();
              }}
            />
            <button className="btn justify-center" disabled={loading} onClick={searchCreator} type="button">
              <Search size={16} />
              {loading ? "查询中" : "查询达人"}
            </button>
          </div>
        </div>
        {message ? <div className="mt-3 rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-sm text-coral">{message}</div> : null}
        {profile ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-teal/10 px-2.5 py-1 font-medium text-teal">已接入实时数据</span>
            {profile.source ? <span>来源: {profile.source === "tikhub" ? "TikHub" : profile.source}</span> : null}
            {resolvedBy ? <span>匹配方式: {formatResolvedBy(resolvedBy)}</span> : null}
            <span>UID: {profile.user_id}</span>
            {profile.red_id ? <span>小红书号: {profile.red_id}</span> : null}
            {profile.account_status ? <span className="rounded-full bg-coral/10 px-2.5 py-1 font-medium text-coral">{profile.account_status}</span> : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="panel p-4">
          <SectionTitle icon={UserRound} title="达人基础信息" />
          <div className="mt-4 flex items-start gap-3">
            {displayCreator.avatarUrl ? (
              <img className="h-14 w-14 rounded-lg border border-line object-cover" src={displayCreator.avatarUrl} alt="" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-teal/10 text-lg font-semibold text-teal">
                {displayCreator.nickname.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-lg font-semibold text-ink">{displayCreator.nickname}</div>
              <div className="mt-1 text-sm text-slate-500">
                {displayCreator.platform}
                {displayCreator.redId ? ` · 小红书号 ${displayCreator.redId}` : ""}
                {displayCreator.location ? ` · ${displayCreator.location}` : ""}
              </div>
              {displayCreator.accountStatus ? <div className="mt-2 text-sm font-medium text-coral">{displayCreator.accountStatus}</div> : null}
              {displayCreator.bio ? <div className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{displayCreator.bio}</div> : null}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="粉丝数" value={displayCreator.followersDisplay} />
            <Metric label="关注数" value={displayCreator.followingDisplay} />
            <Metric label="获赞/收藏" value={displayCreator.interactionsDisplay} />
            <Metric label="笔记数" value={displayCreator.noteCountDisplay} />
            <Metric label="小红书号" value={displayCreator.redId || "-"} />
            <Metric label="地区" value={displayCreator.location || "-"} />
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <div className="text-xs font-medium text-slate-500">主要赛道</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {displayCreator.tracks.map((track) => (
                <span key={track} className="rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
                  {track}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <SectionTitle icon={WalletCards} title="达人当前身价" />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="text-sm text-slate-500">当前商单参考报价</div>
              <div className="mt-1 text-2xl font-semibold text-ink">
                {formatCurrency(displayCreator.quoteRange[0])} - {formatCurrency(displayCreator.quoteRange[1])} / 条
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-left sm:text-right">
              <div className="text-sm text-amber-700">建议报价</div>
              <div className="text-2xl font-semibold text-amber-800">{formatCurrency(displayCreator.suggestedQuote)} / 条</div>
            </div>
          </div>
          <div className="mt-4 divide-y divide-line rounded-lg border border-line">
            {pricing.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-medium text-ink">
                  {item.prefix || ""}
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-50 px-3 py-3 text-sm font-semibold">
              <span>最终建议报价</span>
              <span>{formatCurrency(displayCreator.suggestedQuote)}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Highlight label="品牌支付给达人" value={formatCurrency(displayCreator.suggestedQuote)} />
            <Highlight label="达人实际到账" value={formatCurrency(displayCreator.suggestedQuote)} />
            <Highlight label="隐藏差价" value="¥0" danger />
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader title="匹配商单" description="平台按赛道、地区、粉丝量和报价透明度匹配当前可接合作。" />
          <button className="btn secondary justify-center" onClick={() => setDealBatchIndex((current) => current + 1)} type="button">
            <RefreshCw size={16} />
            换一批
          </button>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {matchedDeals.map((deal) => (
            <article key={deal.id} className="panel flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">品牌</div>
                  <h3 className="mt-1 text-lg font-semibold text-ink">{deal.brandName}</h3>
                </div>
                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">{deal.keywordMatch}% 匹配</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {deal.reasonTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <InfoLine label="合作主题" value={deal.theme} />
                <InfoLine label="预算区间" value={`${formatCurrency(deal.budgetMin)} - ${formatCurrency(deal.budgetMax)} / 条`} />
                <InfoLine label="交付要求" value={deal.deliverable} />
                <InfoLine label="推荐理由" value={buildDealReason(deal, displayCreator)} />
                <InfoLine label="达人预计到账" value={formatCurrency(deal.creatorPayout)} strong />
              </dl>
              <button className="btn mt-5 justify-center" data-testid={`accept-${deal.id}`} onClick={() => onAcceptDeal(deal)} type="button">
                <CheckCircle2 size={16} />
                接受合作
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BrandView() {
  const [selectedTrack, setSelectedTrack] = useState<EducationMarketplaceTrack>("青少年成长");
  const [batchIndex, setBatchIndex] = useState(0);
  const scoredCreators = useMemo(() => buildEducationRecommendations(selectedTrack), [selectedTrack]);
  const batchSize = 10;
  const batchCount = Math.max(1, Math.ceil(scoredCreators.length / batchSize));
  const normalizedBatchIndex = batchIndex % batchCount;
  const displayedCreators = scoredCreators.slice(normalizedBatchIndex * batchSize, normalizedBatchIndex * batchSize + batchSize);
  const brandBrief = buildEducationBrandBrief(selectedTrack);

  function changeTrack(track: EducationMarketplaceTrack) {
    setSelectedTrack(track);
    setBatchIndex(0);
  }

  return (
    <div className="space-y-5">
      <section className="panel p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <SectionTitle icon={Building2} title="品牌需求卡片" />
          </div>
          <div className="grid gap-2 sm:grid-cols-[220px_auto] sm:items-end">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-500">选择赛道</span>
              <select
                className="control w-full"
                value={selectedTrack}
                onChange={(event) => changeTrack(event.target.value as EducationMarketplaceTrack)}
              >
                {educationMarketplaceTracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn secondary justify-center" onClick={() => setBatchIndex((current) => current + 1)} type="button">
              <RefreshCw size={16} />
              换一批
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="品牌" value={brandBrief.name} />
          <Metric label="行业 / 赛道" value={brandBrief.industry} />
          <Metric label="目标城市" value={brandBrief.city} />
          <Metric label="目标人群" value={brandBrief.audience} />
          <Metric label="投放目标" value={brandBrief.goal} />
          <Metric label="预算" value={formatCurrency(brandBrief.budget)} />
        </div>
      </section>

      <section className="panel table-scroll">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectionTitle icon={Users} title="推荐达人列表" />
          </div>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">默认图文报价</span>
        </div>
        <table className="app-table min-w-[760px]">
          <thead>
            <tr>
              <th>达人昵称</th>
              <th>地区</th>
              <th>赛道</th>
              <th>粉丝数</th>
              <th>原始报价</th>
              <th>建议报价</th>
            </tr>
          </thead>
          <tbody>
            {displayedCreators.map((creator) => (
              <tr key={creator.userId}>
                <td>
                  <div className="font-medium text-ink">{creator.name}</div>
                </td>
                <td>{creator.location || "-"}</td>
                <td>
                  <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                    {creator.sourceTracks[0] || selectedTrack}
                  </span>
                </td>
                <td>{formatNumber(creator.fansNum)}</td>
                <td>{formatCurrency(creator.picturePrice)}</td>
                <td className="font-semibold text-teal">{formatCurrency(creator.suggestedQuote)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function IndustryView() {
  const [selectedTrack, setSelectedTrack] = useState<IndustryTrack>("学科提分");
  const selectedIndustry = industryDataByTrack[selectedTrack];
  const maxKeywordGrowth = Math.max(...selectedIndustry.keywordTrends.map((keyword) => keyword.growth));
  const displayedContentThemes = selectedIndustry.contentThemes;

  return (
    <div className="space-y-5">
      <section className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SectionTitle icon={Target} title="赛道概览" />
            <p className="mt-2 text-sm text-slate-600">选择教育细分赛道，查看本地小红书采集库里的内容主题、参与账号和热词变化。</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-2xl lg:justify-end" aria-label="选择赛道">
            {industryTracks.map((track) => {
              const active = selectedTrack === track;
              return (
                <button
                  key={track}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active ? "border-teal bg-teal text-white" : "border-line bg-white text-slate-700 hover:border-teal/40 hover:bg-teal/5"
                  }`}
                  onClick={() => setSelectedTrack(track)}
                  type="button"
                >
                  {track}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="赛道" value={selectedIndustry.overview.track} />
          <Metric label="监控周期" value={selectedIndustry.overview.period} />
          <Metric label="内容主题" value={`${selectedIndustry.overview.themeCount}个`} />
          <Metric label="参与账号" value={`${selectedIndustry.overview.accountCount}个`} />
          <Metric label="匹配笔记" value={`${formatNumber(selectedIndustry.overview.noteCount)}条`} />
          <Metric label="高互动内容" value={`${selectedIndustry.overview.highInteractionPosts}条`} />
        </div>
      </section>

      <section className="panel table-scroll">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle icon={TrendingUp} title="赛道内容阵地" />
          <div className="text-sm text-slate-500">基于本地采集库统计，展示内容量、账号参与度和互动表现较高的主题。</div>
        </div>
        <table className="app-table">
          <thead>
            <tr>
              <th>内容主题</th>
              <th>近30天笔记</th>
              <th>参与账号</th>
              <th>估算曝光</th>
              <th>互动量</th>
              <th>热度变化</th>
            </tr>
          </thead>
          <tbody>
            {displayedContentThemes.map((item) => (
              <tr key={item.themeName}>
                <td className="font-medium text-ink">{item.themeName}</td>
                <td>{item.noteCount30d}条笔记</td>
                <td>{item.accountCount}个账号</td>
                <td>{formatWan(item.estimatedExposure)}曝光</td>
                <td>{formatNumber(item.interactions)}</td>
                <td>
                  <span className="rounded-full bg-teal/10 px-2 py-1 text-xs font-semibold text-teal">{item.trend}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel p-4">
        <SectionTitle icon={BarChart3} title="赛道热词趋势" />
        <div className="mt-4 space-y-3">
          {selectedIndustry.keywordTrends.map((keyword, index) => (
            <div key={keyword.keyword} className="grid gap-2 sm:grid-cols-[180px_1fr_70px] sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                  {index + 1}
                </span>
                {keyword.keyword}
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal" style={{ width: `${(keyword.growth / maxKeywordGrowth) * 100}%` }} />
              </div>
              <div className="text-sm font-semibold text-coral">+{keyword.growth}%</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TradeView({
  selectedDeal,
  tradeStep,
  onAdvance
}: {
  selectedDeal: Deal;
  tradeStep: number;
  onAdvance: () => void;
}) {
  return (
    <div className="space-y-5">
      <section className="panel p-4">
        <SectionTitle icon={ReceiptText} title="交易确认卡片" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <Metric label="品牌方" value={selectedDeal.brandName} />
            <Metric label="达人" value={featuredCreator.nickname} />
            <Metric label="合作内容" value={selectedDeal.deliverable} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Highlight label="品牌支付给达人" value={formatCurrency(selectedDeal.budget)} />
            <Highlight label="达人实际到账" value={formatCurrency(selectedDeal.creatorPayout)} />
            <Highlight label="平台服务费" value="¥0" />
            <Highlight label="隐藏差价" value="¥0" danger />
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-teal/20 bg-teal/5 p-4 text-sm leading-6 text-teal">
          达人报价、品牌支付、达人到账全部公开。平台不通过压低达人报价或抬高品牌预算赚取隐形差价。
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle icon={Handshake} title="模拟交易状态" />
          <button className="btn" data-testid="advance-trade" onClick={onAdvance} type="button">
            <ArrowRight size={16} />
            模拟支付 / 推进状态
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-6">
          {tradeStatuses.map((status, index) => {
            const done = index <= tradeStep;
            return (
              <div
                key={status}
                className={`rounded-lg border p-3 text-sm ${
                  done ? "border-teal bg-teal/5 text-teal" : "border-line bg-white text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="font-medium">{status}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-sm text-slate-600">
          当前状态：<span className="font-semibold text-ink">{tradeStatuses[tradeStep]}</span>
        </div>
      </section>
    </div>
  );
}

function ReportView({ selectedDeal }: { selectedDeal: Deal }) {
  const [selectedTrack, setSelectedTrack] = useState<IndustryTrack>("学科提分");
  const [reports, setReports] = useState<DemoTrackReports | null>(null);
  const [generatedTracks, setGeneratedTracks] = useState<Partial<Record<IndustryTrack, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const selectedReport = generatedTracks[selectedTrack] ? reports?.[selectedTrack] : null;
  const canUseReport = Boolean(selectedReport) && !loading;

  async function loadReport(track: IndustryTrack) {
    if (reports?.[track]) return reports[track];
    const response = await fetch(`${DEMO_REPORTS_PATH}?track=${encodeURIComponent(track)}`);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "本地报告文件读取失败，请检查 data 目录中的 report.md");
    }
    const payload = (await response.json()) as DemoTrackReport;
    setReports((current) => ({ ...current, [track]: payload }));
    return payload;
  }

  async function generateReport() {
    setLoading(true);
    setMessage("");
    try {
      await wait(REPORT_GENERATION_DELAY_MS);
      const report = await loadReport(selectedTrack);
      if (!report) {
        throw new Error("当前赛道暂无本地报告，请补充报告文件后重试");
      }
      setGeneratedTracks((current) => ({ ...current, [selectedTrack]: true }));
      setMessage(`${selectedTrack}报告已生成`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "报告生成失败");
    } finally {
      setLoading(false);
    }
  }

  function exportJson() {
    if (!selectedReport) {
      setMessage("请先生成当前赛道报告");
      return;
    }
    const payload = {
      report: selectedReport,
      selectedDeal,
      transparencyFormula: "品牌支付金额 = 达人到账金额 + 明示平台服务费；隐藏差价 = 0"
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `xiaohuangque-${selectedTrack}-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("已导出当前赛道报告 JSON");
  }

  async function copyReport() {
    if (!selectedReport) {
      setMessage("请先生成当前赛道报告");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildTrackReportText(selectedReport, selectedDeal));
      setMessage("已复制当前赛道报告内容");
    } catch {
      setMessage("复制失败，请使用浏览器手动复制");
    }
  }

  return (
    <div className="space-y-5">
      <section className="demo-actions panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SectionTitle icon={Clipboard} title="报告生成" />
            <div className="mt-4 flex flex-wrap gap-2" aria-label="选择报告赛道">
              {industryTracks.map((track) => {
                const active = selectedTrack === track;
                const generated = generatedTracks[track];
                return (
                  <button
                    key={track}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      active ? "border-teal bg-teal text-white" : "border-line bg-white text-slate-700 hover:border-teal/40 hover:bg-teal/5"
                    }`}
                    disabled={loading}
                    onClick={() => {
                      setSelectedTrack(track);
                      setMessage(generated ? `${track}报告已生成` : "");
                    }}
                    type="button"
                  >
                    {track}
                    {generated ? <span className="ml-1 opacity-80">已生成</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" data-testid="generate-report" disabled={loading} onClick={generateReport} type="button">
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <FileText size={16} />}
              {loading ? "生成中" : "一键生成"}
            </button>
            <button className="btn secondary" data-testid="print-report" disabled={!canUseReport} onClick={() => window.print()} type="button">
              <Printer size={16} />
              打印 / 导出 PDF
            </button>
            <button className="btn secondary" data-testid="export-json" disabled={!canUseReport} onClick={exportJson} type="button">
              <Download size={16} />
              导出 JSON
            </button>
            <button className="btn secondary" data-testid="copy-report" disabled={!canUseReport} onClick={copyReport} type="button">
              <Copy size={16} />
              复制报告内容
            </button>
          </div>
        </div>
        {message ? <div className="mt-3 text-sm text-slate-500">{message}</div> : null}
      </section>

      {loading ? (
        <section className="panel flex min-h-64 items-center justify-center p-6 text-center">
          <div>
            <RefreshCw className="mx-auto animate-spin text-teal" size={32} />
            <div className="mt-3 font-medium text-ink">正在生成{selectedTrack}报告</div>
            <p className="mt-2 text-sm text-slate-500">系统正在整理赛道趋势、内容主题、用户痛点和商单建议。</p>
          </div>
        </section>
      ) : selectedReport ? (
        <section className="demo-report panel p-5">
          <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-teal">小黄雀透明商单推荐报告</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">{selectedReport.title}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                已生成当前赛道的完整小红书内容分析报告，可直接打印、导出或复制给品牌客户查看。
              </p>
            </div>
            <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">隐藏差价 ¥0</span>
          </div>

          <div className="mt-5">
            <MarkdownReport markdown={selectedReport.markdown} />
            <div className="mt-6 rounded-lg border border-teal/20 bg-teal/5 p-4 text-sm leading-6 text-teal">
              品牌支付金额 = 达人到账金额 + 明示平台服务费。本次示例中，品牌支付 {formatCurrency(selectedDeal.budget)}，
              达人到账 {formatCurrency(selectedDeal.creatorPayout)}，平台服务费 ¥0，隐藏差价 ¥0。
            </div>
          </div>
        </section>
      ) : (
        <section className="panel flex min-h-64 items-center justify-center p-6 text-center">
          <div>
            <Eye className="mx-auto text-slate-400" size={32} />
            <div className="mt-3 font-medium text-ink">点击“一键生成”查看{selectedTrack}报告</div>
            <p className="mt-2 text-sm text-slate-500">报告生成后可以打印、导出 JSON 或复制报告内容。</p>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof UserRound; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-teal" />
      <h2 className="font-semibold text-ink">{title}</h2>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold leading-5 text-ink">{value}</div>
    </div>
  );
}

function Highlight({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-3 ${danger ? "border-coral/30 bg-coral/5" : "border-teal/20 bg-teal/5"}`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${danger ? "text-coral" : "text-teal"}`}>{value}</div>
    </div>
  );
}

function FormulaItem({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 font-semibold ${strong ? "text-coral" : "text-ink"}`}>{value}</div>
    </div>
  );
}

function InfoLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 leading-5 ${strong ? "font-semibold text-teal" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

function buildTrackReportText(report: DemoTrackReport, selectedDeal: Deal) {
  return [
    report.title,
    "",
    report.markdown,
    "",
    `透明报价说明：品牌支付${formatCurrency(selectedDeal.budget)}，达人到账${formatCurrency(selectedDeal.creatorPayout)}，平台服务费¥0，隐藏差价¥0。`
  ].join("\n");
}

type MarkdownNode =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

function MarkdownReport({ markdown }: { markdown: string }) {
  const nodes = useMemo(() => {
    const parsed = parseSimpleMarkdown(markdown);
    return parsed[0]?.type === "h1" ? parsed.slice(1) : parsed;
  }, [markdown]);

  return (
    <article className="space-y-4">
      {nodes.map((node, index) => {
        if (node.type === "h2") {
          return (
            <h3
              key={`${node.type}-${index}`}
              className="border-t border-line pt-5 text-base font-semibold text-ink first:border-t-0 first:pt-0"
            >
              {node.text}
            </h3>
          );
        }
        if (node.type === "h3") {
          return (
            <h4 key={`${node.type}-${index}`} className="pt-1 text-sm font-semibold text-teal">
              {node.text}
            </h4>
          );
        }
        if (node.type === "ul") {
          return (
            <ul key={`${node.type}-${index}`} className="space-y-2">
              {node.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={15} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`${node.type}-${index}`} className="text-sm leading-7 text-slate-700">
            {node.text}
          </p>
        );
      })}
    </article>
  );
}

function parseSimpleMarkdown(markdown: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  const paragraph: string[] = [];
  let list: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    nodes.push({ type: "p", text: paragraph.join(" ") });
    paragraph.length = 0;
  }

  function flushList() {
    if (!list.length) return;
    nodes.push({ type: "ul", items: list });
    list = [];
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      nodes.push({ type: `h${heading[1].length}` as "h1" | "h2" | "h3", text: heading[2] });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return nodes;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type EducationBrandBrief = {
  name: string;
  industry: string;
  audience: string;
  goal: string;
  budget: number;
  city: string;
};

type EducationRecommendation = PgyEducationCreator & {
  displayTags: string[];
  contentCount: number;
  interactionsMetric: number;
  trafficMetric: number;
  stabilityMetric: number;
  engagementRate: number;
  quoteFactor: number;
  suggestedQuote: number;
  sortScore: number;
};

function buildEducationBrandBrief(track: EducationMarketplaceTrack): EducationBrandBrief {
  const byTrack: Partial<Record<EducationMarketplaceTrack, Omit<EducationBrandBrief, "city">>> = {
    学科提分: {
      name: "学科提分训练营",
      industry: "学科提分",
      audience: "小学高年级、初高中学生和家长",
      goal: "推广试听课和学习资料领取",
      budget: 260000
    },
    升学择校: {
      name: "升学择校规划咨询",
      industry: "升学择校",
      audience: "小升初、中考、高考和国际升学家庭",
      goal: "推广一对一规划咨询和择校说明会",
      budget: 320000
    },
    素质能力: {
      name: "项目式素质能力营",
      industry: "素质能力",
      audience: "关注表达力、科学、美育和领导力的家庭",
      goal: "推广体验课和项目营报名",
      budget: 210000
    },
    研学营地: {
      name: "青少年研学营地",
      industry: "研学营地",
      audience: "7-16岁学生家庭",
      goal: "招募周末营、夏令营和自然研学报名",
      budget: 200000
    },
    家庭教育: {
      name: "家庭沟通成长课",
      industry: "家庭教育",
      audience: "关注青春期沟通、厌学和亲子关系的家长",
      goal: "获取家庭教育课程咨询",
      budget: 180000
    },
    低龄启蒙: {
      name: "低龄启蒙学习力中心",
      industry: "低龄启蒙",
      audience: "幼小衔接、小学低年级学生家长",
      goal: "推广阅读、表达、数学思维和英语启蒙体验课",
      budget: 180000
    },
    青少年成长: {
      name: "青少年成长营",
      industry: "青少年成长",
      audience: "小初高学生 / 家长",
      goal: "招募体验课、成长营和咨询线索",
      budget: 300000
    }
  };

  return {
    city: "全国",
    ...(byTrack[track] || byTrack["学科提分"]!)
  };
}

function buildEducationRecommendations(track: EducationMarketplaceTrack): EducationRecommendation[] {
  return generatedPgyCreators
    .filter((creator) => creator.sourceTracks.includes(track))
    .map((creator) => {
      const displayTags = buildCreatorDisplayTags(creator);
      const contentCount = creator.contentCount ?? 0;
      const interactionsMetric = creator.interactions ?? creator.interMidNum ?? 0;
      const trafficMetric = creator.clickMidNum ?? Math.max(contentCount * 1200, interactionsMetric * 8, Math.round(creator.fansNum * 0.08));
      const stabilityMetric = creator.hundredLikePercent30 ?? confidenceToStability(creator.confidence);
      const engagementRate = roundPercent((interactionsMetric / Math.max(trafficMetric, 1)) * 100);
      const matchScore = calculateTrackMatchScore(creator, track);
      const quoteFactor = calculateQuoteFactor(creator, track, engagementRate, matchScore, trafficMetric, stabilityMetric);
      const suggestedQuote = roundToHundred(basePicturePrice(creator) * quoteFactor);
      const sortScore = calculateSortScore(creator, matchScore, engagementRate, trafficMetric, stabilityMetric);

      return {
        ...creator,
        displayTags,
        contentCount,
        interactionsMetric,
        trafficMetric,
        stabilityMetric,
        engagementRate,
        quoteFactor,
        suggestedQuote,
        picturePrice: basePicturePrice(creator),
        sortScore
      };
    })
    .sort((a, b) => b.sortScore - a.sortScore || b.score - a.score || b.fansNum - a.fansNum);
}

function buildCreatorDisplayTags(creator: PgyEducationCreator) {
  return [
    creator.contentTags.taxonomy1Tag,
    ...creator.contentTags.taxonomy2Tags,
    ...creator.personalTags,
    ...creator.keywords.split(",").map((keyword) => keyword.trim())
  ]
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .slice(0, 5);
}

function calculateTrackMatchScore(creator: PgyEducationCreator, track: EducationMarketplaceTrack) {
  let score = creator.sourceTracks.includes(track) ? 82 : 54;
  const searchable = [
    creator.contentTags.taxonomy1Tag,
    ...creator.contentTags.taxonomy2Tags,
    ...creator.personalTags,
    creator.keywords
  ].join(" ");

  if (searchable.includes(track)) score += 10;
  if (track === "学科提分" && /数学|语文|英语|物理|化学|学科|提分|教辅|中考|高考/.test(searchable)) score += 10;
  if (track === "升学择校" && /升学|择校|规划|中考|高考|志愿|小升初|国际|留学|双语|IB|AP/.test(searchable)) score += 10;
  if (track === "素质能力" && /素质|科学|美育|领导力|项目式|表达|自然/.test(searchable)) score += 10;
  if (track === "研学营地" && /户外|研学|自然|营地|夏令营|周末营/.test(searchable)) score += 10;
  if (track === "家庭教育" && /家庭|亲子|家长|沟通|青春期/.test(searchable)) score += 10;
  if (track === "低龄启蒙" && /小学|低龄|启蒙|阅读|英语|语文|数学思维|幼小/.test(searchable)) score += 10;
  if (track === "青少年成长" && /青少年|青春期|中考|高考|小学|初中|高中|亲子|家庭|营地|成长/.test(searchable)) score += 8;

  return clamp(score, 45, 99);
}

function calculateQuoteFactor(
  creator: PgyEducationCreator,
  track: EducationMarketplaceTrack,
  engagementRate: number,
  matchScore: number,
  trafficMetric: number,
  stabilityMetric: number
) {
  let factor = 1;

  if (matchScore >= 92) factor += 0.1;
  else if (matchScore >= 82) factor += 0.05;
  else if (matchScore < 65) factor -= 0.15;

  if (creator.keywords.includes(track)) factor += 0.05;
  if (engagementRate >= 8) factor += 0.05;
  else if (engagementRate < 4.5) factor -= 0.08;

  if (stabilityMetric >= 90) factor += 0.05;
  else if (stabilityMetric < 70) factor -= 0.06;

  if (creator.score >= 6200) factor += 0.05;
  else if (creator.score < 4600) factor -= 0.08;

  if (trafficMetric < 10000) factor -= 0.05;
  if (basePicturePrice(creator) > 50000 && matchScore < 90) factor -= 0.08;

  return clamp(Number(factor.toFixed(2)), 0.6, 1.2);
}

function calculateSortScore(
  creator: PgyEducationCreator,
  matchScore: number,
  engagementRate: number,
  trafficMetric: number,
  stabilityMetric: number
) {
  const engagementScore = clamp(engagementRate * 10, 35, 100);
  const trafficScore = clamp(trafficMetric / 400, 35, 100);
  const stabilityScore = clamp(stabilityMetric, 40, 100);
  const platformScore = clamp(creator.score / 70, 45, 100);
  return Math.round(matchScore * 0.4 + engagementScore * 0.22 + trafficScore * 0.18 + stabilityScore * 0.12 + platformScore * 0.08);
}

function basePicturePrice(creator: PgyEducationCreator) {
  if (creator.picturePrice > 0) return creator.picturePrice;
  const followerQuote = creator.fansNum < 5000 ? 300 : creator.fansNum < 20000 ? 800 : creator.fansNum < 100000 ? 2500 : 6000;
  return roundToHundred(followerQuote);
}

function confidenceToStability(confidence?: string) {
  if (confidence === "high") return 92;
  if (confidence === "medium") return 78;
  if (confidence === "low") return 58;
  return 70;
}

function roundToHundred(value: number) {
  return Math.max(300, Math.round(value / 100) * 100);
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type DisplayCreator = {
  nickname: string;
  platform: string;
  avatarUrl?: string | null;
  redId?: string | null;
  bio?: string | null;
  location?: string | null;
  accountStatus?: string | null;
  followers: number;
  followersDisplay: string;
  following: number;
  followingDisplay: string;
  exposure30d: number;
  exposureDisplay: string;
  interactions30d: number;
  interactionsDisplay: string;
  engagementRate: number;
  noteCount: number;
  noteCountDisplay: string;
  tracks: string[];
  pricedTrackCount: number;
  quoteRange: [number, number];
  suggestedQuote: number;
};

function buildDisplayCreator(profile: XhsCreatorProfile | null): DisplayCreator {
  if (!profile) {
    return {
      nickname: featuredCreator.nickname,
      platform: featuredCreator.platform,
      followers: featuredCreator.followers,
      followersDisplay: formatNumber(featuredCreator.followers),
      following: 0,
      followingDisplay: "0",
      exposure30d: featuredCreator.exposure30d,
      exposureDisplay: formatNumber(featuredCreator.exposure30d),
      interactions30d: featuredCreator.interactions30d,
      interactionsDisplay: formatNumber(featuredCreator.interactions30d),
      engagementRate: featuredCreator.engagementRate,
      noteCount: 0,
      noteCountDisplay: "0",
      tracks: featuredCreator.tracks,
      pricedTrackCount: featuredCreator.tracks.length,
      quoteRange: featuredCreator.quoteRange,
      suggestedQuote: featuredCreator.suggestedQuote
    };
  }

  const rawData = getXhsRawData(profile.raw);
  const followersDisplay = profile.follower_count_display || pickRawDisplay(rawData, "fans", "fans_count", "followers", "follower_count", "fansCount");
  const followingDisplay = profile.following_count_display || pickRawDisplay(rawData, "follows", "following", "following_count", "follows_count");
  const interactionDisplay =
    profile.like_and_collect_display || pickRawDisplay(rawData, "like_and_collect", "liked_count", "likedCount", "likes", "total_likes", "liked");
  const noteDisplay = profile.note_count_display || pickRawDisplay(rawData, "note_count", "noteCount", "notes", "posted_count", "post_count");
  const followers = profile.follower_count || parseCompactCount(followersDisplay);
  const following = profile.following_count || parseCompactCount(followingDisplay);
  const interactions = profile.liked_count + profile.collected_count || parseCompactCount(interactionDisplay);
  const noteCount = profile.note_count || parseCompactCount(noteDisplay);
  const engagementRate = profile.engagement_rate || (followers ? roundPercent((interactions / followers) * 100) : 0);
  const exposure = estimateExposure(followers, interactions, noteCount);
  const tracks = profile.category_tags.length ? profile.category_tags.slice(0, 5) : ["小红书达人", "内容种草", "本地生活"];
  const pricedTrackCount = profile.category_tags.length ? tracks.length : 0;
  const suggestedQuote = estimateQuote(followers, exposure, interactions, engagementRate, noteCount, pricedTrackCount);
  const quoteSpread = Math.max(50, Math.round(suggestedQuote * 0.25));

  return {
    nickname: profile.nickname || `小红书达人 ${profile.user_id}`,
    platform: "小红书",
    avatarUrl: profile.avatar_url,
    redId: profile.red_id,
    bio: profile.bio,
      location: profile.location || profile.ip_location,
      accountStatus: profile.account_status,
      followers,
      followersDisplay: followersDisplay || formatNumber(followers),
      following,
      followingDisplay: followingDisplay || formatNumber(following),
      exposure30d: exposure,
      exposureDisplay: formatNumber(exposure),
      interactions30d: interactions,
      interactionsDisplay: interactionDisplay || formatNumber(interactions),
      engagementRate,
      noteCount,
      noteCountDisplay: noteDisplay || formatNumber(noteCount),
    tracks,
    pricedTrackCount,
    quoteRange: [Math.max(50, suggestedQuote - quoteSpread), suggestedQuote + quoteSpread],
    suggestedQuote
  };
}

function buildMockDisplayCreator(creator: CreatorProfile): DisplayCreator {
  const estimatedNotes = Math.max(12, Math.round(creator.exposure30d / 18000));
  return {
    nickname: creator.nickname,
    platform: creator.platform,
    bio: creator.audience,
    location: creator.city,
    followers: creator.followers,
    followersDisplay: formatNumber(creator.followers),
    following: 0,
    followingDisplay: "-",
    exposure30d: creator.exposure30d,
    exposureDisplay: formatNumber(creator.exposure30d),
    interactions30d: creator.interactions30d,
    interactionsDisplay: formatNumber(creator.interactions30d),
    engagementRate: creator.engagementRate,
    noteCount: estimatedNotes,
    noteCountDisplay: formatNumber(estimatedNotes),
    tracks: creator.tracks,
    pricedTrackCount: creator.tracks.length,
    quoteRange: creator.quoteRange,
    suggestedQuote: creator.suggestedQuote
  };
}

function getXhsRawData(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const body = (raw as { body?: unknown }).body;
  if (!body || typeof body !== "object") return {};
  const data = (body as { data?: unknown }).data;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

function formatResolvedBy(value: string) {
  const labels: Record<string, string> = {
    profile_url: "主页链接",
    user_id: "user_id",
    red_id: "小红书号",
    search: "用户搜索"
  };
  return labels[value] || value;
}

function pickRawDisplay(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function parseCompactCount(value?: string | null) {
  if (!value) return 0;
  const normalized = value.replace(/,/g, "").trim().toLowerCase().replace(/\+$/, "");
  let multiplier = 1;
  let numeric = normalized;
  if (normalized.endsWith("万") || normalized.endsWith("w")) {
    multiplier = 10000;
    numeric = normalized.slice(0, -1);
  } else if (normalized.endsWith("k")) {
    multiplier = 1000;
    numeric = normalized.slice(0, -1);
  }
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? Math.round(parsed * multiplier) : 0;
}

function buildPricingBreakdown(creator: DisplayCreator) {
  const components = estimateQuoteComponents({
    followers: creator.followers,
    exposure: creator.exposure30d,
    interactions: creator.interactions30d,
    engagementRate: creator.engagementRate,
    noteCount: creator.noteCount,
    trackCount: creator.pricedTrackCount
  });

  return [
    { label: "粉丝基础价", value: components.follower },
    { label: "流量加成", value: components.traffic, prefix: "+" },
    { label: "互动资产加成", value: components.engagement, prefix: "+" },
    { label: "赛道标签加成", value: components.vertical, prefix: "+" }
  ];
}

function buildMatchedDeals(creator: DisplayCreator, batchIndex: number): Deal[] {
  const scored = mockDeals
    .map((deal) => scoreDealForCreator(deal, creator))
    .sort((a, b) => b.keywordMatch - a.keywordMatch || b.creatorPayout - a.creatorPayout);
  const batchSize = 3;
  const batchCount = Math.max(1, Math.ceil(scored.length / batchSize));
  const start = (batchIndex % batchCount) * batchSize;
  return scored.slice(start, start + batchSize);
}

function scoreDealForCreator(deal: Deal, creator: DisplayCreator): Deal {
  const trackScore = calculateDealTrackScore(deal, creator);
  const quoteScore = calculateDealQuoteScore(deal, creator.suggestedQuote);
  const followerScore = calculateDealFollowerScore(deal, creator.followers);
  const cityScore = calculateDealCityScore(deal, creator.location);
  const assetScore = calculateDealAssetScore(creator);
  const score = Math.round(trackScore * 0.4 + quoteScore * 0.25 + followerScore * 0.15 + cityScore * 0.1 + assetScore * 0.1);
  const creatorPayout = clamp(roundQuote(clamp(creator.suggestedQuote, deal.budgetMin, deal.budgetMax)), deal.budgetMin, deal.budgetMax);
  const reasonTags = buildDealReasonTags(deal, creator, {
    trackScore,
    quoteScore,
    followerScore,
    cityScore,
    assetScore
  });

  return {
    ...deal,
    budget: creatorPayout,
    creatorPayout,
    keywordMatch: clamp(score, 50, 98),
    reasonTags
  };
}

function calculateDealTrackScore(deal: Deal, creator: DisplayCreator) {
  const creatorText = normalizeMatchText([...creator.tracks, creator.bio || "", creator.nickname].join(" "));
  const matches = deal.targetTracks.filter((track) => creatorText.includes(normalizeMatchText(track)));
  if (matches.length > 0) return clamp(72 + matches.length * 12, 72, 100);
  if (deal.targetTracks.some((track) => relatedTrackText(track).some((keyword) => creatorText.includes(keyword)))) return 78;
  if (creator.tracks.includes("小红书达人") || creator.tracks.includes("内容种草")) return 64;
  return 52;
}

function calculateDealQuoteScore(deal: Deal, suggestedQuote: number) {
  if (suggestedQuote >= deal.budgetMin && suggestedQuote <= deal.budgetMax) return 100;
  const nearest = suggestedQuote < deal.budgetMin ? deal.budgetMin : deal.budgetMax;
  const gapRatio = Math.abs(suggestedQuote - nearest) / Math.max(nearest, 1);
  return clamp(Math.round(100 - gapRatio * 120), 35, 92);
}

function calculateDealFollowerScore(deal: Deal, followers: number) {
  if (followers >= deal.minFollowers && followers <= deal.maxFollowers) return 100;
  if (followers < deal.minFollowers) {
    return clamp(Math.round((followers / Math.max(deal.minFollowers, 1)) * 88), 25, 88);
  }
  const overRatio = (followers - deal.maxFollowers) / Math.max(deal.maxFollowers, 1);
  return clamp(Math.round(92 - overRatio * 45), 45, 92);
}

function calculateDealCityScore(deal: Deal, location?: string | null) {
  if (deal.city === "全国") return 92;
  if (!location) return 70;
  const locationText = normalizeMatchText(location);
  return locationText.includes(normalizeMatchText(deal.city)) ? 100 : 62;
}

function calculateDealAssetScore(creator: DisplayCreator) {
  const interactionScore = clamp(Math.sqrt(Math.max(creator.interactions30d, 0)) * 1.8, 35, 100);
  const noteScore = clamp(creator.noteCount * 2, 35, 100);
  return Math.round(interactionScore * 0.65 + noteScore * 0.35);
}

function buildDealReasonTags(
  deal: Deal,
  creator: DisplayCreator,
  scores: { trackScore: number; quoteScore: number; followerScore: number; cityScore: number; assetScore: number }
) {
  const tags = [...deal.reasonTags];
  if (scores.trackScore >= 78) tags.unshift("赛道匹配");
  if (scores.quoteScore >= 90) tags.unshift("报价合适");
  if (scores.cityScore >= 90) tags.unshift(deal.city === "全国" ? "全国可投" : `${deal.city}同城`);
  if (scores.followerScore >= 90) tags.unshift("粉丝量达标");
  if (scores.assetScore >= 80) tags.unshift("互动资产好");
  if (creator.suggestedQuote < deal.budgetMin) tags.unshift("可上探报价");
  return Array.from(new Set(tags)).slice(0, 5);
}

function buildDealReason(deal: Deal, creator: DisplayCreator) {
  const trackMatch = deal.targetTracks.filter((track) => creator.tracks.some((creatorTrack) => normalizeMatchText(creatorTrack).includes(normalizeMatchText(track))));
  const parts = [
    trackMatch.length ? `赛道贴合 ${trackMatch.slice(0, 2).join("、")}` : `目标赛道 ${deal.targetTracks.slice(0, 2).join("、")}`,
    deal.city === "全国" ? "全国可投放" : `${deal.city}投放`,
    `预算覆盖 ${formatCurrency(deal.budgetMin)}-${formatCurrency(deal.budgetMax)}`
  ];
  return parts.join(" · ");
}

function relatedTrackText(track: string) {
  const map: Record<string, string[]> = {
    青少年成长: ["教育", "家庭", "亲子", "校园", "成长", "学习"],
    学科提分: ["学习", "提分", "数学", "英语", "备考", "课程"],
    教育成长: ["教育", "学习", "课程", "家长", "孩子", "成长"],
    素质能力: ["科学", "美育", "表达", "项目式", "能力", "启蒙"],
    升学择校: ["升学", "择校", "中考", "小升初", "规划", "学校"],
    家庭教育: ["亲子", "家长", "孩子", "青春期", "沟通"],
    低龄启蒙: ["亲子", "阅读", "启蒙", "英语", "少儿"],
    母婴亲子: ["亲子", "孩子", "宝宝", "家庭"],
    校园生活: ["校园", "学生", "大学", "宿舍", "学校"],
    深圳探店: ["深圳", "探店", "本地", "同城"],
    本地生活: ["本地", "同城", "探店", "周末", "消费"],
    本地消费: ["消费", "优惠", "团购", "门店"],
    精致消费: ["消费", "女性", "白领", "护肤", "穿搭", "生活方式"],
    咖啡甜品: ["咖啡", "甜品", "下午茶", "探店"],
    美食探店: ["美食", "吃", "探店", "餐厅", "火锅"],
    旅游出行: ["旅游", "旅行", "出行", "路线", "攻略"],
    研学营地: ["研学", "营地", "自然", "夏令营"],
    亲子出行: ["亲子", "周末", "露营", "研学"],
    美妆穿搭: ["美妆", "穿搭", "护肤", "妆容", "ootd"],
    健康健身: ["健身", "运动", "普拉提", "健康"]
  };
  return (map[track] || [track]).map(normalizeMatchText);
}

function normalizeMatchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function estimateExposure(followers: number, interactions: number, noteCount: number) {
  if (noteCount <= 0) return Math.round(Math.max(followers * 6, interactions * 1.4));
  const averageInteraction = interactions / Math.max(noteCount, 1);
  const perNoteReach = Math.min(2500, Math.max(120, followers * 0.15 + averageInteraction * 6));
  return Math.round(Math.max(followers * 6, interactions * 1.4, noteCount * perNoteReach));
}

function estimateQuote(
  followers: number,
  exposure: number,
  interactions: number,
  engagementRate: number,
  noteCount: number,
  trackCount: number
) {
  const components = estimateQuoteComponents({ followers, exposure, interactions, engagementRate, noteCount, trackCount });
  const raw = components.follower + components.traffic + components.engagement + components.vertical;
  return roundQuote(clamp(raw, quoteFloorByFollowers(followers), quoteCapByFollowers(followers)));
}

function estimateQuoteComponents({
  followers,
  exposure,
  interactions,
  engagementRate,
  trackCount
}: {
  followers: number;
  exposure: number;
  interactions: number;
  engagementRate: number;
  noteCount: number;
  trackCount: number;
}) {
  const follower = Math.round(
    followers < 100
      ? followers * 1.2
      : followers < 1000
        ? 80 + followers * 0.35
        : followers < 10000
          ? 250 + followers * 0.08
          : 700 + followers * 0.008
  );
  const traffic = Math.round(Math.min(900, Math.sqrt(Math.max(exposure, 0)) * 0.25));
  const engagementCredibility = clamp(Math.log10(Math.max(followers, 10)) / 5, 0.25, 1);
  const cappedEngagementRate = Math.min(20, Math.max(0, engagementRate));
  const engagement = Math.round(
    Math.min(800, Math.sqrt(Math.max(interactions, 0)) * 0.45 + cappedEngagementRate * 6 * engagementCredibility)
  );
  const vertical = trackCount > 0 ? Math.min(300, trackCount * 50) : 0;

  return { follower, traffic, engagement, vertical };
}

function quoteFloorByFollowers(followers: number) {
  if (followers < 100) return 100;
  if (followers < 1000) return 200;
  if (followers < 5000) return 300;
  if (followers < 20000) return 500;
  if (followers < 100000) return 800;
  return 1500;
}

function quoteCapByFollowers(followers: number) {
  if (followers < 100) return 200;
  if (followers < 500) return 300;
  if (followers < 2000) return 600;
  if (followers < 5000) return 900;
  if (followers < 20000) return 1600;
  if (followers < 100000) return 5000;
  return 20000;
}

function roundQuote(value: number) {
  const step = value < 500 ? 50 : 100;
  return Math.max(100, Math.round(value / step) * step);
}

function formatCurrency(value: number) {
  return `¥${new Intl.NumberFormat("zh-CN").format(value)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function formatWan(value: number) {
  if (value < 10000) return formatNumber(value);
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value / 10000)}万`;
}
