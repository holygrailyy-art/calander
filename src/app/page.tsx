import { Suspense } from "react";
import ChatPanel from "@/components/Chat/ChatPanel";

export default function Home() {
  return (
    <div className="h-full flex flex-col bg-zinc-50">
      <Suspense
        fallback={
          <div className="flex flex-col h-full items-center justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        }
      >
        <ChatPanel />
      </Suspense>
    </div>
  );
}
