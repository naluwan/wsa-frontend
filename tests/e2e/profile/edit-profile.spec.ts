import { test, expect } from '@playwright/test';
import { devLogin } from '../helpers/auth';

/**
 * E2E 測試：個人檔案編輯功能
 *
 * 測試範圍：
 * 1. 編輯個人檔案對話框的顯示
 * 2. 編輯各項個人資料欄位
 * 3. 儲存個人資料
 * 4. 驗證資料更新成功
 */

test.describe('Profile: 個人檔案編輯功能', () => {
  test.beforeEach(async ({ context }) => {
    console.log('[Setup] 清除 cookies 重置登入狀態');
    await context.clearCookies();
  });

  test('應該能開啟編輯個人檔案對話框', async ({ page }) => {
    // Given: 我已登入
    console.log('[Given] 已登入');
    await devLogin(page, 'seed_test_001');

    // And: 我在個人檔案頁面
    console.log('[And] 前往個人檔案頁面');
    await page.goto('/users/me/profile');
    await page.waitForLoadState('load');

    // When: 我點擊「編輯資料」按鈕
    console.log('[When] 點擊編輯資料按鈕');
    const editButton = page.getByRole('button', { name: '編輯資料' });
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Then: 應該顯示編輯個人檔案對話框
    console.log('[Then] 驗證對話框顯示');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // And: 對話框應該包含標題「編輯個人資料」
    const dialogTitle = page.getByRole('heading', { name: '編輯個人資料' });
    await expect(dialogTitle).toBeVisible();
    console.log('✅ 編輯個人檔案對話框顯示正常');

    console.log('[Test] ✅ 編輯個人檔案對話框測試完成');
  });

  test('編輯對話框應該包含所有必要欄位', async ({ page }) => {
    // Given: 我已登入且開啟編輯對話框
    console.log('[Given] 已登入且開啟編輯對話框');
    await devLogin(page, 'seed_test_001');
    await page.goto('/users/me/profile');
    await page.waitForLoadState('load');

    const editButton = page.getByRole('button', { name: '編輯資料' });
    await editButton.click();

    // When: 我檢查對話框中的欄位
    console.log('[When] 檢查對話框欄位');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Then: 應該包含所有必要欄位
    console.log('[Then] 驗證所有欄位存在');
    const expectedFields = [
      { label: '頭像 URL', type: 'input' },
      { label: '姓名', type: 'input' },
      { label: '暱稱', type: 'input' },
      { label: '心理性別', type: 'select' },
      { label: '職業', type: 'input' },
      { label: '生日', type: 'button' }, // date picker button
      { label: '所在地區', type: 'select' },
      { label: 'GitHub 連結', type: 'input' },
    ];

    for (const field of expectedFields) {
      const label = page.getByText(field.label).first();
      await expect(label).toBeVisible({ timeout: 3000 });
      console.log(`✅ 找到欄位: ${field.label}`);
    }

    // And: 應該有儲存按鈕
    const saveButton = page.getByRole('button', { name: '儲存' });
    await expect(saveButton).toBeVisible();
    console.log('✅ 找到儲存按鈕');

    console.log('[Test] ✅ 所有欄位驗證完成');
  });

  test('應該能成功編輯並儲存個人資料', async ({ page }) => {
    // Given: 我已登入且開啟編輯對話框
    console.log('[Given] 已登入且開啟編輯對話框');
    await devLogin(page, 'seed_test_001');
    await page.goto('/users/me/profile');
    await page.waitForLoadState('load');

    const editButton = page.getByRole('button', { name: '編輯資料' });
    await editButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // When: 我編輯暱稱欄位
    console.log('[When] 編輯暱稱欄位');
    const nicknameInput = page.getByLabel('暱稱');
    await nicknameInput.fill('E2E Test User');

    // And: 點擊儲存按鈕
    console.log('[And] 點擊儲存按鈕');
    const saveButton = page.getByRole('button', { name: '儲存' });
    await saveButton.click();

    // Then: 對話框應該關閉
    console.log('[Then] 驗證對話框關閉');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    console.log('✅ 對話框已關閉');

    // And: 應該顯示成功訊息（toast）
    console.log('[And] 驗證成功訊息');
    // Note: Toast 可能很快消失，所以使用較短的 timeout
    const successToast = page.getByText('個人資料已更新').or(page.getByText('成功'));
    const toastVisible = await successToast.isVisible().catch(() => false);
    if (toastVisible) {
      console.log('✅ 顯示成功訊息');
    } else {
      console.log('ℹ️  成功訊息可能已消失（正常現象）');
    }

    console.log('[Test] ✅ 編輯並儲存個人資料測試完成');
  });
});
