(() => {
  "use strict";

  const SETTINGS_KEY = "bella_ui_settings_v1";
  const originalOpenSettings = window.openBellaSettings;

  function readSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
    catch { return {}; }
  }

  function writeIntensity(value) {
    const intensity = ["low", "normal", "high"].includes(value) ? value : "high";
    const settings = readSettings();
    settings.momentsIntensity = intensity;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
    window.BellaMoments?.setIntensity?.(intensity);
    return intensity;
  }

  function installStyles() {
    if (document.getElementById("bellaMomentsUIStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaMomentsUIStyles";
    style.textContent = `
      .bella-moments-intensity{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-start}
      .bella-moments-intensity button{min-width:58px;padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
      .bella-moments-intensity button.active{background:linear-gradient(135deg,rgba(10,132,255,.42),rgba(103,91,255,.3));border-color:rgba(122,252,255,.38)}
      .bella-moments-stats{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;color:var(--muted);font-size:10px}
      .bella-moments-stats span{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}
    `;
    document.head.appendChild(style);
  }

  function enhanceSettings() {
    const modal = document.getElementById("bellaSettings");
    const momentsToggle = modal?.querySelector("#bellaMomentsEnabled");
    if (!modal || !momentsToggle || modal.querySelector("#bellaMomentsIntensity")) return;

    const current = window.BellaMoments?.getIntensity?.() || readSettings().momentsIntensity || "high";
    const status = window.BellaMoments?.status?.() || {};
    const stats = status.session || {};

    const row = document.createElement("div");
    row.className = "bella-setting-row";
    row.id = "bellaMomentsIntensity";
    row.innerHTML = `
      <div class="bella-setting-copy">
        <b>كثافة اللقطات 🔥</b>
        <span>تحكم بكثرة الإشاعات واللقطات. «حيل» هو الجو الكامل اللي تبيه بدون ما يركبون فوق بعض.</span>
        <div class="bella-moments-stats">
          <span>👂 ${Number(stats.rumors || 0)} إشاعة</span>
          <span>💬 ${Number(stats.toasts || 0)} لقطة</span>
          <span>✨ ${Number(stats.rare || 0)} نادرة</span>
          <span>👑 ${Number(stats.legendary || 0)} أسطورية</span>
        </div>
      </div>
      <div class="bella-moments-intensity" role="group" aria-label="كثافة لقطات بيلا">
        <button type="button" data-intensity="low">هادي</button>
        <button type="button" data-intensity="normal">عادي</button>
        <button type="button" data-intensity="high">حيل 🔥</button>
      </div>`;

    momentsToggle.closest(".bella-setting-row")?.insertAdjacentElement("afterend", row);
    const sync = value => row.querySelectorAll("[data-intensity]").forEach(button => button.classList.toggle("active", button.dataset.intensity === value));
    sync(current);
    row.querySelectorAll("[data-intensity]").forEach(button => {
      button.addEventListener("click", () => sync(writeIntensity(button.dataset.intensity)));
    });
  }

  function wrapSettings() {
    if (typeof originalOpenSettings !== "function") return;
    window.openBellaSettings = function openBellaSettingsWithMoments() {
      const result = originalOpenSettings.apply(this, arguments);
      installStyles();
      enhanceSettings();
      return result;
    };
  }

  installStyles();
  wrapSettings();

  window.BellaMomentsUI = Object.freeze({ enhanceSettings, writeIntensity });
})();
