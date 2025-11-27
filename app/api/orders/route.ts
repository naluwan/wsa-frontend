/**
 * POST /api/orders
 * 建立訂單 API Route
 * 轉發請求到後端 Spring Boot API
 *
 * 支援兩種參數：
 * - courseId: 課程 UUID（舊方式）
 * - slug: Journey 的 slug（新方式），例如 "software-design-pattern"
 */

import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, slug } = body

    // 檢查是否有 courseId 或 slug
    if (!courseId && !slug) {
      return NextResponse.json(
        { error: "缺少課程 ID 或 slug" },
        { status: 400 }
      )
    }

    // 取得 JWT token
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "未登入" },
        { status: 401 }
      )
    }

    // 建立請求 body
    const requestBody: { courseId?: string; slug?: string } = {}
    if (courseId) {
      requestBody.courseId = courseId
    }
    if (slug) {
      requestBody.slug = slug
    }

    // 呼叫後端 API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    const res = await fetch(`${apiUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "建立訂單失敗" }))
      return NextResponse.json(error, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[POST /api/orders] 錯誤:", error)
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    )
  }
}
