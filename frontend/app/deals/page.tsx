"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clipboard, Copy, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { MarketplaceDeal } from "@/lib/types";
import { buildDealShareText, formatCurrency, uniqueCities, uniqueTracks } from "@/lib/marketplace";

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="panel p-8 text-center text-sm text-slate-500">正在加载商单...</div>}>
      <DealsContent />
    </Suspense>
  );
}

function DealsContent() {
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<MarketplaceDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [track, setTrack] = useState("全部赛道");
  const [city, setCity] = useState("全部城市");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  async function loadDeals() {
    try {
      setLoading(true);
      const payload = await api.marketplaceDeals("?limit=120");
      setDeals(payload.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "商单加载失败");
    } finally {
      setLoading(false);
    }
  }

  const tracks = useMemo(() => ["全部赛道", ...uniqueTracks(deals)], [deals]);
  const cities = useMemo(() => ["全部城市", ...uniqueCities(deals)], [deals]);
  const filteredDeals = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchTrack = track === "全部赛道" || deal.target_tracks.includes(track);
      const matchCity = city === "全部城市" || deal.city === city;
      const text = [deal.brand_name, deal.title, deal.target_audience, deal.deliverable, deal.brief, ...deal.target_tracks].join(" ").toLowerCase();
      return matchTrack && matchCity && (!keyword || text.includes(keyword));
    });
  }, [city, deals, query, track]);

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal">
              <Clipboard size={17} />
              公开商单广场
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-ink">达人无需注册，直接挑选可申请商单。</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              所有预算、交付要求和目标人群公开展示。复制商单文案后可以直接发到微信群或小红书私信。
            </p>
          </div>
          <Link className="btn secondary" href="/merchant">
            商家发布商单
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-[1fr_220px_180px]">
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-500">搜索</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input className="control w-full pl-9" placeholder="品牌 / 主题 / 人群 / 交付" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-500">赛道</span>
            <select className="control w-full" value={track} onChange={(event) => setTrack(event.target.value)}>
              {tracks.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-500">城市</span>
            <select className="control w-full" value={city} onChange={(event) => setCity(event.target.value)}>
              {cities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {message ? <div className="panel border-l-4 border-l-coral p-4 text-sm text-coral">{message}</div> : null}

      {loading ? (
        <div className="panel p-8 text-center text-sm text-slate-500">正在加载商单...</div>
      ) : filteredDeals.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </section>
      ) : (
        <div className="panel p-8 text-center">
          <div className="font-medium text-ink">暂无匹配商单</div>
          <p className="mt-2 text-sm text-slate-500">换一个关键词、赛道或城市继续查看。</p>
        </div>
      )}
    </div>
  );
}

function DealCard({ deal }: { deal: MarketplaceDeal }) {
  const [copied, setCopied] = useState(false);

  async function copyShareText() {
    const url = `${window.location.origin}/deals/${deal.id}`;
    await navigator.clipboard.writeText(buildDealShareText(deal, url));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="panel flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{deal.city} · {deal.source === "seed" ? "平台精选" : "商家发布"}</div>
          <h2 className="mt-1 text-lg font-semibold leading-6 text-ink">{deal.brand_name}</h2>
        </div>
        {deal.application_count ? <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">{deal.application_count} 人报名</span> : null}
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-ink">{deal.title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {deal.target_tracks.slice(0, 4).map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{item}</span>
        ))}
      </div>
      <dl className="mt-4 flex-1 space-y-3 text-sm">
        <InfoLine label="预算" value={`${formatCurrency(deal.budget_min)} - ${formatCurrency(deal.budget_max)} / 条`} />
        <InfoLine label="交付" value={deal.deliverable} />
        <InfoLine label="人群" value={deal.target_audience} />
      </dl>
      <div className="mt-5 flex gap-2">
        <Link className="btn flex-1 justify-center" href={`/deals/${deal.id}`}>
          查看并申请
          <ArrowRight size={16} />
        </Link>
        <button className="btn secondary px-3" onClick={copyShareText} type="button">
          <Copy size={16} />
          {copied ? "已复制" : "复制文案"}
        </button>
      </div>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 leading-5 text-ink">{value}</dd>
    </div>
  );
}
