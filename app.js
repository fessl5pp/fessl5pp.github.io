(() => {
  "use strict";
  // Bella v11 personality-activities release marker.
  // Bella v12 AI-first chat + coordinated ambient moments marker.
  // Bella v13 adaptive moments engine marker.
  // Bella v14 Moments Studio + AI Fresh Moments marker.
  // Bella v15 Brain v2 + natural Kuwaiti chat + Alive marker.

  function installSwitchInteractionFix() {
    if (document.getElementById("bellaSwitchInteractionFix")) return;
    const style = document.createElement("style");
    style.id = "bellaSwitchInteractionFix";
    style.textContent = `
      .bella-switch{cursor:pointer;touch-action:manipulation}
      .bella-switch input{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;opacity:0!important;pointer-events:auto!important;cursor:pointer;z-index:2}
      .bella-switch-track{pointer-events:none!important}
    `;
    document.head.appendChild(style);
  }
  installSwitchInteractionFix();

  const coreModules = [
    "bella-account.js",
    "bella-analytics.js",
    "script.js",
    "bella-legacy-plus.js",
    "bella-config.js",
    "bella-context.js",
    "bella-routing.js",
    "bella-moments.js",
    "bella-brain-v2.js",
    "bella-memory-v3.js",
    "bella-style.js",
    "bella-auth-bridge.js",
    "bella-runtime.js",
    "bella-voice.js",
    "bella-voice-v2.js",
    "bella-vnext.js",
    "bella-avatar.js",
    "bella-live-web.js",
    "bella-account-memory.js",
    "bella-account-center.js",
    "bella-speed.js",
    "bella-ui.js",
    "bella-moments-ui.js",
    "bella-alive.js",
    "bella-moments-feedback.js",
    "bella-ai-activities.js",
    "bella-install.js"
  ];

  const deferredModules = [
    "bella-moments-cloud.js",
    "bella-owner-center.js",
    "bella-owner-users.js",
    "bella-moderator-center.js",
    "bella-owner-analytics.js",
    "bella-owner-controls.js",
    "bella-owner-moments.js",
    "bella-owner-dashboard-v2.js"
  ];

  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `/${file}?v=16`;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${file}`));
      document.head.appendChild(script);
    });
  }

  function loadList(list) {
    let chain = Promise.resolve();
    for (const file of list) chain = chain.then(() => loadScript(file));
    return chain;
  }

  function showBootError(error) {
    console.error("Bella boot failed:", error);
    const banner = document.getElementById("bellaConnectionState") || document.createElement("div");
    banner.id = "bellaConnectionState";
    banner.className = "bella-connection-state";
    banner.hidden = false;
    banner.textContent = "تعذر تحميل بيلا بالكامل. حدّث الصفحة وجرب مرة ثانية.";
    const inputArea = document.querySelector(".input-area");
    if (!banner.isConnected && inputArea) inputArea.insertAdjacentElement("beforebegin", banner);
  }

  let deferredPromise = null;
  function loadDeferred() {
    if (deferredPromise) return deferredPromise;
    deferredPromise = loadList(deferredModules).catch(error => {
      console.warn("Bella deferred modules skipped:", error?.message || error);
      return false;
    });
    window.__bellaAdminBoot = deferredPromise;
    return deferredPromise;
  }
  window.__bellaLoadDeferred = loadDeferred;

  const core = loadList(coreModules);
  window.__bellaCoreBoot = core;
  window.__bellaBoot = core.then(() => {
    const schedule = () => loadDeferred();
    if ("requestIdleCallback" in window) window.requestIdleCallback(schedule, { timeout: 1400 });
    else setTimeout(schedule, 350);
    return true;
  }).catch(error => { showBootError(error); throw error; });
})();
