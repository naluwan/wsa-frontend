// ==============================================================================
// WARNING / DEPRECATED:
// 此 API 屬於過渡期橋接，仍然依賴舊 Course 架構。
// 目前呼叫後端：GET /api/courses/{courseId}/orders
//
// 未來規劃：
// - 改為 Journey-based 訂單查詢（例如：GET /api/journeys/{slug}/orders）
// - 或整合到 Order Service 中統一查詢
//
// 新功能請勿依賴此 API，待後端 Journey Order API 完成後將被替換。
// ==============================================================================

/**
 * @deprecated 過渡期訂單查詢 API，請勿在新功能中使用
 *
 * GET /api/orders/by-course/{courseId}
 * 取得特定課程的訂單紀錄
 * 轉發請求到後端 Spring Boot API: GET /api/courses/{courseId}/orders
 */

import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

/**
 * @deprecated 過渡期訂單查詢 API，請勿在新功能中使用
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params

    // 取得 JWT token
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "未登入" },
        { status: 401 }
      )
    }

    // 呼叫後端 API
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    const res = await fetch(`${apiUrl}/api/courses/${courseId}/orders`, {
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "取得訂單失敗" }))
      return NextResponse.json(error, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/orders/by-course/{courseId}] 錯誤:", error)
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    )
  }
}
