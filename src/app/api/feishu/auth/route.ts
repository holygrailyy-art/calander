import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const appId = process.env.FEISHU_APP_ID;

  // Use the request origin for the redirect URI (works for both localhost and Vercel)
  const origin = req.headers.get("origin") || req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const baseUrl = origin?.startsWith("http") ? origin : `${protocol}://${origin}`;
  const redirectUri = `${baseUrl}/api/feishu/callback`;

  const authUrl = new URL("https://accounts.feishu.cn/open-apis/authen/v1/authorize");
  authUrl.searchParams.set("client_id", appId!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", "feishu_calendar_auth");

  return NextResponse.redirect(authUrl.toString());
}
