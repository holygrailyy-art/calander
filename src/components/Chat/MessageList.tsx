"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
}

export default function MessageList({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-700 mb-2">AI 日程助手</h2>
          <p className="text-sm text-zinc-500 max-w-xs">
            用自然语言管理你的日程和费用。试试说：
          </p>
          <div className="mt-3 sm:mt-4 space-y-2 w-full max-w-sm">
            {[
              "明天下午2点开个团队会议",
              "今天午饭花了35块",
              "我这周有什么安排",
              "在飞书日历上创建明天上午10点的面试",
            ].map((suggestion) => (
              <p key={suggestion} className="text-xs text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2">
                &ldquo;{suggestion}&rdquo;
              </p>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {loading && (
        <div className="flex justify-start mb-4">
          <div className="bg-zinc-100 rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
