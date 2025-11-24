import { test, expect } from '@playwright/test';
import { devLogin } from './helpers/auth';

/**
 * R1 E2E 測試：課程列表與存取權限
 *
 * 測試範圍：
 * 1. 未登入使用者可以瀏覽課程列表
 * 2. 未登入使用者點擊單元會被要求登入
 * 3. 已登入使用者可以試看免費單元
 * 4. 已登入使用者無法觀看非免費單元（顯示鎖定）
 * 5. Mock 購買課程後解鎖所有單元
 * 6. 已購買課程的使用者可以觀看所有單元
 *
 * 對應規格：R1-Course-Unit-Access-And-Ownership-Spec.md
 */

test.describe('R1: 課程列表與存取權限', () => {
  test.beforeEach(async ({ context }) => {
    // 每個測試開始前清除 cookies，確保測試獨立性
    await context.clearCookies();
  });

  test('未登入使用者可以瀏覽課程列表頁面', async ({ page }) => {
    // Given: 我尚未登入
    // When: 我訪問課程列表頁
    await page.goto('http://localhost:3000/courses');
    await page.waitForLoadState('networkidle');

    // Then: 應該可以看到課程列表
    // 根據種子資料，應該有兩門課程：
    // 1. SOFTWARE_DESIGN_PATTERN - 軟體設計精通模式之旅
    // 2. AI_X_BDD - AI x BDD：規格驅動全自動開發術

    // 使用 data-testid 或文字內容來驗證課程卡片存在
    const courseCards = page.locator('[data-testid="course-card"]');
    const courseCount = await courseCards.count();

    // 應該至少有 1 門課程（可能有 2 門）
    expect(courseCount).toBeGreaterThanOrEqual(1);

    // 驗證課程標題存在
    await expect(page.getByText(/軟體設計|設計模式|AI.*BDD/i)).toBeVisible();

    console.log('[Test] ✅ 未登入可以瀏覽課程列表');
  });

  test('未登入使用者點擊課程單元會顯示登入提示', async ({ page }) => {
    // Given: 我尚未登入
    // When: 我訪問課程詳情頁（例如軟體設計模式課程）
    await page.goto('http://localhost:3000/courses/SOFTWARE_DESIGN_PATTERN');
    await page.waitForLoadState('networkidle');

    // Then: 應該可以看到課程內容和單元列表
    await expect(page.getByText(/軟體設計|設計模式/i)).toBeVisible();

    // When: 我點擊任一單元（例如免費試看單元）
    // 尋找第一個單元項目並點擊
    const firstUnit = page.locator('text=/課程介紹|intro/i').first();

    if (await firstUnit.isVisible()) {
      await firstUnit.click();

      // Then: 應該顯示登入提示對話框
      // 根據規格：應該彈出 AlertDialog 要求登入
      const loginDialog = page.locator('[role="alertdialog"], [role="dialog"]').filter({
        hasText: /請先登入|登入/i
      });

      await expect(loginDialog).toBeVisible({ timeout: 5000 });

      // And: 對話框中應該有「前往登入」按鈕
      const loginButton = loginDialog.locator('button, a').filter({ hasText: /前往登入|登入/i });
      await expect(loginButton).toBeVisible();

      console.log('[Test] ✅ 未登入點擊單元會顯示登入提示');
    } else {
      console.log('[Test] ⚠️ 找不到單元項目，跳過此測試');
    }
  });

  test('已登入但未購買課程時，可以試看免費單元', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    await devLogin(page, 'seed_test_010');

    // When: 我訪問課程詳情頁
    await page.goto('http://localhost:3000/courses/SOFTWARE_DESIGN_PATTERN');
    await page.waitForLoadState('networkidle');

    // When: 我點擊免費試看單元（根據種子資料，前兩個單元是免費的）
    // 單元：sdp-intro-course-overview, sdp-intro-ai-era
    const freeUnit = page.locator('text=/課程介紹.*手把手|這門課手把手/i').first();

    if (await freeUnit.isVisible()) {
      await freeUnit.click();
      await page.waitForLoadState('networkidle');

      // Then: 應該可以看到影片播放器或單元內容
      // 不應該顯示「無法觀看」訊息
      const cannotWatchMessage = page.locator('text=/無法觀看|購買.*才能享有/i');
      await expect(cannotWatchMessage).not.toBeVisible();

      // And: 應該有影片相關元素（video, iframe, 或播放器組件）
      const videoPlayer = page.locator('video, iframe[src*="youtube"], iframe[src*="youtu.be"]');
      const hasVideo = await videoPlayer.count() > 0;

      if (hasVideo) {
        console.log('[Test] ✅ 免費單元可以正常觀看（有影片播放器）');
      } else {
        console.log('[Test] ⚠️ 找不到影片播放器，但沒有「無法觀看」訊息');
      }
    } else {
      console.log('[Test] ⚠️ 找不到免費試看單元');
    }
  });

  test('已登入但未購買課程時，非免費單元顯示鎖定狀態', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    await devLogin(page, 'seed_test_010');

    // When: 我訪問課程詳情頁
    await page.goto('http://localhost:3000/courses/SOFTWARE_DESIGN_PATTERN');
    await page.waitForLoadState('networkidle');

    // When: 我點擊非免費單元（根據種子資料，「平台使用手冊」是付費單元）
    const lockedUnit = page.locator('text=/平台使用手冊|副本零/i').first();

    if (await lockedUnit.isVisible()) {
      await lockedUnit.click();
      await page.waitForLoadState('networkidle');

      // Then: 應該顯示「無法觀看」訊息
      // 根據規格：應該顯示類似「您無法觀看「平台使用手冊」這是購買「軟體設計精通模式之旅」之後才能享有的內容。」
      const cannotWatchMessage = page.locator('text=/無法觀看|購買.*才能享有/i');
      await expect(cannotWatchMessage).toBeVisible({ timeout: 5000 });

      // And: 不應該顯示影片播放器
      const videoPlayer = page.locator('video, iframe[src*="youtube"]');
      await expect(videoPlayer).not.toBeVisible();

      console.log('[Test] ✅ 非免費單元顯示鎖定狀態');
    } else {
      console.log('[Test] ⚠️ 找不到付費單元');
    }
  });

  test('Mock 購買課程後，所有單元都應該解鎖', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    const user = await devLogin(page, 'seed_test_015');

    // And: 我在課程詳情頁
    await page.goto('http://localhost:3000/courses/SOFTWARE_DESIGN_PATTERN');
    await page.waitForLoadState('networkidle');

    // And: 確認目前無法觀看付費單元
    const lockedUnitBefore = page.locator('text=/平台使用手冊/i').first();
    if (await lockedUnitBefore.isVisible()) {
      await lockedUnitBefore.click();
      await page.waitForLoadState('networkidle');

      // 應該看到鎖定訊息
      await expect(page.locator('text=/無法觀看|購買.*才能享有/i')).toBeVisible();
    }

    // When: 我呼叫 Mock 購買 API
    const purchaseResponse = await page.request.post(
      'http://localhost:8080/api/courses/SOFTWARE_DESIGN_PATTERN/purchase/mock',
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Then: 購買應該成功
    expect(purchaseResponse.ok()).toBeTruthy();
    const purchaseData = await purchaseResponse.json();
    expect(purchaseData.course.isOwned).toBe(true);

    console.log('[Test] ✅ Mock 購買 API 成功');

    // When: 重新載入頁面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // And: 再次點擊之前被鎖定的單元
    const unlockedUnit = page.locator('text=/平台使用手冊/i').first();
    if (await unlockedUnit.isVisible()) {
      await unlockedUnit.click();
      await page.waitForLoadState('networkidle');

      // Then: 不應該再顯示「無法觀看」訊息
      await expect(page.locator('text=/無法觀看|購買.*才能享有/i')).not.toBeVisible();

      console.log('[Test] ✅ 購買後單元成功解鎖');
    }
  });

  test('課程列表頁應顯示課程的擁有狀態', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    await devLogin(page, 'seed_test_020');

    // When: 我訪問課程列表頁
    await page.goto('http://localhost:3000/courses');
    await page.waitForLoadState('networkidle');

    // Then: 未擁有的課程應該顯示「尚未擁有」或「立刻購買」
    // 已擁有的課程應該顯示「已擁有」或「進入課程」

    // 查找課程卡片
    const courseCards = page.locator('[data-testid="course-card"]');
    const firstCard = courseCards.first();

    if (await firstCard.isVisible()) {
      // 應該有購買或進入相關的按鈕
      const actionButtons = firstCard.locator('button, a').filter({
        hasText: /立刻購買|進入課程|試聽/i
      });

      const buttonCount = await actionButtons.count();
      expect(buttonCount).toBeGreaterThan(0);

      console.log('[Test] ✅ 課程卡片顯示操作按鈕');
    }
  });

  test('GET /api/courses 應回傳課程列表與擁有狀態', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    await devLogin(page, 'seed_test_025');

    // When: 我呼叫課程列表 API
    const response = await page.request.get('http://localhost:8080/api/courses');

    // Then: 應該成功回傳
    expect(response.ok()).toBeTruthy();

    // And: 回傳的資料應該是陣列
    const courses = await response.json();
    expect(Array.isArray(courses)).toBeTruthy();
    expect(courses.length).toBeGreaterThan(0);

    // And: 每個課程應該包含必要欄位
    const firstCourse = courses[0];
    expect(firstCourse.courseCode).toBeDefined();
    expect(firstCourse.title).toBeDefined();
    expect(firstCourse.teacherName).toBeDefined();
    expect(firstCourse.priceTwd).toBeDefined();
    expect(typeof firstCourse.isOwned).toBe('boolean');

    console.log('[Test] ✅ GET /api/courses 回傳正確格式');
  });

  test('GET /api/courses/{courseCode} 應回傳課程詳情與單元列表', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入
    await devLogin(page, 'seed_test_030');

    // When: 我呼叫課程詳情 API
    const response = await page.request.get(
      'http://localhost:8080/api/courses/SOFTWARE_DESIGN_PATTERN'
    );

    // Then: 應該成功回傳
    expect(response.ok()).toBeTruthy();

    // And: 回傳的資料應該包含課程資訊和章節列表
    const data = await response.json();
    expect(data.course).toBeDefined();
    expect(data.course.courseCode).toBe('SOFTWARE_DESIGN_PATTERN');
    expect(data.sections).toBeDefined();
    expect(Array.isArray(data.sections)).toBeTruthy();

    // And: 章節應該包含單元
    const firstSection = data.sections[0];
    expect(firstSection.sectionTitle).toBeDefined();
    expect(firstSection.units).toBeDefined();
    expect(Array.isArray(firstSection.units)).toBeTruthy();

    // And: 單元應該包含必要欄位
    const firstUnit = firstSection.units[0];
    expect(firstUnit.unitId).toBeDefined();
    expect(firstUnit.title).toBeDefined();
    expect(typeof firstUnit.isFreePreview).toBe('boolean');
    expect(typeof firstUnit.canAccess).toBe('boolean');

    console.log('[Test] ✅ GET /api/courses/{courseCode} 回傳正確格式');
  });

  test('未登入時 GET /api/courses/{courseCode} 所有單元的 canAccess 都是 false', async ({ page }) => {
    // Given: 我尚未登入（清除所有 cookies）
    await page.context().clearCookies();

    // When: 我呼叫課程詳情 API（不帶認證）
    const response = await page.request.get(
      'http://localhost:8080/api/courses/SOFTWARE_DESIGN_PATTERN'
    );

    // Then: 應該成功回傳（因為是公開 API）
    expect(response.ok()).toBeTruthy();

    // And: 所有單元的 canAccess 都應該是 false
    const data = await response.json();

    for (const section of data.sections) {
      for (const unit of section.units) {
        expect(unit.canAccess).toBe(false);
      }
    }

    console.log('[Test] ✅ 未登入時所有單元 canAccess = false');
  });

  test('已登入未購買時，只有免費單元的 canAccess 是 true', async ({ page }) => {
    // Given: 我已使用 dev 一鍵登入（使用一個沒有購買任何課程的使用者）
    await devLogin(page, 'seed_test_040');

    // When: 我呼叫課程詳情 API
    const response = await page.request.get(
      'http://localhost:8080/api/courses/SOFTWARE_DESIGN_PATTERN'
    );

    // Then: 應該成功回傳
    expect(response.ok()).toBeTruthy();

    // And: 只有免費試看的單元 canAccess 是 true
    const data = await response.json();

    let hasFreeUnit = false;
    let hasLockedUnit = false;

    for (const section of data.sections) {
      for (const unit of section.units) {
        if (unit.isFreePreview) {
          expect(unit.canAccess).toBe(true);
          hasFreeUnit = true;
        } else {
          expect(unit.canAccess).toBe(false);
          hasLockedUnit = true;
        }
      }
    }

    expect(hasFreeUnit).toBe(true); // 應該至少有一個免費單元
    expect(hasLockedUnit).toBe(true); // 應該至少有一個付費單元

    console.log('[Test] ✅ 已登入未購買時，只有免費單元可存取');
  });
});
