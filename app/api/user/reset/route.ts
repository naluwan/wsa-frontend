import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 重置使用者資料 API（Next.js Route Handler）
 *
 * 功能說明：
 * - POST: 重置使用者的所有學習資料
 *   - 清除所有課程觀看進度（user_unit_progress）
 *   - 重置經驗值（totalXp = 0, weeklyXp = 0, level = 1）
 *   - 清除所有課程訂單（user_courses）
 * - 從 httpOnly cookie 中讀取 JWT token
 *
 * 資料來源：後端 /api/user/reset（真實資料）
 *
 * 使用場景：
 * - 開發測試時重置資料
 * - 使用者想要重新開始學習
 *
 * 錯誤處理：
 * - 無 token → 回傳 401 未授權
 * - token 無效或過期 → 回傳 401 未授權
 * - 其他錯誤 → 回傳 500 伺服器錯誤
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

/**
 * POST: 重置使用者資料
 */
export async function POST(request: NextRequest) {
  try {
    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/user/reset] POST - Token 存在:", !!token);

    // 步驟 2: 若沒有 token，回傳 401
    if (!token) {
      console.log("[/api/user/reset] POST - 沒有 token，未授權");
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 步驟 3: 使用 token 向後端 API 重置資料
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    console.log("[/api/user/reset] POST - 向後端發送請求到:", `${apiUrl}/api/user/reset`);

    const response = await fetch(
      `${apiUrl}/api/user/reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("[/api/user/reset] POST - 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，轉發錯誤
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/user/reset] POST - 後端回應錯誤:", response.status, errorText);
      return NextResponse.json(
        { error: "重置失敗" },
        { status: response.status }
      );
    }

    // 步驟 5: 成功重置
    const result = await response.json();
    console.log("[/api/user/reset] POST - 成功重置資料");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[/api/user/reset] POST - 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
