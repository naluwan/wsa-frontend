import { test, expect } from '@playwright/test';
import { devLogin, checkLoginStatus } from './helpers/auth';

/**
 * R1 E2E 測試：單元完成與經驗值系統
 *
 * 測試範圍：
 * 1. 完成單元後 XP 正確增加
 * 2. totalXp 和 weeklyXp 同步更新
 * 3. 等級根據經驗值正確計算
 * 4. 完成單元後 /api/auth/me 回傳最新資料
 * 5. 不能重複完成同一個單元
 * 6. 完成多個單元後 XP 累積正確
 *
 * 對應規格：R1-Unit-And-XP-Spec.md
 *
 * 等級表（參考）：
 * Level 1: 0 XP
 * Level 2: 200 XP
 * Level 3: 500 XP
 * Level 4: 1500 XP
 * Level 5: 3000 XP
 * ...
 */

test.describe('R1: 單元完成與經驗值系統', () => {
  test.beforeEach(async ({ context }) => {
    // 每個測試開始前清除 cookies
    await context.clearCookies();
  });

  test('完成單元後，totalXp 和 weeklyXp 應該增加', async ({ page }) => {
    // Given: 我使用一個低等級的種子使用者登入（以便觀察 XP 變化）
    // seed_test_040: 羅雅芳40, Level 1, totalXp=0, weeklyXp=0
    const user = await devLogin(page, 'seed_test_040');

    expect(user.level).toBe(1);
    expect(user.totalXp).toBe(0);
    expect(user.weeklyXp).toBe(0);

    console.log(`[Test] 初始狀態: Level ${user.level}, totalXp ${user.totalXp}, weeklyXp ${user.weeklyXp}`);

    // When: 我呼叫完成單元 API（使用一個免費試看單元）
    // 根據種子資料，sdp-intro-course-overview 是免費試看單元，xpReward = 200
    const completeResponse = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-course-overview/complete'
    );

    // Then: 應該成功完成
    expect(completeResponse.ok()).toBeTruthy();

    // And: 回傳的資料應該包含更新後的使用者資訊
    const completeData = await completeResponse.json();
    expect(completeData.user).toBeDefined();

    // And: totalXp 和 weeklyXp 都應該增加 200（假設 xpReward = 200）
    expect(completeData.user.totalXp).toBeGreaterThan(user.totalXp);
    expect(completeData.user.weeklyXp).toBeGreaterThan(user.weeklyXp);

    const xpGained = completeData.user.totalXp - user.totalXp;
    console.log(`[Test] 獲得 XP: ${xpGained}`);
    console.log(`[Test] 完成後: Level ${completeData.user.level}, totalXp ${completeData.user.totalXp}, weeklyXp ${completeData.user.weeklyXp}`);

    // And: 單元應該被標記為已完成
    expect(completeData.unit.isCompleted).toBe(true);

    console.log('[Test] ✅ 完成單元後 XP 正確增加');
  });

  test('完成單元後，/api/auth/me 應該回傳最新的 XP 和等級', async ({ page }) => {
    // Given: 我使用一個低等級的種子使用者登入
    const user = await devLogin(page, 'seed_test_039');
    const initialXp = user.totalXp;
    const initialLevel = user.level;

    // When: 我完成一個單元
    await page.request.post('http://localhost:8080/api/units/sdp-intro-course-overview/complete');

    // And: 我呼叫 /api/auth/me
    const updatedUser = await checkLoginStatus(page);

    // Then: 回傳的 XP 應該是更新後的值
    expect(updatedUser).not.toBeNull();
    expect(updatedUser!.totalXp).toBeGreaterThan(initialXp);
    expect(updatedUser!.weeklyXp).toBeGreaterThan(user.weeklyXp);

    console.log(`[Test] XP 從 ${initialXp} 增加到 ${updatedUser!.totalXp}`);
    console.log('[Test] ✅ /api/auth/me 回傳最新 XP');
  });

  test('等級應該根據 totalXp 正確計算', async ({ page }) => {
    // Test Case 1: totalXp = 0 應該是 Level 1
    let user = await devLogin(page, 'seed_test_040');
    expect(user.totalXp).toBe(0);
    expect(user.level).toBe(1);

    // Test Case 2: totalXp = 100 應該是 Level 1（需要 200 才能升到 Level 2）
    user = await devLogin(page, 'seed_test_037');
    expect(user.totalXp).toBe(100);
    expect(user.level).toBe(1);

    // Test Case 3: totalXp = 400 應該是 Level 2（200-499 是 Level 2）
    user = await devLogin(page, 'seed_test_036');
    expect(user.totalXp).toBe(400);
    expect(user.level).toBe(2);

    // Test Case 4: totalXp = 1200 應該是 Level 3（500-1499 是 Level 3）
    user = await devLogin(page, 'seed_test_035');
    expect(user.totalXp).toBe(1200);
    expect(user.level).toBe(3);

    // Test Case 5: totalXp = 65000 應該是 Level 36（最高等級）
    user = await devLogin(page, 'seed_test_001');
    expect(user.totalXp).toBe(65000);
    expect(user.level).toBe(36);

    console.log('[Test] ✅ 等級計算正確');
  });

  test('完成單元可能導致升級', async ({ page }) => {
    // Given: 我使用一個接近升級的種子使用者
    // seed_test_036: totalXp=400, level=2 (需要 500 升到 Level 3)
    const user = await devLogin(page, 'seed_test_036');
    expect(user.level).toBe(2);
    expect(user.totalXp).toBe(400);

    // When: 我完成一個單元（假設獲得 200 XP）
    const completeResponse = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-course-overview/complete'
    );

    expect(completeResponse.ok()).toBeTruthy();
    const completeData = await completeResponse.json();

    // Then: 應該升級到 Level 3
    // 400 + 200 = 600 XP → Level 3
    expect(completeData.user.totalXp).toBeGreaterThanOrEqual(500);
    expect(completeData.user.level).toBeGreaterThanOrEqual(3);

    console.log(`[Test] 升級！Level ${user.level} → Level ${completeData.user.level}`);
    console.log('[Test] ✅ 完成單元可能導致升級');
  });

  test('不能重複完成同一個單元', async ({ page }) => {
    // Given: 我使用一個新的種子使用者登入
    const user = await devLogin(page, 'seed_test_038');
    const initialXp = user.totalXp;

    // When: 我第一次完成單元
    const firstComplete = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-course-overview/complete'
    );

    expect(firstComplete.ok()).toBeTruthy();
    const firstData = await firstComplete.json();
    const xpAfterFirst = firstData.user.totalXp;

    expect(xpAfterFirst).toBeGreaterThan(initialXp);
    console.log(`[Test] 第一次完成: XP ${initialXp} → ${xpAfterFirst}`);

    // When: 我嘗試第二次完成同一個單元
    const secondComplete = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-course-overview/complete'
    );

    // Then: 應該失敗或 XP 不增加
    if (secondComplete.ok()) {
      // 如果回傳 200，則 XP 不應該再增加
      const secondData = await secondComplete.json();
      expect(secondData.user.totalXp).toBe(xpAfterFirst);
      console.log('[Test] 第二次完成: XP 沒有增加（正確）');
    } else {
      // 如果回傳錯誤（例如 400），也是正確的
      expect(secondComplete.status()).toBe(400);
      console.log('[Test] 第二次完成: 回傳錯誤（正確）');
    }

    console.log('[Test] ✅ 不能重複完成同一個單元');
  });

  test('完成多個不同單元，XP 應該累積', async ({ page }) => {
    // Given: 我使用一個低等級的種子使用者登入
    const user = await devLogin(page, 'seed_test_070');
    const initialXp = user.totalXp;

    console.log(`[Test] 初始 XP: ${initialXp}`);

    // When: 我完成第一個單元
    const complete1 = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-course-overview/complete'
    );
    expect(complete1.ok()).toBeTruthy();
    const data1 = await complete1.json();
    const xpAfter1 = data1.user.totalXp;

    console.log(`[Test] 完成單元 1: XP ${initialXp} → ${xpAfter1} (+${xpAfter1 - initialXp})`);

    // When: 我完成第二個單元
    const complete2 = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-ai-era/complete'
    );
    expect(complete2.ok()).toBeTruthy();
    const data2 = await complete2.json();
    const xpAfter2 = data2.user.totalXp;

    console.log(`[Test] 完成單元 2: XP ${xpAfter1} → ${xpAfter2} (+${xpAfter2 - xpAfter1})`);

    // Then: XP 應該是兩次累加
    expect(xpAfter2).toBeGreaterThan(xpAfter1);
    expect(xpAfter1).toBeGreaterThan(initialXp);

    const totalGained = xpAfter2 - initialXp;
    console.log(`[Test] 總共獲得 XP: ${totalGained}`);
    console.log('[Test] ✅ 多個單元 XP 正確累積');
  });

  test('GET /api/units/{unitId} 應該正確顯示單元的完成狀態', async ({ page }) => {
    // Given: 我使用一個種子使用者登入
    await devLogin(page, 'seed_test_069');

    // When: 我查詢一個尚未完成的單元
    const beforeComplete = await page.request.get(
      'http://localhost:8080/api/units/sdp-intro-course-overview'
    );

    expect(beforeComplete.ok()).toBeTruthy();
    const beforeData = await beforeComplete.json();

    // Then: isCompleted 應該是 false（可能為 false 或不存在）
    const wasCompletedBefore = beforeData.isCompleted === true;

    // When: 我完成這個單元
    await page.request.post('http://localhost:8080/api/units/sdp-intro-course-overview/complete');

    // And: 再次查詢這個單元
    const afterComplete = await page.request.get(
      'http://localhost:8080/api/units/sdp-intro-course-overview'
    );

    expect(afterComplete.ok()).toBeTruthy();
    const afterData = await afterComplete.json();

    // Then: isCompleted 應該是 true
    expect(afterData.isCompleted).toBe(true);

    console.log(`[Test] 完成前: isCompleted = ${beforeData.isCompleted}`);
    console.log(`[Test] 完成後: isCompleted = ${afterData.isCompleted}`);
    console.log('[Test] ✅ 單元完成狀態正確更新');
  });

  test('weeklyXp 和 totalXp 應該同步增加相同的數值', async ({ page }) => {
    // Given: 我使用一個種子使用者登入
    const user = await devLogin(page, 'seed_test_068');
    const initialTotalXp = user.totalXp;
    const initialWeeklyXp = user.weeklyXp;

    // When: 我完成一個單元
    const completeResponse = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-course-overview/complete'
    );

    expect(completeResponse.ok()).toBeTruthy();
    const completeData = await completeResponse.json();

    // Then: totalXp 和 weeklyXp 的增量應該相同
    const totalXpGained = completeData.user.totalXp - initialTotalXp;
    const weeklyXpGained = completeData.user.weeklyXp - initialWeeklyXp;

    expect(totalXpGained).toBe(weeklyXpGained);
    expect(totalXpGained).toBeGreaterThan(0);

    console.log(`[Test] totalXp 增加: ${totalXpGained}`);
    console.log(`[Test] weeklyXp 增加: ${weeklyXpGained}`);
    console.log('[Test] ✅ totalXp 和 weeklyXp 同步增加');
  });

  test('完成單元的回傳格式應符合規格', async ({ page }) => {
    // Given: 我使用一個種子使用者登入
    await devLogin(page, 'seed_test_067');

    // When: 我完成一個單元
    const completeResponse = await page.request.post(
      'http://localhost:8080/api/units/sdp-intro-course-overview/complete'
    );

    // Then: 回傳格式應符合規格
    expect(completeResponse.ok()).toBeTruthy();
    const data = await completeResponse.json();

    // 應該包含 user 物件
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeDefined();
    expect(typeof data.user.level).toBe('number');
    expect(typeof data.user.totalXp).toBe('number');
    expect(typeof data.user.weeklyXp).toBe('number');

    // 應該包含 unit 物件
    expect(data.unit).toBeDefined();
    expect(data.unit.unitId).toBeDefined();
    expect(typeof data.unit.isCompleted).toBe('boolean');

    console.log('[Test] ✅ 完成單元的回傳格式正確');
  });
});
