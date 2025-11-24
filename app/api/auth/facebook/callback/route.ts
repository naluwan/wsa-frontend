import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Facebook OAuth Callback Handler
 *
 * 處理 Facebook OAuth 授權後的回調請求
 * 流程：
 * 1. 接收 Facebook 回傳的授權碼（code）
 * 2. 使用授權碼向 Facebook 交換 access token
 * 3. 使用 access token 取得使用者基本資料
 * 4. 將使用者資料傳送到後端進行登入/註冊
 * 5. 將後端回傳的 JWT token 存入 httpOnly cookie
 * 6. 重新導向使用者到首頁
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");  // 取得 returnUrl（從 state 參數）

  // 解碼 returnUrl，預設為首頁
  const returnUrl = state ? decodeURIComponent(state) : "/";

  // 檢查是否有授權碼，若沒有則導回登入頁
  if (!code) {
    return NextResponse.redirect("http://localhost:3000/login");
  }

  try {
    // 步驟 1: 使用授權碼向 Facebook 交換 access token
    // 開發環境使用固定的 localhost:3000
    const redirectUri = "http://localhost:3000/api/auth/facebook/callback";

    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.append("client_id", process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!);
    tokenUrl.searchParams.append("client_secret", process.env.FACEBOOK_APP_SECRET!);
    tokenUrl.searchParams.append("redirect_uri", redirectUri);
    tokenUrl.searchParams.append("code", code);

    const tokenResp = await fetch(tokenUrl.toString());

    if (!tokenResp.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;

    // 步驟 2: 使用 access token 向 Facebook 取得使用者資料
    const userInfoUrl = new URL("https://graph.facebook.com/me");
    userInfoUrl.searchParams.append("fields", "id,name,email,picture");
    userInfoUrl.searchParams.append("access_token", accessToken);

    const userInfoResponse = await fetch(userInfoUrl.toString());

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo = await userInfoResponse.json();

    // 步驟 3: 將使用者資料傳送到後端進行登入/註冊
    // 注意：若使用者未提供 email 權限，使用 Facebook ID 作為 email
    // 使用 API_URL（容器內部）或 NEXT_PUBLIC_API_URL（本地開發）
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const loginResponse = await fetch(
      `${apiUrl}/api/auth/oauth-login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "facebook",
          externalId: userInfo.id,
          email: userInfo.email || `${userInfo.id}@facebook.com`,
          displayName: userInfo.name,
          avatarUrl: userInfo.picture?.data?.url || "",
        }),
      }
    );

    if (!loginResponse.ok) {
      throw new Error("Failed to login");
    }

    const loginData = await loginResponse.json();

    // 步驟 4: 將 JWT token 存入 httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("token", loginData.token, {
      httpOnly: true, // 防止 XSS 攻擊
      secure: process.env.NODE_ENV === "production", // 正式環境使用 HTTPS
      sameSite: "lax", // 防止 CSRF 攻擊
      maxAge: 60 * 60 * 24 * 7, // 7 天過期
      path: "/",
    });

    // 步驟 5: 登入成功，導向 returnUrl 或首頁
    // 強制使用 localhost:3000 避免跳轉到容器內部主機名
    // 使用 303 重定向確保瀏覽器完全重新載入頁面
    const redirectUrl = `http://localhost:3000${returnUrl}`;
    const response = NextResponse.redirect(redirectUrl, 303);
    return response;
  } catch (error) {
    // 若發生任何錯誤，導回登入頁並顯示錯誤訊息
    console.error("Facebook OAuth callback error:", error);
    return NextResponse.redirect("http://localhost:3000/login?error=oauth_failed");
  }
}
