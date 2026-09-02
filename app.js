(() => {
  "use strict";

  const modules = [
    "bella-account.js",
    "script.js",
    "bella-legacy-plus.js",
    "bella-context.js",
    "bella-routing.js",
    "bella-style.js",
    "bella-runtime.js",
    "bella-vnext.js",
    "bella-speed.js",
    "bella-ui.js",
    "bella-install.js"
  ];

  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `/${file}?v=14`;
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
