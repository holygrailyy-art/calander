import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/agent/orchestrator";
import { prisma } from "@/lib/prisma";

// Use a fixed conversation ID for single-user MVP
const CONVERSATION_ID = "main";

async function loadHistory(): Promise<{ role: string; content: string }[]> {
  try {
    let conv = await prisma.conversation.findUnique({
      where: { id: CONVERSATION_ID },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { id: CONVERSATION_ID },
        include: { messages: true },
      });
    }
    return conv.messages.map((m) => ({ role: m.role, content: m.content }));
  } catch {
    return [];
  }
}

async function saveMessage(role: string, content: string) {
  try {
    await prisma.message.create({
      data: { role, content, conversationId: CONVERSATION_ID },
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body as { message?: string };

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const history = await loadHistory();
    const response = await run(message, history);

    await saveMessage("user", message);
    await saveMessage("assistant", response.text || response.plan?.description || "");

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const history = await loadHistory();
    return NextResponse.json({ messages: history });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
