import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Google OAuth Callback Handler
 *
 * 處理 Google OAuth 授權後的回調請求
 * 流程：
 * 1. 接收 Google 回傳的授權碼（code）
 * 2. 使用授權碼向 Google 交換 access token
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
    // 步驟 1: 使用授權碼向 Google 交換 access token
    // 開發環境使用固定的 localhost:3000
    const redirectUri = "http://localhost:3000/api/auth/google/callback";

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code, // 授權碼
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!, // Google Client ID
        client_secret: process.env.GOOGLE_CLIENT_SECRET!, // Google Client Secret
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 步驟 2: 使用 access token 向 Google 取得使用者資料
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo = await userInfoResponse.json();

    // 步驟 3: 將使用者資料傳送到後端進行登入/註冊
    // 後端會建立或更新使用者，並回傳 JWT token
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
          provider: "google",
          externalId: userInfo.id,
          email: userInfo.email,
          displayName: userInfo.name,
          avatarUrl: userInfo.picture,
        }),
      }
    );

    if (!loginResponse.ok) {
      throw new Error("Failed to login");
    }

    const loginData = await loginResponse.json();

    // 步驟 4: 將 JWT token 存入 httpOnly cookie
    // httpOnly 確保前端 JavaScript 無法存取 token，提升安全性
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
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect("http://localhost:3000/login?error=oauth_failed");
  }
}
