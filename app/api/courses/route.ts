import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 取得所有課程列表 API（Next.js Route Handler）
 *
 * 功能說明：
 * - 公開端點（未登入也可存取）
 * - 若有 JWT token，會計算 isOwned 狀態
 * - 向後端 /api/courses 發送請求取得所有課程列表
 * - 回傳課程列表給前端元件使用
 *
 * 資料來源：後端 /api/courses（真實資料）
 *
 * 使用場景：
 * - /courses 頁面顯示所有課程
 * - 首頁顯示推薦課程
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 步驟 1: 從 cookie 中取得 JWT token（可能不存在）
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/courses] Token 存在:", !!token);

    // 步驟 2: 向後端 API 請求課程列表（無論是否有 token 都可以存取）
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    console.log("[/api/courses] 向後端發送請求到:", `${apiUrl}/api/courses`);

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${apiUrl}/api/courses`,
      { headers }
    );

    console.log("[/api/courses] 後端回應狀態:", response.status);

    // 步驟 3: 若後端回傳錯誤，回傳對應的錯誤狀態
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/courses] 後端回應錯誤:", response.status, errorText);
      return NextResponse.json(
        { error: "取得課程列表失敗" },
        { status: response.status }
      );
    }

    // 步驟 4: 取得課程列表並回傳給前端
    const courses = await response.json();
    console.log("[/api/courses] 成功取得課程列表，共", courses.length, "個課程");
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("[/api/courses] 發生錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
