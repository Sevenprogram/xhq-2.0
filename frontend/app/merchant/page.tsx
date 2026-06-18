"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ChevronDown, ChevronRight, Clipboard, LogIn, RefreshCw, Save, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { DealApplication, MarketplaceDeal, MarketplaceDealCreate, MerchantProfile } from "@/lib/types";
import {
  MERCHANT_PASSWORD,
  MERCHANT_USERNAME,
  TEST_MERCHANT_KEY,
  applicationStatusOptions,
  defaultTrackOptions,
  formatCurrency
} from "@/lib/marketplace";

const SESSION_STORAGE_KEY = "xiaohuangque-merchant-session";
const ROLE_CHANGE_EVENT = "xiaohuangque-merchant-session-change";

const initialDealForm: MarketplaceDealCreate = {
  brand_name: "",
  title: "",
  city: "全国",
  budget_min: 500,
  budget_max: 1500,
  target_tracks: ["教育成长"],
  target_audience: "",
  deliverable: "",
  brief: "",
  contact_wechat: ""
};

const dealTemplates: Array<{ label: string; form: MarketplaceDealCreate }> = [
  {
    label: "门店探店",
    form: {
      brand_name: "轻氧普拉提",
      title: "白领女性普拉提体验课",
      city: "深圳",
      budget_min: 1000,
      budget_max: 2600,
      target_tracks: ["健康健身"],
      target_audience: "20-35 岁女性、本地生活、运动健身、白领通勤人群",
      deliverable: "小红书图文 1 条 + 门店环境露出",
      brief: "希望达人到店体验课程，内容包含门店环境、课程体验、适合人群和预约方式。优先本地生活/健身/女性生活方式账号。",
      contact_wechat: ""
    }
  },
  {
    label: "课程体验",
    form: {
      brand_name: "城市图书馆计划",
      title: "亲子阅读打卡活动招募",
      city: "全国",
      budget_min: 500,
      budget_max: 1500,
      target_tracks: ["母婴亲子"],
      target_audience: "亲子阅读家庭、家长、低龄启蒙和教育成长关注者",
      deliverable: "小红书图文 1 条 + 活动报名入口",
      brief: "围绕亲子阅读打卡活动进行内容种草，突出活动机制、适合年龄、参与方式和家庭阅读氛围。",
      contact_wechat: ""
    }
  },
  {
    label: "产品种草",
    form: {
      brand_name: "Mellow Coffee",
      title: "新品咖啡试饮种草",
      city: "深圳",
      budget_min: 700,
      budget_max: 2200,
      target_tracks: ["咖啡甜品"],
      target_audience: "咖啡爱好者、办公室白领、周末探店和精致消费人群",
      deliverable: "小红书图文 1 条，需包含产品口味、门店/购买入口和使用场景",
      brief: "达人可围绕新品试饮、办公室下午茶、周末探店或礼物推荐展开。内容需要真实体验感，避免硬广口吻。",
      contact_wechat: ""
    }
  }
];

const budgetPresets = [
  { label: "素人种草", min: 300, max: 800 },
  { label: "本地探店", min: 800, max: 2200 },
  { label: "精选达人", min: 1500, max: 4000 }
];

const audiencePresets = [
  "深圳本地生活、白领女性、运动健身、1万粉以下也可",
  "亲子阅读家庭、家长、低龄启蒙和教育成长关注者",
  "咖啡爱好者、办公室白领、周末探店和精致消费人群",
  "校园生活、学生党、低预算真实体验账号"
];

const deliverablePresets = [
  "小红书图文 1 条 + 门店环境露出",
  "小红书图文 1 条 + 活动报名入口",
  "小红书图文 1 条，需包含产品口味、购买入口和使用场景",
  "到店体验 1 次 + 图文笔记 1 条 + 评论区答疑"
];

export default function MerchantPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(window.localStorage.getItem(SESSION_STORAGE_KEY) === "brand");
  }, []);

  function onLogin() {
    window.localStorage.setItem(SESSION_STORAGE_KEY, "brand");
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
    setAuthed(true);
  }

  if (!authed) return <LoginPanel onLogin={onLogin} />;
  return <MerchantWorkspace />;
}

