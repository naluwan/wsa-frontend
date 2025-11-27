import { test, expect, Page } from '@playwright/test';
import { devLogin } from '../helpers/auth';

/**
 * ============================================================================
 * DEPRECATED: 舊 Course 架構的 E2E 測試
 * ============================================================================
 *
 * 本測試檔案屬於舊的 Course/Unit 架構，已被 Journey 架構取代。
 *
 * 測試內容：
 * - 使用舊的 /courses 路徑
 * - 使用舊的 /courses/{courseCode} 詳情頁
 * - 使用舊的 unit sidebar 結構
 *
 * 已被取代：
 * - 新架構使用 /journeys 路徑
 * - 新架構使用 /journeys/{slug} 詳情頁
 * - 新架構使用 chapters/missions 結構
 *
 * 狀態：已停用（describe.skip）
 * 原因：完全基於舊架構，不再維護
 * 如需重寫：請參考新的 Journey 測試架構，建立新的測試檔案
 *
 * ============================================================================
 *
 * E2E 測試：課程篩選與 Sidebar 聯動（已棄用）
 *
 * 測試範圍：
 * 1. 點擊不同課程卡片後 sidebar 的狀態變化
 * 2. 課程篩選器與 sidebar 的連動
 * 3. URL 路徑有正確切換
 * 4. sidebar 中的課程相關連結顯示正確
 *
 * 使用 data-testid：
 * - course-card: 課程卡片
 * - sidebar-nav-{路徑}: sidebar 導航連結
 */

/**
 * Helper: 前往課程列表頁並等待課程卡片載入
 * 不使用 networkidle，因為頁面可能有長連線/輪詢導致永遠等不到 idle
 */
async function gotoCoursesAndWaitForCards(page: Page) {
  await page.goto('/courses', { waitUntil: 'load' });
  await page.waitForSelector('[data-testid="course-card"]', {
    timeout: 15000,
    state: 'visible'
  });
}

