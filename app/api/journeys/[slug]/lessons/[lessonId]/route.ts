/**
 * Journey Lesson API Route - 取得課程單元詳情
 * GET /api/journeys/:slug/lessons/:lessonId
 *
 * 代理後端 API: GET /api/journeys/:slug/lessons/:lessonId
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  const backendUrl = process.env.API_URL || 'http://localhost:8080'
  const { slug, lessonId } = await params

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
      `${backendUrl}/api/journeys/${slug}/lessons/${lessonId}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      console.error(
        `[API /journeys/${slug}/lessons/${lessonId}] Backend returned ${response.status}`
      )
      return NextResponse.json(
        { error: 'Failed to fetch lesson detail' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[API /journeys/${slug}/lessons/${lessonId}] Error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
