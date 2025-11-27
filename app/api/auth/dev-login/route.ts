import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Dev 一鍵登入 API Route（僅供開發與測試使用）
 *
 * 處理 dev 一鍵登入請求，用於 E2E 測試和本地開發
 * 流程：
 * 1. 接收種子使用者的 externalId
 * 2. 呼叫後端 /api/auth/dev-login
 * 3. 將後端回傳的 JWT token 存入 httpOnly cookie
 * 4. 回傳使用者資料
 *
 * ⚠️ 警告：此 API 應僅在開發與測試環境使用，生產環境應停用
 */
export async function POST(request: NextRequest) {
  try {
    // 步驟 1: 解析請求內容，取得 externalId
    const body = await request.json();
    const { externalId } = body;

    if (!externalId) {
      return NextResponse.json(
        { error: 'externalId is required' },
        { status: 400 }
      );
    }

    console.log('[Dev Login API] 嘗試登入種子使用者:', externalId);

    // 步驟 2: 呼叫後端 dev 登入 API
    // 使用 API_URL（容器內部）或 NEXT_PUBLIC_API_URL（本地開發）
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const loginResponse = await fetch(`${apiUrl}/api/auth/dev-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ externalId }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('[Dev Login API] Backend 回應錯誤:', errorText);
      return NextResponse.json(
        { error: 'Dev login failed', details: errorText },
        { status: loginResponse.status }
      );
    }

    const loginData = await loginResponse.json();
    console.log('[Dev Login API] 登入成功:', loginData.user.displayName);

    // 步驟 3: 將 JWT token 存入 httpOnly cookie
    // httpOnly 確保前端 JavaScript 無法存取 token，提升安全性
    const cookieStore = await cookies();
    cookieStore.set('token', loginData.token, {
      httpOnly: true, // 防止 XSS 攻擊
      secure: process.env.NODE_ENV === 'production', // 正式環境使用 HTTPS
      sameSite: 'lax', // 防止 CSRF 攻擊
      maxAge: 60 * 60 * 24 * 7, // 7 天過期
      path: '/',
    });

    // 步驟 4: 回傳使用者資料（不包含 token，因為已存在 cookie 中）
    return NextResponse.json({
      success: true,
      user: loginData.user,
    });
  } catch (error) {
    console.error('[Dev Login API] 發生錯誤:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
