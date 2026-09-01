(() => {
  "use strict";

  const SETTINGS_KEY = "bella_ui_settings_v1";
  const defaults = { randomSuggestions: false };

  function getSettings() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return { ...defaults };
    }
  }

  function saveSettings(next) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
    applySettings(next);
  }

  function applySettings(settings = getSettings()) {
    const suggestions = document.getElementById("quickSuggestions");
    if (suggestions) suggestions.hidden = !settings.randomSuggestions;
  }

  window.closeBellaMoreMenu = function closeBellaMoreMenu() {
    const menu = document.getElementById("bellaMoreMenu");
    if (menu) menu.hidden = true;
  };

  window.toggleBellaMoreMenu = function toggleBellaMoreMenu() {
    const menu = document.getElementById("bellaMoreMenu");
    if (menu) menu.hidden = !menu.hidden;
  };

  window.openBellaSettings = function openBellaSettings() {
    closeBellaMoreMenu();
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
        <p class="bella-settings-note">الإعداد ينحفظ على هالجهاز، وتقدر تغيره بأي وقت من ⚙️.</p>
        <div class="vnext-actions"><button id="bellaSettingsClose" class="vnext-primary">تم</button></div>
      </div>`;

    document.body.appendChild(modal);
    modal.querySelector("#bellaRandomSuggestions")?.addEventListener("change", event => {
      const next = getSettings();
      next.randomSuggestions = event.target.checked;
      saveSettings(next);
    });
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

  window.BellaUI = Object.freeze({ getSettings, applySettings });
})();
