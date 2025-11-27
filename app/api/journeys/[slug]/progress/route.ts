/**
 * Journey Progress API Route - 取得使用者的課程進度
 * GET /api/journeys/:slug/progress
 *
 * 代理後端 API: GET /api/journeys/:slug/progress
 * 回傳使用者已完成的 lesson ID 列表
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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `${backendUrl}/api/journeys/${slug}/progress`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      console.error(
        `[API /journeys/${slug}/progress] Backend returned ${response.status}`
      )
      return NextResponse.json(
        { completedLessonIds: [] },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[API /journeys/${slug}/progress] Error:`, error)
    return NextResponse.json(
      { completedLessonIds: [] },
      { status: 500 }
    )
  }
}
