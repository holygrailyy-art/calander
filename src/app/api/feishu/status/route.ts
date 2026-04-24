import { NextResponse } from "next/server";
import { isFeishuConnected } from "@/lib/feishu/client";

export async function GET() {
  const connected = await isFeishuConnected();
  return NextResponse.json({ connected });
}
