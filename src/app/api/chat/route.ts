import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/agent/orchestrator";

// In-memory conversation history (per session, simplified for MVP)
const conversations = new Map<string, { role: string; content: string }[]>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationId = "default" } = body as {
      message?: string;
      conversationId?: string;
    };

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const history = conversations.get(conversationId) || [];
    const response = await run(message, history);

    // Save to conversation history
    history.push({ role: "user", content: message });
    history.push({
      role: "assistant",
      content: response.text || response.plan?.description || "",
    });
    conversations.set(conversationId, history);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
