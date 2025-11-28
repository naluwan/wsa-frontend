/**
 * Journey API Route - 取得旅程列表
 * GET /api/journeys
 *
 * 代理後端 API: GET /api/journeys
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  try {
    // 取得 JWT token（如果存在）
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${backendUrl}/api/journeys`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`[API /journeys] Backend returned ${response.status}`)
      return NextResponse.json(
        { error: 'Failed to fetch journeys' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API /journeys] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
