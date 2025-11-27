/**
 * Journey Lesson Progress API Route - 更新課程觀看進度
 * POST /api/journeys/:slug/lessons/:lessonId/progress
 *
 * 代理後端 API: POST /api/journeys/:slug/lessons/:lessonId/progress
 * 用於保存使用者觀看影片的進度（秒數）
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  const backendUrl = process.env.API_URL || 'http://localhost:8080'
  const { slug, lessonId } = await params

  try {
    // 取得 JWT token
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    // 若沒有 token，靜默失敗（不影響播放體驗）
    if (!token) {
      return NextResponse.json(
        { lessonId: parseInt(lessonId), lastPositionSeconds: 0 },
        { status: 200 }
      )
    }

    // 取得請求內容
    const body = await request.json()

    const response = await fetch(
      `${backendUrl}/api/journeys/${slug}/lessons/${lessonId}/progress`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      // 靜默失敗，回傳請求的秒數
      return NextResponse.json(
        { lessonId: parseInt(lessonId), lastPositionSeconds: body.lastPositionSeconds || 0 },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[API /journeys/${slug}/lessons/${lessonId}/progress] Error:`, error)
    // 靜默失敗
    return NextResponse.json(
      { lessonId: parseInt(lessonId), lastPositionSeconds: 0 },
      { status: 200 }
    )
  }
}
