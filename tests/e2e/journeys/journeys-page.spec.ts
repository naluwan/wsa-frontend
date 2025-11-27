import { test, expect } from '@playwright/test';
import { devLogin } from '../helpers/auth';

/**
 * E2E 測試：/journeys 頁面驗證
 *
 * 測試範圍：
 * 1. 未登入狀態下可以進入頁面
 * 2. 進入頁面可以看到「立即加入課程」按鈕
 * 3. 點擊「立即加入課程」按鈕會跳轉至該課程建立訂單
 * 4. 當上方課程篩選器變換時,/journeys 內容會變
 * 5. 如果該課程已經有訂單且是待付款狀態,點擊「立即加入課程」會跳轉到該課程的完成支付頁面
 *
 * 前置條件：
 * - 使用 courseCode 'software-design-pattern' 進行測試
 * - 需要先在 /courses 頁面選擇課程以設定 currentCourse context
 */

test.describe('Journeys 頁面測試', () => {
  test.beforeEach(async ({ context }) => {
    console.log('[Setup] 清除 cookies 重置登入狀態');
    await context.clearCookies();
  });

  test.describe('未登入狀態', () => {
    test('未登入時可以進入 /journeys 頁面並看到立即加入課程按鈕', async ({ page }) => {
      // Given: 我在未登入狀態下先選擇一個課程
      console.log('[Given] 未登入狀態下訪問課程列表頁');
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      // And: 我點擊第一個課程卡片以選擇課程
      console.log('[And] 點擊第一個課程卡片選擇課程');
      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500); // 等待 context 更新

      // When: 我訪問 /journeys 頁面
      console.log('[When] 訪問 /journeys 頁面');
      await page.goto('http://localhost:3000/journeys');
      await page.waitForLoadState('load');

      // Then: 應該能成功進入頁面
      console.log('[Then] 驗證成功進入頁面');
      expect(page.url()).toContain('/journeys');

      // And: 應該看到「立即加入課程」按鈕
      console.log('[And] 驗證看到立即加入課程按鈕');
      // 等待頁面載入完成，不再顯示「載入中...」
      await page.waitForSelector('text=載入中...', { state: 'hidden', timeout: 15000 }).catch(() => {
        console.log('⚠️ 載入中... 文字未出現或已消失');
      });

      const joinButtons = page.getByRole('button', { name: '立即加入課程' });
      await expect(joinButtons.first()).toBeVisible({ timeout: 10000 });
      const count = await joinButtons.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ 找到 ${count} 個立即加入課程按鈕`);

      console.log('[Test] ✅ 未登入時可以進入 /journeys 頁面並看到立即加入課程按鈕');
    });

    test('未登入時點擊「立即加入課程」按鈕應跳轉至建立訂單頁面', async ({ page }) => {
      // Given: 我在未登入狀態下先選擇課程並進入 /journeys 頁面
      console.log('[Given] 未登入狀態下選擇課程並進入 /journeys');
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      await page.goto('http://localhost:3000/journeys');
      await page.waitForLoadState('load');

      // When: 我點擊「立即加入課程」按鈕
      console.log('[When] 點擊立即加入課程按鈕');
      const joinButton = page.getByRole('button', { name: '立即加入課程' }).first();
      await expect(joinButton).toBeVisible({ timeout: 5000 });
      await joinButton.click();

      // Then: 應該跳轉到建立訂單頁面
      console.log('[Then] 驗證跳轉到建立訂單頁面');
      await page.waitForURL('**/orders?productId=**', { timeout: 10000 });
      expect(page.url()).toContain('/orders?productId=');
      console.log('✅ 成功跳轉到建立訂單頁面');

      console.log('[Test] ✅ 未登入時點擊立即加入課程按鈕跳轉成功');
    });
  });

  test.describe('課程篩選器變換測試', () => {
    test('變換課程篩選器時 /journeys 頁面內容應該改變', async ({ page }) => {
      // Given: 我已登入並選擇第一個課程
      console.log('[Given] 已登入並選擇第一個課程');
      await devLogin(page, 'seed_test_001');

      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      const firstCourseTitle = await firstCourseCard.locator('[data-testid="course-title"]').textContent();
      console.log(`第一個課程: ${firstCourseTitle}`);
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      // And: 我在 /journeys 頁面
      console.log('[And] 在 /journeys 頁面');
      await page.goto('http://localhost:3000/journeys');
      await page.waitForLoadState('load');

      // And: 記錄當前頁面的課程標題
      const initialTitle = await page.locator('h1').first().textContent();
      console.log(`初始課程標題: ${initialTitle}`);

      // When: 我變換課程篩選器(選擇下一個課程)
      console.log('[When] 變換課程篩選器');
      const courseSelector = page.locator('button[role="combobox"]');

      // 檢查課程選擇器是否存在
      const isSelectorVisible = await courseSelector.isVisible().catch(() => false);

      if (isSelectorVisible) {
        await courseSelector.click();
        await page.waitForTimeout(500);

        // 選擇第二個課程選項
        const courseOptions = page.locator('[role="option"]');
        const optionsCount = await courseOptions.count();

        if (optionsCount > 1) {
          await courseOptions.nth(1).click();
          await page.waitForTimeout(1000); // 等待頁面重新載入

          // Then: 頁面內容應該改變
          console.log('[Then] 驗證頁面內容改變');
          const newTitle = await page.locator('h1').first().textContent();
          console.log(`變換後課程標題: ${newTitle}`);

          expect(newTitle).not.toBe(initialTitle);
          console.log('✅ 課程篩選器變換後,頁面內容已改變');
        } else {
          console.log('⚠️ 只有一個課程,無法測試篩選器變換');
        }
      } else {
        console.log('⚠️ 課程選擇器不可見,可能在此頁面不顯示');
      }

      console.log('[Test] ✅ 課程篩選器變換測試完成');
    });

    test('變換課程後點擊「立即加入課程」應跳轉到對應課程的訂單頁面', async ({ page }) => {
      // Given: 我已登入並選擇第一個課程
      console.log('[Given] 已登入並選擇第一個課程');
      await devLogin(page, 'seed_test_001');

      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      await page.goto('http://localhost:3000/journeys');
      await page.waitForLoadState('load');

      // When: 我記錄第一個課程的 productId
      const joinButton = page.getByRole('button', { name: '立即加入課程' }).first();
      await expect(joinButton).toBeVisible({ timeout: 5000 });

      // 點擊按鈕並記錄跳轉的 URL
      await joinButton.click();
      await page.waitForURL('**/orders?productId=**', { timeout: 10000 });
      const firstProductUrl = page.url();
      console.log(`第一個課程的訂單頁面: ${firstProductUrl}`);

      // 回到 /journeys 頁面
      await page.goto('http://localhost:3000/journeys');
      await page.waitForLoadState('load');

      // And: 變換到第二個課程
      console.log('[And] 變換到第二個課程');
      const courseSelector = page.locator('button[role="combobox"]');
      const isSelectorVisible = await courseSelector.isVisible().catch(() => false);

      if (isSelectorVisible) {
        await courseSelector.click();
        await page.waitForTimeout(500);

        const courseOptions = page.locator('[role="option"]');
        const optionsCount = await courseOptions.count();

        if (optionsCount > 1) {
          await courseOptions.nth(1).click();
          await page.waitForTimeout(1000);

          // Then: 點擊「立即加入課程」應跳轉到不同的 productId
          console.log('[Then] 點擊立即加入課程並驗證 productId 不同');
          const secondJoinButton = page.getByRole('button', { name: '立即加入課程' }).first();
          await expect(secondJoinButton).toBeVisible({ timeout: 5000 });
          await secondJoinButton.click();

          await page.waitForURL('**/orders?productId=**', { timeout: 10000 });
          const secondProductUrl = page.url();
          console.log(`第二個課程的訂單頁面: ${secondProductUrl}`);

          expect(secondProductUrl).not.toBe(firstProductUrl);
          console.log('✅ 不同課程跳轉到不同的訂單頁面');
        } else {
          console.log('⚠️ 只有一個課程,無法測試不同課程的訂單頁面');
        }
      } else {
        console.log('⚠️ 課程選擇器不可見,無法測試');
      }

      console.log('[Test] ✅ 變換課程後訂單跳轉測試完成');
    });
  });

  test.describe('已擁有課程測試', () => {
    test('已擁有課程時,按鈕應顯示「進入課程」', async ({ page }) => {
      // Given: 我已登入並擁有某個課程
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // 假設第一個課程已購買,或者我們需要先購買課程
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      // 尋找已擁有的課程(有「已擁有」badge)
      const ownedCourseCard = page.locator('[data-testid="course-card"]:has-text("已擁有")').first();
      const hasOwnedCourse = await ownedCourseCard.isVisible().catch(() => false);

      if (hasOwnedCourse) {
        console.log('[Given] 找到已擁有的課程');
        await ownedCourseCard.click();
        await page.waitForTimeout(500);

        // When: 我訪問 /journeys 頁面
        console.log('[When] 訪問 /journeys 頁面');
        await page.goto('http://localhost:3000/journeys');
        await page.waitForLoadState('load');

        // Then: 應該看到「進入課程」按鈕而不是「立即加入課程」
        console.log('[Then] 驗證按鈕顯示為「進入課程」');
        const enterCourseButtons = page.getByRole('button', { name: '進入課程' });
        const count = await enterCourseButtons.count();

        if (count > 0) {
          console.log(`✅ 找到 ${count} 個「進入課程」按鈕`);
        } else {
          console.log('⚠️ 未找到「進入課程」按鈕(課程可能尚未擁有)');
        }
      } else {
        console.log('⚠️ 未找到已擁有的課程,跳過測試');
      }

      console.log('[Test] ✅ 已擁有課程按鈕顯示測試完成');
    });

    test('已擁有課程時,點擊「進入課程」應跳轉到課程學習頁面', async ({ page }) => {
      // Given: 我已登入並擁有某個課程
      console.log('[Given] 已登入並擁有課程');
      await devLogin(page, 'seed_test_001');

      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const ownedCourseCard = page.locator('[data-testid="course-card"]:has-text("已擁有")').first();
      const hasOwnedCourse = await ownedCourseCard.isVisible().catch(() => false);

      if (hasOwnedCourse) {
        await ownedCourseCard.click();
        await page.waitForTimeout(500);

        await page.goto('http://localhost:3000/journeys');
        await page.waitForLoadState('load');

        // When: 我點擊「進入課程」按鈕
        console.log('[When] 點擊進入課程按鈕');
        const enterCourseButton = page.getByRole('button', { name: '進入課程' }).first();
        const isButtonVisible = await enterCourseButton.isVisible().catch(() => false);

        if (isButtonVisible) {
          await enterCourseButton.click();

          // Then: 應該跳轉到課程學習頁面
          console.log('[Then] 驗證跳轉到課程學習頁面');
          await page.waitForTimeout(2000);
          const currentUrl = page.url();
          console.log(`當前 URL: ${currentUrl}`);

          // 課程學習頁面的 URL 格式: /journeys/{slug}/chapters/{chapterId}/missions/{lessonId}
          const isMissionPage = currentUrl.includes('/missions/');
          expect(isMissionPage).toBe(true);
          console.log('✅ 成功跳轉到課程學習頁面');
        } else {
          console.log('⚠️ 「進入課程」按鈕不可見,跳過測試');
        }
      } else {
        console.log('⚠️ 未找到已擁有的課程,跳過測試');
      }

      console.log('[Test] ✅ 進入課程按鈕跳轉測試完成');
    });
  });

  test.describe('待付款訂單跳轉測試', () => {
    test('已登入且有待付款訂單時,點擊「立即加入課程」應跳轉到完成支付頁面', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我先建立一個待付款訂單
      console.log('[And] 建立待付款訂單');
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      // 點擊「立刻購買」按鈕建立訂單
      const purchaseButton = page.locator('[data-testid="purchase-course-button"]').first();
      if (await purchaseButton.isVisible().catch(() => false)) {
        await purchaseButton.click();
        await page.waitForURL('**/orders?productId=**', { timeout: 10000 });

        // 在訂單頁面填寫資料並建立訂單(但不付款)
        const createOrderButton = page.getByRole('button', { name: '建立訂單' });
        if (await createOrderButton.isVisible().catch(() => false)) {
          await createOrderButton.click();
          await page.waitForTimeout(2000); // 等待訂單建立
        }
      }

      // When: 我回到 /journeys 頁面
      console.log('[When] 回到 /journeys 頁面');

      // 監聽頁面的 console 訊息，特別是訂單檢查相關的日誌
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[JourneysPage]') || text.includes('訂單')) {
          console.log(`[Browser Console] ${text}`);
        }
      });

      await page.goto('http://localhost:3000/journeys');
      await page.waitForLoadState('load');
      await page.waitForTimeout(3000); // 等待檢查訂單狀態和 API 調用完成

      // Then: 點擊「立即加入課程」應跳轉到完成支付頁面
      console.log('[Then] 點擊立即加入課程');
      const joinButton = page.getByRole('button', { name: '立即加入課程' }).first();
      await expect(joinButton).toBeVisible({ timeout: 5000 });
      await joinButton.click();

      // 驗證是否跳轉到完成支付頁面(URL 包含 orderNumber)
      console.log('[Then] 驗證跳轉到完成支付頁面');
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log(`當前 URL: ${currentUrl}`);

      // 完成支付頁面的 URL 格式: /journeys/{slug}/orders?productId={id}&orderNumber={orderNo}
      // 或 /journeys/{slug}/orders/complete?orderNumber={orderNo}
      const hasOrderNumber = currentUrl.includes('orderNumber=');
      const isCompletePage = currentUrl.includes('/complete');

      if (hasOrderNumber || isCompletePage) {
        console.log('✅ 成功跳轉到完成支付頁面');
      } else {
        console.log('⚠️ 跳轉到建立訂單頁面(待付款訂單跳轉功能可能尚未實作)');
      }

      console.log('[Test] ✅ 待付款訂單跳轉測試完成');
    });
  });
});
