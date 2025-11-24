import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 測試設定檔
 * 用於測試 R1 Demo 的完整流程
 *
 * 相關規格文檔：
 * - R1-Identity-And-Profile-Spec.md
 * - R1-Course-Unit-Access-And-Ownership-Spec.md
 * - R1-Unit-And-XP-Spec.md
 * - R1-Leaderboard-Spec.md
 */
export default defineConfig({
  // 測試檔案目錄
  testDir: './tests/e2e',

  // 完整測試報告輸出目錄
  outputDir: './test-results',

  // 全域測試 timeout（30 秒）
  timeout: 30000,

  // 預期 assertion timeout（5 秒）
  expect: {
    timeout: 5000,
  },

  // 失敗測試重試次數
  retries: process.env.CI ? 2 : 0,

  // 並行執行的 worker 數量
  workers: process.env.CI ? 1 : undefined,

  // HTML 測試報告
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 所有測試的共用設定
  use: {
    // 前端應用程式的基礎 URL
    baseURL: 'http://localhost:3000',

    // 測試時截圖（僅失敗時）
    screenshot: 'only-on-failure',

    // 測試時錄影（僅失敗時）
    video: 'retain-on-failure',

    // 測試追蹤（僅失敗時）
    trace: 'retain-on-failure',

    // 提高 action timeout 避免因動畫導致的不穩定
    actionTimeout: 10000,

    // 導航 timeout
    navigationTimeout: 15000,
  },

  // 測試專案設定（不同瀏覽器）
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 設定視窗大小
        viewport: { width: 1280, height: 720 },
      },
    },

    // 可選：其他瀏覽器測試
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 開發伺服器設定（選用）
  // 如果需要在執行測試前自動啟動 dev server，可以啟用以下設定
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
