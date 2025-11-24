# WSA Frontend

Water Sausage Academy 前端專案 - 使用 Next.js 14 App Router 架構。

## 技術棧

- **框架**: Next.js 14.0.4 (App Router)
- **UI 元件庫**: Radix UI + Tailwind CSS
- **測試框架**: Playwright (E2E 測試)
- **部署平台**: Heroku
- **CI/CD**: GitHub Actions

## 專案結構

```
frontend/
├── app/                      # Next.js App Router 頁面
│   ├── (auth)/              # 認證相關頁面（登入、註冊）
│   ├── (dashboard)/         # Dashboard 頁面（需登入）
│   ├── (journey)/           # 課程學習頁面
│   └── api/                 # API Routes
├── components/              # React 元件
│   ├── ui/                  # 基礎 UI 元件
│   └── ...                  # 業務元件
├── contexts/                # React Context
├── lib/                     # 工具函式
├── tests/                   # 測試檔案
│   └── e2e/                # E2E 測試
│       ├── auth/           # 登入保護測試
│       ├── course/         # 課程相關測試
│       ├── leaderboard/    # 排行榜測試
│       ├── sidebar/        # 側邊欄測試
│       ├── unit/           # 單元完成測試
│       └── helpers/        # 測試輔助函式
└── .github/
    └── workflows/          # GitHub Actions workflows
```

## 開發環境設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數設定

建立 `.env.local` 檔案：

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

## E2E 測試

本專案使用 Playwright 進行 E2E 測試，測試範圍涵蓋：

- **登入保護**: 未登入時的登入對話框行為
- **側邊欄導航**: 已登入/未登入狀態的側邊欄連結顯示
- **排行榜**: 總排行榜與週排行榜的排名邏輯
- **課程篩選**: 課程選擇與側邊欄狀態連動
- **單元完成**: 影片播放器與單元完成流程

### 執行測試

```bash
# 執行所有測試（headless 模式）
npm run test:e2e

# 以 headed 模式執行（可看到瀏覽器）
npm run test:e2e:headed

# 使用 Playwright UI 模式
npm run test:e2e:ui

# Debug 模式
npm run test:e2e:debug

# CI 模式（使用 CI 專用設定）
npm run test:e2e:ci
```

### 測試資料

測試使用 **Seed Users**（`provider = 'seed'`）:
- 帳號格式: `seed_test_001` ~ `seed_test_100`
- 使用 `devLogin` helper 函式進行一鍵登入
- 不同的種子使用者有不同的 XP 和等級，用於測試不同情境

---

## CI / Deploy 設定

本專案使用 GitHub Actions 自動化測試與部署流程。

### 工作流程說明

#### 1. 觸發條件

- **Push**: 任何分支（`main`, `develop`, `feature/**`）的 push 都會觸發 E2E 測試
- **Pull Request**: 對 `main` 分支的 PR 會觸發 E2E 測試
- **自動部署**: 只有 `main` 分支且測試通過後才會自動部署到 Heroku

#### 2. CI 流程 (test job)

```
Push/PR → 安裝依賴 → 建置 Next.js → 啟動 Server → 執行 Playwright E2E 測試 → 上傳測試報告
```

**測試環境**:
- Node.js 18
- Ubuntu Latest
- Playwright + Chromium
- 單一 worker (避免資源競爭)

**測試輸出**:
- HTML Report (瀏覽測試結果)
- JUnit XML Report (與 CI 工具整合)
- 失敗時的截圖和 trace

#### 3. Deploy 流程 (deploy job)

```
測試通過 → 檢查是否為 main 分支 → 部署到 Heroku → 驗證部署
```

**部署條件**:
- ✅ 必須在 `main` 分支
- ✅ 必須是 `push` 事件（不是 PR）
- ✅ E2E 測試必須通過

---

### GitHub Secrets 設定

請在 GitHub 專案的 **Settings → Secrets and variables → Actions** 新增以下 secrets：

#### 前端相關 Secrets

