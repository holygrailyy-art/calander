import { NextRequest, NextResponse } from "next/server";
import { setUserAccessToken } from "@/lib/feishu/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Use nextUrl.origin which works correctly for both localhost and Vercel
  const baseUrl = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(new URL(`/?feishu_error=${error}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?feishu_error=missing_code", baseUrl));
  }

  try {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;
    const redirectUri = `${baseUrl}/api/feishu/callback`;

    const res = await fetch("https://open.feishu.cn/open-apis/authen/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
      }),
    });

    const data = await res.json();
    console.log("[Feishu OAuth] Token response:", JSON.stringify(data, null, 2));

    if (data.access_token) {
      await setUserAccessToken(data.access_token, data.refresh_token);
      return NextResponse.redirect(new URL("/?feishu_connected=true", baseUrl));
    }

    const errMsg = data.msg || data.error_description || data.error || "unknown_error";
    return NextResponse.redirect(new URL(`/?feishu_error=${encodeURIComponent(errMsg)}`, baseUrl));
  } catch (err) {
    console.error("[Feishu OAuth] Error:", err);
    return NextResponse.redirect(new URL("/?feishu_error=exception", baseUrl));
  }
}
