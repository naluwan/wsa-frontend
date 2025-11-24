import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 取得總經驗值排行榜 API v2（Next.js Route Handler）
 *
 * 功能說明：
 * - 從 httpOnly cookie 中讀取 JWT token
 * - 向後端 /api/leaderboard/total/v2 發送請求取得總排行榜
 * - 支援 limit 和 offset 參數（分頁）
 * - 回傳排行榜列表、當前使用者排名、總人數和是否有更多資料
 *
 * 資料來源：後端 /api/leaderboard/total/v2（真實資料）
 *
 * 使用場景：
 * - /leaderboard 頁面的總排行榜 tab（支援無限滾動）
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
    // 取得 query 參數（limit 和 offset）
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    // 步驟 1: 從 cookie 中取得 JWT token（可選）
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/leaderboard/total/v2] Token 存在:", !!token);
    console.log("[/api/leaderboard/total/v2] 查詢參數 - limit:", limit, "offset:", offset);

    // 步驟 2: 向後端 API 請求總排行榜（有 token 則帶上，沒有也可以查看）
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const backendUrl = `${apiUrl}/api/leaderboard/total/v2?limit=${limit}&offset=${offset}`;
    console.log("[/api/leaderboard/total/v2] 向後端發送請求到:", backendUrl);

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(backendUrl, { headers });

    console.log("[/api/leaderboard/total/v2] 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/leaderboard/total/v2] 後端回應錯誤:", response.status, errorText);
      return NextResponse.json(
        { error: "取得排行榜失敗" },
        { status: response.status }
      );
    }

    // 步驟 5: 取得排行榜並回傳給前端
    const leaderboardData = await response.json();
    console.log("[/api/leaderboard/total/v2] 成功取得排行榜，共", leaderboardData.leaderboard?.length || 0, "筆資料");
    console.log("[/api/leaderboard/total/v2] hasMore:", leaderboardData.hasMore, "total:", leaderboardData.total);
    return NextResponse.json(leaderboardData, { status: 200 });
  } catch (error) {
    console.error("[/api/leaderboard/total/v2] 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
