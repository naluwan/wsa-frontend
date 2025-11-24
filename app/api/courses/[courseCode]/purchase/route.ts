import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Mock 購買課程 API
 *
 * 功能說明：
 * - 需要登入（必須有 JWT token）
 * - 向後端 /api/courses/{courseCode}/purchase/mock 發送請求
 * - 不串接真實金流，直接建立課程擁有權記錄
 * - 回傳購買結果
 *
 * 資料來源：後端 /api/courses/{courseCode}/purchase/mock
 *
 * 使用場景：
 * - 課程詳情頁面點擊「購買課程」按鈕
 * - 購買成功後解鎖所有單元
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseCode: string }> }
) {
  try {
    // 取得 courseCode 參數
    const { courseCode } = await params;
    console.log("[/api/courses/[courseCode]/purchase] 購買課程:", courseCode);

    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/courses/[courseCode]/purchase] Token 存在:", !!token);

    // 步驟 2: 若沒有 token，回傳 401（購買功能必須登入）
    if (!token) {
      console.log("[/api/courses/[courseCode]/purchase] 沒有 token，回傳 401");
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 步驟 3: 向後端 API 發送購買請求
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const backendUrl = `${apiUrl}/api/courses/${courseCode}/purchase/mock`;
    console.log("[/api/courses/[courseCode]/purchase] 向後端發送請求到:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[/api/courses/[courseCode]/purchase] 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/courses/[courseCode]/purchase] 後端回應錯誤:", response.status, errorText);

      if (response.status === 404) {
        return NextResponse.json(
          { error: "找不到課程" },
          { status: 404 }
        );
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: "未授權，請重新登入" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "購買課程失敗" },
        { status: response.status }
      );
    }

    // 步驟 5: 取得購買結果並回傳給前端
    const purchaseResult = await response.json();
    console.log("[/api/courses/[courseCode]/purchase] 購買成功:", purchaseResult.course?.title);

    return NextResponse.json(purchaseResult, { status: 200 });
  } catch (error) {
    console.error("[/api/courses/[courseCode]/purchase] 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
