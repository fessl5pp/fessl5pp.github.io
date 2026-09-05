const { test, expect } = require('@playwright/test');

async function boot(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('bella_vnext_v2', JSON.stringify({ version:2,onboarded:true,name:'اختبار',memory:[],recentReplies:[],recentUser:[],mood:{angry:0,cute:0,happy:0},stats:{messages:0,totalChars:0,humor:0,warmth:0,radar:0,dira:0,gameWins:0} }));
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__bellaBoot);
  await page.evaluate(() => window.__bellaBoot);
  return errors;
}

test('v15 Brain and layered memory enrich short Kuwaiti chat', async ({ page }) => {
  const errors = await boot(page);
  const result = await page.evaluate(() => {
    const intent = window.BellaBrainV2?.classifyIntent?.('اي');
    const brainPayload = window.BellaBrainV2?.enrichPayload?.({ message: 'اي', memory: [], relationship: 'جديد' });
    const memoryPayload = window.BellaMemoryV3?.enrichPayload?.({ message: 'الحين قاعد اشرب قهوة', memory: [] });
    return { intent, brainPayload, memoryPayload, brain: window.BellaBrainV2?.snapshot?.() };
  });
  expect(result.intent.intent).toBe('followup_short');
  expect(result.intent.shortFollowup).toBe(true);
  expect(result.brainPayload.brainContext.naturalKuwaitiChat).toBe(true);
  expect(result.memoryPayload.memory.some(x => x.includes('مؤقت للجلسة فقط'))).toBe(true);
  expect(result.brain.version).toBe(2);
  expect(errors).toEqual([]);
});

test('v15 moments expose reactions without breaking rumor UI', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => window.BellaMoments?.showRumor?.());
  await expect(page.locator('#rumor-bar')).toBeVisible();
  await expect(page.locator('#bellaMomentFeedback')).toBeVisible();
  await expect(page.getByRole('button', { name: 'عجبتني الإشاعة' })).toBeVisible();
  await page.getByRole('button', { name: 'عجبتني الإشاعة' }).click();
  const total = await page.evaluate(() => window.BellaMomentFeedback?.snapshot?.()?.total || 0);
  expect(total).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('v15 AI activity renders a generated challenge', async ({ page }) => {
  await page.route('**/api/activity-generate', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok:true, activity:{ kind:'quick', title:'لغز سريع', question:'شي له أسنان وما يعض شنو هو؟', answer:'المشط', hint:'تستخدمه حق الشعر' } })
  }));
  const errors = await boot(page);
  await page.evaluate(() => window.BellaAIActivities?.generate?.('quick'));
  await expect(page.locator('#bellaAIActivityModal')).toBeVisible();
  await expect(page.locator('#bellaAIActivityModal')).toContainText('شي له أسنان');
  await page.locator('#bellaAIActivityAnswer').fill('المشط');
  await page.locator('#bellaAIActivityCheck').click();
  await expect(page.locator('#bellaAIActivityCheck')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('v15 deferred admin modules can load after core boot', async ({ page }) => {
  const errors = await boot(page);
  const coreState = await page.evaluate(() => ({ brain: !!window.BellaBrainV2, loader: typeof window.__bellaLoadDeferred === 'function' }));
  expect(coreState.brain).toBe(true);
  expect(coreState.loader).toBe(true);
  await page.evaluate(() => window.__bellaLoadDeferred());
  await page.evaluate(() => window.__bellaAdminBoot);
  const adminState = await page.evaluate(() => ({ owner: !!window.BellaOwnerCenter, dashboard: !!window.BellaOwnerDashboardV2, momentsStudio: !!window.BellaMomentsStudio }));
  expect(adminState.owner).toBe(true);
  expect(adminState.dashboard).toBe(true);
  expect(adminState.momentsStudio).toBe(true);
  expect(errors).toEqual([]);
});
