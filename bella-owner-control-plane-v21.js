(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  let state = null;
  let busy = false;

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function token() {
    return String(session()?.access_token || "");
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[c]);
  }

  function toast(text) {
    try { window.showToast?.(text); } catch {}
  }

  async function rpc(name, payload = {}) {
    if (!token()) throw new Error("owner session unavailable");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
    return data;
  }

  function first(value) {
    return Array.isArray(value) ? value[0] || {} : value || {};
  }

  function toLocalInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function toIso(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function fmt(value) {
    if (!value) return "—";
    try { return new Date(value).toLocaleString("ar-KW"); }
    catch { return String(value); }
  }

  function styles() {
    if (document.getElementById("bellaControlPlaneV21Styles")) return;
    const style = document.createElement("style");
    style.id = "bellaControlPlaneV21Styles";
    style.textContent = `
      .bella-v21-launch{margin:13px 0;padding:13px;border:1px solid rgba(124,104,255,.28);border-radius:16px;background:linear-gradient(135deg,rgba(90,80,255,.11),rgba(70,205,255,.05));text-align:right}.bella-v21-launch h3{margin:0 0 4px}.bella-v21-launch p{margin:0 0 10px;color:var(--muted);font-size:10px;line-height:1.7}.bella-v21-launch button{border:0;border-radius:12px;padding:10px 13px;background:var(--accent);color:#fff;font:inherit;font-size:11px;font-weight:950;cursor:pointer}
      .bella-v21-card{width:min(1040px,96vw)!important;max-height:92dvh;overflow:auto;text-align:right}.bella-v21-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:-1px;z-index:4;padding-bottom:10px;background:var(--panel,#111722)}.bella-v21-head h2{margin:0}.bella-v21-head p{margin:5px 0 0;color:var(--muted);font-size:10px;line-height:1.6}
      .bella-v21-tabs{display:flex;gap:7px;overflow:auto;position:sticky;top:64px;z-index:3;padding:8px 0 12px;background:var(--panel,#111722)}.bella-v21-tabs button{border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:8px 10px;background:rgba(255,255,255,.04);color:inherit;font:inherit;font-size:10px;font-weight:850;white-space:nowrap;cursor:pointer}.bella-v21-tabs button.active{background:var(--accent);color:#fff;border-color:transparent}
      .bella-v21-pane{display:none}.bella-v21-pane.active{display:block}.bella-v21-box{padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.025)}.bella-v21-box h3{margin:0 0 4px;font-size:12px}.bella-v21-box>p{margin:0 0 10px;color:var(--muted);font-size:9px;line-height:1.7}.bella-v21-list{display:grid;gap:9px}.bella-v21-flag{padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.02)}.bella-v21-flag-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.bella-v21-flag-head b{font-size:11px}.bella-v21-flag-head small{display:block;color:var(--muted);font-size:8px;margin-top:3px}.bella-v21-chip{padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.1);font-size:8px;font-weight:900;white-space:nowrap}
      .bella-v21-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.bella-v21-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px}.bella-v21-field{display:grid;gap:5px;margin-top:9px}.bella-v21-field label{font-size:9px;font-weight:900}.bella-v21-field input,.bella-v21-field textarea,.bella-v21-field select,.bella-v21-controls input,.bella-v21-controls select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.05);color:inherit;padding:8px;font:inherit;outline:none}.bella-v21-field textarea{min-height:88px;resize:vertical;line-height:1.6}
      .bella-v21-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.bella-v21-actions button{border:1px solid rgba(255,255,255,.11);border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:9px;font-weight:900;cursor:pointer}.bella-v21-actions button.primary{background:var(--accent);border-color:transparent;color:#fff}.bella-v21-actions button.danger{color:#ff9b96}.bella-v21-actions button:disabled{opacity:.55;cursor:wait}.bella-v21-state{margin-top:8px;color:var(--muted);font-size:9px;line-height:1.6}
      .bella-v21-preview{min-height:110px;margin-top:10px;padding:12px;border:1px solid rgba(100,190,255,.18);border-radius:13px;background:rgba(70,140,230,.06);white-space:pre-wrap;line-height:1.75;font-size:11px}.bella-v21-checks{display:grid;gap:8px;margin-top:10px}.bella-v21-check{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px}.bella-v21-check b{font-size:10px}.bella-v21-check small{display:block;color:var(--muted);font-size:8px;margin-top:2px}.bella-v21-check code{font-size:8px;color:var(--muted)}
      @media(max-width:760px){.bella-v21-grid,.bella-v21-controls{grid-template-columns:1fr}.bella-v21-tabs{top:62px}.bella-v21-flag-head{flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  async function loadState() {
    state = first(await rpc("bella_owner_ops_v20"));
    return state;
  }

  function shell() {
    document.getElementById("bellaControlPlaneV21")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaControlPlaneV21";
    modal.className = "vnext-modal";
    modal.innerHTML = `
      <div class="vnext-card bella-v21-card">
        <div class="bella-v21-head"><div><h2>Control Plane v21 🧪</h2><p>Progressive Rollouts · Scheduling · Persona Preview Lab · Diagnostics</p></div><button class="vnext-ghost" data-close>✕</button></div>
        <div class="bella-v21-tabs">
          <button class="active" data-tab="rollouts">🚦 Rollouts</button>
          <button data-tab="preview">🧠 Preview Lab</button>
          <button data-tab="diagnostics">🩺 Diagnostics</button>
        </div>
        <section class="bella-v21-pane active" data-pane="rollouts"></section>
        <section class="bella-v21-pane" data-pane="preview"></section>
        <section class="bella-v21-pane" data-pane="diagnostics"></section>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    modal.querySelector("[data-close]").onclick = () => modal.remove();
    modal.querySelectorAll("[data-tab]").forEach(button => {
      button.onclick = () => {
        modal.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === button));
        modal.querySelectorAll("[data-pane]").forEach(x => x.classList.toggle("active", x.dataset.pane === button.dataset.tab));
        if (button.dataset.tab === "diagnostics") renderDiagnostics(modal.querySelector('[data-pane="diagnostics"]'));
      };
    });
    return modal;
  }

  async function setBaseMode(key, mode, note) {
    await rpc("bella_owner_set_feature_flag", { p_key: key, p_mode: mode, p_note: note || "" });
  }

  async function setRollout(key, percent) {
    await rpc("bella_owner_set_feature_rollout_v21", { p_key: key, p_percent: percent, p_reason: "Control Plane v21" });
  }

  async function scheduleFlag(key, mode, start, end) {
    await rpc("bella_owner_schedule_feature_v21", {
      p_key: key,
      p_mode: mode,
      p_start: start,
      p_end: end,
      p_reason: "Control Plane v21"
    });
  }

  async function clearSchedule(key) {
    await rpc("bella_owner_clear_feature_schedule_v21", { p_key: key, p_reason: "Control Plane v21" });
  }

  async function renderRollouts(host) {
    const flags = state?.feature_flags || {};
    host.innerHTML = `<div class="bella-v21-box"><h3>Progressive Rollouts + Scheduling 🚦</h3><p>خل الميزة BETA وحدد نسبة التجربة. التوزيع ثابت لكل مستخدم/جهاز، والجدولة تغيّر الحالة تلقائيًا بين وقت البداية والنهاية.</p><div class="bella-v21-list" data-list></div><div class="bella-v21-state" data-state>جاهز.</div></div>`;
    const list = host.querySelector("[data-list]");
    const status = host.querySelector("[data-state]");

    for (const [key, item] of Object.entries(flags)) {
      const box = document.createElement("div");
      box.className = "bella-v21-flag";
      const scheduled = item.scheduled_mode && item.scheduled_start;
      box.innerHTML = `
        <div class="bella-v21-flag-head">
          <div><b>${esc(item.label || key)}</b><small>${esc(item.note || key)}</small></div>
          <span class="bella-v21-chip">${scheduled ? `⏱️ ${esc(item.scheduled_mode)} · ${esc(fmt(item.scheduled_start))}` : `Base: ${esc(item.mode || "on")}`}</span>
        </div>
        <div class="bella-v21-controls">
          <select data-mode><option value="on">🟢 ON</option><option value="beta">🧪 BETA</option><option value="off">🔴 OFF</option></select>
          <input data-percent type="number" min="0" max="100" step="1" value="${Number(item.rollout_percent || 0)}" title="نسبة BETA">
          <select data-schedule-mode><option value="beta">🧪 جدولة BETA</option><option value="on">🟢 جدولة ON</option><option value="off">🔴 جدولة OFF</option></select>
          <input data-start type="datetime-local" value="${esc(toLocalInput(item.scheduled_start))}" title="بداية الجدولة">
        </div>
        <div class="bella-v21-controls" style="grid-template-columns:1fr auto auto auto">
          <input data-end type="datetime-local" value="${esc(toLocalInput(item.scheduled_end))}" title="نهاية الجدولة - اختياري">
          <button class="bella-ops-v20-mini" data-save-base>حفظ الحالة</button>
          <button class="bella-ops-v20-mini" data-save-rollout>حفظ النسبة</button>
          <button class="bella-ops-v20-mini" data-save-schedule>جدولة</button>
        </div>
        ${scheduled ? `<div class="bella-v21-actions"><button class="danger" data-clear>إلغاء الجدولة</button></div>` : ""}
        <div class="bella-v21-state">BETA حاليًا: ${Number(item.rollout_percent || 0)}% · ${scheduled ? `تنتهي: ${esc(fmt(item.scheduled_end))}` : "بدون جدولة"}</div>`;

      const mode = box.querySelector("[data-mode]");
      mode.value = item.mode || "on";
      const scheduleMode = box.querySelector("[data-schedule-mode]");
      scheduleMode.value = item.scheduled_mode || "beta";

      box.querySelector("[data-save-base]").onclick = async () => {
        if (busy) return;
        busy = true;
        status.textContent = `جاري حفظ ${item.label || key}…`;
        try {
          await setBaseMode(key, mode.value, item.note || "");
          await loadState();
          await window.BellaFeatureControlsV3?.refresh?.(true);
          await renderRollouts(host);
          toast("تم تحديث الحالة الأساسية ✅");
        } catch (error) {
          status.textContent = `تعذر الحفظ: ${error.message || "خطأ"}`;
        } finally { busy = false; }
      };

      box.querySelector("[data-save-rollout]").onclick = async () => {
        if (busy) return;
        busy = true;
        const percent = Math.max(0, Math.min(100, Number(box.querySelector("[data-percent]").value) || 0));
        status.textContent = `جاري ضبط BETA إلى ${percent}%…`;
        try {
          await setRollout(key, percent);
          await loadState();
          await window.BellaFeatureControlsV3?.refresh?.(true);
          await renderRollouts(host);
          toast(`تم ضبط الـRollout على ${percent}% ✅`);
        } catch (error) {
          status.textContent = `تعذر حفظ النسبة: ${error.message || "خطأ"}`;
        } finally { busy = false; }
      };

      box.querySelector("[data-save-schedule]").onclick = async () => {
        if (busy) return;
        const start = toIso(box.querySelector("[data-start]").value);
        const end = toIso(box.querySelector("[data-end]").value);
        if (!start) return toast("حدد وقت البداية.");
        if (end && new Date(end) <= new Date(start)) return toast("وقت النهاية لازم يكون بعد البداية.");
        busy = true;
        status.textContent = "جاري حفظ الجدولة…";
        try {
          await scheduleFlag(key, scheduleMode.value, start, end);
          await loadState();
          await window.BellaFeatureControlsV3?.refresh?.(true);
          await renderRollouts(host);
          toast("تمت جدولة الميزة ✅");
        } catch (error) {
          status.textContent = `تعذر الجدولة: ${error.message || "خطأ"}`;
        } finally { busy = false; }
      };

      box.querySelector("[data-clear]")?.addEventListener("click", async () => {
        if (busy) return;
        busy = true;
        try {
          await clearSchedule(key);
          await loadState();
          await window.BellaFeatureControlsV3?.refresh?.(true);
          await renderRollouts(host);
          toast("تم إلغاء الجدولة ✅");
        } catch (error) {
          status.textContent = `تعذر الإلغاء: ${error.message || "خطأ"}`;
        } finally { busy = false; }
      });
      list.appendChild(box);
    }
  }

  function personaPayload(host) {
    return {
      p_enabled: true,
      p_system_overlay: String(host.querySelector("[data-overlay]").value || "").trim().slice(0, 6000),
      p_brevity: host.querySelector("[data-brevity]").value,
      p_humor: Number(host.querySelector("[data-humor]").value || 0),
      p_warmth: Number(host.querySelector("[data-warmth]").value || 0),
      p_directness: Number(host.querySelector("[data-directness]").value || 0),
      p_dialect: Number(host.querySelector("[data-dialect]").value || 0),
      p_blocked_phrases: String(host.querySelector("[data-blocked]").value || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, 40)
    };
  }

  function renderPreview(host) {
    const p = state?.persona || {};
    host.innerHTML = `
      <div class="bella-v21-grid">
        <div class="bella-v21-box"><h3>Persona Preview Lab 🧠</h3><p>جرّب أي تعديل على رسالة حقيقية بدون حفظ. الطلب ما يغير شخصية بيلا إلا إذا ضغطت «حفظ الإعدادات».</p>
          <div class="bella-v21-field"><label>رسالة الاختبار</label><textarea data-message>شلونج اليوم؟ قوليلي شي كويتي طبيعي بدون مبالغة</textarea></div>
          <div class="bella-v21-field"><label>System Overlay التجريبي</label><textarea data-overlay maxlength="6000">${esc(p.system_overlay || "")}</textarea></div>
          <div class="bella-v21-field"><label>عبارات تتجنبها — كل سطر عبارة</label><textarea data-blocked>${esc(Array.isArray(p.blocked_phrases) ? p.blocked_phrases.join("\n") : "")}</textarea></div>
        </div>
        <div class="bella-v21-box"><h3>مقابض التجربة 🎚️</h3>
          <div class="bella-v21-field"><label>طول الرد</label><select data-brevity><option value="short">قصير</option><option value="medium">متوسط</option><option value="long">أطول</option></select></div>
          <div class="bella-v21-field"><label>المزح 0–3</label><input data-humor type="number" min="0" max="3" value="${Number(p.humor ?? 1)}"></div>
          <div class="bella-v21-field"><label>الدفا 0–3</label><input data-warmth type="number" min="0" max="3" value="${Number(p.warmth ?? 1)}"></div>
          <div class="bella-v21-field"><label>المباشرة 0–1</label><input data-directness type="number" min="0" max="1" step=".05" value="${Number(p.directness ?? .35)}"></div>
          <div class="bella-v21-field"><label>اللهجة 0–1</label><input data-dialect type="number" min="0" max="1" step=".05" value="${Number(p.dialect ?? .8)}"></div>
          <div class="bella-v21-actions"><button class="primary" data-preview>تشغيل Preview</button><button data-save>حفظ الإعدادات لبيلا</button></div>
          <div class="bella-v21-state" data-state>Preview لا يحفظ أي تغيير.</div>
          <div class="bella-v21-preview" data-output>النتيجة بتظهر هني.</div>
        </div>
      </div>`;
    host.querySelector("[data-brevity]").value = ["short", "medium", "long"].includes(p.brevity) ? p.brevity : "medium";

    host.querySelector("[data-preview]").onclick = async () => {
      if (busy) return;
      const message = String(host.querySelector("[data-message]").value || "").trim();
      if (!message) return toast("اكتب رسالة اختبار.");
      busy = true;
      const button = host.querySelector("[data-preview]");
      const status = host.querySelector("[data-state]");
      const output = host.querySelector("[data-output]");
      button.disabled = true;
      status.textContent = "بيلا التجريبية ترد…";
      output.textContent = "…";
      try {
        const payload = personaPayload(host);
        const response = await fetch("/api/owner-persona-preview", {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            systemOverlay: payload.p_system_overlay,
            brevity: payload.p_brevity,
            humor: payload.p_humor,
            warmth: payload.p_warmth,
            directness: payload.p_directness,
            dialect: payload.p_dialect,
            blockedPhrases: payload.p_blocked_phrases,
            localDate: new Date().toISOString().slice(0, 10)
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        output.textContent = data.preview || "ما رجع نص.";
        status.textContent = "Preview فقط — ما انحفظ شيء ✅";
      } catch (error) {
        output.textContent = "تعذر تشغيل Preview.";
        status.textContent = error.message || "خطأ";
      } finally {
        button.disabled = false;
        busy = false;
      }
    };

    host.querySelector("[data-save]").onclick = async () => {
      if (busy) return;
      if (!confirm("تحفظ إعدادات الـPreview الحالية وتطبقها على بيلا؟")) return;
      busy = true;
      const status = host.querySelector("[data-state]");
      status.textContent = "جاري الحفظ…";
      try {
        await rpc("bella_owner_update_persona_v20", personaPayload(host));
        await loadState();
        await window.BellaFeatureControlsV3?.refresh?.(true);
        status.textContent = "تم حفظ إعدادات بيلا ✅";
        toast("تم تحديث شخصية بيلا ✅");
      } catch (error) {
        status.textContent = `تعذر الحفظ: ${error.message || "خطأ"}`;
      } finally { busy = false; }
    };
  }

  async function renderDiagnostics(host) {
    host.innerHTML = `<div class="bella-v21-box"><h3>Runtime Diagnostics 🩺</h3><p>يفحص الربط الفعلي بدون كشف أسرار أو مفاتيح.</p><div class="bella-v21-actions"><button class="primary" data-refresh>إعادة الفحص</button></div><div class="bella-v21-state" data-state>جاري الفحص…</div><div class="bella-v21-checks" data-list></div></div>`;
    const run = async () => {
      const status = host.querySelector("[data-state]");
      const list = host.querySelector("[data-list]");
      status.textContent = "جاري فحص بيلا…";
      list.innerHTML = "";
      try {
        const response = await fetch("/api/owner-diagnostics", { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok && response.status !== 207) throw new Error(data.error || `HTTP ${response.status}`);
        const checks = Array.isArray(data.checks) ? data.checks : [];
        list.innerHTML = checks.map(check => `
          <div class="bella-v21-check"><span>${check.ok ? "✅" : "❌"}</span><div><b>${esc(check.name)}</b><small>${esc(JSON.stringify(check.detail || {}))}</small></div><code>${Number(check.latencyMs || 0)}ms</code></div>`).join("");
        status.textContent = `${data.status === "ok" ? "كل الأنظمة سليمة ✅" : `في ${Number(data.failed || 0)} فحص يحتاج انتباه`} · ${esc(data.release || "v21")}`;
      } catch (error) {
        status.textContent = `تعذر تشغيل Diagnostics: ${error.message || "خطأ"}`;
      }
    };
    host.querySelector("[data-refresh]").onclick = run;
    await run();
  }

  async function open() {
    if (!window.BellaOwnerCenter?.isOwner?.()) return toast("حساب المالك مطلوب.");
    styles();
    const modal = shell();
    const rolloutHost = modal.querySelector('[data-pane="rollouts"]');
    rolloutHost.innerHTML = `<div class="bella-v21-state">جاري تحميل Control Plane…</div>`;
    try {
      await loadState();
      await renderRollouts(rolloutHost);
      renderPreview(modal.querySelector('[data-pane="preview"]'));
      modal.querySelector('[data-pane="diagnostics"]').innerHTML = `<div class="bella-v21-state">افتح التبويب لتشغيل الفحص.</div>`;
    } catch (error) {
      rolloutHost.innerHTML = `<div class="bella-v21-state">تعذر تحميل Control Plane: ${esc(error.message || "خطأ")}</div>`;
    }
  }

  function install(card) {
    if (!card || card.querySelector("[data-bella-control-plane-v21]")) return false;
    if (!window.BellaOwnerCenter?.isOwner?.()) return false;
    styles();
    const section = document.createElement("section");
    section.className = "bella-v21-launch";
    section.dataset.bellaControlPlaneV21 = "1";
    section.innerHTML = `<h3>Control Plane v21 🧪</h3><p>اختبارات تدريجية بنسبة مستخدمين، جدولة تلقائية، Persona Preview قبل الحفظ، وفحص صحة النظام.</p><button type="button">فتح Control Plane</button>`;
    section.querySelector("button").onclick = open;
    card.insertBefore(section, card.firstChild?.nextSibling || card.firstChild || null);
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
    setTimeout(() => document.querySelectorAll("#bellaOwnerCenter .bella-owner-card").forEach(card => install(card)), 1300);
  }

  window.BellaControlPlaneV21 = Object.freeze({ open, install, refresh: loadState });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})();