/**
 * Journey Last Watched API Route - 取得使用者最後觀看的課程位置
 * GET /api/journeys/:slug/last-watched
 *
 * 代理後端 API: GET /api/journeys/:slug/last-watched
 * 回傳使用者最後觀看的 chapterId 和 lessonId
 *
 * Response Example (Success 200):
 * {
 *   "chapterId": 8,
 *   "lessonId": 8001,
 *   "lastPositionSeconds": 120
 * }
 *
 * Response (No Content 204 or empty):
 * 若未登入或無進度記錄
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const backendUrl = process.env.API_URL || 'http://localhost:8080'
  const { slug } = await params

  try {
    // 取得 JWT token（如果存在）
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    // 若未登入，直接回傳 null
    if (!token) {
      return NextResponse.json(null)
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }

    const response = await fetch(
      `${backendUrl}/api/journeys/${slug}/last-watched`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    )

    // 204 No Content 表示無進度記錄
    if (response.status === 204) {
      return NextResponse.json(null)
    }

    if (!response.ok) {
      console.error(
        `[API /journeys/${slug}/last-watched] Backend returned ${response.status}`
      )
      return NextResponse.json(null, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[API /journeys/${slug}/last-watched] Error:`, error)
    return NextResponse.json(null, { status: 500 })
  }
}
