const { test, expect } = require('@playwright/test');

async function bootBella(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('bella_vnext_v2', JSON.stringify({
      version: 2,
      onboarded: true,
      name: 'لاعب اختبار',
      memory: [],
      recentReplies: [],
      recentUser: [],
      mood: { angry: 0, cute: 0, happy: 0 },
      stats: { messages: 0, totalChars: 0, humor: 0, warmth: 0, radar: 0, dira: 0, gameWins: 0 }
    }));
    localStorage.removeItem('bella_game_center_v2');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__bellaBoot);
  await page.evaluate(() => window.__bellaBoot);
  await page.evaluate(() => (window.openChat || window.__openBella)());
  return pageErrors;
}

async function openGames(page) {
  await page.locator('.header-actions button[aria-label="فعاليات بيلا"]').click();
  await expect(page.locator('#bellaActivities')).toBeVisible();
}

test('daily wisdom is a four-choice non-chat game with instant feedback', async ({ page }) => {
  const pageErrors = await bootBella(page);
  const before = await page.locator('#box .m.bot').count();
  await openGames(page);
  await page.getByRole('button', { name: /حكمة اليوم/ }).click();

  await expect(page.locator('#bellaGameCenterPlay')).toBeVisible();
  await expect(page.getByTestId('bella-game-choice')).toHaveCount(4);
  await page.getByTestId('bella-game-choice').first().click();
  await expect(page.locator('#bellaGameFeedback')).toContainText(/صح عليك|غلط/);
  await expect(page.locator('#bellaGameNext')).toBeVisible();
  await expect(page.locator('#box .m.bot')).toHaveCount(before);
  expect(pageErrors).toEqual([]);
});

test('Kuwaiti challenge runs a ten-question session with score and streak UI', async ({ page }) => {
  const pageErrors = await bootBella(page);
  await openGames(page);
  await page.getByRole('button', { name: /تحدي كويتي/ }).click();

  await expect(page.locator('#bellaGameCenterPlay')).toBeVisible();
  await expect(page.locator('.bella-game-stat').first()).toContainText('1/10');
  await expect(page.getByTestId('bella-game-choice')).toHaveCount(4);
  await page.getByTestId('bella-game-choice').nth(1).click();
  await page.locator('#bellaGameNext').click();
  await expect(page.locator('.bella-game-stat').first()).toContainText('2/10');
  await expect(page.getByTestId('bella-game-choice')).toHaveCount(4);
  expect(pageErrors).toEqual([]);
});

test('proverb game offers difficulty then four completion choices', async ({ page }) => {
  const pageErrors = await bootBella(page);
  await openGames(page);
  await page.getByRole('button', { name: /أكمل المثل|كمّل المثل/ }).click();

  await expect(page.locator('#bellaProverbDifficulty')).toBeVisible();
  await page.getByRole('button', { name: /متوسط/ }).click();
  await expect(page.locator('#bellaGameCenterPlay')).toBeVisible();
  await expect(page.getByTestId('bella-game-choice')).toHaveCount(4);
  await page.getByTestId('bella-game-choice').last().click();
  await expect(page.locator('#bellaGameFeedback')).toContainText(/صح عليك|غلط/);
  expect(pageErrors).toEqual([]);
});

test('rumor center has 200 unique fictional entries with categories and favorites', async ({ page }) => {
  const pageErrors = await bootBella(page);
  await openGames(page);
  await page.getByRole('button', { name: /قائمة الإشاعات/ }).click();

  await expect(page.locator('#bellaRumorCenter')).toBeVisible();
  await expect(page.locator('#bellaRumorCenter')).toContainText('200 إشاعة مختلفة');
  await expect(page.locator('#bellaRumorCategory')).toBeVisible();
  await expect(page.locator('.bella-rumor-item')).toHaveCount(40);
  await page.locator('.bella-rumor-fav').first().click();
  await expect(page.locator('.bella-rumor-fav').first()).toHaveText('❤️');
  expect(pageErrors).toEqual([]);
});

test('player profile exposes stats, achievements and leaderboard entry point', async ({ page }) => {
  const pageErrors = await bootBella(page);
  await openGames(page);
  await page.getByRole('button', { name: /ملف اللاعب/ }).click();

  await expect(page.locator('#bellaGameProfile')).toBeVisible();
  await expect(page.locator('#bellaGameProfile')).toContainText('الإنجازات');
  await expect(page.locator('.bella-game-badge')).toHaveCount(12);
  await expect(page.getByRole('button', { name: /لوحة الترتيب/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
