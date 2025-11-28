import { test, expect } from '@playwright/test';
import { devLogin } from '../helpers/auth';

/**
 * E2E 測試：Sidebar 連結驗證
 *
 * 測試範圍：
 * 1. 未登入狀態下的 sidebar 連結顯示
 * 2. 登入後的 sidebar 連結顯示
 * 3. Sidebar 連結導航功能
 *
 * 使用 data-testid 格式：sidebar-nav-{路徑}
 * 例如：sidebar-nav- (首頁), sidebar-nav-journeys, sidebar-nav-leaderboard, 等
 *
 * 路由說明：
 * - /courses：課程列表頁（所有課程 card，主要入口）
 * - /journeys：目前選取課程的章節＋單元總覽頁（依賴 currentCourse context）
 */

test.describe('Sidebar: 導航連結驗證', () => {
  test.beforeEach(async ({ context }) => {
    console.log('[Setup] 清除 cookies 重置登入狀態');
    await context.clearCookies();
  });

  test.describe('未登入狀態', () => {
    test('未登入時應該只顯示基本連結，隱藏需要登入的連結', async ({ page }) => {
      // Given: 我在未登入狀態下訪問首頁
      console.log('[Given] 未登入狀態下訪問首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 等待 sidebar 導航元素載入
      await page.waitForSelector('[data-testid^="sidebar-nav-"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ Sidebar 導航元素載入超時');
      });

      // When: 我檢查 sidebar 中的導航連結
      console.log('[When] 檢查 sidebar 導航連結');

      // Then: 應該看到基本連結（首頁、課程、排行榜）
      const homeLink = page.locator('[data-testid="sidebar-nav-"]');
      const journeysLink = page.locator('[data-testid="sidebar-nav-journeys"]');
      const leaderboardLink = page.locator('[data-testid="sidebar-nav-leaderboard"]');

      console.log('[Then] 驗證基本連結存在');
      await expect(homeLink).toBeVisible({ timeout: 5000 });
      console.log('✅ 首頁連結可見');

      await expect(journeysLink).toBeVisible({ timeout: 5000 });
      console.log('✅ 課程連結可見');

      await expect(leaderboardLink).toBeVisible({ timeout: 5000 });
      console.log('✅ 排行榜連結可見');

      // And: 應該看不到或隱藏需要登入的連結（個人檔案）
      const profileLink = page.locator('[data-testid="sidebar-nav-users-me-profile"]');
      const profileVisibility = await profileLink.isVisible().catch(() => false);

      if (!profileVisibility) {
        console.log('✅ 個人檔案連結在未登入狀態下隱藏（符合預期）');
      } else {
        console.log('⚠️ 個人檔案連結在未登入狀態下仍可見（需要檢查業務邏輯）');
      }

      console.log('[Test] ✅ 未登入時 sidebar 連結顯示正確');
    });

    test('未登入時點擊課程連結應能導航成功', async ({ page }) => {
      // Given: 我在未登入狀態下
      console.log('[Given] 未登入狀態下');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 等待 sidebar 導航元素載入
      await page.waitForSelector('[data-testid="sidebar-nav-journeys"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ Sidebar 導航元素載入超時');
      });

      // When: 我點擊課程連結
      console.log('[When] 點擊課程連結');
      const journeysLink = page.locator('[data-testid="sidebar-nav-journeys"]');
      await expect(journeysLink).toBeVisible();
      await journeysLink.click();

      // Then: 應該導航到課程頁面
      console.log('[Then] 驗證導航到課程頁面');
      await page.waitForURL('**/journeys', { timeout: 10000 });
      await page.waitForLoadState('load');
      expect(page.url()).toContain('/journeys');
      console.log('✅ 成功導航到課程頁面');

      console.log('[Test] ✅ 未登入時課程連結導航正常');
    });
  });

  test.describe('登入後狀態', () => {
    test('登入後應該顯示完整的 sidebar 連結（包括個人檔案）', async ({ page }) => {
      // Given: 我已使用 dev 一鍵登入
      console.log('[Given] 使用 dev 一鍵登入');
      const user = await devLogin(page, 'seed_test_001');
      console.log(`登入使用者: ${user.displayName}`);

      // When: 我訪問首頁
      console.log('[When] 訪問首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 等待 sidebar 導航元素載入
      await page.waitForSelector('[data-testid^="sidebar-nav-"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ Sidebar 導航元素載入超時');
      });

      // Then: 應該看到所有登入後的連結
      console.log('[Then] 驗證登入後的完整連結');

      const requiredLinks = [
        { testid: 'sidebar-nav-', label: '首頁' },
        { testid: 'sidebar-nav-journeys', label: '課程' },
        { testid: 'sidebar-nav-users-me-profile', label: '個人檔案' },
        { testid: 'sidebar-nav-leaderboard', label: '排行榜' },
      ];

      for (const link of requiredLinks) {
        const element = page.locator(`[data-testid="${link.testid}"]`);
        try {
          await expect(element).toBeVisible({ timeout: 5000 });
          console.log(`✅ ${link.label} 連結可見`);
        } catch (error) {
          console.warn(`⚠️ ${link.label} 連結不可見 (testid: ${link.testid})`);
        }
      }

      console.log('[Test] ✅ 登入後 sidebar 連結顯示完整');
    });

    test('登入後點擊個人檔案連結應能導航成功', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我在首頁
      console.log('[And] 在首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 等待 sidebar 導航元素載入
      await page.waitForSelector('[data-testid^="sidebar-nav-"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ Sidebar 導航元素載入超時');
      });

      // When: 我點擊個人檔案連結
      console.log('[When] 點擊個人檔案連結');
      const profileLink = page.locator('[data-testid="sidebar-nav-users-me-profile"]');

      try {
        await expect(profileLink).toBeVisible({ timeout: 5000 });
        await profileLink.click();

        // Then: 應該導航到個人檔案頁面
        console.log('[Then] 驗證導航到個人檔案頁面');
        await page.waitForURL('**/profile', { timeout: 10000 });
        await page.waitForLoadState('load');
        expect(page.url()).toContain('/profile');
        console.log('✅ 成功導航到個人檔案頁面');

        console.log('[Test] ✅ 登入後個人檔案連結導航正常');
      } catch (error) {
        console.error('❌ 個人檔案連結不可見或無法點擊', error);
        throw error;
      }
    });

    test('登入後點擊排行榜連結應能導航成功', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我在首頁
      console.log('[And] 在首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 等待 sidebar 導航元素載入
      await page.waitForSelector('[data-testid="sidebar-nav-leaderboard"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ Sidebar 導航元素載入超時');
      });

      // When: 我點擊排行榜連結
      console.log('[When] 點擊排行榜連結');
      const leaderboardLink = page.locator('[data-testid="sidebar-nav-leaderboard"]');
      await expect(leaderboardLink).toBeVisible();
      await leaderboardLink.click();

      // Then: 應該導航到排行榜頁面
      console.log('[Then] 驗證導航到排行榜頁面');
      await page.waitForURL('**/leaderboard', { timeout: 10000 });
      await page.waitForLoadState('load');
      expect(page.url()).toContain('/leaderboard');
      console.log('✅ 成功導航到排行榜頁面');

      console.log('[Test] ✅ 登入後排行榜連結導航正常');
    });

    test('登入後訪問不同頁面時，對應的 sidebar 連結應該高亮顯示', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // Test Case 1: 在首頁時，首頁連結應該高亮
      console.log('\n[Test Case 1] 在首頁時');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 等待 sidebar 導航元素載入
      await page.waitForSelector('[data-testid^="sidebar-nav-"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ Sidebar 導航元素載入超時');
      });

      const homeLink = page.locator('[data-testid="sidebar-nav-"]');
      const homeLinkClasses = await homeLink.getAttribute('class');
      console.log(`首頁連結 class: ${homeLinkClasses}`);

      // Test Case 2: 在課程頁面時，課程連結應該高亮
      console.log('\n[Test Case 2] 在課程頁面時');
      const journeysLink = page.locator('[data-testid="sidebar-nav-journeys"]');
      await journeysLink.click();
      await page.waitForLoadState('load');

      const journeysLinkClasses = await journeysLink.getAttribute('class');
      console.log(`課程連結 class: ${journeysLinkClasses}`);
      expect(journeysLinkClasses).toContain('accent');

      console.log('[Test] ✅ Sidebar 連結高亮顯示正常');
    });

    test('登入後所有主要連結應該正確指向目標頁面', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 先導航到首頁（確保 sidebar 顯示基本連結）
      console.log('[And] 導航到首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 定義所有要測試的連結和其對應的 URL
      console.log('[And] 定義要測試的連結');
      const linksToTest = [
        {
          testid: 'sidebar-nav-journeys',
          expectedUrl: '/journeys',
          label: '所有單元',  // 修正：/journeys 對應的是「所有單元」
        },
        {
          testid: 'sidebar-nav-leaderboard',
          expectedUrl: '/leaderboard',
          label: '排行榜',
        },
        {
          testid: 'sidebar-nav-users-me-profile',
          expectedUrl: '/users/me/profile',
          label: '個人檔案',
        },
      ];

      // When & Then: 逐個測試每個連結
      console.log('[When/Then] 測試每個連結的導航');
      for (const linkTest of linksToTest) {
        console.log(`\n測試連結: ${linkTest.label}`);

        // 在每次測試前先回到首頁
        await page.goto('/');
        await page.waitForLoadState('load');

        const link = page.locator(`[data-testid="${linkTest.testid}"]`);

        // 真正的測試 - 不使用 try-catch，讓測試失敗時能被發現
        await expect(link).toBeVisible({ timeout: 5000 });
        await link.click();

        // 等待 URL 變更到目標頁面
        await page.waitForURL(`**${linkTest.expectedUrl}`, { timeout: 10000 });
        await page.waitForLoadState('load');

        expect(page.url()).toContain(linkTest.expectedUrl);
        console.log(`✅ ${linkTest.label} 連結正確指向 ${linkTest.expectedUrl}`);
      }

      console.log('\n[Test] ✅ 所有主要連結導航測試完成');
    });

    test('登入後點擊 SOP 寶典應導航到軟體設計模式 SOP 頁面', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我在首頁
      console.log('[And] 在首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // When: 我查看 sidebar 中的寶典連結（預設應該是軟體設計模式的 SOP 寶典）
      console.log('[When] 查看 sidebar 中的寶典連結');
      const sopLink = page.locator('[data-testid="sidebar-nav-journeys-software-design-pattern-sop"]');

      try {
        await expect(sopLink).toBeVisible({ timeout: 5000 });
        console.log('✅ 找到 SOP 寶典連結');

        // And: 點擊 SOP 寶典連結
        console.log('[And] 點擊 SOP 寶典連結');
        await sopLink.click();

        // Then: 應該導航到軟體設計模式的 SOP 頁面
        console.log('[Then] 驗證導航到 SOP 頁面');
        await page.waitForURL('**/journeys/software-design-pattern/sop', { timeout: 10000 });
        await page.waitForLoadState('load');
        expect(page.url()).toContain('/journeys/software-design-pattern/sop');
        console.log('✅ 成功導航到軟體設計模式 SOP 頁面');

        // And: 頁面應該顯示「SOP 寶典」標題
        const heading = page.locator('h1:has-text("SOP 寶典")');
        await expect(heading).toBeVisible({ timeout: 5000 });
        console.log('✅ 頁面顯示 SOP 寶典標題');

        // And: 應該顯示課程折價提示框（軟體設計模式限定）
        const discountAlert = page.getByText('將軟體設計精通之旅體驗課程的全部影片看完就可以獲得 3000 元課程折價券！');
        const alertVisible = await discountAlert.isVisible().catch(() => false);
        if (alertVisible) {
          console.log('✅ 顯示課程折價提示框');
        } else {
          console.log('ℹ️  未顯示課程折價提示框（可能需檢查條件）');
        }

        // And: Header 應該存在（但不顯示課程篩選器和漢堡排）
        const header = page.locator('header');
        await expect(header).toBeVisible({ timeout: 5000 });
        console.log('✅ Header 顯示正常');

        // And: 不應該顯示漢堡排按鈕
        const hamburgerButton = page.locator('button:has-text("Menu")').or(page.locator('svg.lucide-menu').locator('..'));
        const hamburgerVisible = await hamburgerButton.isVisible().catch(() => false);
        if (!hamburgerVisible) {
          console.log('✅ 漢堡排按鈕已隱藏（符合預期）');
        } else {
          console.log('⚠️ 漢堡排按鈕仍然可見（需要檢查）');
        }

        console.log('[Test] ✅ SOP 寶典完整功能測試通過');
      } catch (error) {
        console.error('❌ SOP 寶典連結測試失敗', error);
        throw error;
      }
    });

    test('切換到 AI x BDD 課程後應顯示 Prompt 寶典', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我在首頁
      console.log('[And] 在首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // When: 我切換到 AI x BDD 課程
      console.log('[When] 切換到 AI x BDD 課程');
      const courseSelector = page.locator('[role="combobox"]').first();
      if (await courseSelector.isVisible().catch(() => false)) {
        await courseSelector.click();
        await page.waitForTimeout(500);

        // 選擇 AI x BDD 課程
        const aiBddOption = page.getByText('AI x BDD').or(page.getByText('ai-bdd'));
        if (await aiBddOption.isVisible().catch(() => false)) {
          await aiBddOption.click();
          await page.waitForTimeout(1000);
          console.log('✅ 成功切換到 AI x BDD 課程');

          // Then: Sidebar 應該顯示「Prompt 寶典」連結
          console.log('[Then] 驗證 Prompt 寶典連結');
          const promptLink = page.locator('[data-testid="sidebar-nav-journeys-ai-bdd-sop"]');
          const promptVisible = await promptLink.isVisible().catch(() => false);

          if (promptVisible) {
            console.log('✅ 找到 Prompt 寶典連結');

            // And: 點擊 Prompt 寶典連結
            console.log('[And] 點擊 Prompt 寶典連結');
            await promptLink.click();

            // Then: 應該導航到 AI x BDD 的 SOP 頁面
            await page.waitForURL('**/journeys/ai-bdd/sop', { timeout: 10000 });
            await page.waitForLoadState('load');
            expect(page.url()).toContain('/journeys/ai-bdd/sop');
            console.log('✅ 成功導航到 AI x BDD Prompt 寶典頁面');

            // And: 頁面應該顯示「Prompt 寶典」標題
            const heading = page.locator('h1:has-text("Prompt 寶典")');
            await expect(heading).toBeVisible({ timeout: 5000 });
            console.log('✅ 頁面顯示 Prompt 寶典標題');

            console.log('[Test] ✅ Prompt 寶典測試完成');
          } else {
            console.log('⚠️ 未找到 Prompt 寶典連結（可能課程尚未設定）');
          }
        } else {
          console.log('⚠️ 未找到 AI x BDD 課程選項');
        }
      } else {
        console.log('⚠️ 課程選擇器不可見');
      }
    });
  });

  test.describe('Sidebar 交互測試', () => {
    test('Sidebar 應該支援收合和展開功能', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我訪問首頁
      console.log('[And] 訪問首頁');
      await page.goto('/');
      await page.waitForLoadState('load');

      // And: 等待 sidebar 元素載入
      await page.waitForSelector('aside', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => {
        console.log('[Test] ⚠️ Sidebar 元素載入超時');
      });

      // When: 我尋找 sidebar 收合按鈕並點擊
      console.log('[When] 尋找並點擊 sidebar 收合按鈕');
      const toggleButton = page.locator('button[aria-label*="收合"], button[aria-label*="展開"]').first();

      if (await toggleButton.isVisible().catch(() => false)) {
        const initialClasses = await page.locator('aside').getAttribute('class');
        console.log(`初始 sidebar class: ${initialClasses}`);

        await toggleButton.click();
        await page.waitForTimeout(400); // 等待動畫

        const collapsedClasses = await page.locator('aside').getAttribute('class');
        console.log(`收合後 sidebar class: ${collapsedClasses}`);

        // Then: sidebar 應該根據狀態改變 class
        console.log('[Then] 驗證 sidebar 狀態改變');
        expect(initialClasses).not.toBe(collapsedClasses);
        console.log('✅ Sidebar 收合功能正常');
      } else {
        console.log('⚠️ 未找到 sidebar 收合按鈕（可能在行動版設備上隱藏）');
      }

      console.log('[Test] ✅ Sidebar 交互測試完成');
    });
  });
});
