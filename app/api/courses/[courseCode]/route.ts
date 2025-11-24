import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 取得課程詳情（包含章節化的單元列表）API
 *
 * 功能說明：
 * - 公開端點（未登入也可存取）
 * - 若有 JWT token，會計算 isOwned 和 canAccess 狀態
 * - 向後端 /api/courses/{courseCode} 發送請求取得課程詳情
 * - 回傳包含 sections 的完整課程資料
 *
 * 資料來源：後端 /api/courses/{courseCode}
 *
 * 使用場景：
 * - /courses/[courseCode] 課程詳情頁面
 * - 顯示 Accordion 章節與單元清單
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseCode: string }> }
) {
  try {
    // 取得 courseCode 參數
    const { courseCode } = await params;
    console.log("[/api/courses/[courseCode]] 請求課程:", courseCode);

    // 步驟 1: 從 cookie 中取得 JWT token（可能不存在）
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/courses/[courseCode]] Token 存在:", !!token);

    // 步驟 2: 向後端 API 請求課程詳情
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const backendUrl = `${apiUrl}/api/courses/${courseCode}`;
    console.log("[/api/courses/[courseCode]] 向後端發送請求到:", backendUrl);

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(backendUrl, { headers });

    console.log("[/api/courses/[courseCode]] 後端回應狀態:", response.status);

    // 步驟 3: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/courses/[courseCode]] 後端回應錯誤:", response.status, errorText);

      if (response.status === 404) {
        return NextResponse.json(
          { error: "找不到課程" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "取得課程詳情失敗" },
        { status: response.status }
      );
    }

    // 步驟 4: 取得課程詳情並回傳給前端
    const courseDetail = await response.json();
    console.log("[/api/courses/[courseCode]] 成功取得課程詳情:", courseDetail.course?.title);
    console.log("[/api/courses/[courseCode]] 章節數量:", courseDetail.sections?.length);

    return NextResponse.json(courseDetail, { status: 200 });
  } catch (error) {
    console.error("[/api/courses/[courseCode]] 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
