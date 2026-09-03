(() => {
  "use strict";

  const PROFILE_KEY = "bella_account_profile_v1";
  const VNEXT_KEY = "bella_vnext_v2";
  const LEGACY_KEY = "bella_clean_no_gemini_v31";
  let installed = false;

  function readJson(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function compactNumber(value) {
    const n = safeNumber(value);
    if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
    return String(Math.floor(n));
  }

  function dateLabel(value) {
    const date = new Date(value || "");
    if (!Number.isFinite(date.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("ar-KW", { year: "numeric", month: "short", day: "numeric" }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }

  function timeLabel(value) {
    const date = new Date(value || "");
    if (!Number.isFinite(date.getTime())) return "مو متزامن للحين";
    const diff = Math.max(0, Date.now() - date.getTime());
    if (diff < 60000) return "قبل شوي";
    if (diff < 3600000) return `قبل ${Math.max(1, Math.floor(diff / 60000))} د`;
    if (diff < 86400000) return `قبل ${Math.max(1, Math.floor(diff / 3600000))} س`;
    return dateLabel(date);
  }

  function accountSnapshot() {
    const profile = readJson(PROFILE_KEY, {});
    const legacy = readJson(LEGACY_KEY, {});
    const vnext = readJson(VNEXT_KEY, {});
    const memoryStatus = window.BellaAccountMemory?.status?.() || {};
    const xp = Math.max(safeNumber(profile.xp), safeNumber(legacy.xp));
    const level = Math.max(1, safeNumber(profile.level), safeNumber(legacy.lvl), Math.floor(xp / 100) + 1);
    const messages = Math.max(safeNumber(profile.messages), safeNumber(legacy.messages), safeNumber(vnext?.stats?.messages));
    const gifts = Math.max(safeNumber(profile.gifts), safeNumber(legacy.gifts));
    const memoryCount = Math.max(0, safeNumber(memoryStatus.localCount), Array.isArray(vnext.memory) ? vnext.memory.length : 0);
    return {
      profile,
      xp,
      level,
      messages,
      gifts,
      memoryCount,
      joined: profile.created_at || "",
      synced: profile.updated_at || ""
    };
  }

  function createStat(label, value, icon) {
    const item = document.createElement("div");
    item.className = "bella-account-stat";
    const iconEl = document.createElement("span");
    iconEl.className = "bella-account-stat-icon";
    iconEl.textContent = icon;
    const valueEl = document.createElement("b");
    valueEl.textContent = value;
    const labelEl = document.createElement("small");
    labelEl.textContent = label;
    item.append(iconEl, valueEl, labelEl);
    return item;
  }

  function renderStats(host) {
    const snapshot = accountSnapshot();
    host.replaceChildren(
      createStat("Level", String(Math.floor(snapshot.level)), "⭐"),
      createStat("XP", compactNumber(snapshot.xp), "⚡"),
      createStat("رسالة", compactNumber(snapshot.messages), "💬"),
      createStat("ذكرى", compactNumber(snapshot.memoryCount), "🧠")
    );
  }

  function refreshMeta(card) {
    const snapshot = accountSnapshot();
    const joined = card.querySelector("[data-bella-account-joined]");
    const synced = card.querySelector("[data-bella-account-synced]");
    const memory = card.querySelector("[data-bella-account-memory-count]");
    const stats = card.querySelector("[data-bella-account-stats]");
    if (joined) joined.textContent = dateLabel(snapshot.joined);
    if (synced) synced.textContent = timeLabel(snapshot.synced);
    if (memory) memory.textContent = `${Math.floor(snapshot.memoryCount)} ذكرى محفوظة`;
    if (stats) renderStats(stats);
  }

  function decorateSignedInModal(modal) {
    if (!(modal instanceof HTMLElement) || modal.id !== "bellaAccountModal") return false;
    const card = modal.querySelector(".vnext-card");
    if (!card || card.dataset.accountCenterV1 === "1") return false;
    const signedIn = Boolean(window.BellaAccount?.isSignedIn?.());
    if (!signedIn || !card.querySelector("#bellaSignedName")) return false;
    card.dataset.accountCenterV1 = "1";

    const dashboard = document.createElement("section");
    dashboard.className = "bella-account-center";
    dashboard.setAttribute("aria-label", "ملخص حساب بيلا");

    const cloud = document.createElement("div");
    cloud.className = "bella-account-cloud";
    const cloudTitle = document.createElement("strong");
    cloudTitle.textContent = "☁️ حسابك متصل";
    const cloudMeta = document.createElement("small");
    cloudMeta.innerHTML = `آخر مزامنة: <b data-bella-account-synced></b>`;
    cloud.append(cloudTitle, cloudMeta);

    const stats = document.createElement("div");
    stats.className = "bella-account-stats";
    stats.dataset.bellaAccountStats = "1";

    const details = document.createElement("div");
    details.className = "bella-account-details";
    const joinedRow = document.createElement("div");
    joinedRow.innerHTML = `<span>📅 انضم للحساب</span><b data-bella-account-joined></b>`;
    const memoryRow = document.createElement("div");
    memoryRow.innerHTML = `<span>🧠 ذاكرة بيلا</span><b data-bella-account-memory-count></b>`;
    details.append(joinedRow, memoryRow);

    const quick = document.createElement("div");
    quick.className = "bella-account-center-actions";
    const memoryButton = document.createElement("button");
    memoryButton.type = "button";
    memoryButton.className = "bella-account-action";
    memoryButton.textContent = "إدارة الذاكرة 🧠";
    memoryButton.onclick = () => {
      modal.remove();
      window.openMemoryPanel?.();
    };
    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "bella-account-action";
    settingsButton.textContent = "إعدادات بيلا ⚙️";
    settingsButton.onclick = () => {
      modal.remove();
      window.openBellaSettings?.();
    };
    quick.append(memoryButton, settingsButton);

    dashboard.append(cloud, stats, details, quick);
    const accountStatus = card.querySelector(".bella-account-status");
    if (accountStatus) accountStatus.after(dashboard);
    else card.prepend(dashboard);
    refreshMeta(card);

    card.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest("#bellaSyncNow") || target.closest("#bellaSaveName")) {
        setTimeout(() => refreshMeta(card), 700);
        setTimeout(() => refreshMeta(card), 1900);
      }
    });
    return true;
  }

  function injectStyles() {
    if (document.getElementById("bellaAccountCenterStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaAccountCenterStyles";
    style.textContent = `
      .bella-account-center{display:grid;gap:10px;margin:12px 0 4px}
      .bella-account-cloud{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border:1px solid rgba(92,220,160,.2);border-radius:14px;background:rgba(92,220,160,.07);text-align:right}
      .bella-account-cloud strong{font-size:12px}.bella-account-cloud small{font-size:10px;color:var(--muted)}
      .bella-account-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
      .bella-account-stat{display:grid;justify-items:center;gap:2px;padding:9px 4px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.04);min-width:0}
      .bella-account-stat-icon{font-size:16px}.bella-account-stat b{font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis}.bella-account-stat small{font-size:9px;color:var(--muted)}
      .bella-account-details{display:grid;gap:6px;padding:10px 12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.035)}
      .bella-account-details>div{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px}.bella-account-details b{font-size:10px}
      .bella-account-center-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      @media(max-width:430px){.bella-account-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.bella-account-cloud{align-items:flex-start;flex-direction:column}.bella-account-center-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (installed) return true;
    installed = true;
    injectStyles();
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.id === "bellaAccountModal") queueMicrotask(() => decorateSignedInModal(node));
          node.querySelectorAll?.("#bellaAccountModal").forEach(modal => queueMicrotask(() => decorateSignedInModal(modal)));
        }
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
    document.querySelectorAll("#bellaAccountModal").forEach(decorateSignedInModal);
    return true;
  }

  window.BellaAccountCenter = Object.freeze({ install, decorate: decorateSignedInModal, snapshot: accountSnapshot });

  const start = () => install();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
