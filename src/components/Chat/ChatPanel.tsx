"use client";

import { useState, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { OrchestratorResponse } from "@/types/agent";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load conversation history on mount
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.map(
            (m: { role: string; content: string }, i: number) => ({
              id: `loaded-${i}`,
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
              timestamp: new Date(),
            })
          );
          setMessages(loaded);
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
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
      <div className="border-b border-zinc-200 px-4 sm:px-6 py-3 sm:py-4 bg-white">
        <h2 className="text-base font-semibold text-zinc-900">对话</h2>
        <p className="text-xs text-zinc-500">用自然语言管理日程和费用 · 说「撤销」可回退上一步</p>
      </div>
      <MessageList messages={messages} loading={loading} />
      <InputBar onSend={sendMessage} disabled={loading} />
    </div>
  );
}
