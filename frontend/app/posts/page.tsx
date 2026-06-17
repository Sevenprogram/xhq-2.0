"use client";

import { useEffect, useState } from "react";
import { FileJson, FileUp, RefreshCw, Search } from "lucide-react";
import { api, formatDate, formatNumber } from "@/lib/api";
import type { Post, Project } from "@/lib/types";

export default function PostsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | "">("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [minScore, setMinScore] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function loadProjects() {
    const rows = await api.projects();
    setProjects(rows);
    if (projectId === "" && rows[0]) setProjectId(rows[0].id);
  }

  async function loadPosts() {
    const params = new URLSearchParams();
    if (projectId) params.set("project_id", String(projectId));
    if (search.trim()) params.set("search", search.trim());
    if (platform) params.set("platform", platform);
    if (minScore) params.set("min_relevance_score", minScore);
    params.set("sort_by", "relevance_score");
    const result = await api.posts(`?${params.toString()}`);
    setPosts(result.items);
    setTotal(result.total);
  }

  async function uploadCsv() {
    if (!projectId || !csvFile) return;
    const job = await api.importCsv(Number(projectId), csvFile);
    setMessage(`CSV 导入完成：任务 ${job.id}，新增 ${job.inserted_count}，更新 ${job.updated_count}`);
    await loadPosts();
  }

  async function uploadJson() {
    if (!projectId || !jsonFile) return;
    const job = await api.importJson(Number(projectId), jsonFile);
    setMessage(`JSON 导入完成：任务 ${job.id}，新增 ${job.inserted_count}，更新 ${job.updated_count}`);
    await loadPosts();
  }

  useEffect(() => {
    loadProjects().catch((err) => setMessage(err.message));
  }, []);

  useEffect(() => {
    loadPosts().catch((err) => setMessage(err.message));
  }, [projectId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">内容</h1>
          <p className="text-sm text-slate-500">导入、搜索、筛选和查看帖子/视频</p>
        </div>
        <button className="btn secondary" onClick={loadPosts}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      <section className="panel p-4">
        <div className="grid gap-3 lg:grid-cols-[220px_140px_120px_1fr_auto]">
          <select className="control" value={projectId} onChange={(event) => setProjectId(Number(event.target.value))}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select className="control" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="">全部平台</option>
            <option value="xiaohongshu">小红书</option>
            <option value="douyin">抖音</option>
          </select>
          <input className="control" placeholder="最低相关度" value={minScore} onChange={(event) => setMinScore(event.target.value)} />
          <input className="control" placeholder="搜索标题、正文、标签、达人" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button className="btn" onClick={loadPosts}>
            <Search size={16} />
            查询
          </button>
        </div>
      </section>

      <section className="panel p-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex flex-wrap items-center gap-3">
            <input className="control" type="file" accept=".csv" onChange={(event) => setCsvFile(event.target.files?.[0] || null)} />
            <button className="btn" onClick={uploadCsv}>
              <FileUp size={16} />
              上传 CSV
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input className="control" type="file" accept=".json" onChange={(event) => setJsonFile(event.target.files?.[0] || null)} />
            <button className="btn secondary" onClick={uploadJson}>
              <FileJson size={16} />
              上传 JSON
            </button>
          </div>
        </div>
        {message ? <div className="mt-3 text-sm text-slate-500">{message}</div> : null}
      </section>

      <section className="panel table-scroll">
        <div className="border-b border-line p-3 text-sm text-slate-500">共 {total} 条</div>
        <table className="app-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>平台</th>
              <th>作者</th>
              <th>发布时间</th>
              <th>点赞</th>
              <th>评论</th>
              <th>收藏</th>
              <th>分享</th>
              <th>相关度</th>
              <th>广告</th>
              <th>链接</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="max-w-sm">
                  <div className="font-medium">{post.title || post.platform_post_id}</div>
                  <div className="mt-1 text-xs text-slate-500">{post.tags?.join(" / ")}</div>
                </td>
                <td>{post.platform}</td>
                <td>{post.creator?.nickname || "-"}</td>
                <td>{formatDate(post.publish_time)}</td>
                <td>{formatNumber(post.like_count)}</td>
                <td>{formatNumber(post.comment_count)}</td>
                <td>{formatNumber(post.collect_count)}</td>
                <td>{formatNumber(post.share_count)}</td>
                <td>{post.relevance_score}</td>
                <td>{post.is_ad_suspected ? "是" : "否"}</td>
                <td>{post.url ? <a className="text-teal" href={post.url} target="_blank">打开</a> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
