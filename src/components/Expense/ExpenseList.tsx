"use client";

import { useEffect, useState } from "react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

const categoryLabels: Record<string, string> = {
  food: "餐饮",
  transport: "交通",
  shopping: "购物",
  entertainment: "娱乐",
  bills: "账单",
  other: "其他",
};

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700",
  transport: "bg-blue-100 text-blue-700",
  shopping: "bg-pink-100 text-pink-700",
  entertainment: "bg-purple-100 text-purple-700",
  bills: "bg-red-100 text-red-700",
  other: "bg-zinc-100 text-zinc-700",
};

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expense")
      .then((res) => res.json())
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, []);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-zinc-200 px-6 py-4 bg-white">
        <h2 className="text-base font-semibold text-zinc-900">费用列表</h2>
        <p className="text-xs text-zinc-500">通过对话记录和管理费用</p>
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
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <svg className="w-12 h-12 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <p className="text-sm text-zinc-500">暂无费用记录</p>
            <p className="text-xs text-zinc-400 mt-1">在对话中说 &ldquo;今天午饭花了35块&rdquo; 来记录</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
              <p className="text-xs text-zinc-500">总支出</p>
              <p className="text-2xl font-semibold text-zinc-900">¥{total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">日期</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">分类</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">金额</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">描述</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {new Date(e.date).toLocaleDateString("zh-CN", {
                          timeZone: "Asia/Shanghai",
                          month: "numeric",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[e.category] || categoryColors.other}`}>
                          {categoryLabels[e.category] || e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 font-medium">¥{e.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600">{e.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
