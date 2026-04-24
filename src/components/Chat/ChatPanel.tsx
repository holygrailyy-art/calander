"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChatMessage } from "@/types/chat";
import { OrchestratorResponse } from "@/types/agent";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const feishuErrorMap: Record<string, string> = {
  missing_code: "缺少授权码，请重新尝试",
  exception: "连接飞书时发生错误，请稍后重试",
  invalid_client: "飞书应用配置错误，请联系管理员",
  redirect_uri_mismatch: "回调地址不匹配，请检查飞书开放平台配置",
};

function buildFeishuMessage(
  searchParams: URLSearchParams
): ChatMessage | null {
  const error = searchParams.get("feishu_error");
  const connected = searchParams.get("feishu_connected");

  if (connected === "true") {
    return {
      id: generateId(),
      role: "assistant",
      content: "飞书已成功连接！现在可以同步日程了。",
      timestamp: new Date(),
    };
  }

  if (error) {
    const errorMsg = feishuErrorMap[error] || `飞书连接失败：${error}`;
    return {
      id: generateId(),
      role: "assistant",
      content: `飞书连接失败：${errorMsg}\n\n请检查：\n1. Vercel 环境变量是否配置了 FEISHU_APP_ID 和 FEISHU_APP_SECRET\n2. 飞书开放平台的回调地址是否配置正确`,
      timestamp: new Date(),
    };
  }

  return null;
}

export default function ChatPanel() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const feishuHandledRef = useRef(false);

  const feishuInitialMessage = useMemo(
    () => buildFeishuMessage(searchParams),
    [searchParams]
  );

  // Load conversation history on mount
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch("/api/chat", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const loadedMessages: ChatMessage[] = [];

        if (data.messages && data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.map(
            (m: { role: string; content: string }, i: number) => ({
              id: `loaded-${i}`,
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
              timestamp: new Date(),
            })
          );
          loadedMessages.push(...loaded);
        }

        if (feishuInitialMessage && !feishuHandledRef.current) {
          feishuHandledRef.current = true;
          loadedMessages.push(feishuInitialMessage);
        }

        setMessages(loadedMessages);
      })
      .catch(() => {
        if (feishuInitialMessage && !feishuHandledRef.current) {
          feishuHandledRef.current = true;
          setMessages([feishuInitialMessage]);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setInitialLoading(false);
      });
  }, []);

  async function sendMessage(message: string) {
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data: OrchestratorResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: data.type === "result" ? "result" : "assistant",
        content: data.text || "操作完成",
        result: data.result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "网络错误，请稍后重试。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-200 px-3 sm:px-6 py-2.5 sm:py-4 bg-white">
        <h2 className="text-sm sm:text-base font-semibold text-zinc-900">对话</h2>
        <p className="text-xs text-zinc-500">用自然语言管理日程和费用 · 说「撤销」可回退上一步</p>
      </div>
      <MessageList messages={messages} loading={loading} />
      <InputBar onSend={sendMessage} disabled={loading} />
    </div>
  );
}
