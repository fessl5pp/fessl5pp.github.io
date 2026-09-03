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

  await page.locator('.header-actions button[aria-label="فعاليات بيلا"]').click();
  await expect(page.locator('#bellaActivities')).toBeVisible();
  await expect(page.getByRole('button', { name: /رادار القز/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /تحدي كويتي/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /شنو بالصندوق/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /كمّل المثل/ })).toBeVisible();
  await page.locator('#bellaActivitiesClose').click();

  await expect(page.getByRole('button', { name: 'إرسال الرسالة' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('account access survives home cleanup and opens the account center', async ({ page }) => {
  const pageErrors = await bootBella(page);

  const account = page.locator('.hero-actions [data-bella-account-button]');
  await expect(account).toBeVisible();
  await expect(account).toContainText(/الحساب|اختبار/);

  await page.evaluate(() => window.BellaUI?.organizeHomeActions?.());
  await expect(page.locator('.hero-actions [data-bella-account-button]')).toHaveCount(1);
  await expect(account).toBeVisible();

  await account.click();
  await expect(page.locator('#bellaAccountModal')).toBeVisible();
  await page.locator('#bellaAccountModal').evaluate(node => node.remove());

  await page.evaluate(() => window.openBellaSettings?.());
  await expect(page.locator('#bellaAccountSettings')).toBeVisible();
  await expect(page.locator('#bellaSettingsAdmin')).toBeHidden();

  expect(pageErrors).toEqual([]);
});

test('Bella visual identity renders and follows mood classes', async ({ page }) => {
  const pageErrors = await bootBella(page);

  await expect(page.locator('#heroAvatar .bella-face')).toHaveCount(1);
  await expect(page.locator('#chatAvatar .bella-face')).toHaveCount(1);
  await expect(page.locator('#heroAvatar .bella-kuwait-mark')).toHaveCount(1);
  await expect(page.locator('#chatAvatar')).toHaveAttribute('role', 'img');

  await page.evaluate(() => {
    const avatar = document.getElementById('chatAvatar');
    avatar.classList.remove('mood-angry', 'mood-cute', 'mood-happy', 'mood-chill');
    avatar.classList.add('mood-cute');
  });

  await expect(page.locator('#chatAvatar')).toHaveAttribute('data-bella-mood', 'cute');
  await expect(page.locator('#chatAvatar')).toHaveAttribute('aria-label', /دلّوعة/);
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