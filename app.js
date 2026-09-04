(() => {
  "use strict";
  // Bella v11 personality-activities release marker.
  // Bella v12 AI-first chat + coordinated ambient moments marker.
  // Bella v13 adaptive moments engine marker.

  // The visible switch track is decoration; the full label area stays the real
  // tap target on iPhone/iPad and desktop.
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

  const modules = [
    "bella-account.js",
    "bella-analytics.js",
    "script.js",
    "bella-legacy-plus.js",
    "bella-config.js",
    "bella-context.js",
    "bella-routing.js",
    "bella-moments.js",
    "bella-style.js",
    "bella-auth-bridge.js",
    "bella-runtime.js",
    "bella-voice.js",
    "bella-vnext.js",
    "bella-avatar.js",
    "bella-live-web.js",
    "bella-account-memory.js",
    "bella-account-center.js",
    "bella-owner-center.js",
    "bella-owner-users.js",
    "bella-moderator-center.js",
    "bella-owner-analytics.js",
    "bella-owner-controls.js",
    "bella-speed.js",
    "bella-ui.js",
    "bella-moments-ui.js",
    "bella-install.js"
  ];

  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `/${file}?v=17`;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${file}`));
      document.head.appendChild(script);
    });
  }

  let chain = Promise.resolve();
  for (const file of modules) chain = chain.then(() => loadScript(file));

  window.__bellaBoot = chain.catch(error => {
    console.error("Bella boot failed:", error);
    const banner = document.getElementById("bellaConnectionState") || document.createElement("div");
    banner.id = "bellaConnectionState";
    banner.className = "bella-connection-state";
    banner.hidden = false;
    banner.textContent = "تعذر تحميل بيلا بالكامل. حدّث الصفحة وجرب مرة ثانية.";
    const inputArea = document.querySelector(".input-area");
    if (!banner.isConnected && inputArea) inputArea.insertAdjacentElement("beforebegin", banner);
  });
})();
