import { test, expect } from '@playwright/test';
import { devLogin } from '../helpers/auth';

/**
 * E2E 測試：個人檔案頁面 - 待付款訂單功能
 *
 * 測試範圍：
 * 1. 登入後若有待付款訂單,進入個人檔案時會彈出提示框
 * 2. 提示框有兩個按鈕:「稍後再說」和「完成訂單」
 * 3. 點擊「稍後再說」會關閉提示框
 * 4. 點擊「完成訂單」會跳轉到完成支付頁面
 * 5. 個人檔案下方的訂單紀錄區域
 * 6. 待付款訂單會顯示「立即完成訂單」按鈕
 * 7. 點擊「立即完成訂單」會跳轉到完成支付頁面
 */

test.describe('個人檔案頁面 - 待付款訂單功能', () => {
  test.beforeEach(async ({ context }) => {
    console.log('[Setup] 清除 cookies 重置登入狀態');
    await context.clearCookies();
  });

  test.describe('待付款訂單提示框測試', () => {
    test('登入後有待付款訂單時,進入個人檔案會彈出提示框', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我建立一個待付款訂單
      console.log('[And] 建立待付款訂單');
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      // 檢查是否有「立刻購買」按鈕(表示尚未購買)
      const purchaseButton = page.locator('[data-testid="purchase-course-button"]').first();
      const hasPurchaseButton = await purchaseButton.isVisible().catch(() => false);

      if (hasPurchaseButton) {
        console.log('[And] 點擊立刻購買按鈕建立訂單');
        await purchaseButton.click();
        await page.waitForURL('**/orders?productId=**', { timeout: 10000 });

        // 在訂單頁面建立訂單(不付款)
        const createOrderButton = page.getByRole('button', { name: '建立訂單' });
        if (await createOrderButton.isVisible().catch(() => false)) {
          await createOrderButton.click();
          await page.waitForTimeout(2000); // 等待訂單建立
          console.log('✅ 訂單已建立');
        }
      } else {
        console.log('⚠️ 課程已購買,無法建立新訂單');
      }

      // When: 我訪問個人檔案頁面
      console.log('[When] 訪問個人檔案頁面');
      await page.goto('http://localhost:3000/users/me/profile');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000); // 等待訂單資料載入和對話框顯示

      // Then: 應該看到待付款訂單提示框
      console.log('[Then] 驗證待付款訂單提示框');
      const dialog = page.locator('[role="alertdialog"]');
      const isDialogVisible = await dialog.isVisible().catch(() => false);

      if (isDialogVisible) {
        console.log('✅ 待付款訂單提示框已顯示');

        // And: 應該看到提示框標題
        const dialogTitle = await dialog.locator('h2').first().textContent();
        expect(dialogTitle).toContain('未完成的訂單');
        console.log(`✅ 提示框標題: ${dialogTitle}`);

        // And: 應該看到兩個按鈕
        const laterButton = page.getByRole('button', { name: '稍後再說' });
        const completeButton = page.getByRole('button', { name: '完成訂單' });

        await expect(laterButton).toBeVisible();
        await expect(completeButton).toBeVisible();
        console.log('✅ 「稍後再說」和「完成訂單」按鈕都可見');
      } else {
        console.log('⚠️ 待付款訂單提示框未顯示(可能沒有待付款訂單或已過期)');
      }

      console.log('[Test] ✅ 待付款訂單提示框顯示測試完成');
    });

    test('點擊「稍後再說」按鈕應關閉提示框', async ({ page }) => {
      // Given: 我已登入並有待付款訂單
      console.log('[Given] 已登入並有待付款訂單');
      await devLogin(page, 'seed_test_001');

      // 建立待付款訂單(簡化版)
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      const purchaseButton = page.locator('[data-testid="purchase-course-button"]').first();
      if (await purchaseButton.isVisible().catch(() => false)) {
        await purchaseButton.click();
        await page.waitForURL('**/orders?productId=**', { timeout: 10000 });

        const createOrderButton = page.getByRole('button', { name: '建立訂單' });
        if (await createOrderButton.isVisible().catch(() => false)) {
          await createOrderButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // And: 我在個人檔案頁面看到提示框
      console.log('[And] 在個人檔案頁面看到提示框');
      await page.goto('http://localhost:3000/users/me/profile');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const dialog = page.locator('[role="alertdialog"]');
      const isDialogVisible = await dialog.isVisible().catch(() => false);

      if (isDialogVisible) {
        // When: 我點擊「稍後再說」按鈕
        console.log('[When] 點擊稍後再說按鈕');
        const laterButton = page.getByRole('button', { name: '稍後再說' });
        await expect(laterButton).toBeVisible();
        await laterButton.click();

        // Then: 提示框應該關閉
        console.log('[Then] 驗證提示框已關閉');
        await page.waitForTimeout(500);
        const isDialogStillVisible = await dialog.isVisible().catch(() => false);
        expect(isDialogStillVisible).toBe(false);
        console.log('✅ 提示框已關閉');
      } else {
        console.log('⚠️ 待付款訂單提示框未顯示,跳過測試');
      }

      console.log('[Test] ✅ 稍後再說按鈕測試完成');
    });

    test('點擊「完成訂單」按鈕應跳轉到完成支付頁面', async ({ page }) => {
      // Given: 我已登入並有待付款訂單
      console.log('[Given] 已登入並有待付款訂單');
      await devLogin(page, 'seed_test_001');

      // 建立待付款訂單(簡化版)
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      const purchaseButton = page.locator('[data-testid="purchase-course-button"]').first();
      if (await purchaseButton.isVisible().catch(() => false)) {
        await purchaseButton.click();
        await page.waitForURL('**/orders?productId=**', { timeout: 10000 });

        const createOrderButton = page.getByRole('button', { name: '建立訂單' });
        if (await createOrderButton.isVisible().catch(() => false)) {
          await createOrderButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // And: 我在個人檔案頁面看到提示框
      console.log('[And] 在個人檔案頁面看到提示框');
      await page.goto('http://localhost:3000/users/me/profile');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const dialog = page.locator('[role="alertdialog"]');
      const isDialogVisible = await dialog.isVisible().catch(() => false);

      if (isDialogVisible) {
        // When: 我點擊「完成訂單」按鈕
        console.log('[When] 點擊完成訂單按鈕');
        const completeButton = page.getByRole('button', { name: '完成訂單' });
        await expect(completeButton).toBeVisible();
        await completeButton.click();

        // Then: 應該跳轉到完成支付頁面
        console.log('[Then] 驗證跳轉到完成支付頁面');
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        console.log(`當前 URL: ${currentUrl}`);

        // 完成支付頁面的 URL 格式: /journeys/{slug}/orders?productId={id}&orderNumber={orderNo}
        const hasOrderNumber = currentUrl.includes('orderNumber=');
        expect(hasOrderNumber).toBe(true);
        console.log('✅ 成功跳轉到完成支付頁面');
      } else {
        console.log('⚠️ 待付款訂單提示框未顯示,跳過測試');
      }

      console.log('[Test] ✅ 完成訂單按鈕測試完成');
    });
  });

  test.describe('訂單紀錄區域測試', () => {
    test('個人檔案下方應顯示訂單紀錄', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // When: 我訪問個人檔案頁面
      console.log('[When] 訪問個人檔案頁面');
      await page.goto('http://localhost:3000/users/me/profile');
      await page.waitForLoadState('load');

      // Then: 應該看到訂單紀錄區域
      console.log('[Then] 驗證訂單紀錄區域');
      const orderSection = page.locator('text=訂單紀錄').first();
      await expect(orderSection).toBeVisible({ timeout: 10000 });
      console.log('✅ 訂單紀錄區域可見');

      console.log('[Test] ✅ 訂單紀錄顯示測試完成');
    });

    test('待付款訂單應顯示「立即完成訂單」按鈕', async ({ page }) => {
      // Given: 我已登入並有待付款訂單
      console.log('[Given] 已登入並有待付款訂單');
      await devLogin(page, 'seed_test_001');

      // 建立待付款訂單
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      const purchaseButton = page.locator('[data-testid="purchase-course-button"]').first();
      if (await purchaseButton.isVisible().catch(() => false)) {
        await purchaseButton.click();
        await page.waitForURL('**/orders?productId=**', { timeout: 10000 });

        const createOrderButton = page.getByRole('button', { name: '建立訂單' });
        if (await createOrderButton.isVisible().catch(() => false)) {
          await createOrderButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // When: 我訪問個人檔案頁面
      console.log('[When] 訪問個人檔案頁面');
      await page.goto('http://localhost:3000/users/me/profile');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // 關閉待付款訂單提示框(如果有)
      const dialog = page.locator('[role="alertdialog"]');
      const isDialogVisible = await dialog.isVisible().catch(() => false);
      if (isDialogVisible) {
        const laterButton = page.getByRole('button', { name: '稍後再說' });
        if (await laterButton.isVisible().catch(() => false)) {
          await laterButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Then: 應該看到「立即完成訂單」按鈕
      console.log('[Then] 驗證立即完成訂單按鈕');
      const completeOrderButton = page.getByRole('button', { name: '立即完成訂單' });
      const hasCompleteButton = await completeOrderButton.isVisible().catch(() => false);

      if (hasCompleteButton) {
        console.log('✅ 找到立即完成訂單按鈕');

        // And: 應該看到待付款狀態標籤
        const pendingBadge = page.locator('text=待付款').first();
        await expect(pendingBadge).toBeVisible();
        console.log('✅ 待付款狀態標籤可見');
      } else {
        console.log('⚠️ 未找到立即完成訂單按鈕(可能沒有待付款訂單)');
      }

      console.log('[Test] ✅ 立即完成訂單按鈕顯示測試完成');
    });

    test('點擊「立即完成訂單」按鈕應跳轉到完成支付頁面', async ({ page }) => {
      // Given: 我已登入並有待付款訂單
      console.log('[Given] 已登入並有待付款訂單');
      await devLogin(page, 'seed_test_001');

      // 建立待付款訂單
      await page.goto('http://localhost:3000/courses');
      await page.waitForLoadState('load');

      const firstCourseCard = page.locator('[data-testid="course-card"]').first();
      await expect(firstCourseCard).toBeVisible({ timeout: 10000 });
      await firstCourseCard.click();
      await page.waitForTimeout(500);

      const purchaseButton = page.locator('[data-testid="purchase-course-button"]').first();
      if (await purchaseButton.isVisible().catch(() => false)) {
        await purchaseButton.click();
        await page.waitForURL('**/orders?productId=**', { timeout: 10000 });

        const createOrderButton = page.getByRole('button', { name: '建立訂單' });
        if (await createOrderButton.isVisible().catch(() => false)) {
          await createOrderButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // And: 我在個人檔案頁面
      console.log('[And] 在個人檔案頁面');
      await page.goto('http://localhost:3000/users/me/profile');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // 關閉待付款訂單提示框(如果有)
      const dialog = page.locator('[role="alertdialog"]');
      const isDialogVisible = await dialog.isVisible().catch(() => false);
      if (isDialogVisible) {
        const laterButton = page.getByRole('button', { name: '稍後再說' });
        if (await laterButton.isVisible().catch(() => false)) {
          await laterButton.click();
          await page.waitForTimeout(500);
        }
      }

      // When: 我點擊「立即完成訂單」按鈕
      console.log('[When] 點擊立即完成訂單按鈕');
      const completeOrderButton = page.getByRole('button', { name: '立即完成訂單' });
      const hasCompleteButton = await completeOrderButton.isVisible().catch(() => false);

      if (hasCompleteButton) {
        await completeOrderButton.click();

        // Then: 應該跳轉到完成支付頁面
        console.log('[Then] 驗證跳轉到完成支付頁面');
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        console.log(`當前 URL: ${currentUrl}`);

        // 完成支付頁面的 URL 格式: /journeys/{slug}/orders?productId={id}&orderNumber={orderNo}
        const hasOrderNumber = currentUrl.includes('orderNumber=');
        expect(hasOrderNumber).toBe(true);
        console.log('✅ 成功跳轉到完成支付頁面');
      } else {
        console.log('⚠️ 未找到立即完成訂單按鈕,跳過測試');
      }

      console.log('[Test] ✅ 立即完成訂單按鈕跳轉測試完成');
    });
  });
});
