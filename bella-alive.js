(() => {
  "use strict";

  const KEY = "bella_alive_v1";
  const MIN_AWAY = 6 * 60 * 60 * 1000;
  const IDLE_MS = 22 * 60 * 1000;
  let idleTimer = null;

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; }
    catch { return {}; }
  }
  function write(value) { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {} }

  function pick(items) { return items[Math.floor(Math.random() * items.length)] || ""; }

  function returnLine(awayMs, relationshipStage) {
    const close = relationshipStage === "close" || relationshipStage === "friends";
    if (awayMs >= 5 * 24 * 60 * 60 * 1000) return pick(close ? ["وينك من زمان", "توك تذكرني 😭", "ها رجعت أخيرًا"] : ["ها رجعت", "وين هالغيبه", "من زمان عنك"]);
    if (awayMs >= 24 * 60 * 60 * 1000) return pick(close ? ["وينك مختفي", "شدعوه وينك", "عبالي سحبت علي 😭"] : ["وينك مختفي", "ها رجعت", "وين هالغيبه"]);
    return pick(close ? ["وينك مختفي", "ها وينك", "توك ترجع 😭"] : ["ها رجعت", "وينك مختفي"]);
  }

  function show(text) {
    if (!text || document.hidden) return false;
    if (window.BellaMoments?.isEnabled?.() === false) return false;
    return window.BellaMoments?.showToast?.(text) || false;
  }

  function boot() {
    const saved = read();
    const now = Date.now();
    const previous = Number(saved.lastSeenAt || 0);
    const away = previous ? now - previous : 0;
    const relationship = window.BellaBrainV2?.relationshipSnapshot?.() || { stage: "new" };
    write({ ...saved, lastSeenAt: now, lastAliveAt: Number(saved.lastAliveAt || 0) });
    window.BellaBrainV2?.markVisit?.();

    if (away >= MIN_AWAY && now - Number(saved.lastAliveAt || 0) >= MIN_AWAY) {
      const text = returnLine(away, relationship.stage);
      setTimeout(() => {
        if (show(text)) write({ ...read(), lastSeenAt: Date.now(), lastAliveAt: Date.now() });
      }, 1600);
    }
    armIdle();
  }

  function armIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (document.hidden || window.BellaMoments?.isEnabled?.() === false) return;
      const relation = window.BellaBrainV2?.relationshipSnapshot?.()?.stage || "new";
      show(relation === "close" || relation === "friends" ? pick(["ها وين رحت", "سحبت علي ولا شنو 😭", "مختفي انت"]) : "ها وين رحت");
    }, IDLE_MS);
  }

  function touch() {
    const saved = read();
    write({ ...saved, lastSeenAt: Date.now() });
    armIdle();
  }

  ["pointerdown", "keydown", "touchstart"].forEach(type => window.addEventListener(type, touch, { passive: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) touch(); });
  window.addEventListener("pagehide", touch);

  window.BellaAlive = Object.freeze({ boot, touch, status: () => ({ ...read(), idleMs: IDLE_MS, minAwayMs: MIN_AWAY }) });

  const start = () => setTimeout(boot, 0);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
