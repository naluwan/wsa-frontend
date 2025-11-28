/**
 * GET /api/user/orders
 * 取得當前使用者的所有訂單
 * 轉發請求到後端 Spring Boot API
 */

import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // 取得 JWT token
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "未登入" },
        { status: 401 }
      )
    }

    // 呼叫後端 API（後端路徑是 /api/orders/user）
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    const res = await fetch(`${apiUrl}/api/orders/user`, {
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
    console.error("[GET /api/user/orders] 錯誤:", error)
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    )
  }
}
