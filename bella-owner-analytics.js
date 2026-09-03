(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  let loading = false;

  function readJson(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function token() {
    return readJson(SESSION_KEY, null)?.access_token || "";
  }

  async function rpc(name, payload = {}) {
    const accessToken = token();
    if (!accessToken) throw new Error("owner session unavailable");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
    return data;
  }

  function compact(value) {
    const n = Math.max(0, Number(value) || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
    return String(Math.floor(n));
  }

  function featureLabel(name) {
    return ({
      dira: "🇰🇼 شكو ماكو",
      radar: "📡 رادار القز",
      "game-box": "🎁 شنو بالصندوق",
      "game-proverb": "🧠 كمّل المثل",
      wisdom: "🧿 الحكمة",
      fazaa: "🚨 فزعة بيلا",
      share: "📸 المشاركة",
      memory: "🧠 الذاكرة",
      settings: "⚙️ الإعدادات"
    })[String(name || "")] || String(name || "ميزة");
  }

  function injectStyles() {
    if (document.getElementById("bellaOwnerAnalyticsStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaOwnerAnalyticsStyles";
    style.textContent = `
      .bella-owner-analytics{display:grid;gap:10px;margin:14px 0;padding:12px;border:1px solid rgba(92,220,160,.16);border-radius:16px;background:rgba(92,220,160,.045)}
      .bella-owner-analytics-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.bella-owner-analytics-head h3{margin:0;font-size:14px}.bella-owner-analytics-head small{display:block;color:var(--muted);font-size:9px;margin-top:3px}
      .bella-owner-period{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:inherit;border-radius:10px;padding:7px 8px;font:inherit;font-size:10px}
      .bella-owner-live-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.bella-owner-live-stat{padding:9px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);text-align:right}.bella-owner-live-stat small{display:block;font-size:9px;color:var(--muted)}.bella-owner-live-stat b{font-size:15px}
      .bella-owner-chart{display:flex;align-items:flex-end;gap:3px;height:92px;padding:8px 4px 0;border-bottom:1px solid rgba(255,255,255,.08);overflow:hidden}.bella-owner-bar{flex:1;min-width:3px;max-width:18px;border-radius:5px 5px 2px 2px;background:currentColor;opacity:.55;position:relative}.bella-owner-bar:hover{opacity:.95}
      .bella-owner-feature-list{display:grid;gap:6px}.bella-owner-feature{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.035);font-size:10px}.bella-owner-feature b{font-size:11px}.bella-owner-feature small{color:var(--muted)}
      .bella-owner-analytics-note{font-size:9px;color:var(--muted);line-height:1.6;margin:0}.bella-owner-analytics-error{padding:9px;border-radius:10px;background:rgba(255,90,90,.08);font-size:10px}
      @media(max-width:520px){.bella-owner-live-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.bella-owner-analytics-head{align-items:flex-start;flex-direction:column}.bella-owner-period{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function metric(label, value) {
    const box = document.createElement("div");
    box.className = "bella-owner-live-stat";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("b");
    strong.textContent = compact(value);
    box.append(small, strong);
    return box;
  }

  function renderChart(host, rows) {
    host.replaceChildren();
    const max = Math.max(1, ...rows.map(row => Number(row.total_events) || 0));
    for (const row of rows) {
      const bar = document.createElement("div");
      bar.className = "bella-owner-bar";
      const total = Number(row.total_events) || 0;
      bar.style.height = `${Math.max(total ? 7 : 2, Math.round((total / max) * 82))}px`;
      bar.title = `${row.day}: ${total} حدث • ${Number(row.active_users) || 0} مستخدم • ${Number(row.chat_messages) || 0} رسالة`;
      bar.setAttribute("aria-label", bar.title);
      host.appendChild(bar);
    }
  }

  function renderFeatures(host, rows) {
    host.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("small");
      empty.textContent = "ما فيه استخدام ميزات مسجل للحين.";
      host.appendChild(empty);
      return;
    }
    for (const row of rows.slice(0, 8)) {
      const item = document.createElement("div");
      item.className = "bella-owner-feature";
      const name = document.createElement("b");
      name.textContent = featureLabel(row.feature);
      const uses = document.createElement("span");
      uses.textContent = `${compact(row.uses)} استخدام`;
      const users = document.createElement("small");
      users.textContent = `${compact(row.unique_users)} مستخدم`;
      item.append(name, uses, users);
      host.appendChild(item);
    }
  }

  async function load(section) {
    if (loading || !window.BellaOwnerCenter?.isOwner?.()) return false;
    loading = true;
    const days = Math.max(7, Math.min(90, Number(section.querySelector("[data-owner-period]")?.value) || 30));
    const stats = section.querySelector("[data-owner-live-stats]");
    const chart = section.querySelector("[data-owner-chart]");
    const features = section.querySelector("[data-owner-features]");
    const error = section.querySelector("[data-owner-analytics-error]");
    if (error) { error.hidden = true; error.textContent = ""; }
    try {
      const [summaryRows, activityRows, featureRows] = await Promise.all([
        rpc("bella_owner_analytics_summary", { p_days: days }),
        rpc("bella_owner_activity", { p_days: days }),
        rpc("bella_owner_features", { p_days: days })
      ]);
      const summary = Array.isArray(summaryRows) ? summaryRows[0] || {} : summaryRows || {};
      stats.replaceChildren(
        metric("نشط اليوم", summary.active_today),
        metric("نشط 7 أيام", summary.active_7d),
        metric(`أحداث ${days} يوم`, summary.tracked_events),
        metric("رسائل فعلية", summary.chat_messages),
        metric("بحث حي", summary.live_web),
        metric("استخدام ميزات", summary.feature_uses)
      );
      renderChart(chart, Array.isArray(activityRows) ? activityRows : []);
      renderFeatures(features, Array.isArray(featureRows) ? featureRows : []);
      return true;
    } catch (err) {
      if (error) {
        error.hidden = false;
        error.textContent = "تعذر تحميل النشاط الفعلي الحين. جرّب مرة ثانية.";
      }
      return false;
    } finally {
      loading = false;
    }
  }

  function decorate(modal) {
    if (!(modal instanceof HTMLElement) || modal.id !== "bellaOwnerCenter") return false;
    const card = modal.querySelector(".bella-owner-card");
    if (!card || card.querySelector("[data-bella-owner-analytics]")) return false;
    injectStyles();

    const section = document.createElement("section");
    section.className = "bella-owner-analytics";
    section.dataset.bellaOwnerAnalytics = "1";

    const head = document.createElement("div");
    head.className = "bella-owner-analytics-head";
    const title = document.createElement("div");
    title.innerHTML = `<h3>📈 النشاط الفعلي</h3><small>إحصائيات استخدام الحسابات المسجلة — بدون نصوص المحادثات</small>`;
    const period = document.createElement("select");
    period.className = "bella-owner-period";
    period.dataset.ownerPeriod = "1";
    period.setAttribute("aria-label", "فترة إحصائيات المالك");
    period.innerHTML = `<option value="7">آخر 7 أيام</option><option value="30" selected>آخر 30 يوم</option><option value="90">آخر 90 يوم</option>`;
    head.append(title, period);

    const stats = document.createElement("div");
    stats.className = "bella-owner-live-stats";
    stats.dataset.ownerLiveStats = "1";
    stats.append(metric("تحميل", 0));

    const chart = document.createElement("div");
    chart.className = "bella-owner-chart";
    chart.dataset.ownerChart = "1";
    chart.setAttribute("aria-label", "النشاط اليومي");

    const featuresTitle = document.createElement("b");
    featuresTitle.textContent = "أكثر الميزات استخدامًا";
    featuresTitle.style.fontSize = "11px";
    const features = document.createElement("div");
    features.className = "bella-owner-feature-list";
    features.dataset.ownerFeatures = "1";

    const error = document.createElement("div");
    error.className = "bella-owner-analytics-error";
    error.dataset.ownerAnalyticsError = "1";
    error.hidden = true;

    const note = document.createElement("p");
    note.className = "bella-owner-analytics-note";
    note.textContent = "النشاط الفعلي يبدأ من هذا الإصدار ويحسب المستخدمين المسجلين دخول فقط. نخزن نوع الحدث والميزة ووقته، بدون محتوى الرسائل أو نص الذاكرة.";

    section.append(head, stats, chart, featuresTitle, features, error, note);
    const toolbar = card.querySelector(".bella-owner-toolbar");
    if (toolbar) toolbar.before(section);
    else card.appendChild(section);

    period.addEventListener("change", () => load(section));
    load(section);
    return true;
  }

  function install() {
    document.querySelectorAll("#bellaOwnerCenter").forEach(decorate);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.id === "bellaOwnerCenter") queueMicrotask(() => decorate(node));
          node.querySelectorAll?.("#bellaOwnerCenter").forEach(modal => queueMicrotask(() => decorate(modal)));
        }
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
    return true;
  }

  window.BellaOwnerAnalytics = Object.freeze({ install, decorate, load, status: () => ({ loading }) });

  const start = () => install();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();