| Secret 名稱 | 說明 | 範例值 |
|------------|------|--------|
| `NEXT_PUBLIC_API_URL` | 後端 API 網址 | `https://wsa-backend-ender-1825ee4f322f.herokuapp.com` |
| `NEXT_PUBLIC_APP_URL` | 前端應用程式網址 | `http://localhost:3000` (測試) 或 Heroku 網址 (正式) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456789-abcdefg.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxxxxxxxxxx` |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID | `1234567890123456` |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

#### Heroku 部署 Secrets

| Secret 名稱 | 說明 | 取得方式 |
|------------|------|---------|
| `HEROKU_API_KEY` | Heroku API 金鑰 | 前往 [Heroku Account Settings](https://dashboard.heroku.com/account) → API Key → Reveal |
| `HEROKU_APP_NAME_FRONTEND` | Heroku 前端應用程式名稱 | 在 Heroku Dashboard 中的應用程式名稱，例如 `wsa-frontend-ender-aba5a1f95900` |
| `HEROKU_EMAIL` | Heroku 帳號 Email | 您的 Heroku 登入 Email |

#### 設定步驟

1. 前往 GitHub Repository
2. 點選 **Settings** 頁籤
3. 左側選單選擇 **Secrets and variables** → **Actions**
4. 點選 **New repository secret**
5. 輸入 Secret 名稱和值
6. 點選 **Add secret** 儲存

**重要提醒**:
- ⚠️ 這些 secrets 是機密資訊，請勿 commit 到 Git
- ⚠️ 每個 secret 都必須正確設定，否則 CI/Deploy 會失敗
- ⚠️ `NEXT_PUBLIC_API_URL` 在測試時應指向後端 Heroku URL，不要使用 localhost

---

### Branch Protection 規則設定

為了確保程式碼品質，建議設定 Branch Protection Rules 強制要求測試通過才能合併 PR。

#### 設定步驟

1. **前往 Branch Protection 設定頁面**:
   - GitHub Repository → **Settings** → **Branches** → **Branch protection rules**
   - 點選 **Add rule**

2. **設定 Branch name pattern**:
   ```
   main
   ```

3. **啟用以下規則**:
   - ✅ **Require a pull request before merging**
     - 勾選 "Require approvals" (至少 1 人審核)
   - ✅ **Require status checks to pass before merging**
     - 勾選 "Require branches to be up to date before merging"
     - 在 "Status checks that are required" 搜尋並勾選:
       - `test` (E2E Tests job)
   - ✅ **Do not allow bypassing the above settings** (建議啟用)

4. **儲存設定**:
   - 點選 **Create** 或 **Save changes**

#### 結果

設定完成後：
- 所有對 `main` 分支的更動都必須透過 Pull Request
- PR 必須等待 E2E 測試通過（綠色勾勾）才能合併
- 開發者無法直接 push 到 `main` 分支

---

### 完整的開發與部署流程

#### 情境 1: Feature 開發

```bash
# 1. 建立 feature 分支
git checkout -b feature/new-feature

# 2. 開發功能
# ... coding ...

# 3. 提交變更
git add .
git commit -m "feat: add new feature"

# 4. Push 到 GitHub
git push origin feature/new-feature
# → 觸發 E2E 測試

# 5. 在 GitHub 建立 Pull Request 到 main
# → 再次觸發 E2E 測試
# → 等待測試通過（綠色勾勾）

# 6. Code Review 通過後合併 PR
# → 自動觸發部署到 Heroku
```

#### 情境 2: Hotfix

```bash
# 1. 從 main 建立 hotfix 分支
git checkout main
git pull
git checkout -b hotfix/critical-bug

# 2. 修復 bug
# ... fix bug ...

# 3. 提交變更
git add .
git commit -m "fix: resolve critical bug"

# 4. Push 並建立 PR
git push origin hotfix/critical-bug
# → 等待測試通過

# 5. 合併到 main
# → 自動部署到 Heroku
```

#### 情境 3: 查看測試報告

```bash
# 在 GitHub Actions 頁面:
# 1. 前往 Actions 頁籤
# 2. 點選失敗的 workflow run
# 3. 下載 "playwright-report" artifact
# 4. 解壓縮後開啟 index.html 查看詳細測試結果
```

---

### 常見問題排解

#### Q1: E2E 測試失敗怎麼辦？

1. **檢查 GitHub Actions logs**:
   - 前往 Actions 頁籤
   - 點選失敗的 workflow
   - 查看 "Run Playwright E2E tests" 步驟的 log

2. **下載測試報告**:
   - 在 workflow run 頁面下方找到 "Artifacts"
   - 下載 `playwright-report`
   - 解壓縮後開啟 `index.html` 查看失敗的測試截圖和 trace

3. **本地重現問題**:
   ```bash
   npm run build
   npm run start &
   npm run test:e2e:ci
   ```

#### Q2: Heroku 部署失敗怎麼辦？

1. **檢查 Secrets 是否正確設定**:
   - `HEROKU_API_KEY` 是否正確
   - `HEROKU_APP_NAME_FRONTEND` 是否與 Heroku 應用程式名稱一致
   - `HEROKU_EMAIL` 是否正確

2. **檢查 Heroku 應用程式狀態**:
   ```bash
   heroku apps:info -a your-app-name
   heroku logs --tail -a your-app-name
   ```

3. **手動部署測試**:
   ```bash
   git push heroku main
   ```

#### Q3: 測試在 CI 通過但本地失敗？

- **檢查環境變數**: 確保 `.env.local` 設定正確
- **檢查 API URL**: 本地測試時 `NEXT_PUBLIC_API_URL` 應該指向本地後端或 staging 環境
- **清除快取**: `rm -rf .next && npm run build`

#### Q4: 如何跳過 CI 測試？

**不建議跳過測試**，但如果有緊急需求：
- 在 commit message 加上 `[skip ci]`:
  ```bash
  git commit -m "docs: update README [skip ci]"
  ```

---

### 相關連結

- [GitHub Actions Workflow 檔案](.github/workflows/e2e-and-deploy.yml)
- [Playwright CI 設定檔](playwright.config.ci.ts)
- [E2E 測試檔案](tests/e2e/)
- [Heroku Dashboard](https://dashboard.heroku.com/)

---

## License

本專案為私有專案，未經授權不得使用。
