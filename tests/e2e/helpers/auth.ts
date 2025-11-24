import { Page, BrowserContext, APIRequestContext } from '@playwright/test';

/**
 * 使用者資料型別
 */
export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  level: number;
  totalXp: number;
  weeklyXp: number;
}

/**
 * Dev 一鍵登入（使用種子使用者）
 *
 * 此函數用於 E2E 測試中快速登入種子使用者
 * 流程：
 * 1. 呼叫 frontend /api/auth/dev-login API
 * 2. API 會自動設置 httpOnly cookie
 * 3. 回傳使用者資料供測試使用
 *
 * @param page Playwright Page 物件
 * @param externalId 種子使用者的 external_id（例如：'seed_test_001'）
 * @returns 登入後的使用者資料
 *
 * @example
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { devLogin } from './helpers/auth';
 *
 * test('登入後可以看到使用者資訊', async ({ page }) => {
 *   const user = await devLogin(page, 'seed_test_001');
 *   expect(user.displayName).toBe('王小明1');
 * });
 * ```
 */
export async function devLogin(
  page: Page,
  externalId: string = 'seed_test_001'
): Promise<User> {
  console.log(`[Dev Login Helper] 嘗試登入種子使用者: ${externalId}`);

  // 呼叫 frontend dev login API
  // 注意：必須使用 page.request 而不是獨立的 request context
  // 這樣 cookie 才會自動設置到 page 的 browser context 中
  const response = await page.request.post('http://localhost:3000/api/auth/dev-login', {
    data: {
      externalId,
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Dev login failed: ${response.status()} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Dev login failed: ${data.error}`);
  }

  console.log(`[Dev Login Helper] 登入成功: ${data.user.displayName} (Level ${data.user.level}, ${data.user.totalXp} XP)`);

  return data.user;
}

/**
 * Dev 一鍵登入（使用 APIRequestContext）
 *
 * 此版本適用於需要先設置認證再創建 page 的情境
 * 使用此方法時，需要手動將 cookie 設置到 browser context
 *
 * @param request Playwright APIRequestContext
 * @param context Playwright BrowserContext
 * @param externalId 種子使用者的 external_id
 * @returns 登入後的使用者資料
 *
 * @example
 * ```typescript
 * test('使用 context 登入', async ({ request, context, browser }) => {
 *   const user = await devLoginWithContext(request, context, 'seed_test_001');
 *   const page = await context.newPage();
 *   // ... 測試邏輯
 * });
 * ```
 */
export async function devLoginWithContext(
  request: APIRequestContext,
  context: BrowserContext,
  externalId: string = 'seed_test_001'
): Promise<User> {
  console.log(`[Dev Login Helper (Context)] 嘗試登入種子使用者: ${externalId}`);

  // 呼叫 frontend dev login API
  const response = await request.post('http://localhost:3000/api/auth/dev-login', {
    data: {
      externalId,
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Dev login failed: ${response.status()} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Dev login failed: ${data.error}`);
  }

  // 手動從 response headers 中提取 cookie 並設置到 context
  // 注意：由於 httpOnly cookie 無法透過 JavaScript 存取，
  // 我們需要從 Set-Cookie header 中讀取
  const setCookieHeaders = response.headers()['set-cookie'];
  if (setCookieHeaders) {
    const cookies = Array.isArray(setCookieHeaders)
      ? setCookieHeaders
      : [setCookieHeaders];

    for (const cookieStr of cookies) {
      const cookie = parseCookie(cookieStr);
      await context.addCookies([cookie]);
    }
  }

  console.log(`[Dev Login Helper (Context)] 登入成功: ${data.user.displayName} (Level ${data.user.level}, ${data.user.totalXp} XP)`);

  return data.user;
}

/**
 * 解析 Set-Cookie header 字串為 Playwright cookie 物件
 */
function parseCookie(setCookieStr: string): any {
  const parts = setCookieStr.split(';').map((part) => part.trim());
  const [nameValue] = parts;
  const [name, value] = nameValue.split('=');

  const cookie: any = {
    name,
    value,
    domain: 'localhost',
    path: '/',
  };

  for (const part of parts.slice(1)) {
    const [key, val] = part.split('=');
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'httponly') {
      cookie.httpOnly = true;
    } else if (lowerKey === 'secure') {
      cookie.secure = true;
    } else if (lowerKey === 'samesite') {
      cookie.sameSite = val;
    } else if (lowerKey === 'max-age') {
      cookie.expires = Date.now() / 1000 + parseInt(val, 10);
    } else if (lowerKey === 'path') {
      cookie.path = val;
    } else if (lowerKey === 'domain') {
      cookie.domain = val;
    }
  }

  return cookie;
}

/**
 * 登出當前使用者
 *
 * 清除認證 cookie，使測試回到未登入狀態
 *
 * @param context Playwright BrowserContext
 */
export async function logout(context: BrowserContext): Promise<void> {
  console.log('[Auth Helper] 登出使用者');
  await context.clearCookies();
}

/**
 * 檢查當前是否已登入
 *
 * 透過呼叫 /api/auth/me 來檢查登入狀態
 *
 * @param page Playwright Page 物件
 * @returns 如果已登入則回傳使用者資料，否則回傳 null
 */
export async function checkLoginStatus(page: Page): Promise<User | null> {
  try {
    const response = await page.request.get('http://localhost:3000/api/auth/me');

    if (!response.ok()) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('[Auth Helper] 檢查登入狀態失敗:', error);
    return null;
  }
}
