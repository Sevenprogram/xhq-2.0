"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Clipboard, Home, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/deals", label: "商单广场", icon: Clipboard }
];

const SESSION_STORAGE_KEY = "xiaohuangque-merchant-session";
const ROLE_CHANGE_EVENT = "xiaohuangque-merchant-session-change";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"guest" | "brand">("guest");

  useEffect(() => {
    setRole(readStoredRole());

    function syncRole() {
      setRole(readStoredRole());
    }

    window.addEventListener("storage", syncRole);
    window.addEventListener(ROLE_CHANGE_EVENT, syncRole);
    return () => {
      window.removeEventListener("storage", syncRole);
      window.removeEventListener(ROLE_CHANGE_EVENT, syncRole);
    };
  }, []);

  function logout() {
    clearStoredRole();
    setRole("guest");
    router.push("/");
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <Link href="/" className="text-lg font-semibold text-ink">
            小黄雀商单
          </Link>
          <div className="text-xs text-slate-500">透明达人商单广场</div>
        </div>
        <nav className="flex flex-wrap gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          {role === "brand" ? (
            <>
              <Link
                href="/merchant"
                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm ${
                  pathname === "/merchant" ? "bg-teal text-white" : "bg-teal text-white hover:bg-teal/90"
                }`}
              >
                <Building2 size={16} />
                商家后台
              </Link>
              <button className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-slate-700 hover:bg-slate-100" onClick={logout} type="button">
                <LogOut size={16} />
                退出
              </button>
            </>
          ) : (
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-teal px-3 text-sm text-white hover:bg-teal/90" onClick={() => router.push("/merchant")} type="button">
              <Building2 size={16} />
              商家登录
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function readStoredRole() {
  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored === "brand") return "brand";
    return "guest";
  } catch {
    return "guest";
  }
}

function clearStoredRole() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  } catch {
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  }
}
