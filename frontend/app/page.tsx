"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { api, formatNumber } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setData(await api.dashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-slate-500">项目、关键词、内容和达人资产概览</p>
        </div>
        <button className="btn secondary" onClick={load}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      {error ? <div className="panel border-l-4 border-l-coral p-4 text-sm text-coral">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="项目总数" value={data?.project_count ?? "-"} accent="teal" />
        <StatCard label="关键词数量" value={data?.keyword_count ?? "-"} accent="gold" />
        <StatCard label="内容总数" value={data?.post_count ?? "-"} accent="ink" />
        <StatCard label="达人总数" value={data?.creator_count ?? "-"} accent="coral" />
        <StatCard label="今日新增内容" value={data?.today_new_posts ?? "-"} accent="teal" />
        <StatCard label="今日新增爆文" value={data?.today_hot_posts ?? "-"} accent="coral" />
      </div>

      <section className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">近 7 日内容增长</h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.seven_day_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9ded8" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="新增内容" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="mb-3 font-semibold text-ink">爆文榜</h2>
          <div className="space-y-3">
            {(data?.hot_posts || []).map((post) => (
              <div key={post.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="font-medium text-ink">{post.title || post.platform_post_id}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {post.platform} · 点赞 {formatNumber(post.like_count)} · 评论 {formatNumber(post.comment_count)} · 热度 {post.hot_score ?? 0}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 font-semibold text-ink">达人榜</h2>
          <div className="space-y-3">
            {(data?.top_creators || []).map((creator) => (
              <div key={creator.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="font-medium text-ink">{creator.nickname || creator.platform_creator_id}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {creator.platform} · 粉丝 {formatNumber(creator.follower_count)} · 评分 {creator.creator_score ?? 0}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel p-4">
        <h2 className="mb-3 font-semibold text-ink">平台分布</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.platform_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9ded8" />
              <XAxis dataKey="platform" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="内容数" fill="#c2410c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
