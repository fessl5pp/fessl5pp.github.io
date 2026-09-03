const { test, expect } = require('@playwright/test');

async function bootBella(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('bella_vnext_v2', JSON.stringify({
      version: 2,
      onboarded: true,
      name: 'اختبار',
      memory: [],
      recentReplies: [],
      recentUser: [],
      mood: { angry: 0, cute: 0, happy: 0 },
      stats: { messages: 0, totalChars: 0, humor: 0, warmth: 0, radar: 0, dira: 0, gameWins: 0 }
    }));
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__bellaBoot);
  await page.evaluate(() => window.__bellaBoot);
  await expect(page.locator('#inp')).toBeAttached();
  return pageErrors;
}

test('boots cleanly and core chat controls open', async ({ page }) => {
  const pageErrors = await bootBella(page);

  await page.evaluate(() => (window.openChat || window.__openBella)());
  await expect(page.locator('#win')).toHaveClass(/active/);

  await page.evaluate(() => window.toggleBellaMoreMenu());
  await expect(page.locator('#bellaMoreMenu')).toBeVisible();
  await expect(page.getByRole('button', { name: 'إرسال الرسالة' })).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test('Enter and send button each submit exactly one message', async ({ page }) => {
  await bootBella(page);
  await page.evaluate(() => (window.openChat || window.__openBella)());

  await page.evaluate(() => {
    window.send = async function () {
      const input = document.getElementById('inp');
      const text = String(input?.value || '').trim();
      if (!text) return;
      const node = document.createElement('div');
      node.className = 'm user';
      node.textContent = text;
      document.getElementById('box')?.appendChild(node);
      input.value = '';
    };
  });

  const input = page.locator('#inp');
  await input.fill('اختبار Enter');
  await input.press('Enter');
  await expect(page.locator('#box .m.user')).toHaveCount(1);
  await expect(page.locator('#box .m.user').last()).toContainText('اختبار Enter');

  await input.fill('اختبار الزر');
  await page.getByRole('button', { name: 'إرسال الرسالة' }).click();
  await expect(page.locator('#box .m.user')).toHaveCount(2);
  await expect(page.locator('#box .m.user').last()).toContainText('اختبار الزر');
  await expect(page.getByRole('button', { name: 'إرسال الرسالة' })).toBeEnabled();
});

test('emergency network fallback renders a JSON API reply', async ({ page }) => {
  await page.route('**/api/chat', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ reply: 'رد اختبار الشبكة ✅', liveWeb: false })
    });
  });

  await bootBella(page);
  await page.evaluate(() => (window.openChat || window.__openBella)());
  await page.evaluate(() => window.__bellaEmergencySend('اختبار fallback'));

  await expect(page.locator('#box .m.user').last()).toContainText('اختبار fallback');
  await expect(page.locator('#box .m.bot').last()).toContainText('رد اختبار الشبكة');
});

test('mobile viewport keeps pinch zoom available', async ({ page }) => {
  await page.goto('/');
  const content = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(content).not.toContain('user-scalable=no');
  expect(content).not.toContain('maximum-scale=1.0');
});
