import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 - CI 環境專用
 *
 * 與本機配置的差異：
 * - 關閉影片錄製（節省空間）
 * - 使用 trace: retain-on-failure
 * - 輸出 JUnit 報告
 * - 使用 list 和 html reporter
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',

  // 測試超時設定
  timeout: 60000,  // 單個測試 60 秒
  expect: {
    timeout: 10000, // expect 斷言 10 秒
  },

  // CI 環境不重試失敗的測試
  retries: 0,

  // CI 環境使用單個 worker（避免資源競爭）
  workers: 1,

  // Reporter 設定
  reporter: [
    ['list'],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never' // CI 環境不自動開啟
    }],
  ],

  // 全域設定
  use: {
    // Base URL
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    // 截圖設定（只在失敗時截圖）
    screenshot: 'only-on-failure',

    // 影片設定（關閉以節省空間和時間）
    video: 'off',

    // Trace 設定（只在失敗時保留）
    trace: 'retain-on-failure',

    // 操作超時
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // 測試專案設定（只使用 Chromium）
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Web Server 設定（CI 環境中，server 已經在背景執行）
  // 所以不需要在這裡啟動
});