function LoginPanel({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (username === MERCHANT_USERNAME && password === MERCHANT_PASSWORD) {
      setError("");
      onLogin();
      return;
    }
    setError("账号或密码错误");
  }

  return (
    <section className="mx-auto max-w-xl">
      <div className="panel p-6">
        <div className="flex items-center gap-2">
          <LogIn className="text-teal" size={20} />
          <h1 className="text-xl font-semibold text-ink">商家登录</h1>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">输入演示账号后，可以发布商单并查看达人报名候选人。</p>
        <div className="mt-5 space-y-3">
          <FormInput label="账号" value={username} onChange={setUsername} placeholder="admin" />
          <FormInput label="密码" value={password} onChange={setPassword} type="password" placeholder="xiaohuangque2026" />
          <button className="btn w-full justify-center" onClick={submit} type="button">
            <Building2 size={16} />
            进入商家工作台
          </button>
          {error ? <div className="rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-sm text-coral">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}

function MerchantWorkspace() {
  const [deals, setDeals] = useState<MarketplaceDeal[]>([]);
  const [applications, setApplications] = useState<DealApplication[]>([]);
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("测试商家");
  const [expandedDealId, setExpandedDealId] = useState<number | null>(null);
  const [form, setForm] = useState<MarketplaceDealCreate>(initialDealForm);
  const [message, setMessage] = useState("");
  const [publishStatus, setPublishStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const [profilePayload, dealPayload, applicationPayload] = await Promise.all([
        api.merchantProfile(),
        api.marketplaceDeals(`?include_offline=true&merchant_key=${encodeURIComponent(TEST_MERCHANT_KEY)}&limit=200`),
        api.dealApplications("?limit=300")
      ]);
      setMerchantProfile(profilePayload);
      setDisplayNameDraft(profilePayload.display_name);
      setForm((current) => ({ ...current, brand_name: current.brand_name.trim() ? current.brand_name : profilePayload.display_name }));
      setDeals(dealPayload.items);
      setApplications(applicationPayload.items);
      setExpandedDealId((current) => current ?? dealPayload.items[0]?.id ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "工作台数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function publishDeal() {
    const normalizedForm: MarketplaceDealCreate = {
      ...form,
      brand_name: form.brand_name.trim(),
      title: form.title.trim(),
      city: form.city.trim() || "全国",
      target_tracks: form.target_tracks.length ? form.target_tracks : [defaultTrackOptions[0]],
      target_audience: form.target_audience.trim(),
      deliverable: form.deliverable.trim(),
      brief: form.brief.trim(),
      contact_wechat: form.contact_wechat.trim()
    };

    if (!normalizedForm.brand_name || !normalizedForm.title || !normalizedForm.target_audience || !normalizedForm.deliverable) {
      setPublishStatus("error");
      setPublishMessage("请填写品牌名称、商单标题、目标达人/人群和交付要求");
      return;
    }

    if (normalizedForm.budget_min <= 0 || normalizedForm.budget_max <= 0 || normalizedForm.budget_min > normalizedForm.budget_max) {
      setPublishStatus("error");
      setPublishMessage("请填写有效预算区间，最高预算不能低于最低预算");
      return;
    }
    try {
      setMessage("");
      setPublishStatus("submitting");
      setPublishMessage("正在发布商单，请稍候...");
      const createdDeal = await api.createMarketplaceDeal(normalizedForm);
      setForm({
        ...initialDealForm,
        brand_name: merchantProfile?.display_name || "",
        contact_wechat: normalizedForm.contact_wechat
      });
      await refresh();
      setExpandedDealId(createdDeal.id);
      setPublishStatus("success");
      setPublishMessage(`「${createdDeal.title}」已发布到商单广场`);
    } catch (error) {
      setPublishStatus("error");
      setPublishMessage(error instanceof Error ? error.message : "商单发布失败");
    }
  }

  async function saveDisplayName() {
    const nextName = displayNameDraft.trim();
    if (!nextName) {
      setMessage("商家展示名不能为空");
      return;
    }
    try {
      const updated = await api.updateMerchantProfile(nextName);
      setMerchantProfile(updated);
      setDisplayNameDraft(updated.display_name);
      setForm((current) => ({ ...current, brand_name: current.brand_name.trim() ? current.brand_name : updated.display_name }));
      setMessage("商家展示名已更新，后续发布商单会使用新的商家身份");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "展示名更新失败");
    }
  }

  async function updateStatus(application: DealApplication, status: DealApplication["status"]) {
    try {
      const updated = await api.updateDealApplicationStatus(application.id, status);
      setApplications((current) => current.map((item) => (item.id === updated.id ? { ...item, status: updated.status } : item)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "状态更新失败");
    }
  }

  const applicationsByDeal = useMemo(() => {
    const grouped = new Map<number, DealApplication[]>();
    applications.forEach((application) => {
      grouped.set(application.deal_id, [...(grouped.get(application.deal_id) || []), application]);
    });
    return grouped;
  }, [applications]);
  const merchantApplicationCount = deals.reduce((sum, deal) => sum + (applicationsByDeal.get(deal.id)?.length || 0), 0);
  const selectedCount = deals.reduce(
    (sum, deal) => sum + (applicationsByDeal.get(deal.id) || []).filter((item) => item.status === "selected").length,
    0
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
      <section className="panel p-5 xl:col-span-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal">
              <Building2 size={17} />
              商家工作台
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-ink">发布商单，查看报名候选人。</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              当前商家：{merchantProfile?.display_name || "测试商家"}。后台只展示这个商家发布的商单和对应候选人。
            </p>
          </div>
          <button className="btn secondary" disabled={loading} onClick={refresh} type="button">
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            刷新
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="公开商单" value={`${deals.length} 个`} />
          <Metric label="报名候选人" value={`${merchantApplicationCount} 人`} />
          <Metric label="已选中候选人" value={`${selectedCount} / ${merchantApplicationCount}`} />
        </div>
      </section>

      {message ? <div className="panel border-l-4 border-l-teal p-4 text-sm text-slate-700 xl:col-span-2">{message}</div> : null}

      <section className="panel p-5">
        <div className="border-b border-line pb-5">
          <div className="flex items-center gap-2">
            <Building2 className="text-teal" size={18} />
            <h2 className="font-semibold text-ink">商家展示名</h2>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="control w-full"
              value={displayNameDraft}
              onChange={(event) => setDisplayNameDraft(event.target.value)}
              placeholder="测试商家"
            />
            <button className="btn secondary justify-center" onClick={saveDisplayName} type="button">
              <Save size={16} />
              保存
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Clipboard className="text-teal" size={18} />
          <h2 className="font-semibold text-ink">发布商单</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">先套用一个商单类型，再调整预算、目标达人和交付内容。</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {dealTemplates.map((template) => (
            <button
              key={template.label}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal/40 hover:text-teal"
              onClick={() => setForm({ ...template.form, contact_wechat: form.contact_wechat })}
              type="button"
            >
              {template.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <FormInput label="品牌 / 门店 / 产品 *" value={form.brand_name} onChange={(value) => setForm({ ...form, brand_name: value })} placeholder="例：轻氧普拉提 / Mellow Coffee" />
          <FormInput label="商单标题 *" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="例：深圳南山普拉提体验课招募" />
          <div className="grid gap-3 sm:grid-cols-3">
            <FormInput label="城市" value={form.city} onChange={(value) => setForm({ ...form, city: value })} placeholder="全国 / 深圳 / 上海" />
            <FormInput label="最低预算" type="number" value={String(form.budget_min)} onChange={(value) => setForm({ ...form, budget_min: Number(value) || 0 })} placeholder="500" />
            <FormInput label="最高预算" type="number" value={String(form.budget_max)} onChange={(value) => setForm({ ...form, budget_max: Number(value) || 0 })} placeholder="1500" />
          </div>
          <div className="flex flex-wrap gap-2">
            {budgetPresets.map((preset) => (
              <button
                key={preset.label}
                className="rounded-md border border-line bg-slate-50 px-3 py-2 text-left text-xs transition hover:border-teal/40 hover:bg-teal/5"
                onClick={() => setForm({ ...form, budget_min: preset.min, budget_max: preset.max })}
                type="button"
              >
                <span className="block font-semibold text-ink">{preset.label}</span>
                <span className="text-slate-500">{formatCurrency(preset.min)} - {formatCurrency(preset.max)}</span>
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-500">目标赛道</span>
            <select
              className="control w-full"
              value={form.target_tracks[0] || ""}
              onChange={(event) => setForm({ ...form, target_tracks: [event.target.value] })}
            >
              {defaultTrackOptions.map((track) => (
                <option key={track} value={track}>{track}</option>
              ))}
            </select>
          </label>
          <FormInput label="目标达人 / 人群" value={form.target_audience} onChange={(value) => setForm({ ...form, target_audience: value })} placeholder="例：深圳本地生活、白领女性、运动健身、1万粉以下也可" />
          <QuickOptions options={audiencePresets} onSelect={(value) => setForm({ ...form, target_audience: value })} />
          <FormInput label="交付要求 *" value={form.deliverable} onChange={(value) => setForm({ ...form, deliverable: value })} placeholder="例：小红书图文 1 条 + 门店环境露出" />
          <QuickOptions options={deliverablePresets} onSelect={(value) => setForm({ ...form, deliverable: value })} />
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-500">详细说明 / 转发补充</span>
            <textarea
              className="control min-h-36 w-full"
              value={form.brief}
              onChange={(event) => setForm({ ...form, brief: event.target.value })}
              placeholder={"产品/服务亮点：\n拍摄重点：\n到店/寄样方式：\n报名偏好："}
            />
          </label>
          <FormInput label="运营联系微信" value={form.contact_wechat} onChange={(value) => setForm({ ...form, contact_wechat: value })} placeholder="可选；留空则让达人直接在页面报名" />
          <button className="btn w-full justify-center" disabled={publishStatus === "submitting"} onClick={publishDeal} type="button">
            {publishStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            {publishStatus === "submitting" ? "正在发布" : "发布到商单广场"}
          </button>
          {publishMessage ? <PublishFeedback status={publishStatus} message={publishMessage} /> : null}
        </div>
      </section>

      <div className="min-w-0 space-y-5">
        <section className="panel table-scroll min-w-0">
          <div className="border-b border-line p-4">
            <h2 className="font-semibold text-ink">我的商单与候选人</h2>
            <p className="mt-1 text-sm text-slate-500">点击商单行展开该商单的报名候选人。一次只展开一个商单。</p>
          </div>
          <table className="app-table">
            <thead>
              <tr>
                <th></th>
                <th>品牌</th>
                <th>商单</th>
                <th>预算</th>
                <th>报名</th>
                <th>链接</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const dealApplications = applicationsByDeal.get(deal.id) || [];
                const expanded = expandedDealId === deal.id;
                return (
                  <Fragment key={deal.id}>
                    <tr key={deal.id} className="cursor-pointer hover:bg-teal/5" onClick={() => setExpandedDealId(expanded ? null : deal.id)}>
                      <td className="w-10">{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                      <td className="font-medium text-ink">
                        <div>{deal.brand_name}</div>
                        <div className="mt-1 text-xs font-normal text-slate-500">{deal.merchant_display_name || merchantProfile?.display_name || "测试商家"}</div>
                      </td>
                      <td>{deal.title}</td>
                      <td>{formatCurrency(deal.budget_min)} - {formatCurrency(deal.budget_max)}</td>
                      <td>{dealApplications.length} 人</td>
                      <td>
                        <Link className="text-teal" href={`/deals/${deal.id}`} onClick={(event) => event.stopPropagation()}>
                          查看
                        </Link>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr key={`${deal.id}-applications`}>
                        <td colSpan={6} className="bg-slate-50 p-0">
                          <DealApplicationsPanel applications={dealApplications} onUpdateStatus={updateStatus} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {!deals.length ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500">这个商家还没有发布商单</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function DealApplicationsPanel({
  applications,
  onUpdateStatus
}: {
  applications: DealApplication[];
  onUpdateStatus: (application: DealApplication, status: DealApplication["status"]) => void;
}) {
  if (!applications.length) {
    return (
      <div className="flex items-center gap-2 px-5 py-5 text-sm text-slate-500">
        <Users size={16} />
        这个商单暂无达人报名。
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Users className="text-teal" size={17} />
        候选人
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="app-table">
          <thead>
            <tr>
              <th>达人</th>
              <th>微信</th>
              <th>报价</th>
              <th>备注</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>
                  <div className="font-medium text-ink">{application.nickname || "未填写昵称"}</div>
                  <a className="text-xs text-teal" href={application.profile_link} target="_blank" rel="noreferrer">账号链接</a>
                </td>
                <td>{application.wechat}</td>
                <td>{application.expected_quote ? formatCurrency(application.expected_quote) : "-"}</td>
                <td>{application.note || "-"}</td>
                <td>
                  <select className="control min-w-28" value={application.status} onChange={(event) => onUpdateStatus(application, event.target.value)}>
                    {applicationStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PublishFeedback({ status, message }: { status: "idle" | "submitting" | "success" | "error"; message: string }) {
  const styles =
    status === "success"
      ? "border-teal/30 bg-teal/5 text-teal"
      : status === "error"
        ? "border-coral/30 bg-coral/5 text-coral"
        : "border-line bg-slate-50 text-slate-600";
  const Icon = status === "submitting" ? RefreshCw : CheckCircle2;

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${styles}`}>
      <Icon className={status === "submitting" ? "animate-spin" : ""} size={16} />
      <span>{message}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-teal">{value}</div>
    </div>
  );
}

function QuickOptions({ options, onSelect }: { options: string[]; onSelect: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          className="max-w-full rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs text-slate-600 transition hover:border-teal/40 hover:text-teal"
          onClick={() => onSelect(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
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
