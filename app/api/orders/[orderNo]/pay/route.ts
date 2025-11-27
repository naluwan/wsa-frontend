/**
 * POST /api/orders/{orderNo}/pay
 * 付款 API Route
 * 轉發請求到後端 Spring Boot API
 */

import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    const res = await fetch(`${apiUrl}/api/orders/${orderNo}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "付款失敗" }))
      return NextResponse.json(error, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[POST /api/orders/{orderNo}/pay] 錯誤:", error)
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    )
  }
}
