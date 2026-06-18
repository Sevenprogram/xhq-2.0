"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, formatDate } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");

  async function loadJobs() {
    setJobs(await api.jobs());
  }

  useEffect(() => {
    loadJobs().catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">任务日志</h1>
          <p className="text-sm text-slate-500">导入和采集任务执行记录</p>
        </div>
        <button className="btn secondary" onClick={loadJobs}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>
      {message ? <div className="panel border-l-4 border-l-coral p-4 text-sm text-coral">{message}</div> : null}
      <section className="panel table-scroll">
        <table className="app-table">
          <thead>
            <tr>
              <th>任务 ID</th>
              <th>项目</th>
              <th>关键词</th>
              <th>平台</th>
              <th>类型</th>
              <th>状态</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>原始数</th>
              <th>插入</th>
              <th>更新</th>
              <th>错误</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.project_id || "-"}</td>
                <td>{job.keyword_id || "-"}</td>
                <td>{job.platform}</td>
                <td>{job.job_type}</td>
                <td>{job.status}</td>
                <td>{formatDate(job.started_at)}</td>
                <td>{formatDate(job.finished_at)}</td>
                <td>{job.raw_result_count}</td>
                <td>{job.inserted_count}</td>
                <td>{job.updated_count}</td>
                <td>{job.error_message || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
