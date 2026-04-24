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
      <div className="border-b border-zinc-200 px-4 sm:px-6 py-3 sm:py-4 bg-white">
        <h2 className="text-sm sm:text-base font-semibold text-zinc-900">日程列表</h2>
        <p className="text-xs text-zinc-500">通过对话创建和管理日程</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-sm text-zinc-500">暂无日程</p>
            <p className="text-xs text-zinc-400 mt-1">在对话中说 &ldquo;明天下午2点开个会&rdquo; 来创建</p>
          </div>
        ) : (
          <>
            {/* Desktop: table layout */}
            <div className="hidden sm:block bg-white rounded-xl border border-zinc-200 overflow-hidden">
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

            {/* Mobile: card layout */}
            <div className="sm:hidden space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                  <h3 className="text-sm font-semibold text-zinc-900">{s.title}</h3>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-zinc-600">
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
                      </span>
                    </div>
                    {s.location && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="text-xs text-zinc-600">{s.location}</span>
                      </div>
                    )}
                    {s.description && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="text-xs text-zinc-600">{s.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
