(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const VNEXT_KEY = "bella_vnext_v2";
  let installed = false;

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function uniqueMemory(items) {
    const seen = new Set();
    const out = [];
    for (const item of Array.isArray(items) ? items : []) {
      const clean = String(item || "").replace(/\s+/g, " ").trim().slice(0, 160);
      const norm = clean.toLowerCase();
      if (!clean || seen.has(norm)) continue;
      seen.add(norm);
      out.push(clean);
    }
    return out.slice(-12);
  }

  function jwtSubject(token) {
    try {
      const part = String(token || "").split(".")[1];
      if (!part) return "";
      const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((part.length + 3) % 4);
      return String(JSON.parse(atob(padded))?.sub || "");
    } catch { return ""; }
  }

  async function syncExactMemory() {
    const session = readJson(SESSION_KEY, null);
    const token = session?.access_token || "";
    const userId = jwtSubject(token);
    if (!token || !userId) return false;

    const memory = uniqueMemory(readJson(VNEXT_KEY, {})?.memory);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bella_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({ memory })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  function install() {
    if (installed || typeof window.openMemoryPanel !== "function") return false;
    installed = true;
    const original = window.openMemoryPanel;

    window.openMemoryPanel = function accountAwareMemoryPanel() {
      const result = original.apply(this, arguments);
      const modal = document.getElementById("bellaMemory");
      if (modal && modal.dataset.accountMemorySync !== "1") {
        modal.dataset.accountMemorySync = "1";
        modal.addEventListener("click", event => {
          const target = event.target instanceof Element ? event.target : null;
          if (!target?.closest("[data-del],#clearBellaMemory")) return;
          setTimeout(() => syncExactMemory(), 80);
        });
      }
      return result;
    };
    return true;
  }

  async function finishEmailConfirmation() {
    const url = new URL(location.href);
    if (url.searchParams.get("account") !== "confirmed") return;
    try { await Promise.resolve(window.__bellaAccountReady); } catch {}
    if (!window.BellaAccount?.isSignedIn?.()) return;
    url.searchParams.delete("account");
    url.hash = "";
    location.replace(`${url.pathname}${url.search}` || "/");
  }

  window.BellaAccountMemory = Object.freeze({ syncExactMemory, install });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(install, 0);
      finishEmailConfirmation();
    }, { once: true });
  } else {
    setTimeout(install, 0);
    finishEmailConfirmation();
  }
})();
