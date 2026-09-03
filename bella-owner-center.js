(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const PAGE_SIZE = 25;

  let owner = false;
  let checked = false;
  let loading = false;
  let currentOffset = 0;
  let currentSearch = "";

  function readJson(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function activeToken() {
    const session = readJson(SESSION_KEY, null);
    return session?.access_token || "";
  }

  function headers() {
    const token = activeToken();
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }

  async function rpc(name, payload = {}) {
    const token = activeToken();
    if (!token) throw new Error("owner session unavailable");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.message || data?.error || `HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function verifyOwner(force = false) {
    if (checked && !force) return owner;
    if (!window.BellaAccount?.isSignedIn?.()) {
      checked = true;
      owner = false;
      removeOwnerButtons();
      return false;
    }
    try {
      const result = await rpc("is_bella_owner");
      owner = result === true || result === "true" || result?.is_bella_owner === true;
    } catch {
      owner = false;
    }
    checked = true;
    if (owner) installOwnerButton();
    else removeOwnerButtons();
    return owner;
  }

  function compact(value) {
    const n = Math.max(0, Number(value) || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
    return String(Math.floor(n));
  }

  function dateLabel(value, withTime = false) {
    const date = new Date(value || "");
    if (!Number.isFinite(date.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("ar-KW", withTime
        ? { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
        : { year: "numeric", month: "short", day: "numeric" }
      ).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  function ensureStyles() {
    if (document.getElementById("bellaOwnerCenterStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaOwnerCenterStyles";
    style.textContent = `
      .bella-owner-card{max-width:min(760px,94vw)!important;max-height:min(86dvh,900px);overflow:auto}
      .bella-owner-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;text-align:right}
      .bella-owner-head h2{margin:0}.bella-owner-head p{margin:4px 0 0;color:var(--muted);font-size:11px;line-height:1.7}
      .bella-owner-badge{white-space:nowrap;padding:6px 9px;border-radius:999px;border:1px solid rgba(92,220,160,.25);background:rgba(92,220,160,.08);font-size:10px;font-weight:900}
      .bella-owner-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}
      .bella-owner-stat{display:grid;gap:3px;padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(255,255,255,.04);text-align:right;min-width:0}
      .bella-owner-stat span{font-size:10px;color:var(--muted)}.bella-owner-stat b{font-size:18px;overflow:hidden;text-overflow:ellipsis}
      .bella-owner-toolbar{display:grid;grid-template-columns:1fr auto;gap:8px;margin:14px 0 10px}
      .bella-owner-toolbar input{min-width:0;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.06);color:inherit;padding:11px 12px;font:inherit;outline:none}
      .bella-owner-toolbar button,.bella-owner-page button,.bella-owner-close{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.06);color:inherit;font:inherit;font-weight:800;cursor:pointer}
      .bella-owner-toolbar button{background:var(--accent);color:#fff;border-color:transparent}
      .bella-owner-list{display:grid;gap:8px}
      .bella-owner-user{display:grid;grid-template-columns:minmax(0,1.6fr) repeat(4,minmax(72px,.6fr));gap:8px;align-items:center;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.035);text-align:right}
      .bella-owner-user-main{min-width:0}.bella-owner-user-main b,.bella-owner-user-main small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bella-owner-user-main small{margin-top:3px;color:var(--muted);font-size:10px}
      .bella-owner-user-metric{display:grid;gap:2px}.bella-owner-user-metric small{font-size:9px;color:var(--muted)}.bella-owner-user-metric b{font-size:11px}
      .bella-owner-empty{padding:20px;text-align:center;color:var(--muted);border:1px dashed rgba(255,255,255,.12);border-radius:14px}
      .bella-owner-page{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}.bella-owner-page span{font-size:10px;color:var(--muted)}
      .bella-owner-note{margin:12px 0 0;font-size:10px;line-height:1.7;color:var(--muted);text-align:right}
      .bella-owner-error{margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(255,90,90,.09);border:1px solid rgba(255,90,90,.2);font-size:11px}
      @media(max-width:650px){.bella-owner-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.bella-owner-user{grid-template-columns:1fr 1fr}.bella-owner-user-main{grid-column:1/-1}.bella-owner-toolbar{grid-template-columns:1fr}.bella-owner-head{flex-direction:column}.bella-owner-badge{align-self:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function removeOwnerButtons() {
    document.querySelectorAll("[data-bella-owner-button]").forEach(node => node.remove());
  }

  function installOwnerButton() {
    if (!owner) return;
    ensureStyles();
    const more = document.querySelector("#bellaMoreMenu .bella-more-grid");
    if (more && !more.querySelector("[data-bella-owner-button]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.bellaOwnerButton = "1";
      button.textContent = "🛡️ مركز المالك";
      button.title = "إحصائيات وإدارة بيلا";
      button.onclick = () => {
        try { window.closeBellaMoreMenu?.(); } catch {}
        open();
      };
      more.prepend(button);
    }

    const accountModal = document.getElementById("bellaAccountModal");
    const quick = accountModal?.querySelector(".bella-account-center-actions");
    if (quick && !quick.querySelector("[data-bella-owner-button]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bella-account-action";
      button.dataset.bellaOwnerButton = "1";
      button.textContent = "مركز المالك 🛡️";
      button.onclick = () => { accountModal.remove(); open(); };
      quick.appendChild(button);
    }
  }

  function modalShell() {
    document.getElementById("bellaOwnerCenter")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaOwnerCenter";
    modal.className = "vnext-modal";
    modal.innerHTML = `<div class="vnext-card bella-owner-card" role="dialog" aria-modal="true" aria-labelledby="bellaOwnerTitle"></div>`;
    modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    return modal.querySelector(".bella-owner-card");
  }

  function stat(label, value) {
    const item = document.createElement("div");
    item.className = "bella-owner-stat";
    const small = document.createElement("span");
    small.textContent = label;
    const strong = document.createElement("b");
    strong.textContent = value;
    item.append(small, strong);
    return item;
  }

  function metric(label, value) {
    const box = document.createElement("div");
    box.className = "bella-owner-user-metric";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("b");
    strong.textContent = value;
    box.append(small, strong);
    return box;
  }

  function renderSummary(host, summary) {
    host.replaceChildren(
      stat("كل الحسابات", compact(summary.total_accounts)),
      stat("جدد اليوم", compact(summary.new_today)),
      stat("نشطون 7 أيام", compact(summary.active_7d)),
      stat("جدد 30 يوم", compact(summary.new_30d)),
      stat("الرسائل", compact(summary.total_messages)),
      stat("الذكريات", compact(summary.total_memories)),
      stat("XP إجمالي", compact(summary.total_xp)),
      stat("متوسط Level", String(Number(summary.avg_level || 0).toFixed(1))),
      stat("الهدايا", compact(summary.total_gifts))
    );
  }

  function renderUsers(host, rows) {
    host.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "bella-owner-empty";
      empty.textContent = currentSearch ? "ما لقيت حساب مطابق للبحث." : "ما فيه حسابات للحين.";
      host.appendChild(empty);
      return;
    }
    for (const row of rows) {
      const item = document.createElement("article");
      item.className = "bella-owner-user";
      const main = document.createElement("div");
      main.className = "bella-owner-user-main";
      const name = document.createElement("b");
      name.textContent = row.display_name || "مستخدم";
      const email = document.createElement("small");
      email.textContent = row.email || "بدون إيميل ظاهر";
      const joined = document.createElement("small");
      joined.textContent = `انضم: ${dateLabel(row.created_at)} • آخر دخول: ${dateLabel(row.last_sign_in_at, true)}`;
      main.append(name, email, joined);
      item.append(
        main,
        metric("Level", compact(row.level)),
        metric("XP", compact(row.xp)),
        metric("رسائل", compact(row.messages)),
        metric("ذكريات", compact(row.memories))
      );
      host.appendChild(item);
    }
  }

  async function loadData(card) {
    if (loading) return;
    loading = true;
    const summaryHost = card.querySelector("[data-owner-summary]");
    const usersHost = card.querySelector("[data-owner-users]");
    const errorHost = card.querySelector("[data-owner-error]");
    const pageLabel = card.querySelector("[data-owner-page-label]");
    const prev = card.querySelector("[data-owner-prev]");
    const next = card.querySelector("[data-owner-next]");
    const refresh = card.querySelector("[data-owner-refresh]");
    if (refresh) refresh.disabled = true;
    if (errorHost) { errorHost.hidden = true; errorHost.textContent = ""; }

    try {
      const [summaryRows, userRows] = await Promise.all([
        rpc("bella_owner_summary"),
        rpc("bella_owner_users", { p_search: currentSearch, p_limit: PAGE_SIZE, p_offset: currentOffset })
      ]);
      const summary = Array.isArray(summaryRows) ? summaryRows[0] || {} : summaryRows || {};
      const rows = Array.isArray(userRows) ? userRows : [];
      renderSummary(summaryHost, summary);
      renderUsers(usersHost, rows);
      const total = Number(rows[0]?.total_count ?? (currentSearch ? 0 : summary.total_accounts) ?? 0) || 0;
      const start = total ? currentOffset + 1 : 0;
      const end = Math.min(total, currentOffset + rows.length);
      if (pageLabel) pageLabel.textContent = `${start}–${end} من ${total}`;
      if (prev) prev.disabled = currentOffset <= 0;
      if (next) next.disabled = currentOffset + PAGE_SIZE >= total;
    } catch (error) {
      if (errorHost) {
        errorHost.hidden = false;
        errorHost.textContent = error?.status === 403 || String(error?.message || "").includes("owner access")
          ? "تم رفض الوصول. سجل دخول بحساب المالك."
          : "تعذر تحميل إحصائيات المالك الحين. جرّب تحديث اللوحة.";
      }
    } finally {
      loading = false;
      if (refresh) refresh.disabled = false;
    }
  }

  async function open() {
    const allowed = await verifyOwner(true);
    if (!allowed) {
      try { window.showToast?.("هذي الصفحة لحساب المالك فقط 🛡️"); } catch {}
      return false;
    }
    ensureStyles();
    currentOffset = 0;
    currentSearch = "";
    const card = modalShell();

    const head = document.createElement("div");
    head.className = "bella-owner-head";
    const titleBox = document.createElement("div");
    const title = document.createElement("h2");
    title.id = "bellaOwnerTitle";
    title.textContent = "مركز المالك 🛡️";
    const desc = document.createElement("p");
    desc.textContent = "نظرة كاملة على حسابات بيلا والتقدم والمزامنة. نصوص المحادثات نفسها مو معروضة هنا.";
    titleBox.append(title, desc);
    const badge = document.createElement("span");
    badge.className = "bella-owner-badge";
    badge.textContent = "OWNER ONLY";
    head.append(titleBox, badge);

    const summary = document.createElement("section");
    summary.className = "bella-owner-stats";
    summary.dataset.ownerSummary = "1";
    summary.append(stat("تحميل", "…"));

    const toolbar = document.createElement("div");
    toolbar.className = "bella-owner-toolbar";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "ابحث بالاسم أو الإيميل";
    search.autocomplete = "off";
    search.setAttribute("aria-label", "بحث في حسابات بيلا");
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.dataset.ownerRefresh = "1";
    refresh.textContent = "تحديث ↻";
    toolbar.append(search, refresh);

    const error = document.createElement("div");
    error.className = "bella-owner-error";
    error.dataset.ownerError = "1";
    error.hidden = true;

    const users = document.createElement("section");
    users.className = "bella-owner-list";
    users.dataset.ownerUsers = "1";
    users.innerHTML = `<div class="bella-owner-empty">جاري تحميل الحسابات…</div>`;

    const pager = document.createElement("div");
    pager.className = "bella-owner-page";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.dataset.ownerPrev = "1";
    prev.textContent = "السابق";
    const pageLabel = document.createElement("span");
    pageLabel.dataset.ownerPageLabel = "1";
    pageLabel.textContent = "—";
    const next = document.createElement("button");
    next.type = "button";
    next.dataset.ownerNext = "1";
    next.textContent = "التالي";
    pager.append(prev, pageLabel, next);

    const note = document.createElement("p");
    note.className = "bella-owner-note";
    note.textContent = "الأرقام تعتمد على بيانات حسابات بيلا الحالية: التسجيل، آخر دخول، XP/Level، عداد الرسائل والذكريات السحابية. ما نعرض محتوى محادثات المستخدمين.";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "bella-owner-close";
    close.textContent = "إغلاق";
    close.onclick = () => card.closest(".vnext-modal")?.remove();

    card.append(head, summary, toolbar, error, users, pager, note, close);

    const submitSearch = () => {
      currentSearch = String(search.value || "").trim().slice(0, 100);
      currentOffset = 0;
      loadData(card);
    };
    refresh.onclick = submitSearch;
    search.addEventListener("keydown", event => { if (event.key === "Enter") submitSearch(); });
    prev.onclick = () => {
      currentOffset = Math.max(0, currentOffset - PAGE_SIZE);
      loadData(card);
    };
    next.onclick = () => {
      currentOffset += PAGE_SIZE;
      loadData(card);
    };

    await loadData(card);
    return true;
  }

  function watchUi() {
    const observer = new MutationObserver(records => {
      if (!owner) return;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.id === "bellaMoreMenu" || node.querySelector?.("#bellaMoreMenu")) installOwnerButton();
          if (node.id === "bellaAccountModal" || node.querySelector?.("#bellaAccountModal")) queueMicrotask(installOwnerButton);
        }
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
  }

  async function start() {
    try { await Promise.resolve(window.__bellaAccountReady); } catch {}
    await verifyOwner(true);
    watchUi();
  }

  window.BellaOwnerCenter = Object.freeze({
    open,
    refresh: () => verifyOwner(true),
    isOwner: () => owner,
    status: () => ({ owner, checked, loading })
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
