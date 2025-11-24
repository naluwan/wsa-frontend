import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 取得課程的單元列表 API（Next.js Route Handler）
 *
 * 功能說明：
 * - 從 httpOnly cookie 中讀取 JWT token
 * - 向後端 /api/courses/{courseCode}/units 發送請求取得單元列表
 * - 回傳單元列表給前端元件使用
 *
 * 資料來源：後端 /api/courses/{courseCode}/units（真實資料）
 *
 * 使用場景：
 * - /courses/[courseCode] 頁面顯示單元列表
 *
 * 錯誤處理：
 * - 無 token → 回傳 401 未授權
 * - token 無效或過期 → 回傳 401 未授權
 * - 課程不存在 → 回傳 404
 * - 其他錯誤 → 回傳 500 伺服器錯誤
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseCode: string }> }
) {
  try {
    const { courseCode } = await params;

    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/courses/[courseCode]/units] Token 存在:", !!token);
    console.log("[/api/courses/[courseCode]/units] 課程代碼:", courseCode);

    // 步驟 2: 若沒有 token，回傳 401
    if (!token) {
      console.log("[/api/courses/[courseCode]/units] 沒有 token，回傳 401");
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 步驟 3: 使用 token 向後端 API 請求單元列表
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    console.log("[/api/courses/[courseCode]/units] 向後端發送請求到:", `${apiUrl}/api/courses/${courseCode}/units`);

    const response = await fetch(
      `${apiUrl}/api/courses/${courseCode}/units`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("[/api/courses/[courseCode]/units] 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/courses/[courseCode]/units] 後端回應錯誤:", response.status, errorText);
      return NextResponse.json(
        { error: response.status === 404 ? "找不到課程" : "取得單元列表失敗" },
        { status: response.status }
      );
    }

    // 步驟 5: 取得單元列表並回傳給前端
    const units = await response.json();
    console.log("[/api/courses/[courseCode]/units] 成功取得單元列表，共", units.length, "個單元");
    return NextResponse.json(units, { status: 200 });
  } catch (error) {
    console.error("[/api/courses/[courseCode]/units] 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
