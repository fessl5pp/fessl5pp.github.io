(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const PAGE_SIZE = 30;

  let allowed = false;
  let checked = false;
  let loading = false;
  let offset = 0;
  let search = "";

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
    if (!token()) throw new Error("moderator session unavailable");
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

  async function verify(force = false) {
    if (checked && !force) return allowed;
    if (!token()) {
      allowed = false;
      checked = true;
      removeButtons();
      return false;
    }
    try {
      const result = await rpc("is_bella_moderator");
      allowed = result === true || result === "true" || result?.is_bella_moderator === true;
    } catch {
      allowed = false;
    }
    checked = true;
    if (allowed) installButton();
    else removeButtons();
    return allowed;
  }

  function compact(value) {
    const n = Math.max(0, Number(value) || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(Math.floor(n));
  }

  function dateLabel(value) {
    const date = new Date(value || "");
    if (!Number.isFinite(date.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("ar-KW", {
        year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  function ensureStyles() {
    if (document.getElementById("bellaModeratorCenterStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaModeratorCenterStyles";
    style.textContent = `
      .bella-mod-card{max-width:min(860px,95vw)!important;max-height:min(88dvh,940px);overflow:auto;text-align:right}
      .bella-mod-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.bella-mod-head h2{margin:0}.bella-mod-head p{margin:5px 0 0;color:var(--muted);font-size:11px;line-height:1.7}
      .bella-mod-actions{display:flex;gap:8px;flex-wrap:wrap}.bella-mod-actions button,.bella-mod-manage,.bella-mod-action{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:9px 11px;background:rgba(255,255,255,.06);color:inherit;font:inherit;font-weight:850;cursor:pointer}.bella-mod-action.primary{background:var(--accent);border-color:transparent;color:#fff}.bella-mod-action.danger{border-color:rgba(255,90,90,.25);background:rgba(255,90,90,.08)}
      .bella-mod-toolbar{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0}.bella-mod-toolbar input{min-width:0;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.05);color:inherit;padding:11px;font:inherit}
      .bella-mod-list{display:grid;gap:8px}.bella-mod-row{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(75px,.55fr)) auto;gap:8px;align-items:center;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:11px;background:rgba(255,255,255,.035)}
      .bella-mod-main{min-width:0}.bella-mod-main b,.bella-mod-main small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bella-mod-main small{color:var(--muted);font-size:10px;margin-top:3px}.bella-mod-metric{display:grid;gap:2px}.bella-mod-metric small{font-size:9px;color:var(--muted)}.bella-mod-metric b{font-size:11px}
      .bella-mod-badge{display:inline-flex;width:max-content;margin-top:5px;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:900;border:1px solid rgba(255,255,255,.11)}.bella-mod-badge.active{background:rgba(80,210,145,.09)}.bella-mod-badge.suspended{background:rgba(255,90,90,.1)}.bella-mod-badge.protected{background:rgba(255,196,80,.1)}
      .bella-mod-detail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.bella-mod-box{padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.035)}.bella-mod-box small{display:block;color:var(--muted);font-size:9px}.bella-mod-box b{display:block;margin-top:3px;font-size:12px}
      .bella-mod-note{font-size:10px;color:var(--muted);line-height:1.7}.bella-mod-error{padding:10px;border:1px solid rgba(255,90,90,.2);background:rgba(255,90,90,.08);border-radius:12px;font-size:11px}.bella-mod-audit{display:grid;gap:8px}.bella-mod-audit-row{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.03)}.bella-mod-audit-row b{display:block}.bella-mod-audit-row small{display:block;color:var(--muted);font-size:10px;margin-top:4px}
      @media(max-width:700px){.bella-mod-row{grid-template-columns:1fr 1fr}.bella-mod-main{grid-column:1/-1}.bella-mod-manage{grid-column:1/-1}.bella-mod-detail{grid-template-columns:repeat(2,minmax(0,1fr))}.bella-mod-toolbar{grid-template-columns:1fr}.bella-mod-head{flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function shell() {
    document.getElementById("bellaModeratorCenter")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaModeratorCenter";
    modal.className = "vnext-modal";
    modal.innerHTML = `<div class="vnext-card bella-mod-card" role="dialog" aria-modal="true" aria-labelledby="bellaModeratorTitle"></div>`;
    modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    return modal.querySelector(".bella-mod-card");
  }

  function metric(label, value) {
    const box = document.createElement("div");
    box.className = "bella-mod-metric";
    const small = document.createElement("small"); small.textContent = label;
    const strong = document.createElement("b"); strong.textContent = value;
    box.append(small, strong);
    return box;
  }

  function statusBadge(row) {
    const badge = document.createElement("span");
    const protectedAccount = row.is_owner || row.staff_role === "moderator";
    badge.className = `bella-mod-badge ${protectedAccount ? "protected" : row.account_status === "suspended" ? "suspended" : "active"}`;
    badge.textContent = row.is_owner ? "المالك" : row.staff_role === "moderator" ? "مشرف" : row.account_status === "suspended" ? "موقوف" : "نشط";
    return badge;
  }

  async function open() {
    if (!await verify(true)) {
      window.showToast?.("هذي الصفحة للمشرفين فقط 🧰");
      return false;
    }

    ensureStyles();
    offset = 0;
    search = "";
    const card = shell();
    card.innerHTML = `
      <div class="bella-mod-head"><div><h2 id="bellaModeratorTitle">مركز الإشراف 🧰</h2><p>مراجعة الحسابات بصلاحيات محدودة. ما نعرض الإيميلات أو نص المحادثات.</p></div><div class="bella-mod-actions"><button data-audit>سجلي</button><button data-close>إغلاق</button></div></div>
      <div class="bella-mod-toolbar"><input data-search maxlength="100" placeholder="ابحث باسم المستخدم"><button class="bella-mod-action primary" data-search-btn>بحث</button></div>
      <div data-error hidden class="bella-mod-error"></div>
      <div data-list class="bella-mod-list"><div class="bella-mod-note">جاري تحميل الحسابات...</div></div>
      <div class="bella-mod-actions" style="margin-top:10px"><button data-prev>السابق</button><button data-next>التالي</button><span data-page class="bella-mod-note"></span></div>
      <p class="bella-mod-note">المشرف يقدر يوقف ويرجع الحسابات العادية فقط. حساب المالك والمشرفين محمي، وتغيير الرتب وإعدادات النظام تبقى للمالك.</p>`;

    card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();
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
    list.innerHTML = `<div class="bella-mod-note">جاري التحديث...</div>`;
    try {
      const rows = await rpc("bella_moderator_users", { p_search: search, p_limit: PAGE_SIZE, p_offset: offset });
      const data = Array.isArray(rows) ? rows : [];
      list.replaceChildren();
      if (!data.length) {
        const empty = document.createElement("div"); empty.className = "bella-mod-note"; empty.textContent = "ما لقيت حسابات بهالصفحة."; list.appendChild(empty);
      }
      for (const row of data) {
        const article = document.createElement("article"); article.className = "bella-mod-row";
        const main = document.createElement("div"); main.className = "bella-mod-main";
        const name = document.createElement("b"); name.textContent = row.display_name || "مستخدم";
        const activity = document.createElement("small"); activity.textContent = `آخر نشاط: ${dateLabel(row.last_activity_at || row.updated_at || row.created_at)}`;
        main.append(name, activity, statusBadge(row));
        const manage = document.createElement("button"); manage.className = "bella-mod-manage"; manage.textContent = row.manageable ? "مراجعة" : "محمي"; manage.disabled = !row.manageable; manage.onclick = () => openDetail(row.user_id);
        article.append(main, metric("Level", compact(row.level)), metric("XP", compact(row.xp)), metric("رسائل", compact(row.messages)), manage);
        list.appendChild(article);
      }
      const total = Number(data[0]?.total_count || 0);
      const start = total ? offset + 1 : 0;
      const end = Math.min(total, offset + data.length);
      card.querySelector("[data-page]").textContent = `${start}–${end} من ${total}`;
      prev.disabled = offset <= 0;
      next.disabled = offset + PAGE_SIZE >= total;
    } catch {
      error.hidden = false;
      error.textContent = "تعذر تحميل الحسابات أو انتهت صلاحية الإشراف.";
      list.replaceChildren();
      await verify(true);
    } finally {
      loading = false;
    }
  }

  async function openDetail(userId) {
    const card = shell();
    card.innerHTML = `<div class="bella-mod-note">جاري تحميل الحساب...</div>`;
    try {
      const rows = await rpc("bella_moderator_user_detail", { p_user_id: userId });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row || !row.manageable) throw new Error("protected staff target");
      const suspended = row.account_status === "suspended";
      card.innerHTML = `
        <div class="bella-mod-head"><div><h2 id="bellaModeratorTitle"></h2><p>تفاصيل تشغيلية فقط — بدون إيميل أو محادثات.</p></div><div class="bella-mod-actions"><button data-back>رجوع</button><button data-close>إغلاق</button></div></div>
        <div class="bella-mod-detail" data-grid></div>
        <div class="bella-mod-actions"><button class="bella-mod-action ${suspended ? "primary" : "danger"}" data-toggle>${suspended ? "إرجاع الحساب" : "إيقاف الحساب"}</button></div>
        <div data-error hidden class="bella-mod-error"></div>
        <p class="bella-mod-note" data-note></p>`;
      card.querySelector("h2").textContent = `${row.display_name || "مستخدم"} 👤`;
      const boxes = [
        ["الحالة", suspended ? "موقوف" : "نشط"], ["Level", compact(row.level)], ["XP", compact(row.xp)], ["الرسائل", compact(row.messages)],
        ["الذكريات", compact(row.memories)], ["نشاط 30 يوم", compact(row.events_30d)], ["آخر نشاط", dateLabel(row.last_activity_at)], ["انضم", dateLabel(row.created_at)]
      ];
      const grid = card.querySelector("[data-grid]");
      for (const [label, value] of boxes) {
        const box = document.createElement("div"); box.className = "bella-mod-box";
        const small = document.createElement("small"); small.textContent = label;
        const strong = document.createElement("b"); strong.textContent = value;
        box.append(small, strong); grid.appendChild(box);
      }
      card.querySelector("[data-note]").textContent = suspended && row.suspended_reason ? `سبب الإيقاف المسجل: ${row.suspended_reason}` : "أي إجراء إشرافي ينحفظ في سجل التدقيق.";
      card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();
      card.querySelector("[data-back]").onclick = () => open();
      card.querySelector("[data-toggle]").onclick = async () => {
        if (suspended) return manage(card, userId, "unsuspend", "إرجاع الحساب من مركز الإشراف");
        const reason = window.prompt("سبب الإيقاف؟ لازم تكتب سبب واضح.", "") ?? null;
        if (reason === null) return;
        if (reason.trim().length < 3) {
          const error = card.querySelector("[data-error]"); error.hidden = false; error.textContent = "اكتب سبب واضح من 3 أحرف أو أكثر."; return;
        }
        return manage(card, userId, "suspend", reason.trim());
      };
    } catch {
      card.innerHTML = `<div class="bella-mod-error">هذا الحساب محمي أو تعذر فتحه.</div><div class="bella-mod-actions" style="margin-top:10px"><button data-back>رجوع</button></div>`;
      card.querySelector("[data-back]").onclick = () => open();
    }
  }

  async function manage(card, userId, action, reason) {
    const error = card.querySelector("[data-error]");
    error.hidden = true;
    card.querySelectorAll("button").forEach(button => { button.disabled = true; });
    try {
      await rpc("bella_moderator_manage_user", { p_user_id: userId, p_action: action, p_reason: reason });
      window.showToast?.("تم حفظ الإجراء ✅");
      await openDetail(userId);
    } catch (e) {
      error.hidden = false;
      error.textContent = e?.message?.includes("protected staff") ? "هذا الحساب محمي وما تقدر تعدله." : e?.message?.includes("reason required") ? "لازم تكتب سبب واضح للإيقاف." : "تعذر حفظ الإجراء.";
      card.querySelectorAll("button").forEach(button => { button.disabled = false; });
    }
  }

  async function openAudit() {
    if (!await verify(true)) return false;
    ensureStyles();
    const card = shell();
    card.innerHTML = `<div class="bella-mod-head"><div><h2 id="bellaModeratorTitle">سجل إشرافي 📋</h2><p>يعرض إجراءاتك الإشرافية أنت فقط.</p></div><div class="bella-mod-actions"><button data-back>رجوع</button><button data-close>إغلاق</button></div></div><div data-audit class="bella-mod-audit"><div class="bella-mod-note">جاري التحميل...</div></div>`;
    card.querySelector("[data-back]").onclick = () => open();
    card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();
    try {
      const rows = await rpc("bella_moderator_audit", { p_limit: 60, p_offset: 0 });
      const host = card.querySelector("[data-audit]");
      host.replaceChildren();
      for (const row of Array.isArray(rows) ? rows : []) {
        const item = document.createElement("article"); item.className = "bella-mod-audit-row";
        const title = document.createElement("b"); title.textContent = `${row.action === "suspend" ? "إيقاف حساب" : "إرجاع حساب"} — ${row.target_display_name || "مستخدم"}`;
        const meta = document.createElement("small"); meta.textContent = dateLabel(row.created_at);
        const reason = document.createElement("small"); reason.textContent = row.reason ? `السبب: ${row.reason}` : "بدون سبب مكتوب";
        item.append(title, meta, reason); host.appendChild(item);
      }
      if (!host.childElementCount) host.innerHTML = `<div class="bella-mod-note">ما عندك إجراءات إشرافية للحين.</div>`;
    } catch {
      card.querySelector("[data-audit]").innerHTML = `<div class="bella-mod-error">تعذر تحميل السجل.</div>`;
    }
    return true;
  }

  function removeButtons() {
    document.querySelectorAll("[data-bella-moderator-button]").forEach(node => node.remove());
  }

  function installButton() {
    if (!allowed) return;
    ensureStyles();
    const more = document.querySelector("#bellaMoreMenu .bella-more-grid");
    if (more && !more.querySelector("[data-bella-moderator-button]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.bellaModeratorButton = "1";
      button.textContent = "🧰 مركز الإشراف";
      button.title = "صلاحيات الإشراف المحدودة";
      button.onclick = () => { try { window.closeBellaMoreMenu?.(); } catch {} open(); };
      more.prepend(button);
    }

    const accountModal = document.getElementById("bellaAccountModal");
    const quick = accountModal?.querySelector(".bella-account-center-actions");
    if (quick && !quick.querySelector("[data-bella-moderator-button]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bella-account-action";
      button.dataset.bellaModeratorButton = "1";
      button.textContent = "مركز الإشراف 🧰";
      button.onclick = () => { accountModal.remove(); open(); };
      quick.appendChild(button);
    }
  }

  const observer = new MutationObserver(() => { if (allowed) installButton(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  [700, 2200, 5200].forEach(delay => setTimeout(() => verify(delay > 700), delay));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) verify(true); });
  window.addEventListener("storage", event => { if (event.key === SESSION_KEY) { checked = false; verify(true); } });

  window.BellaModeratorCenter = Object.freeze({
    open,
    audit: openAudit,
    refresh: () => verify(true),
    isModerator: () => allowed
  });
})();