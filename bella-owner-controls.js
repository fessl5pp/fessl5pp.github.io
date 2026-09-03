(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  let saving = false;

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  async function rpc(name, payload = {}) {
    const token = readSession()?.access_token || "";
    if (!token) throw new Error("owner session unavailable");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return Array.isArray(data) ? data[0] || {} : data || {};
  }

  function ensureStyles() {
    if (document.getElementById("bellaOwnerControlsStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaOwnerControlsStyles";
    style.textContent = `
      .bella-owner-controls{margin:14px 0;padding:13px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.035);text-align:right}
      .bella-owner-controls h3{margin:0 0 4px;font-size:14px}.bella-owner-controls>p{margin:0 0 12px;color:var(--muted);font-size:10px;line-height:1.7}
      .bella-owner-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .bella-owner-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.035)}
      .bella-owner-toggle span{display:grid;gap:2px}.bella-owner-toggle b{font-size:11px}.bella-owner-toggle small{font-size:9px;color:var(--muted)}
      .bella-owner-toggle input{width:18px;height:18px;accent-color:var(--accent)}
      .bella-owner-field{display:grid;gap:6px;margin-top:10px}.bella-owner-field label{font-size:10px;font-weight:900}
      .bella-owner-field input,.bella-owner-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.05);color:inherit;padding:10px 11px;font:inherit;outline:none}
      .bella-owner-field textarea{resize:vertical;min-height:72px;line-height:1.6}
      .bella-owner-ai-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}
      .bella-owner-ai-status div{padding:9px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}
      .bella-owner-ai-status small,.bella-owner-ai-status b{display:block}.bella-owner-ai-status small{font-size:9px;color:var(--muted)}.bella-owner-ai-status b{margin-top:2px;font-size:13px}
      .bella-owner-controls-actions{display:flex;gap:8px;align-items:center;margin-top:11px}.bella-owner-controls-actions button{border:0;border-radius:12px;padding:10px 13px;background:var(--accent);color:#fff;font:inherit;font-weight:900;cursor:pointer}.bella-owner-controls-actions button:disabled{opacity:.55;cursor:wait}.bella-owner-controls-state{font-size:10px;color:var(--muted)}
      @media(max-width:620px){.bella-owner-control-grid{grid-template-columns:1fr}.bella-owner-ai-status{grid-template-columns:1fr 1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function toggleRow(title, note, key) {
    const label = document.createElement("label");
    label.className = "bella-owner-toggle";
    const text = document.createElement("span");
    const strong = document.createElement("b");
    strong.textContent = title;
    const small = document.createElement("small");
    small.textContent = note;
    text.append(strong, small);
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.ownerConfig = key;
    label.append(text, input);
    return label;
  }

  function stat(label, key) {
    const box = document.createElement("div");
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("b");
    strong.dataset.ownerAiStat = key;
    strong.textContent = "—";
    box.append(small, strong);
    return box;
  }

  function fill(section, cfg) {
    const setCheck = (key, value) => {
      const el = section.querySelector(`[data-owner-config="${key}"]`);
      if (el) el.checked = value === true;
    };
    setCheck("live_web_enabled", cfg.live_web_enabled);
    setCheck("games_enabled", cfg.games_enabled);
    setCheck("radar_enabled", cfg.radar_enabled);
    setCheck("maintenance_enabled", cfg.maintenance_enabled);
    const announcement = section.querySelector("[data-owner-announcement]");
    if (announcement) announcement.value = String(cfg.announcement || "");
    const limit = section.querySelector("[data-owner-ai-limit]");
    if (limit) limit.value = Math.max(0, Number(cfg.ai_daily_limit) || 0);
    const values = {
      total: Math.max(0, Number(cfg.today_ai_used) || 0),
      chat: Math.max(0, Number(cfg.today_chat_used) || 0),
      web: Math.max(0, Number(cfg.today_live_web_used) || 0)
    };
    for (const [key, value] of Object.entries(values)) {
      const node = section.querySelector(`[data-owner-ai-stat="${key}"]`);
      if (node) node.textContent = String(value);
    }
  }

  function payload(section) {
    const checked = key => section.querySelector(`[data-owner-config="${key}"]`)?.checked === true;
    const limitValue = Number(section.querySelector("[data-owner-ai-limit]")?.value || 0);
    return {
      p_live_web_enabled: checked("live_web_enabled"),
      p_games_enabled: checked("games_enabled"),
      p_radar_enabled: checked("radar_enabled"),
      p_maintenance_enabled: checked("maintenance_enabled"),
      p_announcement: String(section.querySelector("[data-owner-announcement]")?.value || "").trim().slice(0, 500),
      p_ai_daily_limit: Number.isFinite(limitValue) ? Math.max(0, Math.min(100000, Math.floor(limitValue))) : 0
    };
  }

  async function load(section) {
    const state = section.querySelector("[data-owner-controls-state]");
    try {
      if (state) state.textContent = "جاري تحميل التحكم…";
      const cfg = await rpc("bella_owner_config");
      fill(section, cfg);
      if (state) state.textContent = "الإعدادات الحالية محملة.";
      return true;
    } catch (error) {
      if (state) state.textContent = error?.status === 403 ? "تم رفض الوصول." : "تعذر تحميل إعدادات التحكم.";
      return false;
    }
  }

  async function save(section) {
    if (saving) return false;
    saving = true;
    const button = section.querySelector("[data-owner-controls-save]");
    const state = section.querySelector("[data-owner-controls-state]");
    if (button) button.disabled = true;
    try {
      if (state) state.textContent = "جاري الحفظ…";
      const cfg = await rpc("bella_owner_update_config", payload(section));
      fill(section, cfg);
      await window.BellaConfig?.refresh?.(true);
      if (state) state.textContent = "تم الحفظ وتطبيق الإعدادات ✅";
      try { window.showToast?.("تم تحديث نظام بيلا ✅"); } catch {}
      return true;
    } catch (error) {
      if (state) state.textContent = error?.status === 403 ? "تم رفض الحفظ: حساب المالك مطلوب." : "تعذر حفظ الإعدادات الحين.";
      return false;
    } finally {
      saving = false;
      if (button) button.disabled = false;
    }
  }

  async function install(card) {
    if (!card || card.querySelector("[data-bella-owner-controls]")) return false;
    if (!window.BellaOwnerCenter?.isOwner?.()) return false;
    ensureStyles();

    const section = document.createElement("section");
    section.className = "bella-owner-controls";
    section.dataset.bellaOwnerControls = "1";
    const title = document.createElement("h3");
    title.textContent = "تحكم النظام 🎛️";
    const intro = document.createElement("p");
    intro.textContent = "تحكم مباشر بميزات بيلا والصيانة والإعلان وحد طلبات AI اليومي. 0 يعني بدون حد يومي.";

    const grid = document.createElement("div");
    grid.className = "bella-owner-control-grid";
    grid.append(
      toggleRow("البحث الحي", "Web Search داخل بيلا وشكو ماكو", "live_web_enabled"),
      toggleRow("الألعاب", "شنو بالصندوق وكمّل المثل", "games_enabled"),
      toggleRow("الرادار", "رادار القز والرادار الاجتماعي", "radar_enabled"),
      toggleRow("وضع الصيانة", "يوقف طلبات AI مؤقتًا ويظهر تنبيه", "maintenance_enabled")
    );

    const aiField = document.createElement("div");
    aiField.className = "bella-owner-field";
    const aiLabel = document.createElement("label");
    aiLabel.textContent = "الحد اليومي لطلبات AI";
    const aiInput = document.createElement("input");
    aiInput.type = "number";
    aiInput.min = "0";
    aiInput.max = "100000";
    aiInput.step = "1";
    aiInput.inputMode = "numeric";
    aiInput.dataset.ownerAiLimit = "1";
    aiField.append(aiLabel, aiInput);

    const usage = document.createElement("div");
    usage.className = "bella-owner-ai-status";
    usage.append(stat("استخدام اليوم", "total"), stat("شات", "chat"), stat("بحث حي", "web"));

    const announcementField = document.createElement("div");
    announcementField.className = "bella-owner-field";
    const announcementLabel = document.createElement("label");
    announcementLabel.textContent = "إعلان للمستخدمين";
    const announcement = document.createElement("textarea");
    announcement.maxLength = 500;
    announcement.placeholder = "مثال: تحديث جديد لبيلا الليلة ✨";
    announcement.dataset.ownerAnnouncement = "1";
    announcementField.append(announcementLabel, announcement);

    const actions = document.createElement("div");
    actions.className = "bella-owner-controls-actions";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.dataset.ownerControlsSave = "1";
    saveButton.textContent = "حفظ وتطبيق";
    const status = document.createElement("span");
    status.className = "bella-owner-controls-state";
    status.dataset.ownerControlsState = "1";
    status.textContent = "—";
    actions.append(saveButton, status);
    section.append(title, intro, grid, aiField, usage, announcementField, actions);

    const users = card.querySelector("[data-owner-users]");
    if (users) card.insertBefore(section, users);
    else card.appendChild(section);
    saveButton.onclick = () => save(section);
    await load(section);
    return true;
  }

  function observe() {
    const tryInstall = node => {
      const modal = node?.id === "bellaOwnerCenter" ? node : node?.querySelector?.("#bellaOwnerCenter");
      const card = modal?.querySelector?.(".bella-owner-card");
      if (card) queueMicrotask(() => install(card));
    };
    document.querySelectorAll("#bellaOwnerCenter .bella-owner-card").forEach(card => install(card));
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof HTMLElement) tryInstall(node);
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
  }

  window.BellaOwnerControls = Object.freeze({
    install,
    refresh: async () => {
      const section = document.querySelector("[data-bella-owner-controls]");
      return section ? load(section) : false;
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})();
