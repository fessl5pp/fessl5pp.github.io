(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  let data = null;
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

  function fmt(value) {
    if (!value) return "—";
    try { return new Date(value).toLocaleString("ar-KW"); }
    catch { return String(value); }
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
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || body?.error || `HTTP ${response.status}`);
    return body;
  }

  function first(value) {
    return Array.isArray(value) ? value[0] || {} : value || {};
  }

  async function load() {
    data = first(await rpc("bella_owner_resilience_v22", { p_event_limit: 60 }));
    return data;
  }

  function styles() {
    if (document.getElementById("bellaResilienceV22Styles")) return;
    const style = document.createElement("style");
    style.id = "bellaResilienceV22Styles";
    style.textContent = `
      .bella-v22-launch{margin:13px 0;padding:13px;border:1px solid rgba(255,187,66,.28);border-radius:16px;background:linear-gradient(135deg,rgba(255,165,50,.1),rgba(255,80,120,.045));text-align:right}.bella-v22-launch h3{margin:0 0 4px}.bella-v22-launch p{margin:0 0 10px;color:var(--muted);font-size:10px;line-height:1.7}.bella-v22-launch button{border:0;border-radius:12px;padding:10px 13px;background:linear-gradient(135deg,#f4a62a,#df7652);color:#fff;font:inherit;font-size:11px;font-weight:950;cursor:pointer}
      .bella-v22-card{width:min(1080px,96vw)!important;max-height:92dvh;overflow:auto;text-align:right}.bella-v22-head{display:flex;justify-content:space-between;gap:12px;position:sticky;top:-1px;z-index:5;padding-bottom:10px;background:var(--panel,#111722)}.bella-v22-head h2{margin:0}.bella-v22-head p{margin:5px 0 0;color:var(--muted);font-size:10px}.bella-v22-tabs{display:flex;gap:7px;overflow:auto;position:sticky;top:63px;z-index:4;padding:8px 0 12px;background:var(--panel,#111722)}.bella-v22-tabs button{border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:8px 10px;background:rgba(255,255,255,.04);color:inherit;font:inherit;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}.bella-v22-tabs button.active{background:#d98537;color:#fff;border-color:transparent}.bella-v22-pane{display:none}.bella-v22-pane.active{display:block}
      .bella-v22-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.bella-v22-box{padding:13px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.025)}.bella-v22-box h3{margin:0 0 5px;font-size:12px}.bella-v22-box>p{margin:0 0 10px;color:var(--muted);font-size:9px;line-height:1.7}.bella-v22-status{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.025)}.bella-v22-status b{font-size:11px}.bella-v22-status small{display:block;color:var(--muted);font-size:8px;margin-top:3px}.bella-v22-pill{padding:5px 8px;border-radius:999px;font-size:8px;font-weight:950;border:1px solid rgba(255,255,255,.1)}.bella-v22-pill.on{color:#ffd58a;background:rgba(180,110,20,.14)}.bella-v22-pill.off{color:#a8ffc7;background:rgba(20,150,80,.12)}
      .bella-v22-field{display:grid;gap:5px;margin-top:9px}.bella-v22-field label{font-size:9px;font-weight:900}.bella-v22-field input,.bella-v22-field textarea,.bella-v22-field select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.05);color:inherit;padding:8px;font:inherit;outline:none}.bella-v22-field textarea{min-height:88px;resize:vertical;line-height:1.6}.bella-v22-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.bella-v22-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.bella-v22-actions button{border:1px solid rgba(255,255,255,.11);border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:9px;font-weight:900;cursor:pointer}.bella-v22-actions button.primary{background:#d98537;border-color:transparent;color:#fff}.bella-v22-actions button.danger{color:#ffaaa5}.bella-v22-state{margin-top:8px;color:var(--muted);font-size:9px;line-height:1.6}
      .bella-v22-list{display:grid;gap:8px}.bella-v22-item{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.02)}.bella-v22-item-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.bella-v22-item b{font-size:10px}.bella-v22-item small{display:block;color:var(--muted);font-size:8px;margin-top:3px;line-height:1.5}.bella-v22-event{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start}.bella-v22-event code{font-size:8px;color:var(--muted)}.bella-v22-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}.bella-v22-kpi{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;text-align:center}.bella-v22-kpi b{display:block;font-size:17px}.bella-v22-kpi span{font-size:8px;color:var(--muted)}
      @media(max-width:760px){.bella-v22-grid,.bella-v22-row,.bella-v22-kpis{grid-template-columns:1fr}.bella-v22-tabs{top:61px}.bella-v22-item-head,.bella-v22-status{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function shell() {
    document.getElementById("bellaResilienceV22")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaResilienceV22";
    modal.className = "vnext-modal";
    modal.innerHTML = `
      <div class="vnext-card bella-v22-card">
        <div class="bella-v22-head"><div><h2>Resilience Lab v22 🛡️</h2><p>Safe Mode · Error Center · Persona Experiments</p></div><button class="vnext-ghost" data-close>✕</button></div>
        <div class="bella-v22-tabs">
          <button class="active" data-tab="safe">🛡️ Safe Mode</button>
          <button data-tab="experiments">🧪 Experiments</button>
          <button data-tab="errors">📡 Error Center</button>
        </div>
        <section class="bella-v22-pane active" data-pane="safe"></section>
        <section class="bella-v22-pane" data-pane="experiments"></section>
        <section class="bella-v22-pane" data-pane="errors"></section>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = event => { if (event.target === modal) modal.remove(); };
    modal.querySelector("[data-close]").onclick = () => modal.remove();
    modal.querySelectorAll("[data-tab]").forEach(button => {
      button.onclick = () => {
        modal.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === button));
        modal.querySelectorAll("[data-pane]").forEach(x => x.classList.toggle("active", x.dataset.pane === button.dataset.tab));
        if (button.dataset.tab === "errors") renderErrors(modal.querySelector('[data-pane="errors"]'));
      };
    });
    return modal;
  }

  function renderSafe(host) {
    const cfg = data?.resilience_config || {};
    const enabled = cfg.safe_mode === true;
    host.innerHTML = `
      <div class="bella-v22-grid">
        <div class="bella-v22-box"><h3>Safe Mode 🛡️</h3><p>إذا صار خلل بعد تحديث، يوقف الميزات الثانوية ويخلي الشات الأساسي والحساب ولوحة المالك شغالين.</p>
          <div class="bella-v22-status"><div><b>${enabled ? "وضع الاستقرار مفعّل" : "الوضع الطبيعي"}</b><small>Revision ${Number(cfg.revision || 1)} · آخر تحديث ${esc(fmt(cfg.updated_at))}</small></div><span class="bella-v22-pill ${enabled ? "on" : "off"}">${enabled ? "SAFE MODE" : "NORMAL"}</span></div>
          <div class="bella-v22-field"><label>سبب داخلي للمالك فقط</label><textarea data-reason maxlength="240" placeholder="مثال: مشكلة بالصوت بعد تحديث جديد">${esc(cfg.safe_mode_reason || "")}</textarea></div>
          <div class="bella-v22-actions"><button class="${enabled ? "" : "primary"}" data-toggle>${enabled ? "إلغاء Safe Mode" : "تفعيل Safe Mode"}</button><button data-refresh>تحديث الحالة</button></div>
          <div class="bella-v22-state" data-state>${enabled ? "الشات الأساسي يبقى شغال، والميزات الثانوية تتوقف." : "كل شيء يعمل حسب Feature Flags الحالية."}</div>
        </div>
        <div class="bella-v22-box"><h3>Privacy-minimal Telemetry 📡</h3><p>يسجل أخطاء تقنية فقط: نوع الخطأ، الموديول، fingerprint، الإصدار وكود HTTP. ما يسجل رسائل المستخدم ولا stack trace.</p>
          <div class="bella-v22-status"><div><b>${cfg.telemetry_enabled !== false ? "Error telemetry شغال" : "Error telemetry متوقف"}</b><small>Sampling الحالي ${Number(cfg.telemetry_sample_percent ?? 50)}%</small></div><span class="bella-v22-pill ${cfg.telemetry_enabled !== false ? "off" : "on"}">${cfg.telemetry_enabled !== false ? "ON" : "OFF"}</span></div>
          <div class="bella-v22-row"><div class="bella-v22-field"><label>Sampling %</label><input data-sample type="number" min="0" max="100" step="5" value="${Number(cfg.telemetry_sample_percent ?? 50)}"></div><div class="bella-v22-field"><label>الحالة</label><select data-telemetry><option value="on">تشغيل</option><option value="off">إيقاف</option></select></div></div>
          <div class="bella-v22-actions"><button class="primary" data-save-telemetry>حفظ Telemetry</button><button class="danger" data-prune>حذف أقدم من 14 يوم</button></div>
          <div class="bella-v22-state" data-telemetry-state>جاهز.</div>
        </div>
      </div>`;
    host.querySelector("[data-telemetry]").value = cfg.telemetry_enabled !== false ? "on" : "off";

    host.querySelector("[data-toggle]").onclick = async () => {
      if (busy) return;
      const next = !enabled;
      if (next && !confirm("تفعل Safe Mode؟ الشات الأساسي يظل شغال، لكن الميزات الثانوية بتتوقف مؤقتًا.")) return;
      busy = true;
      const status = host.querySelector("[data-state]");
      status.textContent = "جاري التحديث…";
      try {
        await rpc("bella_owner_set_safe_mode_v22", {
          p_enabled: next,
          p_reason: String(host.querySelector("[data-reason]").value || "").trim().slice(0, 240)
        });
        await load();
        await window.BellaResilienceV22?.refresh?.(true);
        renderSafe(host);
        toast(next ? "تم تفعيل Safe Mode 🛡️" : "تم الرجوع للوضع الطبيعي ✅");
      } catch (error) {
        status.textContent = `تعذر التحديث: ${error.message || "خطأ"}`;
      } finally { busy = false; }
    };

    host.querySelector("[data-refresh]").onclick = async () => {
      if (busy) return;
      busy = true;
      try { await load(); renderSafe(host); }
      catch (error) { host.querySelector("[data-state]").textContent = error.message || "تعذر التحديث"; }
      finally { busy = false; }
    };

    host.querySelector("[data-save-telemetry]").onclick = async () => {
      if (busy) return;
      busy = true;
      const status = host.querySelector("[data-telemetry-state]");
      status.textContent = "جاري الحفظ…";
      try {
        await rpc("bella_owner_set_telemetry_v22", {
          p_enabled: host.querySelector("[data-telemetry]").value === "on",
          p_sample_percent: Math.max(0, Math.min(100, Number(host.querySelector("[data-sample]").value) || 0))
        });
        await load();
        await window.BellaResilienceV22?.refresh?.(true);
        renderSafe(host);
        toast("تم تحديث Telemetry ✅");
      } catch (error) { status.textContent = `تعذر الحفظ: ${error.message || "خطأ"}`; }
      finally { busy = false; }
    };

    host.querySelector("[data-prune]").onclick = async () => {
      if (busy || !confirm("تحذف سجلات الأخطاء الأقدم من 14 يوم؟")) return;
      busy = true;
      const status = host.querySelector("[data-telemetry-state]");
      try {
        const deleted = await rpc("bella_owner_prune_events_v22", { p_keep_days: 14 });
        status.textContent = `تم حذف ${Number(deleted || 0)} سجل قديم.`;
        await load();
      } catch (error) { status.textContent = `تعذر الحذف: ${error.message || "خطأ"}`; }
      finally { busy = false; }
    };
  }

  function experimentEditor(exp = {}) {
    return `
      <div class="bella-v22-box"><h3>Persona A/B Experiment 🧪</h3><p>التوزيع ثابت لكل مستخدم/جهاز. السيرفر هو اللي يجيب الـOverlay من قاعدة البيانات، لذلك المستخدم ما يقدر يحقن تعليمات تجريبية من جهازه.</p>
        <div class="bella-v22-row"><div class="bella-v22-field"><label>Experiment Key</label><input data-exp-key maxlength="40" value="${esc(exp.experiment_key || "persona_tone_01")}"></div><div class="bella-v22-field"><label>الاسم</label><input data-exp-label maxlength="80" value="${esc(exp.label || "تجربة نبرة بيلا")}"></div></div>
        <div class="bella-v22-row"><div class="bella-v22-field"><label>الحالة</label><select data-exp-status><option value="draft">Draft</option><option value="running">Running</option><option value="paused">Paused</option><option value="ended">Ended</option></select></div><div class="bella-v22-field"><label>نسبة الجمهور %</label><input data-exp-audience type="number" min="0" max="100" value="${Number(exp.audience_percent ?? 100)}"></div></div>
        <div class="bella-v22-field"><label>من الجمهور: نسبة Variant B %</label><input data-exp-b type="number" min="0" max="100" value="${Number(exp.variant_b_percent ?? 50)}"></div>
        <div class="bella-v22-row"><div class="bella-v22-field"><label>بداية — اختياري</label><input data-exp-start type="datetime-local" value="${esc(toLocalInput(exp.starts_at))}"></div><div class="bella-v22-field"><label>نهاية — اختياري</label><input data-exp-end type="datetime-local" value="${esc(toLocalInput(exp.ends_at))}"></div></div>
        <div class="bella-v22-field"><label>Variant A Overlay</label><textarea data-exp-a maxlength="1800">${esc(exp.overlay_a || "")}</textarea></div>
        <div class="bella-v22-field"><label>Variant B Overlay</label><textarea data-exp-overlay-b maxlength="1800">${esc(exp.overlay_b || "")}</textarea></div>
        <div class="bella-v22-field"><label>سبب/ملاحظة للـAudit</label><input data-exp-reason maxlength="240" placeholder="مثال: اختبار ردود أقصر"></div>
        <div class="bella-v22-actions"><button class="primary" data-exp-save>حفظ التجربة</button><button data-exp-reset>تجربة جديدة</button></div>
        <div class="bella-v22-state" data-exp-state>Running يوقف أي تجربة Persona ثانية تلقائيًا حتى ما تتعارض الـOverlays.</div>
      </div>`;
  }

  function renderExperiments(host, selectedKey = "") {
    const experiments = Array.isArray(data?.experiments) ? data.experiments : [];
    const selected = experiments.find(x => x.experiment_key === selectedKey) || experiments[0] || {};
    host.innerHTML = `<div class="bella-v22-grid"><div data-editor>${experimentEditor(selected)}</div><div class="bella-v22-box"><h3>التجارب المحفوظة</h3><p>اختار تجربة للتعديل أو وقفها من نفس المحرر.</p><div class="bella-v22-list" data-list></div></div></div>`;
    const editor = host.querySelector("[data-editor]");
    const list = host.querySelector("[data-list]");
    const statusSelect = editor.querySelector("[data-exp-status]");
    statusSelect.value = ["draft", "running", "paused", "ended"].includes(selected.status) ? selected.status : "draft";

    list.innerHTML = experiments.length ? experiments.map(exp => `
      <button class="bella-v22-item" data-exp-pick="${esc(exp.experiment_key)}" style="text-align:right;color:inherit;cursor:pointer">
        <div class="bella-v22-item-head"><div><b>${esc(exp.label || exp.experiment_key)}</b><small>${esc(exp.experiment_key)} · Audience ${Number(exp.audience_percent || 0)}% · B ${Number(exp.variant_b_percent || 0)}%</small></div><span class="bella-v22-pill ${exp.status === "running" ? "off" : ""}">${esc(exp.status)}</span></div>
      </button>`).join("") : `<div class="bella-v22-state">ما عندك تجارب للحين.</div>`;

    list.querySelectorAll("[data-exp-pick]").forEach(btn => {
      btn.onclick = () => renderExperiments(host, btn.dataset.expPick);
    });

    editor.querySelector("[data-exp-reset]").onclick = () => {
      data.experiments = experiments;
      renderExperiments(host, "__new__");
      const freshEditor = host.querySelector("[data-editor]");
      freshEditor.innerHTML = experimentEditor({});
      wireExperimentEditor(host, freshEditor);
    };
    wireExperimentEditor(host, editor);
  }

  function wireExperimentEditor(host, editor) {
    const statusSelect = editor.querySelector("[data-exp-status]");
    if (statusSelect && !statusSelect.value) statusSelect.value = "draft";
    const save = editor.querySelector("[data-exp-save]");
    if (!save) return;
    save.onclick = async () => {
      if (busy) return;
      const key = String(editor.querySelector("[data-exp-key]").value || "").trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(key)) return toast("Experiment Key لازم إنجليزي/أرقام و - أو _ فقط.");
      busy = true;
      const status = editor.querySelector("[data-exp-state]");
      status.textContent = "جاري الحفظ…";
      try {
        await rpc("bella_owner_upsert_experiment_v22", {
          p_key: key,
          p_label: String(editor.querySelector("[data-exp-label]").value || "").trim().slice(0, 80),
          p_status: editor.querySelector("[data-exp-status]").value,
          p_audience_percent: Math.max(0, Math.min(100, Number(editor.querySelector("[data-exp-audience]").value) || 0)),
          p_variant_b_percent: Math.max(0, Math.min(100, Number(editor.querySelector("[data-exp-b]").value) || 0)),
          p_overlay_a: String(editor.querySelector("[data-exp-a]").value || "").trim().slice(0, 1800),
          p_overlay_b: String(editor.querySelector("[data-exp-overlay-b]").value || "").trim().slice(0, 1800),
          p_start: toIso(editor.querySelector("[data-exp-start]").value),
          p_end: toIso(editor.querySelector("[data-exp-end]").value),
          p_reason: String(editor.querySelector("[data-exp-reason]").value || "").trim().slice(0, 240)
        });
        await load();
        await window.BellaResilienceV22?.refresh?.(true);
        renderExperiments(host, key);
        toast("تم حفظ التجربة ✅");
      } catch (error) { status.textContent = `تعذر الحفظ: ${error.message || "خطأ"}`; }
      finally { busy = false; }
    };
  }

  function renderErrors(host) {
    const summary = Array.isArray(data?.event_summary) ? data.event_summary : [];
    const latest = Array.isArray(data?.latest_events) ? data.latest_events : [];
    const total = summary.reduce((sum, item) => sum + Number(item.count || 0), 0);
    const modules = new Set(summary.map(item => item.module).filter(Boolean)).size;
    const newest = latest[0]?.created_at || null;
    host.innerHTML = `
      <div class="bella-v22-box"><h3>Error Center 📡</h3><p>تشخيص آخر 24 ساعة بدون محتوى محادثات.</p>
        <div class="bella-v22-kpis"><div class="bella-v22-kpi"><b>${total}</b><span>أخطاء 24 ساعة</span></div><div class="bella-v22-kpi"><b>${modules}</b><span>Modules متأثرة</span></div><div class="bella-v22-kpi"><b>${newest ? esc(fmt(newest)) : "—"}</b><span>آخر حدث</span></div></div>
        <div class="bella-v22-actions"><button class="primary" data-refresh-errors>تحديث</button></div>
        <div class="bella-v22-state" data-error-state>${summary.length ? "مرتبة حسب الأكثر تكرارًا." : "ما في أخطاء مسجلة آخر 24 ساعة ✅"}</div>
      </div>
      <div class="bella-v22-grid" style="margin-top:10px"><div class="bella-v22-box"><h3>الأكثر تكرارًا</h3><div class="bella-v22-list">${summary.length ? summary.map(item => `<div class="bella-v22-item"><div class="bella-v22-item-head"><div><b>${esc(item.event_type)} · ${esc(item.module || "unknown")}</b><small>آخر ظهور ${esc(fmt(item.last_seen))}</small></div><span class="bella-v22-pill">${Number(item.count || 0)}×</span></div></div>`).join("") : `<div class="bella-v22-state">نظيف.</div>`}</div></div>
      <div class="bella-v22-box"><h3>آخر الأحداث</h3><div class="bella-v22-list">${latest.length ? latest.slice(0, 30).map(item => `<div class="bella-v22-item bella-v22-event"><span>${item.event_type === "network_error" ? "🌐" : item.event_type === "resource_error" ? "📦" : "⚠️"}</span><div><b>${esc(item.module || item.event_type)}</b><small>${esc(item.event_type)} · ${esc(item.fingerprint)}${item.status_code ? ` · HTTP ${Number(item.status_code)}` : ""}<br>${esc(fmt(item.created_at))}</small></div><code>${esc(item.release || "")}</code></div>`).join("") : `<div class="bella-v22-state">ما في أحداث.</div>`}</div></div></div>`;
    host.querySelector("[data-refresh-errors]").onclick = async () => {
      if (busy) return;
      busy = true;
      const status = host.querySelector("[data-error-state]");
      status.textContent = "جاري التحديث…";
      try { await load(); renderErrors(host); }
      catch (error) { status.textContent = `تعذر التحديث: ${error.message || "خطأ"}`; }
      finally { busy = false; }
    };
  }

  async function open() {
    if (!window.BellaOwnerCenter?.isOwner?.()) return toast("حساب المالك مطلوب.");
    styles();
    const modal = shell();
    const safe = modal.querySelector('[data-pane="safe"]');
    safe.innerHTML = `<div class="bella-v22-state">جاري تحميل Resilience Lab…</div>`;
    try {
      await load();
      renderSafe(safe);
      renderExperiments(modal.querySelector('[data-pane="experiments"]'));
      modal.querySelector('[data-pane="errors"]').innerHTML = `<div class="bella-v22-state">افتح التبويب لعرض الأخطاء.</div>`;
    } catch (error) {
      safe.innerHTML = `<div class="bella-v22-state">تعذر تحميل Resilience Lab: ${esc(error.message || "خطأ")}</div>`;
    }
  }

  function install(card) {
    if (!card || card.querySelector("[data-bella-resilience-v22]")) return false;
    if (!window.BellaOwnerCenter?.isOwner?.()) return false;
    styles();
    const section = document.createElement("section");
    section.className = "bella-v22-launch";
    section.dataset.bellaResilienceV22 = "1";
    section.innerHTML = `<h3>Resilience Lab v22 🛡️</h3><p>Safe Mode سريع، Error Center بدون محتوى المحادثات، وتجارب Persona A/B ثابتة وآمنة.</p><button type="button">فتح Resilience Lab</button>`;
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
    setTimeout(() => document.querySelectorAll("#bellaOwnerCenter .bella-owner-card").forEach(card => install(card)), 1400);
  }

  window.BellaResilienceOwnerV22 = Object.freeze({ open, install, refresh: load });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})();
