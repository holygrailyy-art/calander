import Anthropic from "@anthropic-ai/sdk";
import { Intent, ExecutionPlan } from "@/types/agent";
import { getPlanPrompt } from "./prompts";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const anthropic = new Anthropic();

function extractText(response: Anthropic.Message): string {
  for (const block of response.content) {
    if (block.type === "text" && block.text.trim().length > 0) return block.text;
  }
  for (const block of response.content) {
    if (block.type === "thinking" && block.thinking.trim().length > 0) return block.thinking;
  }
  return "";
}

function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
}

async function getDomainContext(intent: Intent): Promise<string> {
  const parts: string[] = [];

  if (intent.domain === "schedule") {
    // Fetch recent schedules for context (for update/delete operations)
    const schedules = await prisma.schedule.findMany({
      orderBy: { startTime: "desc" },
      take: 20,
    });
    if (schedules.length > 0) {
      parts.push("## 现有日程数据");
      for (const s of schedules) {
        parts.push(
          `- ID: ${s.id}, 标题: ${s.title}, 时间: ${s.startTime.toISOString()}${s.endTime ? " ~ " + s.endTime.toISOString() : ""}${s.location ? ", 地点: " + s.location : ""}`
        );
      }
    }
  }

  if (intent.domain === "expense") {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 20,
    });
    if (expenses.length > 0) {
      parts.push("## 现有费用数据");
      for (const e of expenses) {
        parts.push(
          `- ID: ${e.id}, 金额: ¥${e.amount}, 分类: ${e.category}, 描述: ${e.description || "无"}, 日期: ${e.date.toISOString()}`
        );
      }
    }
  }

  return parts.join("\n");
}

export async function generatePlan(
  intent: Intent,
  history: { role: string; content: string }[]
): Promise<ExecutionPlan> {
  const now = new Date();
  const currentTime = now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  const domainContext = await getDomainContext(intent);

  const systemPrompt = getPlanPrompt(currentTime);

  const userMessage = `用户意图:
- 域: ${intent.domain}
- 操作: ${intent.action}
- 参数: ${JSON.stringify(intent.parameters)}
- 原始消息: ${intent.rawMessage}

${domainContext ? domainContext : "（无现有数据）"}

请根据以上信息生成执行计划。`;

  let text = "";
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    text = extractText(response);
    if (text) break;
    // retry
  }

  if (!text) {
    return {
      id: randomUUID(),
      domain: intent.domain as "schedule" | "expense",
      action: intent.action as "create" | "update" | "delete" | "query",
      description: "无法生成计划，请重试",
      toolName: "",
      parameters: {},
      requiresConfirmation: true,
    };
  }

  try {
    const jsonStr = extractJson(text);
    const parsed = JSON.parse(jsonStr);
    return {
      id: randomUUID(),
      domain: parsed.domain || intent.domain,
      action: parsed.action || intent.action,
      description: parsed.description || "执行操作",
      toolName: parsed.toolName || "",
      parameters: parsed.parameters || {},
      requiresConfirmation: parsed.requiresConfirmation ?? true,
    };
  } catch (e) {
    console.error("[Planner] Parse error:", e, "Raw text:", text);
    // Fallback plan
    return {
      id: randomUUID(),
      domain: intent.domain as "schedule" | "expense",
      action: intent.action as "create" | "update" | "delete" | "query",
      description: `无法解析操作，请重试`,
      toolName: "",
      parameters: {},
      requiresConfirmation: true,
    };
  }
}
