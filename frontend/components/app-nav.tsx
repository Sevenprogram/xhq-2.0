"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, ClipboardList, FileUp, Handshake, Home, Tags, UserRoundSearch } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/projects", label: "项目", icon: BriefcaseBusiness },
  { href: "/keywords", label: "关键词", icon: Tags },
  { href: "/posts", label: "内容", icon: FileUp },
  { href: "/creators", label: "达人", icon: UserRoundSearch },
  { href: "/demo", label: "商单 Demo", icon: Handshake },
  { href: "/analytics", label: "趋势", icon: BarChart3 },
  { href: "/jobs", label: "任务", icon: ClipboardList }
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="text-lg font-semibold text-ink">关键词流量监控</div>
          <div className="text-xs text-slate-500">Xiaohongshu / Douyin Local Intelligence</div>
        </div>
        <nav className="flex flex-wrap gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm ${
                  active ? "bg-teal text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
