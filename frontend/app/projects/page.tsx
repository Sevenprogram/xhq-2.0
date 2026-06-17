"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { api, formatDate } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sensitiveLevel, setSensitiveLevel] = useState(2);
  const [message, setMessage] = useState("");

  async function load() {
    setProjects(await api.projects());
  }

  async function createProject() {
    if (!name.trim()) return;
    await api.createProject({ name, description, sensitive_level: sensitiveLevel });
    setName("");
    setDescription("");
    setMessage("项目已创建");
    await load();
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">项目</h1>
          <p className="text-sm text-slate-500">按研究主题沉淀本地数据资产</p>
        </div>
        <button className="btn secondary" onClick={load}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      <section className="panel p-4">
        <h2 className="mb-3 font-semibold text-ink">创建项目</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_160px_auto]">
          <input className="control" placeholder="项目名称" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="control" placeholder="项目描述" value={description} onChange={(event) => setDescription(event.target.value)} />
          <select className="control" value={sensitiveLevel} onChange={(event) => setSensitiveLevel(Number(event.target.value))}>
            <option value={0}>普通话题</option>
            <option value={1}>商业话题</option>
            <option value={2}>教育/健康</option>
            <option value={3}>高敏感</option>
          </select>
          <button className="btn" onClick={createProject}>
            <Plus size={16} />
            创建
          </button>
        </div>
        {message ? <div className="mt-3 text-sm text-slate-500">{message}</div> : null}
      </section>

      <section className="panel table-scroll">
        <table className="app-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>项目名称</th>
              <th>描述</th>
              <th>敏感级别</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.id}</td>
                <td className="font-medium">{project.name}</td>
                <td>{project.description || "-"}</td>
                <td>{project.sensitive_level}</td>
                <td>{formatDate(project.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
