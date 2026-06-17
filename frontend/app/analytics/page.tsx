"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

type Trend = { date: string; keyword?: string; platform?: string; count: number };
type Growth = { post_id: number; title?: string; platform: string; like_growth_24h: number; comment_growth_24h: number };

export default function AnalyticsPage() {
  const [trend, setTrend] = useState<Trend[]>([]);
  const [growth, setGrowth] = useState<Growth[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const [trendRows, growthRows] = await Promise.all([api.keywordTrend(), api.postGrowth()]);
    setTrend(trendRows);
    setGrowth(growthRows);
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">趋势</h1>
          <p className="text-sm text-slate-500">关键词新增内容和 24 小时增长监控</p>
        </div>
        <button className="btn secondary" onClick={load}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>
      {message ? <div className="panel border-l-4 border-l-coral p-4 text-sm text-coral">{message}</div> : null}

      <section className="panel p-4">
        <h2 className="mb-3 font-semibold text-ink">关键词每日新增内容</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9ded8" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line dataKey="count" name="新增内容" stroke="#0f766e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 font-semibold text-ink">内容增长榜</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growth.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9ded8" />
              <XAxis dataKey="post_id" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="like_growth_24h" name="点赞增长" fill="#0f766e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comment_growth_24h" name="评论增长" fill="#c2410c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
