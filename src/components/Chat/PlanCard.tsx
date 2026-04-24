import { ExecutionPlan } from "@/types/agent";

interface Props {
  plan: ExecutionPlan;
  onConfirm: () => void;
  onReject: () => void;
  loading?: boolean;
}

const domainLabels: Record<string, string> = {
  schedule: "日程",
  expense: "费用",
};

const actionLabels: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
  query: "查询",
};

const domainIcons: Record<string, string> = {
  schedule: "📅",
  expense: "💰",
};

export default function PlanCard({ plan, onConfirm, onReject, loading }: Props) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{domainIcons[plan.domain]}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {domainLabels[plan.domain]} · {actionLabels[plan.action]}
          </span>
        </div>

        <p className="text-sm text-zinc-800 mb-3">{plan.description}</p>

        <div className="bg-zinc-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-zinc-500 mb-1">执行参数:</p>
          <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono">
            {JSON.stringify(plan.parameters, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-zinc-900 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "执行中..." : "确认执行"}
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 bg-white text-zinc-700 text-sm font-medium py-2 px-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
