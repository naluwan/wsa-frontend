import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 保存單元觀看進度 API（Next.js Route Handler）
 *
 * 功能說明：
 * - POST: 保存使用者觀看影片的位置（秒數）
 * - 從 httpOnly cookie 中讀取 JWT token
 *
 * 資料來源：後端 /api/user/progress/{unitId}（真實資料）
 *
 * 使用場景：
 * - 播放器每 5 秒保存一次觀看位置
 * - 讓使用者下次觀看時可以從上次的位置繼續
 *
 * 錯誤處理：
 * - 無 token → 回傳 401 未授權
 * - token 無效或過期 → 回傳 401 未授權
 * - 其他錯誤 → 回傳 500 伺服器錯誤
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic';

/**
 * POST: 保存觀看進度
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;
    const body = await request.json();
    const { lastPositionSeconds } = body;

    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("[/api/user/progress/[unitId]] POST - Token 存在:", !!token);
    console.log("[/api/user/progress/[unitId]] POST - 單元 ID:", unitId);
    console.log("[/api/user/progress/[unitId]] POST - 觀看位置:", lastPositionSeconds);

    // 步驟 2: 若沒有 token，靜默失敗（不影響播放體驗）
    if (!token) {
      console.log("[/api/user/progress/[unitId]] POST - 沒有 token，靜默失敗");
      return NextResponse.json({ saved: false }, { status: 200 });
    }

    // 步驟 3: 使用 token 向後端 API 保存進度
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    console.log("[/api/user/progress/[unitId]] POST - 向後端發送請求到:", `${apiUrl}/api/user/progress/${unitId}`);

    const response = await fetch(
      `${apiUrl}/api/user/progress/${unitId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lastPositionSeconds }),
      }
    );

    console.log("[/api/user/progress/[unitId]] POST - 後端回應狀態:", response.status);

    // 步驟 4: 若後端回傳錯誤，靜默失敗（不影響播放體驗）
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/user/progress/[unitId]] POST - 後端回應錯誤:", response.status, errorText);
      return NextResponse.json({ saved: false }, { status: 200 });
    }

    // 步驟 5: 成功保存進度
    const result = await response.json();
    console.log("[/api/user/progress/[unitId]] POST - 成功保存進度");
    return NextResponse.json({ saved: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("[/api/user/progress/[unitId]] POST - 發生錯誤:", error);
    // 靜默失敗，不影響播放體驗
    return NextResponse.json({ saved: false }, { status: 200 });
  }
}
