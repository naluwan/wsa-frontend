import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 取得本週經驗值排行榜 API（Next.js Route Handler）
 *
 * 功能說明：
 * - 從 httpOnly cookie 中讀取 JWT token
 * - 向後端 /api/leaderboard/weekly 發送請求取得週排行榜
 * - 支援 limit 參數（預設 50 人）
 * - 回傳排行榜列表給前端元件使用
 *
 * 資料來源：後端 /api/leaderboard/weekly（真實資料）
 *
 * 使用場景：
 * - /leaderboard 頁面的週排行榜 tab
 *
 * 錯誤處理：
 * - 無 token → 回傳 401 未授權
 * - token 無效或過期 → 回傳 401 未授權
 * - 其他錯誤 → 回傳 500 伺服器錯誤
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 取得 query 參數（limit）
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "50";

    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/leaderboard/weekly] Token 存在:", !!token);
    console.log("[/api/leaderboard/weekly] 查詢人數上限:", limit);

    // 步驟 2: 若沒有 token，回傳 401
    if (!token) {
      console.log("[/api/leaderboard/weekly] 沒有 token，回傳 401");
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 步驟 3: 使用 token 向後端 API 請求週排行榜
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const backendUrl = `${apiUrl}/api/leaderboard/weekly?limit=${limit}`;
    console.log("[/api/leaderboard/weekly] 向後端發送請求到:", backendUrl);

    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[/api/leaderboard/weekly] 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/leaderboard/weekly] 後端回應錯誤:", response.status, errorText);
      return NextResponse.json(
        { error: "取得排行榜失敗" },
        { status: response.status }
      );
    }

    // 步驟 5: 取得排行榜並回傳給前端
    const leaderboard = await response.json();
    console.log("[/api/leaderboard/weekly] 成功取得排行榜，共", leaderboard.length, "筆資料");
    return NextResponse.json(leaderboard, { status: 200 });
  } catch (error) {
    console.error("[/api/leaderboard/weekly] 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
