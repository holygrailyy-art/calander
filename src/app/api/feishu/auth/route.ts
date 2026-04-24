import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.FEISHU_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/feishu/callback`;

  const authUrl = new URL("https://accounts.feishu.cn/open-apis/authen/v1/authorize");
  authUrl.searchParams.set("client_id", appId!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", "feishu_calendar_auth");
  // Don't set scope - let user grant permissions through Feishu app settings

  return NextResponse.redirect(authUrl.toString());
}