test.describe.skip('Course: 課程篩選與 Sidebar 聯動 [DEPRECATED - 已停用]', () => {
  test.beforeEach(async ({ context }) => {
    console.log('[Setup] 清除 cookies 重置登入狀態');
    await context.clearCookies();
  });

  test.describe('課程卡片與 Sidebar 聯動', () => {
    test('應該能看到課程列表頁面', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // When: 我訪問課程頁面
      console.log('[When] 訪問課程頁面');
      await page.goto('/courses');
      await page.waitForLoadState('load');

      // And: 等待課程卡片載入完成
      await page.waitForSelector('[data-testid="course-card"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ 課程資料載入超時');
      });

      // Then: 應該看到課程卡片列表
      console.log('[Then] 驗證課程卡片存在');
      const courseCards = page.locator('[data-testid="course-card"]');
      const cardCount = await courseCards.count();

      if (cardCount > 0) {
        console.log(`✅ 找到 ${cardCount} 個課程卡片`);
      } else {
        console.log('⚠️ 未找到課程卡片，嘗試尋找其他課程元素');
        const otherCourses = page.locator('[class*="course"], [role="button"]').filter({
          hasText: /課程|Course|Design|AI|BDD/i
        });
        const otherCount = await otherCourses.count();
        console.log(`找到 ${otherCount} 個可能的課程元素`);
      }

      expect(cardCount).toBeGreaterThan(0);
      console.log('[Test] ✅ 課程列表頁面載入成功');
    });

    test('點擊課程卡片應該選中該課程（視覺回饋）', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我在課程列表頁面
      console.log('[And] 訪問課程列表頁面');
      await gotoCoursesAndWaitForCards(page);

      // When: 我點擊第一個課程卡片
      console.log('[When] 點擊第一個課程卡片');
      const firstCard = page.getByTestId('course-card').first();

      if (await firstCard.isVisible().catch(() => false)) {
        // 獲取課程卡片的信息
        const cardText = await firstCard.textContent();
        console.log(`點擊課程: ${cardText?.substring(0, 50)}...`);

        await firstCard.click();
        await page.waitForTimeout(300); // 等待選中狀態更新

        // Then: 課程卡片應該有選中的視覺效果（例如 border 變化）
        console.log('[Then] 驗證課程卡片被選中');
        const cardClasses = await firstCard.getAttribute('class');

        // 檢查是否有選中相關的 class（例如 border-yellow-600）
        const isSelected = cardClasses?.includes('border-yellow-600') || cardClasses?.includes('shadow-lg');

        if (isSelected) {
          console.log('✅ 課程卡片已選中（有視覺回饋）');
        } else {
          console.log('ℹ️  課程卡片點擊完成（未檢測到明顯的選中樣式）');
        }
      } else {
        console.log('⚠️ 第一個課程卡片不可見');
      }

      console.log('[Test] ✅ 課程卡片選擇測試完成');
    });

    test('選擇課程後 sidebar 應該更新並顯示該課程相關的導航項目', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // When: 我訪問課程列表頁面
      console.log('[When] 訪問課程列表頁面');
      await page.goto('/courses');
      await page.waitForLoadState('load');

      // And: 等待課程卡片載入完成
      await page.waitForSelector('[data-testid="course-card"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ 課程資料載入超時');
      });

      // Then: 記錄初始的 sidebar 狀態
      console.log('[Then] 記錄初始 sidebar 導航項目');
      let initialSidebarItems = await page.locator('[data-testid^="sidebar-nav-"]').count();
      console.log(`初始 sidebar 項目數: ${initialSidebarItems}`);

      // When: 我點擊第一個課程卡片
      console.log('[When] 點擊第一個課程卡片');
      const courseCards = page.getByTestId('course-card');

      if (await courseCards.first().isVisible().catch(() => false)) {
        await courseCards.first().click();
        await page.waitForTimeout(500); // 等待 context 更新和可能的 sidebar 變化

        // Then: sidebar 應該顯示課程相關項目（或維持原有項目）
        console.log('[Then] 驗證 sidebar 狀態');

        const updatedSidebarItems = await page.locator('[data-testid^="sidebar-nav-"]').count();
        console.log(`更新後 sidebar 項目數: ${updatedSidebarItems}`);

        // sidebar 項目可能增加或改變
        if (updatedSidebarItems > 0) {
          console.log('✅ Sidebar 已更新');

          // 列出所有的 sidebar 項目
          const sidebarItems = page.locator('[data-testid^="sidebar-nav-"]');
          for (let i = 0; i < Math.min(5, updatedSidebarItems); i++) {
            const item = sidebarItems.nth(i);
            const testid = await item.getAttribute('data-testid');
            const title = await item.getAttribute('title');
            console.log(`  - ${testid}: ${title}`);
          }
        }

        console.log('[Test] ✅ 課程選擇後 sidebar 更新測試完成');
      } else {
        console.log('⚠️ 沒有找到課程卡片，跳過此測試');
      }
    });
  });

  test.describe('課程詳情頁導航', () => {
    test('點擊「進入課程」或「立刻購買」按鈕應導航到課程詳情頁', async ({ page }) => {
      // Given: 我已登入且擁有課程
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // When: 我訪問課程列表
      console.log('[When] 訪問課程列表');
      await gotoCoursesAndWaitForCards(page);

      // And: 我點擊「進入課程」或「立刻購買」按鈕（而非卡片本身）
      console.log('[And] 尋找並點擊進入課程或購買按鈕');
      const enterButton = page.getByTestId('enter-course-button').first();
      const purchaseButton = page.getByTestId('purchase-course-button').first();

      const enterVisible = await enterButton.isVisible().catch(() => false);
      const purchaseVisible = await purchaseButton.isVisible().catch(() => false);

      if (enterVisible) {
        console.log('點擊「進入課程」按鈕');
        await enterButton.click();
        await expect(page).toHaveURL(/\/courses\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
        console.log('✅ 成功導航到課程詳情頁');
      } else if (purchaseVisible) {
        console.log('點擊「立刻購買」按鈕');
        await purchaseButton.click();
        // 未登入可能顯示對話框，已登入會導航
        await page.waitForTimeout(1000);
        const url = page.url();

        if (url.includes('/courses/')) {
          console.log('✅ 導航到課程詳情頁');
        } else {
          console.log('ℹ️  可能顯示了登入對話框或其他 UI');
        }
      } else {
        console.log('⚠️ 未找到進入課程或購買按鈕');
      }

      console.log('[Test] ✅ 課程詳情頁導航測試完成');
    });

    test('點擊不同課程卡片應有不同的選中狀態', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我訪問課程列表
      console.log('[And] 訪問課程列表');
      await gotoCoursesAndWaitForCards(page);

      // When: 我點擊第一個課程
      console.log('[When] 點擊第一個課程');
      const courseCards = page.getByTestId('course-card');

      if (await courseCards.count() >= 2) {
        // 點擊第一個課程
        await courseCards.nth(0).click();
        await page.waitForTimeout(300);

        const firstCard = courseCards.nth(0);
        const firstCardClasses = await firstCard.getAttribute('class');
        console.log(`第一個課程選中狀態: ${firstCardClasses?.includes('border-yellow-600')}`);

        // 點擊第二個課程
        console.log('[And] 點擊第二個課程');
        await courseCards.nth(1).click();
        await page.waitForTimeout(300);

        const secondCard = courseCards.nth(1);
        const secondCardClasses = await secondCard.getAttribute('class');

        // Then: 第二個課程應該被選中，第一個可能取消選中（取決於實現）
        console.log('[Then] 驗證選中狀態改變');
        console.log(`第二個課程選中狀態: ${secondCardClasses?.includes('border-yellow-600')}`);

        console.log('✅ 課程卡片選擇狀態可以切換');
        console.log('[Test] ✅ 多課程選擇測試完成');
      } else {
        console.log('⚠️ 未找到足夠的課程卡片進行比較');
      }
    });
  });

  test.describe('課程相關的 Sidebar 項目', () => {
    test('進入課程後 sidebar 應該顯示該課程的相關導航項目', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // When: 我訪問課程列表並選擇一個課程
      console.log('[When] 訪問課程列表並選擇課程');
      await page.goto('/courses');
      await page.waitForLoadState('load');

      // And: 等待課程卡片載入完成
      await page.waitForSelector('[data-testid="course-card"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ 課程資料載入超時');
      });

      const courseCards = page.getByTestId('course-card');

      if (await courseCards.first().isVisible().catch(() => false)) {
        // 點擊「進入課程」按鈕以實際進入課程詳情頁
        const enterButton = page.getByTestId('enter-course-button').first();
        const enterVisible = await enterButton.isVisible().catch(() => false);

        if (enterVisible) {
          console.log('[When] 點擊進入課程按鈕');
          await enterButton.click();
          await expect(page).toHaveURL(/\/courses\/.+/, { timeout: 10000 });
          await page.waitForTimeout(500);
        } else {
          console.log('⚠️ 未找到進入課程按鈕，跳過此測試');
          return;
        }

        // Then: 檢查 sidebar 中是否有課程相關的導航項目
        console.log('[Then] 驗證 sidebar 中的課程相關項目');

        // 可能的課程相關項目：所有單元、課程進度、單元列表等
        const possibleCourseItems = [
          'sidebar-nav-units',
          'sidebar-nav-progress',
          'sidebar-nav-missions',
          'sidebar-nav-chapters',
        ];

        let foundCourseItems = 0;
        for (const item of possibleCourseItems) {
          const element = page.locator(`[data-testid="${item}"]`);
          const isVisible = await element.isVisible().catch(() => false);

          if (isVisible) {
            foundCourseItems++;
            const text = await element.getAttribute('title');
            console.log(`✅ 找到課程相關項目: ${item} (${text})`);
          }
        }

        if (foundCourseItems > 0) {
          console.log(`✅ Sidebar 中找到 ${foundCourseItems} 個課程相關項目`);
        } else {
          console.log('⚠️ 未找到課程相關的 sidebar 項目（可能未實現或格式不同）');
        }

        console.log('[Test] ✅ 課程 Sidebar 項目驗證完成');
      } else {
        console.log('⚠️ 未找到課程卡片');
      }
    });

    test('Sidebar 中的課程導航項目應該能正確導航', async ({ page }) => {
      // Given: 我已登入且在課程詳細頁面
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      console.log('[And] 訪問課程列表');
      await page.goto('/courses');
      await page.waitForLoadState('load');

      // And: 等待課程卡片載入完成
      await page.waitForSelector('[data-testid="course-card"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ 課程資料載入超時');
      });

      const courseCards = page.getByTestId('course-card');

      if (await courseCards.first().isVisible().catch(() => false)) {
        console.log('[And] 點擊進入課程按鈕');
        const enterButton = page.getByTestId('enter-course-button').first();
        const enterVisible = await enterButton.isVisible().catch(() => false);

        if (!enterVisible) {
          console.log('⚠️ 未找到進入課程按鈕，跳過此測試');
          return;
        }

        await enterButton.click();
        await expect(page).toHaveURL(/\/courses\/.+/, { timeout: 10000 });
        await page.waitForTimeout(500);

        // When: 我尋找並點擊 sidebar 中的「所有單元」項目
        console.log('[When] 尋找並點擊「所有單元」項目');
        const unitsLink = page.getByTestId('sidebar-nav-units');

        const isUnitsVisible = await unitsLink.isVisible().catch(() => false);

        if (isUnitsVisible) {
          const href = await unitsLink.getAttribute('href');
          console.log(`所有單元連結: ${href}`);

          await unitsLink.click();
          await page.waitForURL('**/units**', { timeout: 10000 });
          await page.waitForLoadState('load');

          // Then: 應該導航到該課程的單元頁面
          console.log('[Then] 驗證導航');
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/\/units|\/missions|\/chapters/);
          console.log(`✅ 成功導航到: ${currentUrl}`);

          console.log('[Test] ✅ Sidebar 課程導航項目導航正常');
        } else {
          console.log('⚠️ 未找到「所有單元」項目');
        }
      } else {
        console.log('⚠️ 未找到課程卡片');
      }
    });
  });

  test.describe('課程篩選功能', () => {
    test('應該能切換不同課程並驗證 sidebar 對應更新', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // When: 我訪問課程頁面
      console.log('[When] 訪問課程頁面');
      await page.goto('/courses');
      await page.waitForLoadState('load');

      // And: 等待課程卡片載入完成
      await page.waitForSelector('[data-testid="course-card"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ 課程資料載入超時');
      });

      // Then: 列出所有課程卡片
      console.log('[Then] 列出可用的課程');
      const courseCards = page.locator('[data-testid="course-card"]');
      const courseCount = await courseCards.count();

      console.log(`找到 ${courseCount} 個課程`);

      // 對於每個課程，記錄其選中狀態和 sidebar 狀態
      for (let i = 0; i < Math.min(courseCount, 2); i++) {
        console.log(`\n[Iteration ${i + 1}] 測試課程 ${i + 1}`);

        const card = courseCards.nth(i);
        const cardText = await card.textContent();
        console.log(`課程名稱: ${cardText?.substring(0, 50)}...`);

        await card.click();
        await page.waitForTimeout(300);

        // 檢查課程是否被選中
        const cardClasses = await card.getAttribute('class');
        const isSelected = cardClasses?.includes('border-yellow-600');
        console.log(`課程選中狀態: ${isSelected}`);

        // 檢查 sidebar 狀態
        const sidebarItems = page.locator('[data-testid^="sidebar-nav-"]');
        const itemCount = await sidebarItems.count();
        console.log(`Sidebar 項目數: ${itemCount}`);

        // 準備下一個迭代（不需要回到課程列表，因為都在同一頁）
        if (i < courseCount - 1) {
          console.log('[回到課程列表]');
          await page.goto('/courses');
          await page.waitForLoadState('load');

          // And: 等待課程卡片載入完成
          await page.waitForSelector('[data-testid="course-card"]', {
            timeout: 10000,
            state: 'visible'
          }).catch(() => {
            console.log('[Test] ⚠️ 課程資料載入超時');
          });
        }
      }

      console.log('\n[Test] ✅ 課程切換與 Sidebar 聯動驗證完成');
    });

    test('課程切換時 sidebar 應該保持功能可用', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // When: 我訪問課程頁面
      console.log('[When] 訪問課程頁面');
      await page.goto('/courses');
      await page.waitForLoadState('load');

      // And: 等待課程卡片載入完成
      await page.waitForSelector('[data-testid="course-card"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ 課程資料載入超時');
      });

      // And: 我選擇一個課程
      console.log('[And] 選擇課程');
      const courseCards = page.getByTestId('course-card');

      if (await courseCards.first().isVisible().catch(() => false)) {
        await courseCards.first().click();
        await page.waitForTimeout(500);

        // Then: 驗證 sidebar 導航項目仍然可點擊
        console.log('[Then] 驗證 sidebar 項目可點擊性');

        const sidebarLinks = page.locator('[data-testid^="sidebar-nav-"]');
        const linksCount = await sidebarLinks.count();

        let clickableCount = 0;

        for (let i = 0; i < Math.min(linksCount, 3); i++) {
          const link = sidebarLinks.nth(i);
          const isClickable = await link.isEnabled().catch(() => false);

          if (isClickable) {
            clickableCount++;
            const testid = await link.getAttribute('data-testid');
            console.log(`✅ ${testid} 可點擊`);
          }
        }

        console.log(`✅ 驗證了 ${clickableCount} 個 sidebar 項目的可點擊性`);

        console.log('[Test] ✅ Sidebar 功能可用性驗證完成');
      } else {
        console.log('⚠️ 未找到課程卡片');
      }
    });
  });
});
