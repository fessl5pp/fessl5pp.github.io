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

  async function start() {
    try { await Promise.resolve(window.__bellaAccountReady); } catch {}
    await sessionStart(false);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) sessionStart(false);
    });
  }

  window.BellaAnalytics = Object.freeze({ track, feature, sessionStart });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();