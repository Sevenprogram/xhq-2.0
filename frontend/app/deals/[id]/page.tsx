"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { DealApplicationCreate, MarketplaceDeal } from "@/lib/types";
import { buildDealShareText, formatCurrency } from "@/lib/marketplace";

const initialForm: DealApplicationCreate = {
  wechat: "",
  profile_link: "",
  expected_quote: null,
  note: "",
  nickname: ""
};

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const [deal, setDeal] = useState<MarketplaceDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<DealApplicationCreate>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    api.marketplaceDeal(params.id)
      .then(setDeal)
      .catch((error) => setMessage(error instanceof Error ? error.message : "商单不存在"))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function submitApplication() {
    if (!deal) return;
    if (!form.wechat.trim() || !form.profile_link.trim()) {
      setMessage("请填写微信号和小红书/抖音主页链接");
      return;
    }
    try {
      setSubmitting(true);
      setMessage("");
      await api.submitDealApplication(deal.id, {
        ...form,
        wechat: form.wechat.trim(),
        profile_link: form.profile_link.trim(),
        nickname: form.nickname?.trim() || null,
        note: form.note?.trim() || null,
        expected_quote: form.expected_quote ? Number(form.expected_quote) : null
      });
      setMessage("报名已提交，商家会在后台看到你的联系方式。");
      setForm(initialForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "报名提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyShareText() {
    if (!deal) return;
    const url = window.location.href;
    await navigator.clipboard.writeText(buildDealShareText(deal, url));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading) return <div className="panel p-8 text-center text-sm text-slate-500">正在加载商单...</div>;
  if (!deal) return <div className="panel p-8 text-center text-sm text-coral">{message || "商单不存在"}</div>;

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-teal" href="/deals">
        <ArrowLeft size={16} />
        返回商单广场
      </Link>

      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <article className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-teal">{deal.city} · {deal.source === "seed" ? "平台精选" : "商家发布"}</div>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink">{deal.brand_name}｜{deal.title}</h1>
            </div>
            <button className="btn secondary" onClick={copyShareText} type="button">
              <Copy size={16} />
              {copied ? "已复制" : "复制转发文案"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="预算区间" value={`${formatCurrency(deal.budget_min)} - ${formatCurrency(deal.budget_max)}`} />
            <Metric label="城市" value={deal.city} />
            <Metric label="报名人数" value={`${deal.application_count} 人`} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {deal.target_tracks.map((track) => (
              <span key={track} className="rounded-full bg-teal/10 px-3 py-1 text-sm font-medium text-teal">{track}</span>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            <DetailBlock title="交付要求" content={deal.deliverable} />
            <DetailBlock title="目标人群" content={deal.target_audience} />
            <DetailBlock title="详细说明" content={deal.brief || "商家暂未补充详细说明，报名后由运营继续跟进。"} />
          </div>
        </article>

        <aside className="panel p-5">
          <div className="flex items-center gap-2">
            <Send className="text-teal" size={18} />
            <h2 className="font-semibold text-ink">申请合作</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">无需注册。留下微信和账号链接，商家后台会直接看到你的报名信息。</p>
          <div className="mt-4 space-y-3">
            <FormInput label="微信号 *" value={form.wechat} onChange={(value) => setForm({ ...form, wechat: value })} placeholder="用于商家联系你" />
            <FormInput label="小红书/抖音主页链接 *" value={form.profile_link} onChange={(value) => setForm({ ...form, profile_link: value })} placeholder="粘贴账号主页链接" />
            <FormInput label="昵称" value={form.nickname || ""} onChange={(value) => setForm({ ...form, nickname: value })} placeholder="选填" />
            <FormInput
              label="期望报价"
              type="number"
              value={form.expected_quote ? String(form.expected_quote) : ""}
              onChange={(value) => setForm({ ...form, expected_quote: value ? Number(value) : null })}
              placeholder="选填"
            />
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-500">备注</span>
              <textarea className="control min-h-24 w-full" value={form.note || ""} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="可补充档期、内容优势或合作偏好" />
            </label>
            <button className="btn w-full justify-center" disabled={submitting} onClick={submitApplication} type="button">
              <CheckCircle2 size={16} />
              {submitting ? "提交中" : "提交申请"}
            </button>
          </div>
          {message ? <div className="mt-3 rounded-md border border-line bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</div> : null}
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function DetailBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{content}</p>
    </section>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <input className="control w-full" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}
