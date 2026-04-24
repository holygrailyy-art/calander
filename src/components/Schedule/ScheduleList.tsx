"use client";

import { useEffect, useState } from "react";

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
}

export default function ScheduleList() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then(setSchedules)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-zinc-200 px-6 py-4 bg-white">
        <h2 className="text-base font-semibold text-zinc-900">日程列表</h2>
        <p className="text-xs text-zinc-500">通过对话创建和管理日程</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <svg className="w-12 h-12 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-sm text-zinc-500">暂无日程</p>
            <p className="text-xs text-zinc-400 mt-1">在对话中说 &ldquo;明天下午2点开个会&rdquo; 来创建</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">标题</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">时间</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">地点</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">备注</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm text-zinc-900 font-medium">{s.title}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {new Date(s.startTime).toLocaleString("zh-CN", {
                        timeZone: "Asia/Shanghai",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {s.endTime &&
                        " ~ " +
                          new Date(s.endTime).toLocaleString("zh-CN", {
                            timeZone: "Asia/Shanghai",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{s.location || "-"}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{s.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
