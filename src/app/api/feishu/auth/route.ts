import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const appId = process.env.FEISHU_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "FEISHU_APP_ID not configured" }, { status: 500 });
  }

  // Use nextUrl.origin which works correctly for both localhost and Vercel
  const baseUrl = req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/feishu/callback`;

  const authUrl = new URL("https://accounts.feishu.cn/open-apis/authen/v1/authorize");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", "feishu_calendar_auth");

  return NextResponse.redirect(authUrl.toString());
}
