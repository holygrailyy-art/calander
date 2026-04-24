import Anthropic from "@anthropic-ai/sdk";
import { Intent, ExecutionPlan, ExecutionResult, OrchestratorResponse } from "@/types/agent";
import { recognizeIntent } from "./intent";
import { generatePlan } from "./planner";
import { execute } from "./executor";
import { getClarificationPrompt, getChatPrompt, getFeedbackPrompt } from "./prompts";
import { isFeishuConnected, createFeishuEvent, getPrimaryCalendarId, deleteFeishuEvent } from "@/lib/feishu/client";

const anthropic = new Anthropic();

// ---- Operation history for undo ----
interface HistoryEntry {
  plan: ExecutionPlan;
  result: ExecutionResult;
  feishuEventId?: string; // If synced to Feishu
}

const operationHistory: HistoryEntry[] = [];

// ---- Feishu sync ----
async function syncToFeishu(plan: ExecutionPlan, result: ExecutionResult): Promise<string | undefined> {
  if (!isFeishuConnected()) return undefined;
  if (plan.toolName !== "createSchedule" || !result.success) return undefined;

  try {
    const calendarId = await getPrimaryCalendarId();
    const params = plan.parameters;
    // Default endTime to 1 hour after startTime if not provided
    const startTime = params.startTime as string;
    const endTime = params.endTime as string
      || new Date(new Date(startTime).getTime() + 3600000).toISOString();

    const event = await createFeishuEvent(calendarId, {
      summary: params.title as string,
      description: params.description as string | undefined,
      startTime,
      endTime,
      location: params.location as string | undefined,
    });
    return event.event_id;
  } catch (e) {
    console.error("[Feishu sync] Failed:", e);
    return undefined;
  }
}

// ---- Undo logic ----
function buildUndoPlan(entry: HistoryEntry): { plans: ExecutionPlan[] } | null {
  const { plan, result, feishuEventId } = entry;
  if (!result.success) return null;

  const data = result.data as Record<string, unknown>;
  const plans: ExecutionPlan[] = [];

  switch (plan.toolName) {
    case "createSchedule": {
      const id = data?.id as string;
      plans.push({
        id: crypto.randomUUID(),
        domain: "schedule",
        action: "delete",
        description: `撤销：删除日程「${plan.parameters.title}」`,
        toolName: "deleteSchedule",
        parameters: { id },
        requiresConfirmation: false,
      });
      // Also delete Feishu event if synced
      break;
    }
    case "createExpense": {
      const id = data?.id as string;
      plans.push({
        id: crypto.randomUUID(),
        domain: "expense",
        action: "delete",
        description: `撤销：删除费用「${plan.parameters.description}」¥${plan.parameters.amount}`,
        toolName: "deleteExpense",
        parameters: { id },
        requiresConfirmation: false,
      });
      break;
    }
    case "createFeishuSchedule": {
      const event = data?.event as Record<string, unknown> | undefined;
      const eventId = (event?.event_id as string) || (data?.event_id as string);
      if (!eventId) return null;
      plans.push({
        id: crypto.randomUUID(),
        domain: "schedule",
        action: "delete",
        description: `撤销：删除飞书日程「${plan.parameters.title}」`,
        toolName: "deleteFeishuSchedule",
        parameters: { eventId },
        requiresConfirmation: false,
      });
      break;
    }
    default:
      return null;
  }

  if (plans.length === 0) return null;
  return { plans };
}

// ---- Claude helpers ----

function extractText(response: Anthropic.Message): string {
  for (const block of response.content) {
    if (block.type === "text" && block.text.trim().length > 0) return block.text;
  }
  for (const block of response.content) {
    if (block.type === "thinking" && block.thinking.trim().length > 0) return block.thinking;
  }
  return "";
}

async function generateClarification(intent: Intent): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: getClarificationPrompt(),
    messages: [
      {
        role: "user",
        content: `用户说: "${intent.rawMessage}"，我无法明确理解用户的意图。请询问用户具体想要做什么。`,
      },
    ],
  });
  return extractText(response) || "抱歉，我没有理解您的意思。请告诉我您想要做什么？";
}

async function generateChatResponse(message: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: getChatPrompt(),
    messages: [{ role: "user", content: message }],
  });
  return extractText(response) || "你好！我可以帮你管理日程和费用。";
}

async function generateFeedback(plan: ExecutionPlan, result: ExecutionResult, extraInfo?: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: getFeedbackPrompt(),
    messages: [
      {
        role: "user",
        content: `操作计划: ${plan.description}
执行结果: ${result.success ? "成功" : "失败"}
结果数据: ${JSON.stringify(result.data)}
错误信息: ${result.error || "无"}
${extraInfo ? `额外信息: ${extraInfo}` : ""}

请用中文反馈给用户。`,
      },
    ],
  });
  return extractText(response) || (result.success ? "操作完成！" : "操作失败，请重试。");
}

function isUndoCommand(message: string): boolean {
  const undoKeywords = ["撤销", "撤回", "undo", "回退"];
  return undoKeywords.some((kw) => message.toLowerCase().includes(kw));
}

// ---- Main pipeline ----

export async function run(
  message: string,
  history: { role: string; content: string }[]
): Promise<OrchestratorResponse> {
  // Handle undo
  if (isUndoCommand(message)) {
    const last = operationHistory[operationHistory.length - 1];
    if (!last) {
      return { type: "result", text: "没有可撤销的操作。" };
    }

    const undo = buildUndoPlan(last);
    if (!undo) {
      return { type: "result", text: "上一步操作不支持撤销。" };
    }

    // Execute all undo plans
    for (const undoPlan of undo.plans) {
      await execute(undoPlan);
    }

    // Also delete Feishu event if it was synced
    if (last.feishuEventId && (await isFeishuConnected())) {
      try {
        const calendarId = await getPrimaryCalendarId();
        await deleteFeishuEvent(calendarId, last.feishuEventId);
      } catch (e) {
        console.error("[Undo] Failed to delete Feishu event:", e);
      }
    }

    operationHistory.pop();
    return {
      type: "result",
      text: `已撤销：${last.plan.description}`,
    };
  }

  // Intent recognition
  const intent = await recognizeIntent(message, history);

  // Handle unclear intent
  if (intent.domain === "unknown" || intent.confidence < 0.5) {
    const text = await generateClarification(intent);
    return { type: "clarification", text };
  }

  // Handle chat
  if (intent.action === "chat") {
    const text = await generateChatResponse(message);
    return { type: "chat", text };
  }

  // Generate plan
  const plan = await generatePlan(intent, history);

  // Auto-execute
  const result = await execute(plan);

  // Auto-sync local schedule to Feishu
  let feishuEventId: string | undefined;
  let extraInfo: string | undefined;
  if (plan.toolName === "createSchedule" && result.success && (await isFeishuConnected())) {
    feishuEventId = await syncToFeishu(plan, result);
    if (feishuEventId) {
      extraInfo = "该日程已自动同步到飞书日历。";
    }
  }

  // Log for undo
  operationHistory.push({ plan, result, feishuEventId });
  if (operationHistory.length > 50) operationHistory.shift();

  const feedbackText = await generateFeedback(plan, result, extraInfo);
  return { type: "result", text: feedbackText, plan, result };
}
