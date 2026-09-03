(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const REFRESH_MS = 5 * 60 * 1000;
  const defaults = Object.freeze({
    live_web_enabled: true,
    games_enabled: true,
    radar_enabled: true,
    maintenance_enabled: false,
    announcement: "",
    updated_at: null
  });

  let state = { ...defaults };
  let loading = false;
  let lastLoadedAt = 0;
  const wrapped = new Set();

  function normalize(data) {
    const row = Array.isArray(data) ? data[0] || {} : data || {};
    return {
      live_web_enabled: row.live_web_enabled !== false,
      games_enabled: row.games_enabled !== false,
      radar_enabled: row.radar_enabled !== false,
      maintenance_enabled: row.maintenance_enabled === true,
      announcement: String(row.announcement || "").trim().slice(0, 500),
      updated_at: row.updated_at || null
    };
  }

  function enabled(name) {
    const key = String(name || "").toLowerCase();
    if (key === "live_web" || key === "web") return state.live_web_enabled;
    if (key === "games" || key === "game") return state.games_enabled;
    if (key === "radar") return state.radar_enabled;
    if (key === "maintenance") return state.maintenance_enabled;
    return true;
  }

  function toast(text) {
    try { window.showToast?.(text); return; } catch {}
    try { window.showPopupCustom?.(text); } catch {}
  }

  function ensureBannerStyles() {
    if (document.getElementById("bellaRemoteConfigStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaRemoteConfigStyles";
    style.textContent = `
      .bella-system-banner{position:relative;z-index:30;margin:8px auto 0;width:min(920px,calc(100% - 20px));padding:9px 12px;border:1px solid rgba(255,255,255,.11);border-radius:13px;background:rgba(255,255,255,.06);backdrop-filter:blur(12px);font-size:11px;font-weight:800;line-height:1.6;text-align:center}
      .bella-system-banner[data-maintenance="1"]{border-color:rgba(255,190,80,.28);background:rgba(255,170,50,.09)}
    `;
    document.head.appendChild(style);
  }

  function renderBanner() {
    if (!document.body) return;
    ensureBannerStyles();
    let banner = document.getElementById("bellaSystemBanner");
    const text = state.maintenance_enabled
      ? "🛠️ بيلا تحت الصيانة مؤقتًا. مركز الحساب ومركز المالك يظلون متاحين."
      : state.announcement;
    if (!text) {
      banner?.remove();
      return;
    }
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "bellaSystemBanner";
      banner.className = "bella-system-banner";
      document.body.prepend(banner);
    }
    banner.dataset.maintenance = state.maintenance_enabled ? "1" : "0";
    banner.textContent = text;
  }

  function disabledMessage(feature) {
    if (feature === "games") return "الألعاب موقفها المالك مؤقتًا 🎮";
    if (feature === "radar") return "الرادار موقفه المالك مؤقتًا 📡";
    if (feature === "live_web") return "البحث الحي موقوف مؤقتًا 🔎";
    return "الميزة موقوفة مؤقتًا.";
  }

  function wrapFunction(name, feature, returnText = false) {
    if (wrapped.has(name)) return true;
    const base = window[name];
    if (typeof base !== "function") return false;
    const guarded = function bellaRemoteFeatureGuard(...args) {
      if (!enabled(feature)) {
        const message = disabledMessage(feature);
        if (returnText) return message;
        toast(message);
        return false;
      }
      return base.apply(this, args);
    };
    guarded.__bellaRemoteConfigWrapped = true;
    guarded.__bellaRemoteConfigOriginal = base;
    window[name] = guarded;
    wrapped.add(name);
    return true;
  }

  function installFeatureGuards() {
    wrapFunction("coffeeRadar", "radar", true);
    wrapFunction("socialRadarReply", "radar", true);
    wrapFunction("openRadarPlus", "radar", false);
    wrapFunction("startBoxGame", "games", false);
    wrapFunction("startProverbGame", "games", false);
  }

  async function refresh(force = false) {
    if (loading) return state;
    if (!force && Date.now() - lastLoadedAt < 15000) return state;
    loading = true;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bella_public_config`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: "{}"
      });
      if (!response.ok) throw new Error(`config HTTP ${response.status}`);
      state = normalize(await response.json().catch(() => null));
      lastLoadedAt = Date.now();
      renderBanner();
      installFeatureGuards();
      window.dispatchEvent(new CustomEvent("bella:config", { detail: { ...state } }));
    } catch (error) {
      console.warn("Bella public config unavailable:", error?.message || error);
      renderBanner();
      installFeatureGuards();
    } finally {
      loading = false;
    }
    return state;
  }

  function snapshot() { return { ...state }; }

  window.BellaConfig = Object.freeze({ enabled, refresh, snapshot, disabledMessage });

  const start = async () => {
    installFeatureGuards();
    await refresh(true);
    setInterval(() => refresh(false), REFRESH_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(false); });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
