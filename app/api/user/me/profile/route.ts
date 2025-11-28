import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * 更新使用者個人資料 API（Next.js Route Handler）
 *
 * 功能說明：
 * - PATCH: 更新使用者的個人資料
 *   - 包含：顯示名稱、暱稱、性別、職業、生日、地區、GitHub 連結、頭像
 *   - Email 欄位不可修改
 * - 從 httpOnly cookie 中讀取 JWT token
 *
 * 資料來源：後端 /api/user/me/profile（真實資料）
 *
 * 使用場景：
 * - 使用者編輯個人資料頁面
 *
 * 錯誤處理：
 * - 無 token → 回傳 401 未授權
 * - token 無效或過期 → 回傳 401 未授權
 * - 其他錯誤 → 回傳 500 伺服器錯誤
 */

// 強制此 API route 為動態路由，不要快取
export const dynamic = 'force-dynamic'

/**
 * PATCH: 更新使用者個人資料
 */
export async function PATCH(request: NextRequest) {
  try {
    // 步驟 1: 從 cookie 中取得 JWT token
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    console.log('[/api/user/me/profile] PATCH - Token 存在:', !!token)

    // 步驟 2: 若沒有 token，回傳 401
    if (!token) {
      console.log('[/api/user/me/profile] PATCH - 沒有 token，未授權')
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    // 步驟 3: 取得請求 body
    const body = await request.json()
    console.log('[/api/user/me/profile] PATCH - 請求內容:', body)

    // 步驟 4: 使用 token 向後端 API 更新個人資料
    const apiUrl =
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    console.log(
      '[/api/user/me/profile] PATCH - 向後端發送請求到:',
      `${apiUrl}/api/user/me/profile`
    )

    const response = await fetch(`${apiUrl}/api/user/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    console.log(
      '[/api/user/me/profile] PATCH - 後端回應狀態:',
      response.status
    )

    // 步驟 5: 若後端回傳錯誤，轉發錯誤
    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        '[/api/user/me/profile] PATCH - 後端回應錯誤:',
        response.status,
        errorText
      )
      return NextResponse.json(
        { error: '更新個人資料失敗' },
        { status: response.status }
      )
    }

    // 步驟 6: 成功更新
    const result = await response.json()
    console.log('[/api/user/me/profile] PATCH - 成功更新個人資料')
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[/api/user/me/profile] PATCH - 發生錯誤:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
