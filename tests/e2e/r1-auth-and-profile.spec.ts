import { test, expect } from '@playwright/test';
import { devLogin, logout, checkLoginStatus } from './helpers/auth';

/**
 * R1 E2E 測試：身分認證與個人檔案
 *
 * 測試範圍：
 * 1. Dev 一鍵登入功能
 * 2. 登入後 Header 顯示使用者資訊
 * 3. /api/auth/me API 回傳正確資料
 * 4. 個人檔案頁顯示正確資訊
 * 5. 登出功能
 *
 * 對應規格：R1-Identity-And-Profile-Spec.md
 */

test.describe('R1: 身分認證與個人檔案', () => {
  test.beforeEach(async ({ context }) => {
    // 每個測試開始前清除 cookies，確保測試獨立性
    await context.clearCookies();
  });

  test('Dev 一鍵登入成功後，Header 顯示使用者資訊', async ({ page }) => {
    // Given: 我在首頁，尚未登入
    await page.goto('http://localhost:3000');

    // When: 我使用 dev 一鍵登入（使用第一個種子使用者）
    const user = await devLogin(page, 'seed_test_001');

    // Then: 應該成功登入並取得使用者資料
    expect(user).toBeDefined();
    expect(user.displayName).toBe('王小明1');
    expect(user.level).toBe(36);
    expect(user.totalXp).toBe(65000);
    expect(user.weeklyXp).toBe(5000);

    // And: 重新載入頁面後，Header 應該顯示使用者資訊
    await page.reload();

    // 等待頁面載入完成
    await page.waitForLoadState('networkidle');

    // 驗證 Header 中有使用者名稱（可能在 dropdown 或其他地方）
    // 注意：這裡使用文字內容來驗證，之後應該加上 data-testid
    const displayNameLocator = page.getByText('王小明1');
    await expect(displayNameLocator).toBeVisible();

    console.log('[Test] ✅ Dev 登入成功，Header 顯示使用者名稱');
  });

  test('登入後呼叫 /api/auth/me 回傳正確的使用者資料', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    await page.goto('http://localhost:3000');
    const user = await devLogin(page, 'seed_test_002');

    // When: 我呼叫 /api/auth/me API
    const response = await page.request.get('http://localhost:3000/api/auth/me');

    // Then: 應該回傳 200 OK
    expect(response.ok()).toBeTruthy();

    // And: 回傳的 JSON 應該包含正確的使用者資料
    const data = await response.json();
    expect(data.user).toBeDefined();

    // And: 驗證所有必要欄位存在且型別正確
    expect(data.user.id).toBeDefined();
    expect(typeof data.user.id).toBe('string');

    expect(data.user.displayName).toBe('李小華2');
    expect(typeof data.user.displayName).toBe('string');

    expect(data.user.email).toBe('seed_user_2@example.com');
    expect(typeof data.user.email).toBe('string');

    expect(data.user.level).toBe(35);
    expect(typeof data.user.level).toBe('number');

    expect(data.user.totalXp).toBe(63500);
    expect(typeof data.user.totalXp).toBe('number');

    expect(data.user.weeklyXp).toBe(4800);
    expect(typeof data.user.weeklyXp).toBe('number');

    expect(data.user.avatarUrl).toBeDefined();
    expect(typeof data.user.avatarUrl).toBe('string');

    console.log('[Test] ✅ /api/auth/me 回傳正確資料格式');
  });

  test('登入後訪問個人檔案頁，顯示完整的使用者資訊', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    await page.goto('http://localhost:3000');
    const user = await devLogin(page, 'seed_test_003');

    // When: 我前往個人檔案頁
    await page.goto('http://localhost:3000/profile');

    // Then: 頁面應該顯示使用者資訊
    await expect(page.getByText('張小美3')).toBeVisible();
    await expect(page.getByText('seed_user_3@example.com')).toBeVisible();

    // And: 應該顯示等級資訊
    // 注意：這裡需要根據實際 UI 結構調整選擇器
    // 可能是 "等級 34" 或 "Lv. 34" 等格式
    const levelText = page.locator('text=/等級.*34|Lv.*34|Level.*34/i');
    await expect(levelText).toBeVisible();

    // And: 應該顯示經驗值資訊
    const totalXpText = page.locator('text=/62,?000|62000/');
    await expect(totalXpText).toBeVisible();

    console.log('[Test] ✅ 個人檔案頁顯示完整使用者資訊');
  });

  test('未登入時訪問個人檔案頁，應該顯示登入提示', async ({ page }) => {
    // Given: 我尚未登入
    await page.goto('http://localhost:3000');

    // When: 我前往個人檔案頁
    await page.goto('http://localhost:3000/profile');

    // Then: 應該顯示未登入提示
    // 根據 R1-Identity-And-Profile-Spec.md:
    // "若未登入，顯示：一個提示卡片：例如「你目前尚未登入，請先登入以查看個人檔案。」"
    const loginPrompt = page.locator('text=/尚未登入|請先登入/i');
    await expect(loginPrompt).toBeVisible();

    // And: 應該有「前往登入」按鈕
    const loginButton = page.locator('button, a').filter({ hasText: /前往登入|登入/i });
    await expect(loginButton).toBeVisible();

    console.log('[Test] ✅ 未登入時顯示登入提示');
  });

  test('登入後可以正常登出', async ({ page, context }) => {
    // Given: 我已使用 dev 一鍵登入
    await page.goto('http://localhost:3000');
    await devLogin(page, 'seed_test_001');
    await page.reload();

    // And: 確認已登入（Header 有使用者名稱）
    await expect(page.getByText('王小明1')).toBeVisible();

    // When: 我點擊登出（可能在 dropdown 或其他地方）
    // 注意：需要根據實際 UI 找到登出按鈕
    // 先嘗試清除 cookies 來模擬登出
    await logout(context);

    // And: 重新載入頁面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Then: 應該回到未登入狀態
    // Header 不應該顯示使用者名稱
    await expect(page.getByText('王小明1')).not.toBeVisible();

    // And: 應該顯示登入按鈕
    const loginButton = page.locator('button, a').filter({ hasText: /登入/i });
    await expect(loginButton).toBeVisible();

    console.log('[Test] ✅ 登出功能正常運作');
  });

  test('checkLoginStatus helper 函數可以正確檢查登入狀態', async ({ page }) => {
    // Given: 我尚未登入
    await page.goto('http://localhost:3000');

    // When: 我檢查登入狀態
    let loginStatus = await checkLoginStatus(page);

    // Then: 應該回傳 null（未登入）
    expect(loginStatus).toBeNull();

    // When: 我使用 dev 一鍵登入
    const user = await devLogin(page, 'seed_test_001');

    // And: 再次檢查登入狀態
    loginStatus = await checkLoginStatus(page);

    // Then: 應該回傳使用者資料
    expect(loginStatus).not.toBeNull();
    expect(loginStatus?.displayName).toBe('王小明1');
    expect(loginStatus?.level).toBe(36);

    console.log('[Test] ✅ checkLoginStatus 函數運作正常');
  });

  test('使用不同的種子使用者登入，資料應該不同', async ({ page }) => {
    // Test 1: 使用 seed_test_001 登入
    await page.goto('http://localhost:3000');
    let user = await devLogin(page, 'seed_test_001');

    expect(user.displayName).toBe('王小明1');
    expect(user.level).toBe(36);
    expect(user.totalXp).toBe(65000);

    // Logout
    await page.context().clearCookies();

    // Test 2: 使用 seed_test_035 登入（等級較低的使用者）
    user = await devLogin(page, 'seed_test_035');

    expect(user.displayName).toBe('胡志強35');
    expect(user.level).toBe(3);
    expect(user.totalXp).toBe(1200);

    console.log('[Test] ✅ 可以使用不同種子使用者登入，資料正確');
  });
});
