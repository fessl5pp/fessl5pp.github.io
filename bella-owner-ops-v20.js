(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const BADGES = [
    ["alnawkhadha", "⚓ النوخذة"],
    ["alsirdal", "🌊 السردال"],
    ["raei_alfazaa", "🤝 راعي الفزعة"],
    ["hafeth_aldira", "🇰🇼 حافظ الديرة"],
    ["saffah_alnuqat", "🔥 سفاح النقاط"],
    ["raei_qaz", "🚗 راعي قز"],
    ["diwaniya", "🛋️ ديوانية متنقلة"],
    ["almrawweg", "😎 المروّق"],
    ["raei_albisht", "🧥 راعي البشت"],
    ["altaj", "👑 التاج"]
  ];

  let opsState = null;
  let busy = false;

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function token() {
    return String(session()?.access_token || "");
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
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function first(value) {
    return Array.isArray(value) ? value[0] || {} : value || {};
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

  function toast(text) {
    try { window.showToast?.(text); } catch {}
  }

  function fmtDate(value) {
    if (!value) return "—";
    try { return new Date(value).toLocaleString("ar-KW"); }
    catch { return String(value); }
  }

  function styles() {
    if (document.getElementById("bellaOwnerOpsV20Styles")) return;
    const style = document.createElement("style");
    style.id = "bellaOwnerOpsV20Styles";
    style.textContent = `
      .bella-owner-v20-launch{margin:13px 0;padding:13px;border:1px solid rgba(90,190,255,.22);border-radius:16px;background:linear-gradient(135deg,rgba(60,135,255,.08),rgba(255,190,80,.04));text-align:right}
      .bella-owner-v20-launch h3{margin:0 0 4px}.bella-owner-v20-launch p{margin:0 0 10px;color:var(--muted);font-size:10px;line-height:1.7}.bella-owner-v20-launch button{border:0;border-radius:12px;padding:10px 13px;background:var(--accent);color:#fff;font:inherit;font-size:11px;font-weight:950;cursor:pointer}
      .bella-ops-v20-card{width:min(980px,96vw)!important;max-height:92dvh;overflow:auto;text-align:right}
      .bella-ops-v20-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;position:sticky;top:-1px;z-index:3;padding-bottom:10px;background:var(--panel,#111722)}
      .bella-ops-v20-head h2{margin:0}.bella-ops-v20-head p{margin:5px 0 0;color:var(--muted);font-size:10px;line-height:1.6}
      .bella-ops-v20-tabs{display:flex;gap:7px;overflow:auto;padding:8px 0 12px;position:sticky;top:64px;z-index:2;background:var(--panel,#111722)}
      .bella-ops-v20-tabs button{border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:8px 10px;background:rgba(255,255,255,.04);color:inherit;font:inherit;font-size:10px;font-weight:850;cursor:pointer;white-space:nowrap}.bella-ops-v20-tabs button.active{background:var(--accent);color:#fff;border-color:transparent}
      .bella-ops-v20-pane{display:none}.bella-ops-v20-pane.active{display:block}
      .bella-ops-v20-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.bella-ops-v20-box{padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}
      .bella-ops-v20-box h3{margin:0 0 4px;font-size:12px}.bella-ops-v20-box p{margin:0;color:var(--muted);font-size:9px;line-height:1.6}
      .bella-ops-v20-row{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}.bella-ops-v20-row:last-child{border-bottom:0}
      .bella-ops-v20-row b,.bella-ops-v20-row small{display:block}.bella-ops-v20-row b{font-size:10px}.bella-ops-v20-row small{font-size:8px;color:var(--muted);margin-top:2px}
      .bella-ops-v20-row select,.bella-ops-v20-field input,.bella-ops-v20-field textarea,.bella-ops-v20-field select{border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.05);color:inherit;padding:9px;font:inherit;outline:none}
      .bella-ops-v20-field{display:grid;gap:5px;margin-top:9px}.bella-ops-v20-field label{font-size:9px;font-weight:900}.bella-ops-v20-field input,.bella-ops-v20-field textarea,.bella-ops-v20-field select{width:100%;box-sizing:border-box}.bella-ops-v20-field textarea{min-height:82px;resize:vertical;line-height:1.6}
      .bella-ops-v20-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.bella-ops-v20-actions button,.bella-ops-v20-mini{border:1px solid rgba(255,255,255,.11);border-radius:11px;padding:9px 11px;background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:9px;font-weight:900;cursor:pointer}.bella-ops-v20-actions button.primary,.bella-ops-v20-mini.primary{background:var(--accent);color:#fff;border-color:transparent}.bella-ops-v20-actions button.danger,.bella-ops-v20-mini.danger{color:#ff9d98}
      .bella-ops-v20-state{margin-top:8px;font-size:9px;color:var(--muted);line-height:1.6}
      .bella-ops-v20-list{display:grid;gap:7px;margin-top:9px}.bella-ops-v20-item{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.02)}.bella-ops-v20-item small{display:block;color:var(--muted);font-size:8px;margin-top:3px;line-height:1.5}
      .bella-ops-v20-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.bella-ops-v20-metric{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;text-align:center}.bella-ops-v20-metric b{display:block;font-size:16px}.bella-ops-v20-metric span{font-size:8px;color:var(--muted)}
      @media(max-width:700px){.bella-ops-v20-grid{grid-template-columns:1fr}.bella-ops-v20-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.bella-ops-v20-tabs{top:62px}}
    `;
    document.head.appendChild(style);
  }

  async function loadState() {
    opsState = first(await rpc("bella_owner_ops_v20"));
    return opsState;
  }

  function modalShell() {
    document.getElementById("bellaOwnerOpsV20")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaOwnerOpsV20";
    modal.className = "vnext-modal";
    modal.innerHTML = `
      <div class="vnext-card bella-ops-v20-card">
        <div class="bella-ops-v20-head">
          <div><h2>Bella Ops OS v20 🇰🇼</h2><p>Feature Flags · Persona Tuner · Seasons · User 360 · Memories · Drops · Audit</p></div>
          <button class="vnext-ghost" data-close>✕</button>
        </div>
        <div class="bella-ops-v20-tabs">
          <button data-tab="flags" class="active">🚦 الميزات</button>
          <button data-tab="persona">🧠 الشخصية</button>
          <button data-tab="season">🏆 الموسم</button>
          <button data-tab="users">👤 User 360</button>
          <button data-tab="drops">🎁 Drops</button>
          <button data-tab="audit">↩️ السجل</button>
          <button data-tab="ai">📊 AI</button>
        </div>
        <section class="bella-ops-v20-pane active" data-pane="flags"></section>
        <section class="bella-ops-v20-pane" data-pane="persona"></section>
        <section class="bella-ops-v20-pane" data-pane="season"></section>
        <section class="bella-ops-v20-pane" data-pane="users"></section>
        <section class="bella-ops-v20-pane" data-pane="drops"></section>
        <section class="bella-ops-v20-pane" data-pane="audit"></section>
        <section class="bella-ops-v20-pane" data-pane="ai"></section>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    modal.querySelector("[data-close]").onclick = () => modal.remove();
    modal.querySelectorAll("[data-tab]").forEach(btn => {
      btn.onclick = () => {
        modal.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === btn));
        modal.querySelectorAll("[data-pane]").forEach(p => p.classList.toggle("active", p.dataset.pane === btn.dataset.tab));
        if (btn.dataset.tab === "audit") renderAudit(modal.querySelector('[data-pane="audit"]'));
        if (btn.dataset.tab === "ai") renderAi(modal.querySelector('[data-pane="ai"]'));
      };
    });
    return modal;
  }

  async function renderFlags(host) {
    const flags = opsState?.feature_flags || {};
    host.innerHTML = `<div class="bella-ops-v20-box"><h3>Feature Flags ثلاثية 🚦</h3><p>ON للجميع · BETA للمالك أثناء التجربة · OFF إيقاف. كل تغيير ينحفظ في Audit Log.</p><div data-flags></div><div class="bella-ops-v20-state" data-state>جاهز.</div></div>`;
    const list = host.querySelector("[data-flags]");
    const state = host.querySelector("[data-state]");
    for (const [key, item] of Object.entries(flags)) {
      const row = document.createElement("div");
      row.className = "bella-ops-v20-row";
      row.innerHTML = `<span><b>${esc(item.label || key)}</b><small>${esc(item.note || key)}</small></span>`;
      const select = document.createElement("select");
      [["on", "🟢 ON"], ["beta", "🧪 BETA"], ["off", "🔴 OFF"]].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      });
      select.value = item.mode || "on";
      select.onchange = async () => {
        select.disabled = true;
        state.textContent = `جاري تحديث ${item.label || key}…`;
        try {
          await rpc("bella_owner_set_feature_flag", { p_key: key, p_mode: select.value, p_note: item.note || "" });
          await loadState();
          await window.BellaFeatureControlsV3?.refresh?.(true);
          state.textContent = "تم التطبيق وحفظه في السجل ✅";
        } catch (error) {
          state.textContent = "تعذر حفظ الميزة.";
          select.value = item.mode || "on";
        } finally {
          select.disabled = false;
        }
      };
      row.appendChild(select);
      list.appendChild(row);
    }
  }

  function personaPayload(host) {
    const lines = String(host.querySelector("[data-blocked]")?.value || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, 40);
    return {
      p_enabled: host.querySelector("[data-enabled]")?.checked === true,
      p_system_overlay: String(host.querySelector("[data-overlay]")?.value || "").trim().slice(0, 6000),
      p_brevity: String(host.querySelector("[data-brevity]")?.value || "medium"),
      p_humor: Number(host.querySelector("[data-humor]")?.value || 1),
      p_warmth: Number(host.querySelector("[data-warmth]")?.value || 1),
      p_directness: Number(host.querySelector("[data-directness]")?.value || .35),
      p_dialect: Number(host.querySelector("[data-dialect]")?.value || .8),
      p_blocked_phrases: lines
    };
  }

  function renderPersona(host) {
    const p = opsState?.persona || {};
    host.innerHTML = `
      <div class="bella-ops-v20-grid">
        <div class="bella-ops-v20-box">
          <h3>Persona Tuner 🧠</h3><p>النبرة تتطبق على طلبات الشات، وSystem Overlay يدخل على تعليمات بيلا من السيرفر مع حدود أمان أعلى منه.</p>
          <div class="bella-ops-v20-field"><label><input type="checkbox" data-enabled ${p.enabled !== false ? "checked" : ""}> تفعيل التخصيص الحي</label></div>
          <div class="bella-ops-v20-field"><label>System Overlay</label><textarea data-overlay maxlength="6000" placeholder="مثال: خففي الإيموجي، لا تكررين نفس الافتتاحية...">${esc(p.system_overlay || "")}</textarea></div>
          <div class="bella-ops-v20-field"><label>عبارات تتجنبها بيلا — كل سطر عبارة</label><textarea data-blocked>${esc(Array.isArray(p.blocked_phrases) ? p.blocked_phrases.join("\n") : "")}</textarea></div>
        </div>
        <div class="bella-ops-v20-box">
          <h3>مقابض الأسلوب 🎚️</h3><p>هذه القيم تدخل مباشرة في styleProfile لكل رسالة.</p>
          <div class="bella-ops-v20-field"><label>طول الرد</label><select data-brevity><option value="short">قصير</option><option value="medium">متوسط</option><option value="long">أطول</option></select></div>
          <div class="bella-ops-v20-field"><label>المزح 0–3</label><input data-humor type="number" min="0" max="3" value="${Number(p.humor ?? 1)}"></div>
          <div class="bella-ops-v20-field"><label>الدفا 0–3</label><input data-warmth type="number" min="0" max="3" value="${Number(p.warmth ?? 1)}"></div>
          <div class="bella-ops-v20-field"><label>المباشرة 0–1</label><input data-directness type="number" min="0" max="1" step=".05" value="${Number(p.directness ?? .35)}"></div>
          <div class="bella-ops-v20-field"><label>قوة اللهجة 0–1</label><input data-dialect type="number" min="0" max="1" step=".05" value="${Number(p.dialect ?? .8)}"></div>
          <div class="bella-ops-v20-actions"><button class="primary" data-save>حفظ وتطبيق</button></div>
          <div class="bella-ops-v20-state" data-state>Revision ${Number(p.revision || 1)} · تحديثات System Overlay توصل لسيرفر AI خلال ثوانٍ قليلة.</div>
        </div>
      </div>`;
    host.querySelector("[data-brevity]").value = ["short", "medium", "long"].includes(p.brevity) ? p.brevity : "medium";
    host.querySelector("[data-save]").onclick = async () => {
      if (busy) return;
      busy = true;
      const state = host.querySelector("[data-state]");
      state.textContent = "جاري حفظ شخصية بيلا…";
      try {
        await rpc("bella_owner_update_persona_v20", personaPayload(host));
        await loadState();
        await window.BellaFeatureControlsV3?.refresh?.(true);
        renderPersona(host);
        toast("تم تحديث شخصية بيلا ✅");
      } catch (error) {
        state.textContent = "تعذر حفظ إعدادات الشخصية.";
      } finally {
        busy = false;
      }
    };
  }

  async function renderSeason(host) {
    const s = opsState?.current_season || {};
    host.innerHTML = `
      <div class="bella-ops-v20-grid">
        <div class="bella-ops-v20-box"><h3>${esc(s.name || "الموسم الحالي")} 🏆</h3><p>بداية: ${esc(fmtDate(s.starts_at))}. عند الإغلاق نحفظ أفضل 3، نوزع أوسمة، ونصفّر نقاط الموسم فقط.</p>
          <div class="bella-ops-v20-field"><label>اسم الموسم القادم</label><input data-next placeholder="مثال: موسم الديرة"></div>
          <div class="bella-ops-v20-actions"><button class="danger" data-close-season>إغلاق الموسم وبدء التالي</button></div>
          <div class="bella-ops-v20-state" data-state>XP ونقاط العمر ما تنمسح.</div>
        </div>
        <div class="bella-ops-v20-box"><h3>Top الموسم</h3><div class="bella-ops-v20-list" data-list><div class="bella-ops-v20-state">جاري التحميل…</div></div></div>
      </div>`;
    const list = host.querySelector("[data-list]");
    try {
      const rows = await rpc("bella_season_leaderboard_v20", { p_limit: 10 });
      list.innerHTML = (Array.isArray(rows) ? rows : []).map(r => `<div class="bella-ops-v20-item"><b>#${Number(r.place)} · ${esc(r.display_name || "لاعب")}</b><small>${Number(r.season_score || 0).toLocaleString("ar-KW")} نقطة موسمية</small></div>`).join("") || `<div class="bella-ops-v20-state">ما في نتائج للحين.</div>`;
    } catch {
      list.innerHTML = `<div class="bella-ops-v20-state">تعذر تحميل الترتيب.</div>`;
    }
    host.querySelector("[data-close-season]").onclick = async () => {
      const next = String(host.querySelector("[data-next]").value || "").trim();
      if (!confirm(`متأكد تبي تقفل ${s.name || "الموسم"} وتبدأ موسم جديد؟ نقاط الموسم بتنصفر فقط.`)) return;
      const state = host.querySelector("[data-state]");
      state.textContent = "جاري إغلاق الموسم وحفظ الفائزين…";
      try {
        const result = await rpc("bella_owner_close_season_v20", { p_next_name: next || null });
        const out = first(result);
        state.textContent = `تم ✅ حفظ ${Number(out.winners_saved || 0)} فائز وبدأ ${out.next_name || "الموسم الجديد"}.`;
        await loadState();
        await window.BellaFeatureControlsV3?.refresh?.(true);
        window.BellaSeasonV20?.refresh?.();
        renderSeason(host);
      } catch (error) {
        state.textContent = `تعذر إغلاق الموسم: ${error.message || "خطأ"}`;
      }
    };
  }

  async function renderUserDetail(host, user) {
    host.innerHTML = `<div class="bella-ops-v20-state">جاري تحميل User 360…</div>`;
    try {
      const detail = first(await rpc("bella_owner_user_360_v20", { p_user_id: user.user_id }));
      const memories = await rpc("bella_owner_memories_v20", { p_user_id: user.user_id, p_include_deleted: true });
      const p = detail.profile || {};
      const a = detail.admin || {};
      const g = detail.games || {};
      const badges = Array.isArray(detail.badges) ? detail.badges : [];
      host.innerHTML = `
        <div class="bella-ops-v20-box">
          <div class="bella-ops-v20-actions"><button data-back>← رجوع للبحث</button></div>
          <h3>${esc(p.display_name || user.display_name || "مستخدم")}</h3>
          <p>${esc(user.email || "بدون إيميل")} · XP ${Number(p.xp || 0)} · Level ${Number(p.level || 1)} · ${esc(a.account_status || "active")}</p>
          <div class="bella-ops-v20-metrics">
            <div class="bella-ops-v20-metric"><b>${Number(p.messages || 0)}</b><span>رسائل</span></div>
            <div class="bella-ops-v20-metric"><b>${Number(g.season_score || 0)}</b><span>نقاط الموسم</span></div>
            <div class="bella-ops-v20-metric"><b>${Number(detail.memory_count || 0)}</b><span>ذكريات</span></div>
            <div class="bella-ops-v20-metric"><b>${Number(detail.gift_count || 0)}</b><span>هدايا</span></div>
          </div>
          <div class="bella-ops-v20-field"><label>منح لقب/وسام</label><select data-badge><option value="">اختر الوسام</option>${BADGES.map(([k,t]) => `<option value="${k}">${esc(t)}</option>`).join("")}</select></div>
          <div class="bella-ops-v20-actions"><button class="primary" data-award>منح الوسام</button></div>
          <div class="bella-ops-v20-state">${badges.length ? `أوسمته: ${badges.map(b => `${b.icon || "🏅"} ${b.title}`).join(" · ")}` : "ما عنده أوسمة للحين."}</div>
        </div>
        <div class="bella-ops-v20-box" style="margin-top:9px"><h3>Memory Inspector 🧠</h3><p>تعديل/حذف ناعم مع Audit وRollback.</p><div class="bella-ops-v20-list" data-memories></div></div>`;
      host.querySelector("[data-back]").onclick = () => renderUsers(host);
      host.querySelector("[data-award]").onclick = async () => {
        const key = host.querySelector("[data-badge]").value;
        if (!key) return toast("اختر وسام أول.");
        try {
          await rpc("bella_owner_award_badge_v20", { p_user_id: user.user_id, p_badge_key: key, p_note: "من User 360" });
          toast("تم منح الوسام ✅");
          renderUserDetail(host, user);
        } catch { toast("تعذر منح الوسام."); }
      };

      const memoriesHost = host.querySelector("[data-memories]");
      const rows = Array.isArray(memories) ? memories : [];
      memoriesHost.innerHTML = "";
      if (!rows.length) memoriesHost.innerHTML = `<div class="bella-ops-v20-state">ما عنده ذكريات محفوظة.</div>`;
      rows.forEach(memory => {
        const item = document.createElement("div");
        item.className = "bella-ops-v20-item";
        item.innerHTML = `<b>${esc(memory.memory_key || memory.category || "memory")}${memory.deleted_at ? " · 🗑️ محذوفة" : ""}</b><small>${esc(memory.memory_text || "")}</small><small>${esc(memory.category || "بدون تصنيف")} · ${esc(fmtDate(memory.updated_at))}</small><div class="bella-ops-v20-actions"><button data-edit>تعديل</button><button class="danger" data-delete>حذف ناعم</button></div>`;
        item.querySelector("[data-edit]").onclick = async () => {
          const text = prompt("عدّل نص الذاكرة:", memory.memory_text || "");
          if (text === null) return;
          const category = prompt("التصنيف:", memory.category || "");
          if (category === null) return;
          try {
            await rpc("bella_owner_update_memory_v20", { p_memory_id: memory.id, p_text: text, p_category: category });
            toast("تم تعديل الذاكرة ✅");
            renderUserDetail(host, user);
          } catch { toast("تعذر تعديل الذاكرة."); }
        };
        item.querySelector("[data-delete]").onclick = async () => {
          if (!confirm("حذف هالذاكرة حذف ناعم؟ تقدر ترجعها من Audit Rollback.")) return;
          try {
            await rpc("bella_owner_delete_memory_v20", { p_memory_id: memory.id, p_reason: "Owner Memory Inspector" });
            toast("تم حذف الذاكرة ✅");
            renderUserDetail(host, user);
          } catch { toast("تعذر حذف الذاكرة."); }
        };
        memoriesHost.appendChild(item);
      });
    } catch (error) {
      host.innerHTML = `<div class="bella-ops-v20-state">تعذر تحميل User 360.</div>`;
    }
  }

  function renderUsers(host) {
    host.innerHTML = `
      <div class="bella-ops-v20-box"><h3>User 360° 👤</h3><p>ابحث بالاسم أو الإيميل، بعدها شوف الملف والذكريات والأوسمة من مكان واحد.</p>
        <div class="bella-ops-v20-field"><label>بحث</label><input data-search placeholder="اسم أو إيميل"></div>
        <div class="bella-ops-v20-actions"><button class="primary" data-go>بحث</button></div>
        <div class="bella-ops-v20-state" data-state>—</div><div class="bella-ops-v20-list" data-list></div>
      </div>`;
    const go = async () => {
      const q = String(host.querySelector("[data-search]").value || "").trim();
      const state = host.querySelector("[data-state]");
      const list = host.querySelector("[data-list]");
      if (!q) { state.textContent = "اكتب اسم أو إيميل."; return; }
      state.textContent = "جاري البحث…";
      try {
        const rows = await rpc("bella_owner_users_v2", { p_search: q, p_limit: 30, p_offset: 0 });
        const users = Array.isArray(rows) ? rows : [];
        list.innerHTML = "";
        users.forEach(user => {
          const item = document.createElement("div");
          item.className = "bella-ops-v20-item";
          item.innerHTML = `<b>${esc(user.display_name || "مستخدم")}</b><small>${esc(user.email || "بدون إيميل")} · XP ${Number(user.xp || 0)} · Level ${Number(user.level || 1)}</small><div class="bella-ops-v20-actions"><button class="primary">فتح User 360</button></div>`;
          item.querySelector("button").disabled = user.is_owner === true;
          item.querySelector("button").onclick = () => renderUserDetail(host, user);
          list.appendChild(item);
        });
        state.textContent = users.length ? `لقيت ${users.length} حساب.` : "ما لقيت حساب.";
      } catch {
        state.textContent = "تعذر البحث.";
      }
    };
    host.querySelector("[data-go]").onclick = go;
    host.querySelector("[data-search]").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  }

  function renderDrops(host) {
    host.innerHTML = `
      <div class="bella-ops-v20-grid">
        <div class="bella-ops-v20-box"><h3>Global Drop / Airdrop 🎁</h3><p>يرسل XP/رسالة/وسام لكل الحسابات النشطة دفعة واحدة. الحسابات الموقوفة مستثناة.</p>
          <div class="bella-ops-v20-field"><label>XP لكل مستخدم</label><input data-xp type="number" min="0" max="5000" value="250"></div>
          <div class="bella-ops-v20-field"><label>وسام اختياري</label><select data-badge><option value="">بدون وسام</option>${BADGES.map(([k,t]) => `<option value="${k}">${esc(t)}</option>`).join("")}</select></div>
          <div class="bella-ops-v20-field"><label>عنوان الهدية</label><input data-label value="هدية جماعية من بيلا 🎁" maxlength="120"></div>
          <div class="bella-ops-v20-field"><label>الرسالة</label><textarea data-message maxlength="500" placeholder="مثال: بمناسبة بداية الموسم الجديد ✨"></textarea></div>
          <div class="bella-ops-v20-field"><label>سبب إداري</label><input data-reason maxlength="240" placeholder="يظهر في Audit Log"></div>
          <div class="bella-ops-v20-actions"><button class="primary" data-send>إرسال الـDrop</button></div><div class="bella-ops-v20-state" data-state>—</div>
        </div>
        <div class="bella-ops-v20-box"><h3>حماية الإساءة 🛡️</h3><p>API الشات عنده Rate Limit مستقل: 36 طلب/10 دقائق لكل IP، والبحث الحي 10/10 دقائق. الـSystem Overlay محمي من تعليمات الذاكرة/المستخدم الأعلى منه، وAI Daily Limit موجود من لوحة v19.</p></div>
      </div>`;
    host.querySelector("[data-send]").onclick = async () => {
      const xp = Math.max(0, Math.min(5000, Number(host.querySelector("[data-xp]").value) || 0));
      const badge = host.querySelector("[data-badge]").value || null;
      const label = host.querySelector("[data-label]").value.trim();
      const message = host.querySelector("[data-message]").value.trim();
      const reason = host.querySelector("[data-reason]").value.trim();
      if (!confirm(`إرسال Drop لكل المستخدمين النشطين؟ XP لكل شخص: ${xp}${badge ? " + وسام" : ""}`)) return;
      const state = host.querySelector("[data-state]");
      state.textContent = "جاري توزيع الـDrop…";
      try {
        const result = first(await rpc("bella_owner_global_drop_v20", { p_xp: xp, p_badge_key: badge, p_label: label, p_message: message, p_reason: reason }));
        state.textContent = `تم ✅ تحديث ${Number(result.profiles_updated || 0)} حساب وإرسال ${Number(result.gifts_sent || 0)} هدية.`;
      } catch (error) {
        state.textContent = `تعذر إرسال الـDrop: ${error.message || "خطأ"}`;
      }
    };
  }

  async function renderAudit(host) {
    host.innerHTML = `<div class="bella-ops-v20-box"><h3>Audit + Rollback ↩️</h3><p>الرجوع متاح تلقائيًا للتغييرات الآمنة في v20: Feature Flags، Persona، والذكريات.</p><div class="bella-ops-v20-state" data-state>جاري التحميل…</div><div class="bella-ops-v20-list" data-list></div></div>`;
    const state = host.querySelector("[data-state]");
    const list = host.querySelector("[data-list]");
    try {
      const rows = await rpc("bella_owner_audit_v20", { p_limit: 60, p_offset: 0 });
      const data = Array.isArray(rows) ? rows : [];
      list.innerHTML = "";
      data.forEach(row => {
        const item = document.createElement("div");
        item.className = "bella-ops-v20-item";
        item.innerHTML = `<b>${esc(row.action)} · ${esc(row.target_display_name || "—")}</b><small>${esc(fmtDate(row.created_at))}${row.reason ? ` · ${esc(row.reason)}` : ""}${row.rolled_back_at ? ` · تم الرجوع ${esc(fmtDate(row.rolled_back_at))}` : ""}</small>`;
        if (row.rollback_available) {
          const actions = document.createElement("div");
          actions.className = "bella-ops-v20-actions";
          const button = document.createElement("button");
          button.textContent = "Rollback";
          button.className = "danger";
          button.onclick = async () => {
            if (!confirm(`ترجع التغيير ${row.action}؟`)) return;
            button.disabled = true;
            try {
              await rpc("bella_owner_rollback_v20", { p_audit_id: row.id });
              toast("تم الـRollback ✅");
              await loadState();
              await window.BellaFeatureControlsV3?.refresh?.(true);
              renderAudit(host);
            } catch {
              toast("تعذر الـRollback.");
              button.disabled = false;
            }
          };
          actions.appendChild(button);
          item.appendChild(actions);
        }
        list.appendChild(item);
      });
      state.textContent = data.length ? `آخر ${data.length} حركة.` : "السجل فاضي.";
    } catch {
      state.textContent = "تعذر تحميل السجل.";
    }
  }

  async function renderAi(host) {
    host.innerHTML = `<div class="bella-ops-v20-box"><h3>AI Usage 📊</h3><p>التوكنز هنا تقدير تشغيلي مبني على متوسط 700 للشات و1200 للبحث الحي، مو فاتورة OpenAI الفعلية.</p><div class="bella-ops-v20-metrics" data-metrics></div><div class="bella-ops-v20-list" data-list></div></div>`;
    const metrics = host.querySelector("[data-metrics]");
    const list = host.querySelector("[data-list]");
    try {
      const rows = await rpc("bella_owner_ai_usage_v20", { p_days: 14 });
      const data = Array.isArray(rows) ? rows : [];
      const totals = data.reduce((a, r) => ({
        req: a.req + Number(r.requests || 0),
        chat: a.chat + Number(r.chat_requests || 0),
        web: a.web + Number(r.live_web_requests || 0),
        tokens: a.tokens + Number(r.estimated_tokens || 0)
      }), { req: 0, chat: 0, web: 0, tokens: 0 });
      metrics.innerHTML = `
        <div class="bella-ops-v20-metric"><b>${totals.req.toLocaleString("ar-KW")}</b><span>طلبات / 14 يوم</span></div>
        <div class="bella-ops-v20-metric"><b>${totals.chat.toLocaleString("ar-KW")}</b><span>شات</span></div>
        <div class="bella-ops-v20-metric"><b>${totals.web.toLocaleString("ar-KW")}</b><span>بحث حي</span></div>
        <div class="bella-ops-v20-metric"><b>${totals.tokens.toLocaleString("ar-KW")}</b><span>توكن تقديري</span></div>`;
      list.innerHTML = data.map(r => `<div class="bella-ops-v20-item"><b>${esc(r.usage_day)}</b><small>${Number(r.requests || 0)} طلب · ${Number(r.chat_requests || 0)} شات · ${Number(r.live_web_requests || 0)} ويب · ~${Number(r.estimated_tokens || 0).toLocaleString("ar-KW")} توكن</small></div>`).join("");
    } catch {
      list.innerHTML = `<div class="bella-ops-v20-state">تعذر تحميل استخدام AI.</div>`;
    }
  }

  async function open() {
    if (!window.BellaOwnerCenter?.isOwner?.()) {
      toast("حساب المالك مطلوب.");
      return;
    }
    styles();
    const modal = modalShell();
    const flags = modal.querySelector('[data-pane="flags"]');
    flags.innerHTML = `<div class="bella-ops-v20-state">جاري تحميل Ops OS v20…</div>`;
    try {
      await loadState();
      await renderFlags(flags);
      renderPersona(modal.querySelector('[data-pane="persona"]'));
      await renderSeason(modal.querySelector('[data-pane="season"]'));
      renderUsers(modal.querySelector('[data-pane="users"]'));
      renderDrops(modal.querySelector('[data-pane="drops"]'));
      modal.querySelector('[data-pane="audit"]').innerHTML = `<div class="bella-ops-v20-state">افتح التبويب لتحميل السجل.</div>`;
      modal.querySelector('[data-pane="ai"]').innerHTML = `<div class="bella-ops-v20-state">افتح التبويب لتحميل استخدام AI.</div>`;
    } catch (error) {
      flags.innerHTML = `<div class="bella-ops-v20-state">تعذر تحميل v20. ${error?.status === 403 ? "حساب المالك مطلوب." : ""}</div>`;
    }
  }

  async function install(card) {
    if (!card || card.querySelector("[data-bella-owner-v20]")) return false;
    if (!window.BellaOwnerCenter?.isOwner?.()) return false;
    styles();
    const box = document.createElement("section");
    box.className = "bella-owner-v20-launch";
    box.dataset.bellaOwnerV20 = "1";
    box.innerHTML = `<h3>Bella Ops OS v20 🚀</h3><p>غرفة التحكم الجديدة: BETA flags، شخصية بيلا الحية، المواسم والألقاب، User 360، الذاكرة، Drops والـRollback.</p><button type="button">فتح Ops OS v20</button>`;
    box.querySelector("button").onclick = open;
    card.insertBefore(box, card.firstChild?.nextSibling || card.firstChild || null);
    return true;
  }

  function observe() {
    const tryInstall = root => {
      const modal = root?.id === "bellaOwnerCenter" ? root : root?.querySelector?.("#bellaOwnerCenter");
      const card = modal?.querySelector?.(".bella-owner-card");
      if (card) queueMicrotask(() => install(card));
    };
    document.querySelectorAll("#bellaOwnerCenter .bella-owner-card").forEach(card => install(card));
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) tryInstall(node);
        }
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
    setTimeout(() => document.querySelectorAll("#bellaOwnerCenter .bella-owner-card").forEach(card => install(card)), 1200);
  }

  window.BellaOwnerOpsV20 = Object.freeze({ open, install, refresh: loadState });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})();