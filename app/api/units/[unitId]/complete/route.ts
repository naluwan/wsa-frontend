import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 完成單元並獲得 XP API（Next.js Route Handler）
 *
 * 功能說明：
 * - POST: 完成單元並獲得 XP 獎勵
 * - 從 httpOnly cookie 中讀取 JWT token
 *
 * 資料來源：後端 /api/units/{unitId}/complete（真實資料）
 *
 * 使用場景：
 * - 使用者在課程學習頁點擊「交付課程」按鈕
 * - 完成單元後獲得 XP 並更新等級
 *
 * 錯誤處理：
 * - 無 token → 回傳 401 未授權
 * - token 無效或過期 → 回傳 401 未授權
 * - 單元不存在 → 回傳 404
 * - 單元已完成過 → 回傳 400
 * - 其他錯誤 → 回傳 500 伺服器錯誤
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

/**
 * POST: 完成單元並獲得 XP
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;

    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/units/[unitId]/complete] POST - Token 存在:", !!token);
    console.log("[/api/units/[unitId]/complete] POST - 單元 ID:", unitId);

    // 步驟 2: 若沒有 token，回傳 401
    if (!token) {
      console.log("[/api/units/[unitId]/complete] POST - 沒有 token，回傳 401");
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 步驟 3: 使用 token 向後端 API 發送完成單元請求
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    console.log("[/api/units/[unitId]/complete] POST - 向後端發送請求到:", `${apiUrl}/api/units/${unitId}/complete`);

    const response = await fetch(
      `${apiUrl}/api/units/${unitId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("[/api/units/[unitId]/complete] POST - 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/units/[unitId]/complete] POST - 後端回應錯誤:", response.status, errorText);

      let errorMessage = "完成單元失敗";
      if (response.status === 400) {
        errorMessage = "此單元已經完成過了";
      } else if (response.status === 404) {
        errorMessage = "找不到單元";
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // 步驟 5: 取得完成單元後的回應並回傳給前端
    // 回應格式：{ user: { id, level, totalXp, weeklyXp }, unit: { unitId, isCompleted } }
    const result = await response.json();
    console.log("[/api/units/[unitId]/complete] POST - 成功完成單元，獲得 XP");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[/api/units/[unitId]/complete] POST - 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
