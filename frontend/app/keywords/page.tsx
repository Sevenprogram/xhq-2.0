"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Plus, RefreshCw } from "lucide-react";
import { api, formatDate } from "@/lib/api";
import type { Keyword, Project } from "@/lib/types";

export default function KeywordsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | "">("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("xiaohongshu");
  const [priority, setPriority] = useState("B");
  const [limit, setLimit] = useState(100);
  const [message, setMessage] = useState("");

  const selectedProjectId = useMemo(() => (projectId === "" ? projects[0]?.id : Number(projectId)), [projectId, projects]);

  async function loadProjects() {
    const rows = await api.projects();
    setProjects(rows);
    if (projectId === "" && rows[0]) setProjectId(rows[0].id);
  }

  async function loadKeywords(id = selectedProjectId) {
    if (!id) return;
    setKeywords(await api.keywords(id));
  }

  async function createKeyword() {
    if (!selectedProjectId || !keyword.trim()) return;
    await api.createKeyword(selectedProjectId, {
      keyword,
      platform,
      priority_level: priority,
      collect_limit: limit,
      collect_frequency: "daily",
      collect_comments: false,
      track_creators: true,
      status: "active"
    });
    setKeyword("");
    setMessage("关键词已创建");
    await loadKeywords(selectedProjectId);
  }

  async function runKeyword(id: number) {
    const job = await api.runKeyword(id);
    setMessage(`任务 ${job.id} 已完成：新增 ${job.inserted_count}，更新 ${job.updated_count}`);
    await loadKeywords(selectedProjectId);
  }

  useEffect(() => {
    loadProjects().catch((err) => setMessage(err.message));
  }, []);

  useEffect(() => {
    if (selectedProjectId) loadKeywords(selectedProjectId).catch((err) => setMessage(err.message));
  }, [selectedProjectId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">关键词</h1>
          <p className="text-sm text-slate-500">配置平台、优先级、采集数量和手动任务</p>
        </div>
        <button className="btn secondary" onClick={() => loadKeywords()}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-[220px_1fr_170px_120px_140px_auto]">
          <select className="control" value={projectId} onChange={(event) => setProjectId(Number(event.target.value))}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <input className="control" placeholder="关键词" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <select className="control" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="xiaohongshu">小红书</option>
            <option value="douyin">抖音</option>
          </select>
          <select className="control" value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="S">S</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
          <input className="control" type="number" min={1} value={limit} onChange={(event) => setLimit(Number(event.target.value))} />
          <button className="btn" onClick={createKeyword}>
            <Plus size={16} />
            新增
          </button>
        </div>
        {message ? <div className="mt-3 text-sm text-slate-500">{message}</div> : null}
      </section>

      <section className="panel table-scroll">
        <table className="app-table">
          <thead>
            <tr>
              <th>关键词</th>
              <th>平台</th>
              <th>优先级</th>
              <th>频率</th>
              <th>采集数量</th>
              <th>评论</th>
              <th>追踪达人</th>
              <th>状态</th>
              <th>最后采集</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">{item.keyword}</td>
                <td>{item.platform}</td>
                <td>{item.priority_level}</td>
                <td>{item.collect_frequency}</td>
                <td>{item.collect_limit}</td>
                <td>{item.collect_comments ? "是" : "否"}</td>
                <td>{item.track_creators ? "是" : "否"}</td>
                <td>{item.status}</td>
                <td>{formatDate(item.last_checked_at)}</td>
                <td>
                  <button className="btn secondary" onClick={() => runKeyword(item.id)}>
                    <Play size={16} />
                    运行
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
