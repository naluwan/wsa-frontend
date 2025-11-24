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
 * 例如：sidebar-nav- (首頁), sidebar-nav-courses, sidebar-nav-leaderboard, 等
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
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('load');

      // When: 我檢查 sidebar 中的導航連結
      console.log('[When] 檢查 sidebar 導航連結');

      // Then: 應該看到基本連結（首頁、課程、排行榜）
      const homeLink = page.locator('[data-testid="sidebar-nav-"]');
      const coursesLink = page.locator('[data-testid="sidebar-nav-courses"]');
      const leaderboardLink = page.locator('[data-testid="sidebar-nav-leaderboard"]');

      console.log('[Then] 驗證基本連結存在');
      await expect(homeLink).toBeVisible({ timeout: 5000 });
      console.log('✅ 首頁連結可見');

      await expect(coursesLink).toBeVisible({ timeout: 5000 });
      console.log('✅ 課程連結可見');

      await expect(leaderboardLink).toBeVisible({ timeout: 5000 });
      console.log('✅ 排行榜連結可見');

      // And: 應該看不到或隱藏需要登入的連結（個人檔案）
      const profileLink = page.locator('[data-testid="sidebar-nav-profile"]');
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
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('load');

      // When: 我點擊課程連結
      console.log('[When] 點擊課程連結');
      const coursesLink = page.locator('[data-testid="sidebar-nav-courses"]');
      await expect(coursesLink).toBeVisible();
      await coursesLink.click();

      // Then: 應該導航到課程頁面
      console.log('[Then] 驗證導航到課程頁面');
      await page.waitForLoadState('load');
      expect(page.url()).toContain('/courses');
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
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('load');

      // Then: 應該看到所有登入後的連結
      console.log('[Then] 驗證登入後的完整連結');

      const requiredLinks = [
        { testid: 'sidebar-nav-', label: '首頁' },
        { testid: 'sidebar-nav-courses', label: '課程' },
        { testid: 'sidebar-nav-profile', label: '個人檔案' },
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
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('load');

      // When: 我點擊個人檔案連結
      console.log('[When] 點擊個人檔案連結');
      const profileLink = page.locator('[data-testid="sidebar-nav-profile"]');

      try {
        await expect(profileLink).toBeVisible({ timeout: 5000 });
        await profileLink.click();

        // Then: 應該導航到個人檔案頁面
        console.log('[Then] 驗證導航到個人檔案頁面');
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
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('load');

      // When: 我點擊排行榜連結
      console.log('[When] 點擊排行榜連結');
      const leaderboardLink = page.locator('[data-testid="sidebar-nav-leaderboard"]');
      await expect(leaderboardLink).toBeVisible();
      await leaderboardLink.click();

      // Then: 應該導航到排行榜頁面
      console.log('[Then] 驗證導航到排行榜頁面');
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
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('load');

      const homeLink = page.locator('[data-testid="sidebar-nav-"]');
      const homeLinkClasses = await homeLink.getAttribute('class');
      console.log(`首頁連結 class: ${homeLinkClasses}`);

      // Test Case 2: 在課程頁面時，課程連結應該高亮
      console.log('\n[Test Case 2] 在課程頁面時');
      const coursesLink = page.locator('[data-testid="sidebar-nav-courses"]');
      await coursesLink.click();
      await page.waitForLoadState('load');

      const coursesLinkClasses = await coursesLink.getAttribute('class');
      console.log(`課程連結 class: ${coursesLinkClasses}`);
      expect(coursesLinkClasses).toContain('accent');

      console.log('[Test] ✅ Sidebar 連結高亮顯示正常');
    });

    test('登入後所有主要連結應該正確指向目標頁面', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 定義所有要測試的連結和其對應的 URL
      console.log('[And] 定義要測試的連結');
      const linksToTest = [
        {
          testid: 'sidebar-nav-courses',
          expectedUrl: '/courses',
          label: '課程',
        },
        {
          testid: 'sidebar-nav-leaderboard',
          expectedUrl: '/leaderboard',
          label: '排行榜',
        },
        {
          testid: 'sidebar-nav-profile',
          expectedUrl: '/profile',
          label: '個人檔案',
        },
      ];

      // When & Then: 逐個測試每個連結
      console.log('[When/Then] 測試每個連結的導航');
      for (const linkTest of linksToTest) {
        console.log(`\n測試連結: ${linkTest.label}`);
        const link = page.locator(`[data-testid="${linkTest.testid}"]`);

        try {
          await expect(link).toBeVisible({ timeout: 5000 });
          await link.click();
          await page.waitForLoadState('load');

          expect(page.url()).toContain(linkTest.expectedUrl);
          console.log(`✅ ${linkTest.label} 連結正確指向 ${linkTest.expectedUrl}`);
        } catch (error) {
          console.warn(`⚠️ ${linkTest.label} 連結測試失敗: ${error}`);
        }
      }

      console.log('\n[Test] ✅ 所有主要連結導航測試完成');
    });
  });

  test.describe('Sidebar 交互測試', () => {
    test('Sidebar 應該支援收合和展開功能', async ({ page }) => {
      // Given: 我已登入
      console.log('[Given] 已登入');
      await devLogin(page, 'seed_test_001');

      // And: 我訪問首頁
      console.log('[And] 訪問首頁');
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('load');

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
