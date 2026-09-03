(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const PAGE_SIZE = 30;

  let offset = 0;
  let search = "";
  let loading = false;

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function token() {
    return String(readSession()?.access_token || "");
  }

  function headers() {
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json"
    };
  }

  async function rpc(name, payload = {}) {
    if (!token()) throw new Error("owner session unavailable");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: headers(),
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

  function dateLabel(value) {
    const date = new Date(value || "");
    if (!Number.isFinite(date.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("ar-KW", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  function compact(value) {
    const n = Math.max(0, Number(value) || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(Math.floor(n));
  }

  function ensureStyles() {
    if (document.getElementById("bellaOwnerUsersStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaOwnerUsersStyles";
    style.textContent = `
      .bella-owner-users-card{max-width:min(900px,95vw)!important;max-height:min(88dvh,940px);overflow:auto;text-align:right}
      .bella-owner-users-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
      .bella-owner-users-head h2{margin:0}.bella-owner-users-head p{margin:5px 0 0;color:var(--muted);font-size:11px;line-height:1.7}
      .bella-owner-users-actions{display:flex;gap:8px;flex-wrap:wrap}.bella-owner-users-actions button,.bella-owner-manage-btn,.bella-owner-user-action{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:9px 11px;background:rgba(255,255,255,.06);color:inherit;font:inherit;font-weight:850;cursor:pointer}
      .bella-owner-users-actions .primary,.bella-owner-user-action.primary{background:var(--accent);border-color:transparent;color:#fff}
      .bella-owner-users-toolbar{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0}.bella-owner-users-toolbar input{min-width:0;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.05);color:inherit;padding:11px;font:inherit}
      .bella-owner-users-list{display:grid;gap:8px}.bella-owner-users-row{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(80px,.55fr)) auto;gap:8px;align-items:center;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:11px;background:rgba(255,255,255,.035)}
      .bella-owner-users-main{min-width:0}.bella-owner-users-main b,.bella-owner-users-main small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bella-owner-users-main small{color:var(--muted);font-size:10px;margin-top:3px}
      .bella-owner-users-metric{display:grid;gap:2px}.bella-owner-users-metric small{font-size:9px;color:var(--muted)}.bella-owner-users-metric b{font-size:11px}
      .bella-owner-status{display:inline-flex;width:max-content;align-items:center;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:900;border:1px solid rgba(255,255,255,.11)}.bella-owner-status.active{background:rgba(80,210,145,.09)}.bella-owner-status.suspended{background:rgba(255,90,90,.1)}.bella-owner-status.owner{background:rgba(255,196,80,.1)}
      .bella-owner-user-detail{display:grid;gap:10px}.bella-owner-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.bella-owner-detail-box{padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.035)}.bella-owner-detail-box small{display:block;color:var(--muted);font-size:9px}.bella-owner-detail-box b{display:block;margin-top:3px;font-size:12px}
      .bella-owner-role-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.bella-owner-role-row label{display:grid;gap:5px;font-size:10px;color:var(--muted)}.bella-owner-role-row select{border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.06);color:inherit;padding:10px;font:inherit}
      .bella-owner-danger{border-color:rgba(255,90,90,.25)!important;background:rgba(255,90,90,.08)!important}.bella-owner-users-note{font-size:10px;color:var(--muted);line-height:1.7}.bella-owner-users-error{padding:10px;border:1px solid rgba(255,90,90,.2);background:rgba(255,90,90,.08);border-radius:12px;font-size:11px}
      .bella-owner-audit{display:grid;gap:8px}.bella-owner-audit-row{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.03)}.bella-owner-audit-row b{display:block}.bella-owner-audit-row small{display:block;color:var(--muted);font-size:10px;margin-top:4px}
      @media(max-width:700px){.bella-owner-users-row{grid-template-columns:1fr 1fr}.bella-owner-users-main{grid-column:1/-1}.bella-owner-manage-btn{grid-column:1/-1}.bella-owner-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bella-owner-users-toolbar,.bella-owner-role-row{grid-template-columns:1fr}.bella-owner-users-head{flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function shell() {
    document.getElementById("bellaOwnerUsersModal")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaOwnerUsersModal";
    modal.className = "vnext-modal";
    modal.innerHTML = `<div class="vnext-card bella-owner-users-card" role="dialog" aria-modal="true" aria-labelledby="bellaOwnerUsersTitle"></div>`;
    modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    return modal.querySelector(".bella-owner-users-card");
  }

  function metric(label, value) {
    const box = document.createElement("div");
    box.className = "bella-owner-users-metric";
    box.innerHTML = `<small></small><b></b>`;
    box.querySelector("small").textContent = label;
    box.querySelector("b").textContent = value;
    return box;
  }

  function statusBadge(row) {
    const badge = document.createElement("span");
    badge.className = `bella-owner-status ${row.is_owner ? "owner" : row.account_status === "suspended" ? "suspended" : "active"}`;
    badge.textContent = row.is_owner ? "OWNER" : row.account_status === "suspended" ? "موقوف" : row.staff_role === "moderator" ? "مشرف" : "نشط";
    return badge;
  }

  async function openList() {
    if (!window.BellaOwnerCenter?.isOwner?.()) {
      try { await window.BellaOwnerCenter?.refresh?.(); } catch {}
    }
    if (!window.BellaOwnerCenter?.isOwner?.()) {
      window.showToast?.("هذي الصفحة للمالك فقط 🛡️");
      return false;
    }

    ensureStyles();
    document.getElementById("bellaOwnerCenter")?.remove();
    offset = 0;
    search = "";
    const card = shell();
    card.innerHTML = `
      <div class="bella-owner-users-head"><div><h2 id="bellaOwnerUsersTitle">إدارة المستخدمين 👥</h2><p>حالة الحسابات والصلاحيات وسجل التغييرات. ما نعرض نص المحادثات.</p></div><div class="bella-owner-users-actions"><button data-audit>سجل الإدارة</button><button data-back>رجوع</button><button data-close>إغلاق</button></div></div>
      <div class="bella-owner-users-toolbar"><input data-search maxlength="100" placeholder="ابحث بالاسم أو الإيميل"><button class="bella-owner-user-action primary" data-search-btn>بحث</button></div>
      <div data-error hidden class="bella-owner-users-error"></div>
      <div data-list class="bella-owner-users-list"><div class="bella-owner-users-note">جاري تحميل الحسابات...</div></div>
      <div class="bella-owner-users-actions" style="margin-top:10px"><button data-prev>السابق</button><button data-next>التالي</button><span data-page class="bella-owner-users-note"></span></div>
      <p class="bella-owner-users-note">إيقاف الحساب يمنع الحساب المسجل من استخدام AI والمزامنة السحابية وهو مسجل دخول. وضع الضيف يظل منفصلًا لأن بيلا تسمح بالاستخدام بدون حساب.</p>`;

    card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();
    card.querySelector("[data-back]").onclick = () => { card.closest(".vnext-modal")?.remove(); window.BellaOwnerCenter?.open?.(); };
    card.querySelector("[data-audit]").onclick = () => openAudit();
    const runSearch = () => { search = card.querySelector("[data-search]").value.trim(); offset = 0; loadUsers(card); };
    card.querySelector("[data-search-btn]").onclick = runSearch;
    card.querySelector("[data-search]").addEventListener("keydown", event => { if (event.key === "Enter") runSearch(); });
    card.querySelector("[data-prev]").onclick = () => { if (offset > 0) { offset = Math.max(0, offset - PAGE_SIZE); loadUsers(card); } };
    card.querySelector("[data-next]").onclick = () => { offset += PAGE_SIZE; loadUsers(card); };
    await loadUsers(card);
    return true;
  }

  async function loadUsers(card) {
    if (loading) return;
    loading = true;
    const list = card.querySelector("[data-list]");
    const error = card.querySelector("[data-error]");
    const prev = card.querySelector("[data-prev]");
    const next = card.querySelector("[data-next]");
    error.hidden = true;
    list.innerHTML = `<div class="bella-owner-users-note">جاري التحديث...</div>`;
    try {
      const rows = await rpc("bella_owner_users_v2", { p_search: search, p_limit: PAGE_SIZE, p_offset: offset });
      const data = Array.isArray(rows) ? rows : [];
      list.replaceChildren();
      if (!data.length) {
        const empty = document.createElement("div");
        empty.className = "bella-owner-users-note";
        empty.textContent = "ما لقيت حسابات بهالصفحة.";
        list.appendChild(empty);
      }
      for (const row of data) {
        const article = document.createElement("article");
        article.className = "bella-owner-users-row";
        const main = document.createElement("div");
        main.className = "bella-owner-users-main";
        const name = document.createElement("b"); name.textContent = row.display_name || "مستخدم";
        const email = document.createElement("small"); email.textContent = row.email || "بدون إيميل";
        const activity = document.createElement("small"); activity.textContent = `آخر نشاط: ${dateLabel(row.last_activity_at || row.last_sign_in_at)}`;
        main.append(name, email, activity, statusBadge(row));
        const manage = document.createElement("button");
        manage.className = "bella-owner-manage-btn";
        manage.textContent = row.is_owner ? "حساب المالك" : "إدارة";
        manage.disabled = row.is_owner === true;
        manage.onclick = () => openDetail(row.user_id);
        article.append(main, metric("Level", compact(row.level)), metric("XP", compact(row.xp)), metric("رسائل", compact(row.messages)), manage);
        list.appendChild(article);
      }
      const total = Number(data[0]?.total_count || 0);
      const start = total ? offset + 1 : 0;
      const end = Math.min(total, offset + data.length);
      card.querySelector("[data-page]").textContent = `${start}–${end} من ${total}`;
      prev.disabled = offset <= 0;
      next.disabled = offset + PAGE_SIZE >= total;
    } catch (e) {
      error.hidden = false;
      error.textContent = "تعذر تحميل المستخدمين. جرّب مرة ثانية.";
      list.replaceChildren();
    } finally {
      loading = false;
    }
  }

  async function openDetail(userId) {
    const card = shell();
    card.innerHTML = `<div class="bella-owner-users-note">جاري تحميل الحساب...</div>`;
    try {
      const rows = await rpc("bella_owner_user_detail", { p_user_id: userId });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) throw new Error("user not found");
      const suspended = row.account_status === "suspended";
      card.innerHTML = `
        <div class="bella-owner-users-head"><div><h2 id="bellaOwnerUsersTitle"></h2><p data-email></p></div><div class="bella-owner-users-actions"><button data-back>رجوع</button><button data-close>إغلاق</button></div></div>
        <div class="bella-owner-detail-grid" data-grid></div>
        <div class="bella-owner-role-row"><label>الصلاحية<select data-role><option value="user">مستخدم</option><option value="moderator">مشرف</option></select></label><button class="bella-owner-user-action" data-save-role>حفظ الصلاحية</button></div>
        <div class="bella-owner-users-actions"><button class="bella-owner-user-action ${suspended ? "primary" : "bella-owner-danger"}" data-toggle-status>${suspended ? "إرجاع الحساب" : "إيقاف الحساب"}</button></div>
        <div data-error hidden class="bella-owner-users-error"></div>
        <p class="bella-owner-users-note" data-note></p>`;
      card.querySelector("h2").textContent = `${row.display_name || "مستخدم"} 👤`;
      card.querySelector("[data-email]").textContent = row.email || "بدون إيميل";
      const grid = card.querySelector("[data-grid]");
      const boxes = [
        ["الحالة", suspended ? "موقوف" : "نشط"], ["Level", compact(row.level)], ["XP", compact(row.xp)], ["الرسائل", compact(row.messages)],
        ["الذكريات", compact(row.memories)], ["نشاط 30 يوم", compact(row.events_30d)], ["آخر نشاط", dateLabel(row.last_activity_at || row.last_sign_in_at)], ["انضم", dateLabel(row.created_at)]
      ];
      for (const [label, value] of boxes) {
        const box = document.createElement("div"); box.className = "bella-owner-detail-box";
        const small = document.createElement("small"); small.textContent = label;
        const strong = document.createElement("b"); strong.textContent = value;
        box.append(small, strong); grid.appendChild(box);
      }
      card.querySelector("[data-role]").value = row.staff_role || "user";
      card.querySelector("[data-note]").textContent = suspended && row.suspended_reason ? `سبب الإيقاف: ${row.suspended_reason}` : "كل تغيير هنا ينحفظ تلقائيًا في سجل الإدارة.";
      card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();
      card.querySelector("[data-back]").onclick = () => openList();
      card.querySelector("[data-save-role]").onclick = async () => {
        await manage(card, userId, "set_role", card.querySelector("[data-role]").value, "تغيير صلاحية من مركز المالك");
      };
      card.querySelector("[data-toggle-status]").onclick = async () => {
        if (suspended) return manage(card, userId, "unsuspend", null, "إرجاع الحساب من مركز المالك");
        const reason = window.prompt("سبب الإيقاف؟ (اختياري)", "") ?? null;
        if (reason === null) return;
        return manage(card, userId, "suspend", null, reason);
      };
    } catch {
      card.innerHTML = `<div class="bella-owner-users-error">تعذر فتح الحساب.</div><div class="bella-owner-users-actions" style="margin-top:10px"><button data-back>رجوع</button></div>`;
      card.querySelector("[data-back]").onclick = () => openList();
    }
  }

  async function manage(card, userId, action, value, reason) {
    const error = card.querySelector("[data-error]");
    error.hidden = true;
    card.querySelectorAll("button,select").forEach(el => { el.disabled = true; });
    try {
      await rpc("bella_owner_manage_user", { p_user_id: userId, p_action: action, p_value: value, p_reason: reason });
      window.showToast?.("تم حفظ التغيير ✅");
      await openDetail(userId);
    } catch (e) {
      error.hidden = false;
      error.textContent = e?.message?.includes("owner account") ? "ما تقدر تعدل حساب المالك من هنا." : "تعذر حفظ التغيير.";
      card.querySelectorAll("button,select").forEach(el => { el.disabled = false; });
    }
  }

  async function openAudit() {
    const card = shell();
    card.innerHTML = `<div class="bella-owner-users-head"><div><h2 id="bellaOwnerUsersTitle">سجل الإدارة 📋</h2><p>سجل تغييرات الحالات والصلاحيات فقط، بدون محادثات.</p></div><div class="bella-owner-users-actions"><button data-back>رجوع</button><button data-close>إغلاق</button></div></div><div data-audit-list class="bella-owner-audit"><div class="bella-owner-users-note">جاري التحميل...</div></div>`;
    card.querySelector("[data-back]").onclick = () => openList();
    card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();
    try {
      const rows = await rpc("bella_owner_audit", { p_limit: 60, p_offset: 0 });
      const host = card.querySelector("[data-audit-list]");
      host.replaceChildren();
      for (const row of Array.isArray(rows) ? rows : []) {
        const item = document.createElement("article");
        item.className = "bella-owner-audit-row";
        const title = document.createElement("b");
        const action = row.action === "suspend" ? "إيقاف حساب" : row.action === "unsuspend" ? "إرجاع حساب" : "تغيير صلاحية";
        title.textContent = `${action} — ${row.target_display_name || "مستخدم"}`;
        const meta = document.createElement("small"); meta.textContent = dateLabel(row.created_at);
        const reason = document.createElement("small"); reason.textContent = row.reason ? `السبب: ${row.reason}` : "بدون سبب مكتوب";
        item.append(title, meta, reason); host.appendChild(item);
      }
      if (!host.childElementCount) host.innerHTML = `<div class="bella-owner-users-note">ما فيه تغييرات إدارية للحين.</div>`;
    } catch {
      card.querySelector("[data-audit-list]").innerHTML = `<div class="bella-owner-users-error">تعذر تحميل سجل الإدارة.</div>`;
    }
  }

  function injectOwnerUsersButton() {
    if (!window.BellaOwnerCenter?.isOwner?.()) return;
    const center = document.getElementById("bellaOwnerCenter");
    if (!center || center.querySelector("[data-owner-users-manage]")) return;
    const toolbar = center.querySelector(".bella-owner-toolbar") || center.querySelector(".bella-owner-head");
    if (!toolbar) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.ownerUsersManage = "1";
    button.textContent = "👥 إدارة المستخدمين";
    button.onclick = () => openList();
    toolbar.appendChild(button);
  }

  const observer = new MutationObserver(() => injectOwnerUsersButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(injectOwnerUsersButton, 500);

  window.BellaOwnerUsers = Object.freeze({
    open: openList,
    audit: openAudit
  });
})();
