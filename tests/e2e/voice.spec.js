const { test, expect } = require('@playwright/test');

async function bootBella(page) {
  await page.addInitScript(() => {
    localStorage.setItem('bella_vnext_v2', JSON.stringify({
      version: 2,
      onboarded: true,
      name: 'اختبار',
      memory: [],
      recentReplies: [],
      recentUser: [],
      mood: { angry: 0, cute: 0, happy: 0 },
      stats: { messages: 0, totalChars: 0, humor: 0, warmth: 0, radar: 0, dira: 0, gameWins: 0 },
      voiceEnabled: false,
      sfxEnabled: false
    }));
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__bellaBoot);
  await page.evaluate(() => window.__bellaBoot);
  await page.waitForFunction(() => !!window.BellaVoice);
  await page.evaluate(() => (window.openChat || window.__openBella)());
  await expect(page.locator('#win')).toHaveClass(/active/);
}

test('Bella server voice loads and toggle persists independently of legacy device voice', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await bootBella(page);

  await expect.poll(() => page.evaluate(() => window.BellaVoice?.provider)).toBe('gpt-4o-mini-tts');
  const internalToggle = page.locator('#bellaVoiceToggle');
  await expect(internalToggle).toHaveAttribute('aria-label', 'تشغيل صوت بيلا');

  await page.getByRole('button', { name: 'إعدادات بيلا' }).click();
  await expect(page.locator('#bellaSettings')).toBeVisible();
  const voiceSettingsButton = page.locator('#bellaVoiceSettings');
  await expect(voiceSettingsButton).toBeVisible();

  await voiceSettingsButton.click();
  await expect.poll(() => page.evaluate(() => window.BellaVoice?.enabled)).toBe(true);
  await expect(internalToggle).toHaveAttribute('aria-label', 'إيقاف صوت بيلا');

  const saved = await page.evaluate(() => ({
    voice: JSON.parse(localStorage.getItem('bella_voice_v1') || '{}'),
    legacy: JSON.parse(localStorage.getItem('bella_vnext_v2') || '{}')
  }));
  expect(saved.voice.enabled).toBe(true);
  expect(saved.legacy.voiceEnabled).toBe(false);
  expect(errors).toEqual([]);
});