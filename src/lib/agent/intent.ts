import Anthropic from "@anthropic-ai/sdk";
import { Intent } from "@/types/agent";
import { getIntentPrompt } from "./prompts";

const anthropic = new Anthropic();

function extractJson(text: string): string {
  // Remove markdown code fences
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
}

function extractText(response: Anthropic.Message): string {
  for (const block of response.content) {
    if (block.type === "text" && block.text.trim().length > 0) return block.text;
  }
  // Fallback: check thinking blocks (some models use extended thinking)
  for (const block of response.content) {
    if (block.type === "thinking" && block.thinking.trim().length > 0) return block.thinking;
  }
  return "";
}

async function callClaude(
  system: string,
  messages: Anthropic.MessageParam[]
): Promise<string> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system,
      messages,
    });
    const text = extractText(response);
    if (text) return text;
    // retry
  }
  return "";
}

export async function recognizeIntent(
  message: string,
  history: { role: string; content: string }[]
): Promise<Intent> {
  const now = new Date();
  const currentTime = now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const messages: Anthropic.MessageParam[] = [];

  // Add recent history for context (last 4 messages)
  const recentHistory = history.slice(-4);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: message });

  const text = await callClaude(getIntentPrompt(currentTime), messages);

  if (!text) {
    return {
      domain: "unknown",
      action: "chat",
      confidence: 0,
      parameters: {},
      rawMessage: message,
    };
  }

  try {
    const jsonStr = extractJson(text);
    const parsed = JSON.parse(jsonStr);
    return {
      domain: parsed.domain || "unknown",
      action: parsed.action || "chat",
      confidence: parsed.confidence || 0,
      parameters: parsed.parameters || {},
      rawMessage: message,
    };
  } catch (e) {
    return {
      domain: "unknown",
      action: "chat",
      confidence: 0,
      parameters: {},
      rawMessage: message,
    };
  }
}
