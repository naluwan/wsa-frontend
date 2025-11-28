import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 取得當前登入使用者資料 API（Next.js Route Handler）
 *
 * 功能說明：
 * - 從 httpOnly cookie 中讀取 JWT token
 * - 向後端 /api/user/me 發送請求取得使用者資料
 * - 回傳使用者資料給前端元件使用
 *
 * 資料來源：後端 /api/user/me（真實資料，非假資料）
 *
 * 使用場景：
 * - SiteHeader 顯示使用者頭像、名稱、等級、XP
 * - Profile 頁面顯示完整個人資料
 * - 任何需要取得當前登入使用者資訊的地方
 *
 * 錯誤處理：
 * - 無 token → 回傳 { user: null }（未登入）
 * - token 無效或過期 → 回傳 { user: null }（未登入）
 * - 其他錯誤 → 回傳 { user: null }（安全起見，視為未登入）
 */

// 強制此 API route 為動態路由，不要快取
// 因為使用者資訊可能隨時變更（登入/登出/更新個人資料）
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/auth/me] Token 存在:", !!token);
    console.log("[/api/auth/me] Token 前 20 字元:", token?.substring(0, 20));

    // 步驟 2: 若沒有 token，回傳 user 為 null（表示未登入）
    if (!token) {
      console.log("[/api/auth/me] 沒有 token，回傳 null");
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // 步驟 3: 使用 token 向後端 API 請求當前使用者資料
    // 環境變數說明：
    // - API_URL: 容器內部使用（docker-compose 中的 backend:8080）
    // - NEXT_PUBLIC_API_URL: 本地開發使用（localhost:8080）
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    console.log("[/api/auth/me] 使用 API URL:", apiUrl);
    console.log("[/api/auth/me] 向後端發送請求到:", `${apiUrl}/api/user/me`);

    const response = await fetch(
      `${apiUrl}/api/user/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // 在 Authorization header 中傳送 JWT token
        },
      }
    );

    console.log("[/api/auth/me] 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤（例如 401 token 過期、404 使用者不存在），視為未登入
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/auth/me] 後端回應錯誤:", response.status, errorText);
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // 步驟 5: 取得使用者資料並回傳給前端
    // 資料格式：{ id, displayName, email, avatarUrl, provider, level, totalXp, weeklyXp }
    const user = await response.json();
    console.log("[/api/auth/me] 成功取得使用者資料:", user);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    // 發生任何例外時，回傳 null 使用者（視為未登入，避免前端報錯）
    console.error("[/api/auth/me] 發生錯誤:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
