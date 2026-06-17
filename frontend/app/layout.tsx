import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = {
  title: "关键词流量监控",
  description: "小红书与抖音关键词流量监控系统"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppNav />
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
