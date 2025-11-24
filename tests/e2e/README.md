# R1 E2E 測試執行說明

本文檔說明如何執行 R1 Demo 的完整 E2E 測試。

## 📋 目錄

- [測試環境需求](#測試環境需求)
- [快速開始](#快速開始)
- [測試檔案說明](#測試檔案說明)
- [測試命令](#測試命令)
- [測試覆蓋範圍](#測試覆蓋範圍)
- [常見問題](#常見問題)
- [開發指南](#開發指南)

---

## 測試環境需求

### 必要條件

1. **Node.js** >= 18.x
2. **npm** >= 9.x
3. **Java** >= 17（執行 backend）
4. **PostgreSQL** >= 14（執行資料庫）
5. **Docker** & **Docker Compose**（推薦，用於容器化執行）

### 服務啟動

測試執行前，確保以下服務正在運行：

```bash
# 方式 1：使用 Docker Compose（推薦）
cd /path/to/wsa
docker compose up -d

# 方式 2：手動啟動各服務
# Backend (Spring Boot)
cd backend
./mvnw spring-boot:run

# Frontend (Next.js)
cd frontend
npm run dev

# Database (PostgreSQL)
# 確保 PostgreSQL 正在運行並且已執行所有 migrations
```

### 驗證服務狀態

確認以下服務可以訪問：

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **Database**: PostgreSQL 在 localhost:5432

---

## 快速開始

### 1. 安裝依賴

```bash
cd frontend
npm install
```

這會自動安裝 Playwright 和所有測試依賴。

### 2. 安裝 Playwright 瀏覽器

首次執行測試前需要安裝瀏覽器：

```bash
npx playwright install chromium
```

### 3. 執行測試

```bash
# 執行所有 E2E 測試（headless 模式）
npm run test:e2e

# 執行測試並顯示瀏覽器視窗
npm run test:e2e:headed

# 使用 Playwright UI 模式（推薦，方便調試）
npm run test:e2e:ui

# 使用 Debug 模式（逐步執行）
npm run test:e2e:debug
```

### 4. 查看測試報告

測試執行完成後會自動生成 HTML 報告：

```bash
# 測試報告位置
# frontend/playwright-report/index.html

# 如果測試失敗，會有截圖和影片
# frontend/test-results/
```

---

## 測試檔案說明

### 📂 測試結構

```
frontend/tests/e2e/
├── helpers/
│   └── auth.ts                               # 認證輔助函數（dev 登入、登出）
├── auth/
│   └── login-dialog.spec.ts                  # 登入保護與對話框測試
├── course/
│   └── course-filter-and-sidebar.spec.ts    # 課程篩選與 Sidebar 連動測試
├── leaderboard/
│   └── ranking.spec.ts                       # 排行榜排名與顯示測試
├── sidebar/
│   └── sidebar-links.spec.ts                 # Sidebar 導航連結測試
├── unit/
│   └── unit-completion.spec.ts               # 單元頁與影片完成流程測試
└── README.md                                  # 本說明文檔
```

### 📝 測試檔案詳細說明

#### 1. `auth/login-dialog.spec.ts` - 登入保護與對話框

**測試數量**: 5 個測試

**測試內容**:
- ✅ 未登入時點擊「試聽課程」按鈕應顯示登入對話框
- ✅ 未登入時點擊「立刻購買」按鈕應顯示登入對話框或導向登入頁
- ✅ 登入對話框中的「前往登入」按鈕應正確導向登入頁
- ✅ 未登入時直接訪問受保護的單元頁面應顯示登入提示
- ✅ 未登入時訪問免費試看單元應該可以正常顯示

**測試重點**: 前端登入保護機制、對話框 UI 互動

**對應規格**: `docs/R1-Identity-And-Profile-Spec.md`

---

#### 2. `course/course-filter-and-sidebar.spec.ts` - 課程篩選與 Sidebar 連動

**測試數量**: 9 個測試

**測試內容**:
- ✅ 預設狀態下顯示所有課程
- ✅ 可以透過課程選擇器切換課程
- ✅ 切換課程後 URL 正確更新
- ✅ 切換課程後 Sidebar 顯示對應課程的單元列表
- ✅ URL 參數正確載入對應課程
- ✅ 無效課程代碼時回退到預設狀態
- ✅ Sidebar 中的課程單元可以點擊導航
- ✅ 課程選擇狀態在不同頁面間保持
- ✅ 免費試看單元有「試看」標記

**測試重點**: 課程篩選邏輯、Sidebar 狀態連動、URL 同步

**對應規格**: `docs/R1-Course-Unit-Access-And-Ownership-Spec.md`

---

#### 3. `leaderboard/ranking.spec.ts` - 排行榜排名與顯示

**測試數量**: 8 個測試

**測試內容**:
- ✅ 排行榜頁面可以正常訪問
- ✅ 總排行榜按 totalXp 正確排序
- ✅ 本週排行榜按 weeklyXp 正確排序
- ✅ 排行榜 Tab 切換功能正常
- ✅ 排行榜顯示正確的名次和 XP 數字
- ✅ 當前使用者的排名卡片固定在底部
- ✅ 排行榜項目包含頭像、名稱、等級、XP
- ✅ 完成單元後排行榜資料即時更新

**測試重點**: 排行榜 UI 細節、Tab 切換、排序邏輯、即時更新

**對應規格**: `docs/R1-Leaderboard-Spec.md`

---

#### 4. `sidebar/sidebar-links.spec.ts` - Sidebar 導航連結

**測試數量**: 8 個測試

**測試內容**:
- ✅ 未登入狀態下 Sidebar 顯示基本導航連結
- ✅ 登入後 Sidebar 顯示完整導航連結（包含個人檔案、排行榜等）
- ✅ 點擊首頁連結導向正確頁面
- ✅ 點擊課程連結導向正確頁面
- ✅ 點擊排行榜連結導向正確頁面
- ✅ 點擊個人檔案連結導向正確頁面（需登入）
- ✅ Sidebar 連結有正確的 data-testid 屬性
- ✅ 當前頁面的 Sidebar 連結有 active 狀態標記

**測試重點**: Sidebar 導航功能、登入狀態判斷、active 狀態

**對應規格**: `docs/R1-Identity-And-Profile-Spec.md`

---

#### 5. `unit/unit-completion.spec.ts` - 單元頁與影片完成流程

**測試數量**: 7 個測試

**測試內容**:
- ✅ 開啟免費試看單元頁應顯示影片播放器
- ✅ 影片播放器應有自訂控制列元素（播放、暫停、音量、全螢幕）
- ✅ 完成單元後應更新 XP 和等級
- ✅ 完成單元的 API 應該正確回傳更新後的資料
- ✅ 已完成的單元應該顯示「已完成」標記
- ✅ 未購買課程的付費單元應該無法完成
- ✅ 影片播放器控制列的播放/暫停按鈕應該可以點擊

**測試重點**: 影片播放器 UI、完成按鈕功能、XP 更新、完成狀態顯示

**對應規格**: `docs/R1-Unit-And-XP-Spec.md`

**等級表參考**:
```
Level 1: 0 XP
Level 2: 200 XP
Level 3: 500 XP
Level 4: 1500 XP
Level 5: 3000 XP
...
Level 36: 65000 XP（最高等級）
```

---

## 測試命令

### 基本命令

```bash
# 執行所有測試
npm run test:e2e

# 執行特定測試檔案
npx playwright test auth/login-dialog.spec.ts

# 執行特定資料夾的測試
npx playwright test tests/e2e/unit/

# 執行特定測試（使用 grep）
npx playwright test --grep "登入對話框"

# 顯示瀏覽器視窗執行
npm run test:e2e:headed

# 使用 UI 模式（推薦）
npm run test:e2e:ui
```

### 進階命令

```bash
# 只執行失敗的測試
npx playwright test --last-failed

# 使用特定瀏覽器
npx playwright test --project=chromium

# 產生測試報告
npx playwright show-report

# Debug 模式
npm run test:e2e:debug

# 平行執行測試（加速）
npx playwright test --workers=4
```

---

## 測試覆蓋範圍

### ✅ 已覆蓋功能

#### 1. **身分認證 (Authentication)**
- [x] OAuth 登入（Google, Facebook）- 透過 dev 登入模擬
- [x] Dev 一鍵登入（種子使用者）
- [x] 登出功能
- [x] JWT Cookie 管理
- [x] /api/auth/me API

#### 2. **使用者資料 (User Profile)**
- [x] 個人檔案頁顯示
- [x] Header 使用者資訊顯示
- [x] 等級、XP、頭像顯示
- [x] 未登入狀態處理

#### 3. **課程系統 (Courses)**
- [x] 課程列表瀏覽
- [x] 課程詳情查看
- [x] 課程擁有狀態顯示
- [x] Mock 購買課程

#### 4. **存取權限 (Access Control)**
- [x] 未登入使用者行為
- [x] 免費試看單元存取
- [x] 付費單元鎖定
- [x] 購買後解鎖驗證
- [x] canAccess 邏輯正確性

#### 5. **單元與經驗值 (Units & XP)**
- [x] 完成單元 API
- [x] XP 增加邏輯
- [x] 等級計算正確性
- [x] 升級機制
- [x] 重複完成防護
- [x] totalXp 和 weeklyXp 同步

#### 6. **排行榜 (Leaderboard)**
- [x] 總 XP 排行榜
- [x] 本週 XP 排行榜
- [x] 排序正確性
- [x] 完成單元後排行榜更新
- [x] Tab 切換功能

#### 7. **導航 (Navigation)**
- [x] Sidebar 連結顯示
- [x] 頁面導航功能
- [x] 路由正確性

### ✅ UI 元素標記（data-testid）

所有關鍵 UI 元素已添加 `data-testid` 屬性以提高測試穩定性：

- [x] Header 下拉選單元素
- [x] 課程卡片內的按鈕
- [x] 單元列表項目
- [x] 排行榜項目
- [x] Sidebar 導航連結
- [x] 影片播放器元素

### 🚫 超出範圍（R1 不包含）

- ❌ 真實金流串接
- ❌ 影片播放偵測（使用「標記為完成」按鈕）
- ❌ 測驗型單元
- ❌ 作業上傳
- ❌ 道館挑戰

---

## 常見問題

### Q1: 測試一直失敗，顯示 "Timeout"

**可能原因**:
- Frontend 或 Backend 服務未啟動
- Database 連線失敗
- 種子資料未正確載入

**解決方法**:
```bash
# 1. 確認服務狀態
docker compose ps

# 2. 檢查 Frontend 可訪問
curl http://localhost:3000

# 3. 檢查 Backend 可訪問
curl http://localhost:8080/api/courses

# 4. 檢查種子資料
docker compose exec db psql -U postgres -d wsa -c "SELECT COUNT(*) FROM users WHERE provider = 'seed';"
```

---

### Q2: Dev 登入失敗，顯示 "找不到種子使用者"

**可能原因**:
- Database migrations 未執行
- V11__Seed_test_users.sql 未執行

**解決方法**:
```bash
# 檢查 migrations 狀態
docker compose exec backend ./mvnw flyway:info

# 重新執行 migrations
docker compose exec backend ./mvnw flyway:migrate

# 驗證種子使用者存在
docker compose exec db psql -U postgres -d wsa -c "SELECT * FROM users WHERE external_id = 'seed_test_001';"
```

---

### Q3: 測試通過但實際 UI 有問題

**可能原因**:
- 測試使用的選擇器不夠精確
- 缺少 `data-testid` 屬性

**解決方法**:
1. 使用 Playwright UI 模式查看實際執行過程：
   ```bash
   npm run test:e2e:ui
   ```

2. 為關鍵元素添加 `data-testid`：
   ```tsx
   // 範例
   <button data-testid="complete-unit-button">
     標記為完成
   </button>
   ```

3. 更新測試使用 `data-testid`：
   ```typescript
   await page.locator('[data-testid="complete-unit-button"]').click();
   ```

---

### Q4: 如何在本地調試單個測試？

```bash
# 方法 1: 使用 test.only
# 在測試檔案中：
test.only('這個測試會單獨執行', async ({ page }) => {
  // ...
});

# 方法 2: 使用命令行 grep
npx playwright test --grep "Dev 一鍵登入"

# 方法 3: 使用 UI 模式
npm run test:e2e:ui
# 然後在 UI 中選擇要執行的測試
```

---

### Q5: 測試資料如何清理？

測試使用種子使用者（`provider = "seed"`），這些使用者的資料會持續累積（XP、完成的單元等）。

**清理方法**:

```bash
# 方式 1: 使用 /api/user/reset API（如果有實作）
curl -X POST http://localhost:8080/api/user/reset \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 方式 2: 直接清理 Database
docker compose exec db psql -U postgres -d wsa -c "
BEGIN;
DELETE FROM user_unit_progress WHERE user_id IN (SELECT id FROM users WHERE provider = 'seed');
UPDATE users SET total_xp = 0, weekly_xp = 0, level = 1 WHERE provider = 'seed';
COMMIT;
"

# 方式 3: 重新執行 seed migration
docker compose exec backend ./mvnw flyway:clean
docker compose exec backend ./mvnw flyway:migrate
```

---

## Data-testid 參考清單

以下列出所有已添加的 `data-testid` 屬性，方便測試時使用：

### 📋 Header 下拉選單

| 元素 | data-testid | 說明 |
|------|------------|------|
| 使用者頭像按鈕 | `user-avatar-button` | 點擊開啟下拉選單 |
| 下拉選單容器 | `user-dropdown-menu` | 整個下拉選單 |
| 使用者名稱 | `user-display-name` | 顯示名稱文字 |
| 使用者等級 | `user-level` | 等級顯示 (Lv. X) |
| 經驗值區塊 | `user-xp-section` | 整個經驗值資訊區域 |
| 經驗值顯示 | `user-xp-display` | 當前 XP / 下一級所需 XP |
| 本週 XP | `user-weekly-xp` | 本週獲得的 XP |
| 個人檔案連結 | `profile-link` | 前往個人檔案 |
| 主題切換按鈕 | `theme-toggle-button` | 切換深色/淺色模式 |
| 邀請好友連結 | `invite-link` | 邀請好友頁面 |
| 重置資料按鈕 | `reset-data-button` | 重置使用者資料 |
| 登出按鈕 | `logout-button` | 登出 |

### 🎓 課程卡片

| 元素 | data-testid | 說明 |
|------|------------|------|
| 課程卡片 | `course-card` | 整個課程卡片 |
| 課程標題 | `course-title` | 課程名稱 |
| 試聽課程按鈕 | `preview-course-button` | 試聽免費單元 |
| 僅限付費按鈕 | `paid-only-button` | 無免費試看時顯示 |
| 進入課程按鈕 | `enter-course-button` | 已購買課程時顯示 |
| 立刻購買按鈕 | `purchase-course-button` | 未購買課程時顯示 |
| 登入提示對話框 | `login-prompt-dialog` | 未登入時的登入提示 |
| 前往登入按鈕 | `goto-login-button` | 對話框中的登入按鈕 |

### 📚 單元列表

| 元素 | data-testid | 說明 |
|------|------------|------|
| 單元列表項目 | `unit-list-item` | 單元按鈕（展開狀態） |
| 單元列表項目（收合） | `unit-list-item-collapsed` | 單元按鈕（收合狀態） |
| 單元標題 | `unit-title` | 單元名稱 |
| 免費試看標記 | `free-preview-badge` | 「試看」badge |
| 已完成標記 | `completed-badge` | 「已完成」badge |

### 🏆 排行榜

| 元素 | data-testid | 說明 |
|------|------------|------|
| 排行榜列 | `leaderboard-row` | 每一行使用者資料 |
| 排名 | `leaderboard-rank` | 排名數字或圖示 |
| 使用者頭像 | `leaderboard-avatar` | 使用者頭像 |
| 使用者名稱 | `leaderboard-display-name` | 顯示名稱 |
| 等級 | `leaderboard-level` | 等級 badge |
| 總 XP | `leaderboard-total-xp` | 總經驗值 |
| 本週 XP | `leaderboard-weekly-xp` | 本週經驗值 |
| 當前使用者卡片 | `current-user-leaderboard-card` | 底部固定的當前使用者資訊 |
| 總排行榜 Tab | `leaderboard-tab-total` | 切換到總排行榜 |
| 本週排行榜 Tab | `leaderboard-tab-weekly` | 切換到本週排行榜 |

### 📱 Sidebar 導航

| 元素 | data-testid | 說明 |
|------|------------|------|
| Sidebar 連結 | `sidebar-nav-{路徑}` | 導航連結（路徑中的 `/` 會被替換為 `-`） |

**範例**:
- 首頁: `sidebar-nav--` (root path)
- 課程: `sidebar-nav--courses`
- 個人檔案: `sidebar-nav--profile`
- 排行榜: `sidebar-nav--leaderboard`
- 所有單元: `sidebar-nav--units`
- 挑戰地圖: `sidebar-nav--map`

### 🎬 影片播放器

| 元素 | data-testid | 說明 |
|------|------------|------|
| 播放器容器 | `unit-video` | 整個影片播放器 |
| 播放/暫停按鈕 | `video-play-pause-button` | 控制播放狀態 |
| 進度條 | `video-progress-bar` | 調整播放位置 |
| 音量按鈕 | `video-volume-button` | 靜音/取消靜音 |
| 音量滑桿 | `video-volume-slider` | 調整音量大小 |
| 全螢幕按鈕 | `video-fullscreen-button` | 進入/退出全螢幕 |

### 使用範例

```typescript
// 使用 data-testid 選擇元素
await page.locator('[data-testid="user-avatar-button"]').click();
await page.locator('[data-testid="course-card"]').first().click();
await page.locator('[data-testid="preview-course-button"]').click();
await page.locator('[data-testid="leaderboard-tab-weekly"]').click();
await page.locator('[data-testid="video-play-pause-button"]').click();

// 等待元素可見
await expect(page.locator('[data-testid="unit-video"]')).toBeVisible();
await expect(page.locator('[data-testid="leaderboard-row"]')).toHaveCount(5);
```

---

## 開發指南

### 新增測試

1. **創建新的測試檔案**:
   ```bash
   touch frontend/tests/e2e/my-feature.spec.ts
   ```

2. **引入必要的 helpers**:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { devLogin } from './helpers/auth';
   ```

3. **撰寫測試**:
   ```typescript
   test.describe('我的功能', () => {
     test.beforeEach(async ({ context }) => {
       await context.clearCookies();
     });

     test('測試案例 1', async ({ page }) => {
       // Given
       await devLogin(page, 'seed_test_001');

       // When
       await page.goto('http://localhost:3000/my-feature');

       // Then
       await expect(page.locator('[data-testid="feature-title"]')).toBeVisible();
     });
   });
   ```

### 新增 Helper 函數

在 `frontend/tests/e2e/helpers/` 目錄下創建新的 helper 檔案：

```typescript
// frontend/tests/e2e/helpers/course.ts
import { Page } from '@playwright/test';

export async function purchaseCourse(page: Page, courseCode: string) {
  const response = await page.request.post(
    `http://localhost:8080/api/courses/${courseCode}/purchase/mock`
  );
  return response.json();
}
```

### 使用 Page Object Pattern

對於複雜的頁面，建議使用 Page Object Pattern：

```typescript
// frontend/tests/e2e/pages/CoursePage.ts
import { Page, Locator } from '@playwright/test';

export class CoursePage {
  readonly page: Page;
  readonly courseTitle: Locator;
  readonly unitList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.courseTitle = page.locator('[data-testid="course-title"]');
    this.unitList = page.locator('[data-testid="unit-list"]');
  }

  async goto(courseCode: string) {
    await this.page.goto(`http://localhost:3000/courses/${courseCode}`);
  }

  async clickUnit(unitId: string) {
    await this.page.locator(`[data-testid="unit-${unitId}"]`).click();
  }
}
```

---

## 相關文件

- [Playwright 官方文檔](https://playwright.dev/)
- [R1-E2E-Test.md](../../docs/R1-E2E-Test.md) - E2E 測試規格
- [R1-Identity-And-Profile-Spec.md](../../docs/R1-Identity-And-Profile-Spec.md)
- [R1-Course-Unit-Access-And-Ownership-Spec.md](../../docs/R1-Course-Unit-Access-And-Ownership-Spec.md)
- [R1-Unit-And-XP-Spec.md](../../docs/R1-Unit-And-XP-Spec.md)
- [R1-Leaderboard-Spec.md](../../docs/R1-Leaderboard-Spec.md)

---

## 貢獻者

如有問題或建議，請聯繫開發團隊或提交 Issue。

**最後更新**: 2025-01-25（添加完整 data-testid 參考清單）
