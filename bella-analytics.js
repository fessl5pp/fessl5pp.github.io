(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const START_KEY = "bella_analytics_session_v1";
  const SESSION_WINDOW_MS = 30 * 60 * 1000;

  function readJson(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function cleanFeature(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  function currentSession() {
    const session = readJson(SESSION_KEY, null);
    return session?.access_token ? session : null;
  }

  function jwtSubject(token) {
    try {
      const part = String(token || "").split(".")[1];
      if (!part) return "";
      const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
      return String(JSON.parse(atob(padded))?.sub || "");
    } catch { return ""; }
  }

  async function track(eventType, feature = "") {
    const session = currentSession();
    if (!session?.access_token || !window.BellaAccount?.isSignedIn?.()) return false;
    const type = String(eventType || "").toLowerCase().trim();
    if (!["session_start", "chat_sent", "live_web", "feature"].includes(type)) return false;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_bella_event`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_event_type: type, p_feature: cleanFeature(feature) || null })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  function feature(name) {
    return track("feature", name);
  }

  async function sessionStart(force = false) {
    const session = currentSession();
    if (!session?.access_token || !window.BellaAccount?.isSignedIn?.()) return false;
    const userId = jwtSubject(session.access_token);
    if (!userId) return false;
    const previous = readJson(START_KEY, null);
    const now = Date.now();
    if (!force && previous?.user_id === userId && now - Number(previous?.at || 0) < SESSION_WINDOW_MS) return false;
    const ok = await track("session_start", "app");
    if (ok) writeJson(START_KEY, { user_id: userId, at: now });
    return ok;
  }

  function featureFromButton(button) {
    const text = String(button?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const id = String(button?.id || "").toLowerCase();
    if (text.includes("شكو ماكو") || id.includes("dira")) return "dira";
    if (text.includes("رادار القز") || text.includes("الرادار") || id.includes("radar")) return "radar";
    if (text.includes("شنو بالصندوق") || id.includes("boxgame")) return "game-box";
    if (text.includes("كمّل المثل") || text.includes("كمل المثل") || id.includes("proverb")) return "game-proverb";
    if (text.includes("حكمة") || id.includes("wisdom")) return "wisdom";
    if (text.includes("فزعة") || id.includes("fazaa")) return "fazaa";
    if (text.includes("شارك") || text.includes("مشاركة") || id.includes("share")) return "share";
    if (text.includes("ذاكرة") || id.includes("memory")) return "memory";
    if (text.includes("الإعدادات") || text.includes("اعدادات") || id.includes("settings")) return "settings";
    return "";
  }

  function installDomTracking() {
    if (document.documentElement.dataset.bellaAnalyticsObserved === "1") return;
    document.documentElement.dataset.bellaAnalyticsObserved = "1";

    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button,[role='button']");
      if (!button) return;
      const name = featureFromButton(button);
      if (name) feature(name);
    }, { capture: true, passive: true });

    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const added of record.addedNodes) {
          if (!(added instanceof HTMLElement)) continue;

          const userNodes = [];
          if (added.matches?.("#box .m.user")) userNodes.push(added);
          added.querySelectorAll?.("#box .m.user").forEach(node => userNodes.push(node));
          for (const node of userNodes) {
            if (node.dataset.bellaAnalyticsChat === "1") continue;
            node.dataset.bellaAnalyticsChat = "1";
            track("chat_sent", "chat");
          }

          const liveRows = [];
          if (added.classList?.contains("bella-live-sources")) liveRows.push(added);
          added.querySelectorAll?.(".bella-live-sources").forEach(node => liveRows.push(node));
          for (const row of liveRows) {
            const bot = row.closest(".m.bot") || row.parentElement;
            if (bot?.dataset?.bellaAnalyticsLive === "1") continue;
            if (bot?.dataset) bot.dataset.bellaAnalyticsLive = "1";
            track("live_web", "chat-web");
          }
        }
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  }

  async function start() {
    installDomTracking();
    try { await Promise.resolve(window.__bellaAccountReady); } catch {}
    await sessionStart(false);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) sessionStart(false);
    });
  }

  window.BellaAnalytics = Object.freeze({ track, feature, sessionStart, installDomTracking });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();