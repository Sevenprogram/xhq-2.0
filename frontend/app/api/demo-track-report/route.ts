import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const trackReportFiles = {
  学科提分: "subject-boost",
  升学择校: "admission-planning",
  素质能力: "competency",
  研学营地: "study-camp",
  家庭教育: "family-education",
  低龄启蒙: "early-learning",
  青少年成长: "teen-growth"
} as const;

type DemoTrack = keyof typeof trackReportFiles;

function isDemoTrack(track: string): track is DemoTrack {
  return Object.prototype.hasOwnProperty.call(trackReportFiles, track);
}

export async function GET(request: Request) {
  const track = new URL(request.url).searchParams.get("track") || "";

  if (!isDemoTrack(track)) {
    return NextResponse.json({ error: "未知赛道，请检查报告赛道配置" }, { status: 400 });
  }

  const reportPath = path.resolve(process.cwd(), "..", "data", trackReportFiles[track], "report.md");

  try {
    const markdown = await readFile(reportPath, "utf8");
    const title = markdown.match(/^#\s+(.+)$/m)?.[1] || `${track}赛道小红书内容分析报告`;

    return NextResponse.json({
      track,
      title,
      markdown
    });
  } catch {
    return NextResponse.json({ error: `未找到${track}本地报告文件` }, { status: 404 });
  }
}
