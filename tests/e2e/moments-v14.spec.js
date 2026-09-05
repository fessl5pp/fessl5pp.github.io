const { test, expect } = require('@playwright/test');

async function boot(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/rest/v1/bella_moments_config*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ remote_enabled: true, enabled_categories: ['normal','night','gaming'], rare_chance: 0.12, legendary_chance: 0.02, global_intensity: 'normal' }])
  }));
  await page.route('**/rest/v1/bella_moments?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: '11111111-1111-1111-1111-111111111111', text: 'يقولون هذي إشاعة Remote حق اختبار v14 👀', category: 'normal', tier: 'common', source: 'manual', pinned_until: null, created_at: new Date().toISOString() }])
  }));
  await page.addInitScript(() => {
    localStorage.setItem('bella_vnext_v2', JSON.stringify({ version: 2, onboarded: true, name: 'اختبار', memory: [], recentReplies: [], recentUser: [], mood: { angry: 0, cute: 0, happy: 0 }, stats: { messages: 0, totalChars: 0, humor: 0, warmth: 0, radar: 0, dira: 0, gameWins: 0 } }));
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__bellaBoot);
  await page.evaluate(() => window.__bellaBoot);
  await expect.poll(() => page.evaluate(() => window.BellaMoments?.status?.().remote?.loaded)).toBe(true);
  return errors;
}

test('v14 merges approved remote moments and applies the owner global intensity ceiling', async ({ page }) => {
  const errors = await boot(page);
  const status = await page.evaluate(() => window.BellaMoments?.status?.());
  expect(status.remote.count).toBe(1);
  expect(status.remote.config.rare_chance).toBeCloseTo(0.12);
  expect(status.remote.config.legendary_chance).toBeCloseTo(0.02);
  expect(status.remote.config.global_intensity).toBe('normal');
  expect(status.effectiveIntensity).toBe('normal');
  expect(status.privacy).toBe('topic-tags-only-no-chat-text');
  expect(errors).toEqual([]);
});

test('guest never gets a Moments Studio owner entry', async ({ page }) => {
  const errors = await boot(page);
  expect(await page.evaluate(() => window.BellaOwnerCenter?.isOwner?.())).toBe(false);
  await expect(page.locator('[data-bella-moments-studio-entry]')).toHaveCount(0);
  expect(await page.evaluate(() => typeof window.BellaMomentsStudio?.open)).toBe('function');
  expect(errors).toEqual([]);
});
