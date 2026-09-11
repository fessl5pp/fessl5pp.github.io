(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  let currentSeason = {};
  let myBadges = [];

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function token() {
    return String(session()?.access_token || "");
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[c]);
  }

  async function rpc(name, payload = {}, auth = false) {
    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    if ((auth || token()) && token()) headers.Authorization = `Bearer ${token()}`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
    return data;
  }

  function styles() {
    if (document.getElementById("bellaSeasonV20Styles")) return;
    const style = document.createElement("style");
    style.id = "bellaSeasonV20Styles";
    style.textContent = `
      .bella-season-v20-entry{margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.035);display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:right}
      .bella-season-v20-entry b,.bella-season-v20-entry small{display:block}.bella-season-v20-entry small{color:var(--muted);font-size:10px;margin-top:3px}
      .bella-season-v20-entry button{border:0;border-radius:11px;padding:9px 11px;background:var(--accent);color:#fff;font:inherit;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}
      .bella-season-v20-card{width:min(720px,94vw)!important;max-height:88dvh;overflow:auto;text-align:right}
      .bella-season-v20-list{display:grid;gap:7px;margin-top:12px}.bella-season-v20-row{display:grid;grid-template-columns:48px 1fr auto;gap:9px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.025)}
      .bella-season-v20-place{font-size:20px;font-weight:950;text-align:center}.bella-season-v20-row small{color:var(--muted);font-size:9px}.bella-season-v20-score{font-weight:950}
      .bella-season-v20-badges{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.bella-season-v20-badge{padding:7px 9px;border:1px solid rgba(255,210,90,.18);border-radius:999px;background:rgba(255,210,90,.06);font-size:10px;font-weight:850}
      .bella-season-v20-state{margin-top:10px;color:var(--muted);font-size:10px}
      @media(max-width:520px){.bella-season-v20-entry{align-items:flex-start;flex-direction:column}.bella-season-v20-row{grid-template-columns:40px 1fr auto}}
    `;
    document.head.appendChild(style);
  }

  function placeIcon(place) {
    return Number(place) === 1 ? "🥇" : Number(place) === 2 ? "🥈" : Number(place) === 3 ? "🥉" : `#${place}`;
  }

  function ensureEntry() {
    styles();
    const host = document.querySelector(".badges-wrap");
    if (!host) return null;
    let entry = document.getElementById("bellaSeasonV20Entry");
    if (!entry) {
      entry = document.createElement("div");
      entry.id = "bellaSeasonV20Entry";
      entry.className = "bella-season-v20-entry";
      entry.innerHTML = `<div><b data-season-name>موسم بيلا 🏆</b><small data-season-sub>ترتيب موسمي بدون ما تضيع نقاط العمر.</small></div><button type="button">الترتيب الموسمي</button>`;
      entry.querySelector("button").onclick = openSeason;
      host.appendChild(entry);
    }
    const name = entry.querySelector("[data-season-name]");
    if (name) name.textContent = `${currentSeason?.name || "موسم بيلا"} 🏆`;
    const sub = entry.querySelector("[data-season-sub]");
    const top = myBadges[0];
    if (sub) sub.textContent = top ? `لقبك الحالي: ${top.icon || "🏅"} ${top.title}` : "ترتيب موسمي بدون ما تضيع نقاط العمر.";
    return entry;
  }

  async function refreshMeta() {
    try {
      const snap = window.BellaFeatureControlsV3?.snapshot?.();
      if (snap?.currentSeason) currentSeason = snap.currentSeason;
      const ops = await rpc("bella_public_ops_v20");
      const row = Array.isArray(ops) ? ops[0] || {} : ops || {};
      if (row.current_season) currentSeason = row.current_season;
      if (token()) {
        try {
          const badges = await rpc("bella_my_badges_v20", {}, true);
          myBadges = Array.isArray(badges) ? badges : [];
        } catch {
          myBadges = [];
        }
      } else {
        myBadges = [];
      }
    } catch {}
    ensureEntry();
  }

  async function openSeason() {
    styles();
    document.getElementById("bellaSeasonV20Modal")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaSeasonV20Modal";
    modal.className = "vnext-modal";
    modal.innerHTML = `
      <div class="vnext-card bella-season-v20-card">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div><h2 style="margin:0" data-title>موسم بيلا 🏆</h2><p style="margin:5px 0;color:var(--muted);font-size:10px">النقاط الموسمية تتصفّر عند نهاية الموسم، لكن XP ونقاط العمر تبقى محفوظة.</p></div>
          <button class="vnext-ghost" data-close>✕</button>
        </div>
        <div class="bella-season-v20-badges" data-badges></div>
        <div class="bella-season-v20-state" data-state>جاري تحميل الترتيب…</div>
        <div class="bella-season-v20-list" data-list></div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    modal.querySelector("[data-close]").onclick = () => modal.remove();
    modal.querySelector("[data-title]").textContent = `${currentSeason?.name || "موسم بيلا"} 🏆`;

    const badgesHost = modal.querySelector("[data-badges]");
    if (myBadges.length) {
      badgesHost.innerHTML = myBadges.slice(0, 8).map(b => `<span class="bella-season-v20-badge">${esc(b.icon || "🏅")} ${esc(b.title)}</span>`).join("");
    } else {
      badgesHost.innerHTML = `<span class="bella-season-v20-badge">🏅 الألقاب تنفتح مع المواسم والإنجازات</span>`;
    }

    const state = modal.querySelector("[data-state]");
    const list = modal.querySelector("[data-list]");
    try {
      const rows = await rpc("bella_season_leaderboard_v20", { p_limit: 30 });
      const data = Array.isArray(rows) ? rows : [];
      list.innerHTML = data.map(row => `
        <div class="bella-season-v20-row">
          <div class="bella-season-v20-place">${esc(placeIcon(row.place))}</div>
          <div><b>${esc(row.display_name || "لاعب")}</b><small>الموسم الحالي</small></div>
          <div class="bella-season-v20-score">${Number(row.season_score || 0).toLocaleString("ar-KW")} نقطة</div>
        </div>`).join("");
      state.textContent = data.length ? `المتنافسين: ${data.length}` : "الموسم توه بادئ — أول نتيجة بتظهر هني.";
    } catch (error) {
      state.textContent = "تعذر تحميل الترتيب الموسمي الحين.";
    }
  }

  function boot() {
    ensureEntry();
    refreshMeta();
    window.addEventListener("bella:ops-v20", event => {
      currentSeason = event.detail?.currentSeason || currentSeason;
      refreshMeta();
    });
    window.addEventListener("storage", event => {
      if (event.key === SESSION_KEY) refreshMeta();
    });
  }

  window.BellaSeasonV20 = Object.freeze({ open: openSeason, refresh: refreshMeta });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();