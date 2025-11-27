import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 完成課程並獲得 XP API（Next.js Route Handler）
 *
 * 功能說明：
 * - POST: 完成課程並獲得 XP 獎勵
 * - 從 httpOnly cookie 中讀取 JWT token
 * - Proxy 到後端 /api/journeys/{slug}/lessons/{lessonId}/complete
 *
 * 使用場景：
 * - 使用者在 Journey 課程學習頁點擊「交付課程」按鈕
 * - 完成課程後獲得 XP 並更新等級
 *
 * 錯誤處理：
 * - 無 token → 回傳 401 未授權
 * - token 無效或過期 → 回傳 401 未授權
 * - 課程不存在 → 回傳 404
 * - 課程已完成過 → 回傳 400
 * - 其他錯誤 → 回傳 500 伺服器錯誤
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

/**
 * POST: 完成課程並獲得 XP
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  console.log("========================================");
  console.log("[COMPLETE API] 收到 POST 請求！");
  console.log("========================================");

  try {
    const { slug, lessonId } = await params;

    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[COMPLETE API] Token 存在:", !!token);
    console.log("[COMPLETE API] slug:", slug, ", lessonId:", lessonId);

    // 步驟 2: 若沒有 token，回傳 401
    if (!token) {
      console.log("[/api/journeys/[slug]/lessons/[lessonId]/complete] POST - 沒有 token，回傳 401");
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 步驟 3: 使用 token 向後端 API 發送完成課程請求
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const backendUrl = `${apiUrl}/api/journeys/${slug}/lessons/${lessonId}/complete`;
    console.log("[/api/journeys/[slug]/lessons/[lessonId]/complete] POST - 向後端發送請求到:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[/api/journeys/[slug]/lessons/[lessonId]/complete] POST - 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/journeys/[slug]/lessons/[lessonId]/complete] POST - 後端回應錯誤:", response.status, errorText);

      let errorMessage = "完成課程失敗";
      if (response.status === 400) {
        errorMessage = "此課程已經完成過了";
      } else if (response.status === 404) {
        errorMessage = "找不到課程";
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // 步驟 5: 取得完成課程後的回應並回傳給前端
    // 回應格式：{ user: { id, level, totalXp, weeklyXp }, unit: { unitId, isCompleted, xpEarned } }
    const result = await response.json();
    console.log("[/api/journeys/[slug]/lessons/[lessonId]/complete] POST - 成功完成課程，獲得 XP");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[/api/journeys/[slug]/lessons/[lessonId]/complete] POST - 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
