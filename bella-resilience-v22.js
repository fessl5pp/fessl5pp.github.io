(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const DEVICE_KEY = "bella_rollout_subject_v21";
  const RELEASE = "v22";
  const REFRESH_MS = 60 * 1000;
  const REPORT_COOLDOWN_MS = 60 * 1000;
  const SAFE_BLOCKED = new Set([
    "leaderboard", "content_ai", "wisdom_game", "proverb_game", "rumor_list",
    "box_game", "kuwait_quiz", "voice", "ai_activities", "moments", "live_web"
  ]);

  let state = {
    safeMode: { enabled: false, publicMessage: "", revision: 1 },
    experiment: {},
    telemetry: { enabled: true, samplePercent: 50 }
  };
  let loading = false;
  let lastRefresh = 0;
  let previousSafeMode = false;
  const reported = new Map();

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function token() {
    return String(session()?.access_token || "");
  }

  function subject() {
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

  function hash32(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function fingerprint(parts) {
    return `v22-${hash32(parts.filter(Boolean).join("|")).toString(16).padStart(8, "0")}`;
  }

  function sourceName(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.pathname.split("/").filter(Boolean).pop() || url.pathname || "page";
    } catch {
      return String(value || "").split("/").pop().slice(0, 100) || "unknown";
    }
  }

  function snapshot() {
    return {
      safeMode: { ...state.safeMode },
      experiment: { ...state.experiment },
      telemetry: { ...state.telemetry },
      subject: subject()
    };
  }

  function sampled() {
    if (!state.telemetry.enabled) return false;
    const pct = Math.max(0, Math.min(100, Number(state.telemetry.samplePercent) || 0));
    return (hash32(`${subject()}:telemetry`) % 100) < pct;
  }

  async function publicRpc(name, payload = {}) {
    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    if (token()) headers.Authorization = `Bearer ${token()}`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `${name} HTTP ${response.status}`);
    return Array.isArray(data) ? data[0] || {} : data || {};
  }

  async function report(eventType, module, detail = {}, statusCode = null, customFingerprint = "") {
    if (!sampled()) return false;
    const fp = customFingerprint || fingerprint([
      eventType,
      module,
      detail?.name,
      detail?.phase,
      detail?.code,
      detail?.source,
      statusCode
    ]);
    const now = Date.now();
    if (now - (reported.get(fp) || 0) < REPORT_COOLDOWN_MS) return false;
    reported.set(fp, now);

    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    if (token()) headers.Authorization = `Bearer ${token()}`;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bella_record_client_event_v22`, {
        method: "POST",
        headers,
        keepalive: true,
        body: JSON.stringify({
          p_event_type: eventType,
          p_module: String(module || "").slice(0, 100),
          p_fingerprint: fp,
          p_release: RELEASE,
          p_route: `${location.pathname}${location.search}`.slice(0, 160),
          p_status_code: Number.isFinite(Number(statusCode)) ? Number(statusCode) : null,
          p_detail: {
            name: String(detail?.name || "").slice(0, 80),
            phase: String(detail?.phase || "").slice(0, 80),
            code: String(detail?.code || "").slice(0, 80),
            source: String(detail?.source || "").slice(0, 120),
            method: String(detail?.method || "").slice(0, 16),
            kind: String(detail?.kind || "").slice(0, 48),
            online: navigator.onLine,
            visibility: document.visibilityState
          }
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  function safeMessage() {
    return state.safeMode.publicMessage || "وضع الاستقرار مفعّل مؤقتًا؛ بعض الميزات الثانوية متوقفة.";
  }

  function toast(text) {
    try { window.showToast?.(text); } catch {}
  }

  function safeBlocked(key) {
    return state.safeMode.enabled && SAFE_BLOCKED.has(key);
  }

  function wrap(name, key) {
    const fn = window[name];
    if (typeof fn !== "function") return false;
    if (fn.__bellaResilienceV22Key === key) return true;
    const original = fn.__bellaResilienceV22Original || fn;
    const guarded = function (...args) {
      if (safeBlocked(key)) {
        toast(safeMessage());
        return false;
      }
      return original.apply(this, args);
    };
    guarded.__bellaResilienceV22Key = key;
    guarded.__bellaResilienceV22Original = original;
    window[name] = guarded;
    return true;
  }

  function installSafeGuards() {
    wrap("openBellaActivities", "content_ai");
    wrap("openDira", "live_web");
    wrap("dailyWisdom", "wisdom_game");
    wrap("startProverbGame", "proverb_game");
    wrap("openBellaRumors", "rumor_list");
    wrap("openBellaRumorList", "rumor_list");
    wrap("startBoxGame", "box_game");
    wrap("startKuwaitiChallenge", "kuwait_quiz");
    wrap("openBellaGameLeaderboard", "leaderboard");
  }

  function renderBanner() {
    const id = "bellaSafeModeV22";
    let banner = document.getElementById(id);
    if (!state.safeMode.enabled) {
      banner?.remove();
      return;
    }
    if (!banner) {
      banner = document.createElement("div");
      banner.id = id;
      banner.setAttribute("role", "status");
      banner.style.cssText = "margin:0 12px 8px;padding:8px 10px;border:1px solid rgba(255,190,70,.24);border-radius:12px;background:rgba(130,85,10,.14);color:#ffd98a;font-size:11px;font-weight:850;text-align:center;line-height:1.55";
      const inputArea = document.querySelector(".input-area");
      if (inputArea) inputArea.insertAdjacentElement("beforebegin", banner);
      else document.body?.prepend(banner);
    }
    banner.textContent = safeMessage();
  }

  function applySafeMode() {
    installSafeGuards();
    renderBanner();

    if (state.safeMode.enabled) {
      try { window.BellaMoments?.setEnabled?.(false); } catch {}
      try { window.BellaVoice?.stop?.(); } catch {}
    } else if (previousSafeMode) {
      try { window.BellaFeatureControlsV3?.refresh?.(true); } catch {}
    }

    const voice = document.getElementById("bellaVoiceToggle");
    if (voice && state.safeMode.enabled) {
      voice.disabled = true;
      voice.title = safeMessage();
    }
    document.querySelectorAll("[data-bella-ai-activity]").forEach(btn => {
      if (!state.safeMode.enabled) return;
      btn.disabled = true;
      btn.title = safeMessage();
    });

    previousSafeMode = state.safeMode.enabled;
  }

  async function fetchState() {
    const row = await publicRpc("bella_public_resilience_v22", { p_subject: subject() });
    const safe = row.safe_mode && typeof row.safe_mode === "object" ? row.safe_mode : {};
    const experiment = row.experiment && typeof row.experiment === "object" ? row.experiment : {};
    const telemetry = row.telemetry && typeof row.telemetry === "object" ? row.telemetry : {};
    state = {
      safeMode: {
        enabled: safe.enabled === true,
        publicMessage: String(safe.public_message || ""),
        revision: Math.max(1, Number(safe.revision) || 1)
      },
      experiment: {
        key: String(experiment.key || ""),
        label: String(experiment.label || ""),
        variant: ["a", "b", "off"].includes(experiment.variant) ? experiment.variant : "off",
        revision: Math.max(0, Number(experiment.revision) || 0),
        audiencePercent: Math.max(0, Math.min(100, Number(experiment.audience_percent) || 0)),
        variantBPercent: Math.max(0, Math.min(100, Number(experiment.variant_b_percent) || 0))
      },
      telemetry: {
        enabled: telemetry.enabled !== false,
        samplePercent: Math.max(0, Math.min(100, Number(telemetry.sample_percent) || 0))
      }
    };
    return state;
  }

  async function refresh(force = false) {
    if (loading) return snapshot();
    if (!force && Date.now() - lastRefresh < 15000) return snapshot();
    loading = true;
    try {
      await fetchState();
      lastRefresh = Date.now();
      applySafeMode();
      const detail = snapshot();
      window.dispatchEvent(new CustomEvent("bella:resilience-v22", { detail }));
    } catch (error) {
      console.warn("Bella Resilience v22 config unavailable:", error?.message || error);
      report("api_error", "bella-resilience-v22.js", { name: error?.name || "Error", phase: "config", code: "RESILIENCE_CONFIG" });
      applySafeMode();
    } finally {
      loading = false;
    }
    return snapshot();
  }

  function installTelemetry() {
    window.addEventListener("error", event => {
      const target = event.target;
      if (target && target !== window && target instanceof Element) {
        const src = target.getAttribute?.("src") || target.getAttribute?.("href") || "";
        if (src) {
          report("resource_error", sourceName(src), { phase: "resource", source: sourceName(src), name: target.tagName || "resource" });
          return;
        }
      }
      const error = event.error;
      report("runtime_error", sourceName(event.filename || "window"), {
        name: error?.name || "Error",
        phase: "window",
        source: sourceName(event.filename || "window")
      });
    }, true);

    window.addEventListener("unhandledrejection", event => {
      const reason = event.reason;
      report("runtime_error", "promise", { name: reason?.name || "UnhandledRejection", phase: "promise" });
    });

    window.addEventListener("offline", () => {
      report("network_error", "browser", { name: "Offline", phase: "connectivity", code: "OFFLINE" });
    });

    setTimeout(() => {
      window.__bellaCoreBoot?.catch?.(error => {
        report("boot_error", "app.js", { name: error?.name || "BootError", phase: "core" });
      });
      window.__bellaAdminBoot?.catch?.(error => {
        report("boot_error", "app.js", { name: error?.name || "BootError", phase: "deferred" });
      });
    }, 0);
  }

  function installFetchObserver() {
    if (window.__bellaResilienceFetchV22) return;
    window.__bellaResilienceFetchV22 = true;
    const baseFetch = window.fetch.bind(window);
    window.fetch = async function bellaResilienceFetch(input, init = {}) {
      const rawUrl = typeof input === "string" ? input : input?.url || "";
      const isApi = rawUrl.startsWith("/api/") || rawUrl.startsWith(`${location.origin}/api/`);
      try {
        const response = await baseFetch(input, init);
        if (isApi && !response.ok) {
          report("api_error", sourceName(rawUrl), {
            name: "HTTPError",
            phase: "fetch",
            code: String(response.status),
            source: sourceName(rawUrl),
            method: String(init?.method || "GET").toUpperCase()
          }, response.status);
        }
        return response;
      } catch (error) {
        if (isApi) {
          report("network_error", sourceName(rawUrl), {
            name: error?.name || "NetworkError",
            phase: "fetch",
            source: sourceName(rawUrl),
            method: String(init?.method || "GET").toUpperCase()
          });
        }
        throw error;
      }
    };
  }

  function observe() {
    installTelemetry();
    installFetchObserver();
    installSafeGuards();
    refresh(true);

    const observer = new MutationObserver(() => {
      installSafeGuards();
      applySafeMode();
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });

    setInterval(() => refresh(false), REFRESH_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(false); });
    window.addEventListener("bella:account-session", () => refresh(true));
    window.addEventListener("storage", event => {
      if (event.key === SESSION_KEY || event.key === DEVICE_KEY) refresh(true);
    });
  }

  window.BellaResilienceV22 = Object.freeze({
    refresh,
    snapshot,
    safeMode: () => state.safeMode.enabled,
    safeBlocked,
    report
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})();
