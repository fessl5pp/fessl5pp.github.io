(() => {
  "use strict";

  const SETTINGS_KEY = "bella_ui_settings_v1";
  const defaults = { randomSuggestions: false, longContext: true };
  let homeActionObserver = null;

  function getSettings() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return { ...defaults };
    }
  }

  function organizeHomeActions() {
    const heroActions = document.querySelector(".hero-actions");
    if (!heroActions) return;

    const isCoreAction = button => {
      const onclick = String(button.getAttribute("onclick") || "");
      return onclick.includes("openChat")
        || onclick.includes("__openBella")
        || onclick.includes("openBellaSettings")
        || onclick.includes("openBellaActivities");
    };

    [...heroActions.querySelectorAll(":scope > button")].forEach(button => {
      if (!isCoreAction(button)) button.remove();
    });

    if (!homeActionObserver) {
      homeActionObserver = new MutationObserver(() => {
        [...heroActions.querySelectorAll(":scope > button")].forEach(button => {
          if (!isCoreAction(button)) button.remove();
        });
      });
      homeActionObserver.observe(heroActions, { childList: true });
    }
  }

  function saveSettings(next) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
    applySettings(next);
  }

  function applySettings(settings = getSettings()) {
    organizeHomeActions();
    const suggestions = document.getElementById("quickSuggestions");
    if (suggestions) suggestions.hidden = !settings.randomSuggestions;
    window.BellaContext?.setEnabled?.(settings.longContext !== false);
  }

  function runAction(name, ...args) {
    closeBellaActivities();
    const action = window[name];
    if (typeof action === "function") return action(...args);
  }

  window.closeBellaMoreMenu = function closeBellaMoreMenu() {
    const menu = document.getElementById("bellaMoreMenu");
    if (menu) menu.hidden = true;
  };

  window.toggleBellaMoreMenu = function toggleBellaMoreMenu() {
    const menu = document.getElementById("bellaMoreMenu");
    if (menu) menu.hidden = !menu.hidden;
  };

  window.closeBellaActivities = function closeBellaActivities() {
    document.getElementById("bellaActivities")?.remove();
  };

  window.openBellaActivities = function openBellaActivities() {
    closeBellaMoreMenu();
    closeBellaActivities();
    document.getElementById("bellaSettings")?.remove();

    const modal = document.createElement("div");
    modal.id = "bellaActivities";
    modal.className = "vnext-modal";
    modal.innerHTML = `
      <div class="vnext-card bella-activities-card" role="dialog" aria-modal="true" aria-labelledby="bellaActivitiesTitle">
        <div class="bella-activities-head">
          <div>
            <h2 id="bellaActivitiesTitle">فعاليات بيلا 🎮</h2>
            <p>الرادار والألعاب والسوالف الجانبية كلها هني، والشات يظل نظيف.</p>
          </div>
          <button class="bella-activities-close" id="bellaActivitiesClose" aria-label="إغلاق">✕</button>
        </div>

        <div class="bella-activities-section">
          <b class="bella-activities-label">📡 الرادار والسوالف</b>
          <div class="bella-activities-grid">
            <button data-action="openRadarPlus"><span>📡</span><b>رادار القز+</b><small>رادار بيلا الخفيف</small></button>
            <button data-action="openDira"><span>🇰🇼</span><b>شكو ماكو؟</b><small>سوالف الديرة والبحث الحي</small></button>
          </div>
        </div>

        <div class="bella-activities-section">
          <b class="bella-activities-label">🎮 الألعاب</b>
          <div class="bella-activities-grid">
            <button data-action="startKuwaitiChallenge"><span>🧩</span><b>تحدي كويتي</b><small>أسئلة وتحديات كويتية</small></button>
            <button data-action="startBoxGame"><span>🎁</span><b>شنو بالصندوق؟</b><small>خمن اللي مخبّته بيلا</small></button>
            <button data-action="startProverbGame"><span>🧠</span><b>كمّل المثل</b><small>اختبر أمثالك الكويتية</small></button>
          </div>
        </div>

        <div class="bella-activities-section">
          <b class="bella-activities-label">✨ أشياء خفيفة</b>
          <div class="bella-activities-grid compact">
            <button data-action="dailyWisdom"><span>🧿</span><b>حكمة اليوم</b></button>
            <button data-action="openFazaa"><span>🚨</span><b>فزعة بيلا</b></button>
            <button data-action="shareChat"><span>📸</span><b>مشاركة</b></button>
            <button data-action="giveGift" data-arg="rose"><span>🌹</span><b>وردة</b></button>
            <button data-action="giveGift" data-arg="choco"><span>🍫</span><b>كاكاو</b></button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);
    modal.querySelectorAll("[data-action]").forEach(button => {
      button.addEventListener("click", () => {
        const arg = button.dataset.arg;
        runAction(button.dataset.action, ...(arg ? [arg] : []));
      });
    });
    modal.querySelector("#bellaActivitiesClose").onclick = closeBellaActivities;
    modal.addEventListener("click", event => { if (event.target === modal) closeBellaActivities(); });
  };

  window.openBellaSettings = function openBellaSettings() {
    closeBellaMoreMenu();
    closeBellaActivities();
    document.getElementById("bellaSettings")?.remove();
    const settings = getSettings();
    const modal = document.createElement("div");
    modal.id = "bellaSettings";
    modal.className = "vnext-modal";
    modal.innerHTML = `
      <div class="vnext-card" role="dialog" aria-modal="true" aria-labelledby="bellaSettingsTitle">
        <h2 id="bellaSettingsTitle">إعدادات بيلا ⚙️</h2>
        <div class="bella-setting-row">
          <div class="bella-setting-copy">
            <b>الكلمات والاقتراحات السريعة</b>
            <span>إذا فعلتها تطلع اقتراحات مثل «شلونچ؟» و«نكتة»، وإذا طفيتها تختفي بالكامل.</span>
          </div>
          <label class="bella-switch">
            <input id="bellaRandomSuggestions" type="checkbox" ${settings.randomSuggestions ? "checked" : ""} aria-label="إظهار الكلمات والاقتراحات السريعة">
            <span class="bella-switch-track"></span>
          </label>
        </div>
        <div class="bella-setting-row">
          <div class="bella-setting-copy">
            <b>ذاكرة سياق السوالف</b>
            <span>تخلي بيلا تتذكر آخر سياق مختصر على هالجهاز عشان ما تضيع السالفة إذا طالت أو سويت تحديث للصفحة.</span>
          </div>
          <label class="bella-switch">
            <input id="bellaLongContext" type="checkbox" ${settings.longContext !== false ? "checked" : ""} aria-label="تفعيل ذاكرة سياق السوالف">
            <span class="bella-switch-track"></span>
          </label>
        </div>
        <div class="bella-settings-tools">
          <button id="bellaThemeSettings">🎨 الثيم</button>
          <button id="bellaMemorySettings">🧠 الذاكرة</button>
          <button id="bellaVoiceSettings">🔊 صوت بيلا</button>
        </div>
        <p class="bella-settings-note">الإعدادات تنحفظ على هالجهاز، وتقدر تغيرها بأي وقت من ⚙️. إذا طفيت ذاكرة السياق تنمسح بيانات السياق الطويل المحفوظة محلياً.</p>
        <div class="vnext-actions"><button id="bellaSettingsClose" class="vnext-primary">تم</button></div>
      </div>`;

    document.body.appendChild(modal);
    modal.querySelector("#bellaRandomSuggestions")?.addEventListener("change", event => {
      const next = getSettings();
      next.randomSuggestions = event.target.checked;
      saveSettings(next);
    });
    modal.querySelector("#bellaLongContext")?.addEventListener("change", event => {
      const next = getSettings();
      next.longContext = event.target.checked;
      saveSettings(next);
    });
    modal.querySelector("#bellaThemeSettings").onclick = () => { modal.remove(); runAction("showTheme"); };
    modal.querySelector("#bellaMemorySettings").onclick = () => { modal.remove(); runAction("openMemoryPanel"); };
    modal.querySelector("#bellaVoiceSettings").onclick = () => {
      const voiceToggle = document.getElementById("bellaVoiceToggle");
      if (voiceToggle) voiceToggle.click();
    };
    modal.querySelector("#bellaSettingsClose").onclick = () => modal.remove();
    modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
  };

  document.addEventListener("click", event => {
    const menu = document.getElementById("bellaMoreMenu");
    if (!menu || menu.hidden) return;
    if (!menu.contains(event.target) && !event.target.closest("#bellaMoreBtn")) closeBellaMoreMenu();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applySettings(), { once: true });
  } else {
    applySettings();
  }

  window.BellaUI = Object.freeze({
    getSettings,
    applySettings,
    organizeHomeActions,
    openActivities: window.openBellaActivities
  });
})();