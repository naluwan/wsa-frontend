/**
 * Journey API Route - 取得旅程詳情
 * GET /api/journeys/:slug
 *
 * 代理後端 API: GET /api/journeys/:slug
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
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

    const response = await fetch(`${backendUrl}/api/journeys/${slug}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`[API /journeys/${slug}] Backend returned ${response.status}`)
      return NextResponse.json(
        { error: 'Failed to fetch journey detail' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[API /journeys/${slug}] Error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
