(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const DEVICE_KEY = "bella_rollout_subject_v21";
  const DEFAULT_FLAGS = {
    leaderboard: true,
    content_ai: true,
    wisdom_game: true,
    proverb_game: true,
    rumor_list: true,
    box_game: true,
    kuwait_quiz: true,
    chat_ai: true,
    voice: true,
    ai_activities: true,
    moments: true
  };

  let flags = Object.fromEntries(Object.entries(DEFAULT_FLAGS).map(([key, effective]) => [key, { mode: "on", baseMode: "on", effective, rolloutPercent: 0 }]));
  let personaStyle = { enabled: true, brevity: "medium", humor: 1, warmth: 1, directness: .35, dialect: .8, revision: 1 };
  let currentSeason = {};
  let loading = false;
  let lastRefresh = 0;
  const wrapped = new Map();

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function token() {
    return String(session()?.access_token || "");
  }

  function rolloutSubject() {
    try {
      let value = localStorage.getItem(DEVICE_KEY);
      if (!value) {
        value = globalThis.crypto?.randomUUID?.() || `bella-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(DEVICE_KEY, value);
      }
      return String(value).slice(0, 120);
    } catch {
      return "bella-anon";
    }
  }

  function toast(text) {
    try { window.showToast?.(text); } catch {}
  }

  function feature(key) {
    return flags[key] || { mode: "on", baseMode: "on", effective: true, rolloutPercent: 0 };
  }

  function enabled(key) {
    return feature(key).effective !== false;
  }

  function message(key) {
    const f = feature(key);
    const suffix = f.mode === "beta"
      ? ` تحت التجربة حاليًا${f.rolloutPercent ? ` (${f.rolloutPercent}% من المستخدمين)` : ""} 🧪`
      : " موقفها المالك مؤقتًا.";
    const names = {
      leaderboard: "لوحة الترتيب",
      content_ai: "AI للمحتوى",
      wisdom_game: "حكمة اليوم",
      proverb_game: "كمّل المثل",
      rumor_list: "قائمة الإشاعات",
      box_game: "شنو بالصندوق",
      kuwait_quiz: "التحدي الكويتي",
      chat_ai: "شات AI",
      voice: "صوت بيلا",
      ai_activities: "تحديات AI",
      moments: "لقطات بيلا"
    };
    return `${names[key] || "الميزة"}${suffix}`;
  }

  function wrap(name, key) {
    const fn = window[name];
    if (typeof fn !== "function") return false;
    if (fn.__bellaFeatureV3Key === key) return true;

    const original = fn.__bellaFeatureV3Original || fn;
    const guarded = function (...args) {
      if (!enabled(key)) {
        toast(message(key));
        return false;
      }
      return original.apply(this, args);
    };
    guarded.__bellaFeatureV3Key = key;
    guarded.__bellaFeatureV3Original = original;
    window[name] = guarded;
    wrapped.set(name, original);
    return true;
  }

  function installGuards() {
    wrap("dailyWisdom", "wisdom_game");
    wrap("startProverbGame", "proverb_game");
    wrap("openBellaRumors", "rumor_list");
    wrap("openBellaRumorList", "rumor_list");
    wrap("startBoxGame", "box_game");
    wrap("startKuwaitiChallenge", "kuwait_quiz");
    wrap("openBellaGameLeaderboard", "leaderboard");
    wrap("__bellaSubmit", "chat_ai");
  }

  function applyGlobalControls() {
    try { window.BellaMoments?.setEnabled?.(enabled("moments")); } catch {}

    const voice = document.getElementById("bellaVoiceToggle");
    if (voice) {
      voice.disabled = !enabled("voice");
      voice.title = !enabled("voice") ? message("voice") : "";
    }
    if (!enabled("voice")) {
      try { window.BellaVoice?.stop?.(); } catch {}
    }

    document.querySelectorAll("[data-bella-ai-activity]").forEach(btn => {
      btn.disabled = !enabled("ai_activities");
      btn.title = !enabled("ai_activities") ? message("ai_activities") : "";
    });

    const root = document.getElementById("bellaActivities");
    if (!root) return;

    const direct = { rumors: "rumor_list", leader: "leaderboard" };
    root.querySelectorAll("[data-game-center]").forEach(btn => {
      const key = direct[btn.dataset.gameCenter];
      if (!key) return;
      btn.disabled = !enabled(key);
      btn.title = !enabled(key) ? message(key) : "";
    });

    const textMap = [
      ["حكمة اليوم", "wisdom_game"],
      ["أكمل المثل", "proverb_game"],
      ["كمّل المثل", "proverb_game"],
      ["شنو بالصندوق", "box_game"],
      ["تحدي كويتي", "kuwait_quiz"]
    ];
    root.querySelectorAll("button").forEach(btn => {
      const text = (btn.textContent || "").trim();
      for (const [needle, key] of textMap) {
        if (!text.includes(needle)) continue;
        btn.disabled = !enabled(key);
        btn.title = !enabled(key) ? message(key) : "";
      }
    });
  }

  async function fetchOps() {
    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    if (token()) headers.Authorization = `Bearer ${token()}`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bella_public_ops_v21`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_subject: rolloutSubject() })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `Ops v21 ${response.status}`);
    return Array.isArray(data) ? data[0] || {} : data || {};
  }

  async function refresh(force = false) {
    if (loading) return snapshot();
    if (!force && Date.now() - lastRefresh < 15000) return snapshot();
    loading = true;

    try {
      const row = await fetchOps();
      const remote = row.feature_flags && typeof row.feature_flags === "object" ? row.feature_flags : {};
      flags = Object.fromEntries(Object.keys(DEFAULT_FLAGS).map(key => {
        const item = remote[key] || {};
        return [key, {
          mode: ["off", "beta", "on"].includes(item.mode) ? item.mode : "on",
          baseMode: ["off", "beta", "on"].includes(item.base_mode) ? item.base_mode : (["off", "beta", "on"].includes(item.mode) ? item.mode : "on"),
          effective: item.effective !== false,
          label: String(item.label || ""),
          note: String(item.note || ""),
          rolloutPercent: Math.max(0, Math.min(100, Number(item.rollout_percent) || 0)),
          scheduledMode: ["off", "beta", "on"].includes(item.scheduled_mode) ? item.scheduled_mode : null,
          scheduledStart: item.scheduled_start || null,
          scheduledEnd: item.scheduled_end || null,
          rolloutBucket: Number.isFinite(Number(item.rollout_bucket)) ? Number(item.rollout_bucket) : null
        }];
      }));
      if (row.persona_style && typeof row.persona_style === "object") personaStyle = { ...personaStyle, ...row.persona_style };
      currentSeason = row.current_season && typeof row.current_season === "object" ? row.current_season : {};
      lastRefresh = Date.now();
      installGuards();
      applyGlobalControls();
      const detail = snapshot();
      window.dispatchEvent(new CustomEvent("bella:ops-v21", { detail }));
      window.dispatchEvent(new CustomEvent("bella:ops-v20", { detail }));
    } catch (error) {
      console.warn("Bella Ops v21 public config unavailable:", error?.message || error);
      installGuards();
      applyGlobalControls();
    } finally {
      loading = false;
    }
    return snapshot();
  }

  function snapshot() {
    return {
      flags: JSON.parse(JSON.stringify(flags)),
      personaStyle: { ...personaStyle },
      currentSeason: { ...currentSeason },
      rolloutSubject: rolloutSubject()
    };
  }

  function installFetchEnricher() {
    if (window.__bellaOpsFetchV20) return;
    window.__bellaOpsFetchV20 = true;
    const baseFetch = window.fetch.bind(window);

    window.fetch = async function bellaOpsFetch(input, init = {}) {
      const url = typeof input === "string" ? input : input?.url || "";
      if (!url.startsWith("/api/chat") || typeof init?.body !== "string") return baseFetch(input, init);

      if (!enabled("chat_ai")) {
        return new Response(JSON.stringify({ error: message("chat_ai"), control: feature("chat_ai").mode }), {
          status: 503,
          headers: { "Content-Type": "application/json", "X-Bella-Feature-Flag": feature("chat_ai").mode }
        });
      }

      try {
        const body = JSON.parse(init.body);
        if (personaStyle?.enabled !== false) {
          body.styleProfile = {
            ...(body.styleProfile || {}),
            brevity: ["short", "medium", "long"].includes(personaStyle.brevity) ? personaStyle.brevity : "medium",
            humor: Math.max(0, Math.min(3, Number(personaStyle.humor) || 0)),
            warmth: Math.max(0, Math.min(3, Number(personaStyle.warmth) || 0)),
            directness: Math.max(0, Math.min(1, Number(personaStyle.directness) || 0)),
            dialect: Math.max(0, Math.min(1, Number(personaStyle.dialect) || 0))
          };
          body.personaRevision = Math.max(1, Number(personaStyle.revision) || 1);
        }
        body.rolloutSubject = rolloutSubject();
        return baseFetch(input, { ...init, body: JSON.stringify(body) });
      } catch {
        return baseFetch(input, init);
      }
    };
  }

  function observe() {
    installFetchEnricher();
    installGuards();
    applyGlobalControls();

    const observer = new MutationObserver(() => {
      installGuards();
      applyGlobalControls();
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });

    refresh(true);
    setInterval(() => refresh(false), 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(false); });
    window.addEventListener("bella:account-session", () => refresh(true));
    window.addEventListener("storage", event => {
      if (event.key === SESSION_KEY || event.key === DEVICE_KEY) refresh(true);
    });
  }

  window.BellaFeatureControlsV3 = Object.freeze({ refresh, enabled, feature, message, snapshot });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})();