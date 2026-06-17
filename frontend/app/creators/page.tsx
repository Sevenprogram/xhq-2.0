"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { api, formatNumber } from "@/lib/api";
import type { Creator } from "@/lib/types";

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [total, setTotal] = useState(0);
  const [platform, setPlatform] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadCreators() {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (search.trim()) params.set("search", search.trim());
    const result = await api.creators(`?${params.toString()}`);
    setCreators(result.items);
    setTotal(result.total);
  }

  useEffect(() => {
    loadCreators().catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">达人</h1>
          <p className="text-sm text-slate-500">查看达人评分、粉丝量和相关内容资产</p>
        </div>
        <button className="btn secondary" onClick={loadCreators}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <select className="control" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="">全部平台</option>
            <option value="xiaohongshu">小红书</option>
            <option value="douyin">抖音</option>
          </select>
          <input className="control" placeholder="搜索昵称" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button className="btn" onClick={loadCreators}>
            <Search size={16} />
            查询
          </button>
        </div>
        {message ? <div className="mt-3 text-sm text-slate-500">{message}</div> : null}
      </section>

      <section className="panel table-scroll">
        <div className="border-b border-line p-3 text-sm text-slate-500">共 {total} 位达人</div>
        <table className="app-table">
          <thead>
            <tr>
              <th>昵称</th>
              <th>平台</th>
              <th>粉丝数</th>
              <th>总获赞</th>
              <th>作品数</th>
              <th>达人评分</th>
              <th>主页</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => (
              <tr key={creator.id}>
                <td className="font-medium">{creator.nickname || creator.platform_creator_id}</td>
                <td>{creator.platform}</td>
                <td>{formatNumber(creator.follower_count)}</td>
                <td>{formatNumber(creator.total_likes)}</td>
                <td>{formatNumber(creator.content_count)}</td>
                <td>{creator.creator_score}</td>
                <td>{creator.profile_url ? <a className="text-teal" href={creator.profile_url} target="_blank">打开</a> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
