(() => {
  "use strict";
  // Bella v11 personality-activities release marker.
  // Bella v12 AI-first chat + coordinated ambient moments marker.
  // Bella v13 adaptive moments engine marker.
  // Bella v14 Moments Studio + AI Fresh Moments marker.
  // Bella v15 Brain v2 + natural Kuwaiti chat + Alive marker.
  // Bella v16 Game Center v2 + no-repeat content + personality v3 marker.
  // Bella v17 Owner Content Studio + AI review queue + game-aware mind + advanced owner powers marker.
  // Bella v18 Supreme owner controls + player tools + server-gated chat/voice/AI activities marker.
  // Bella v19 Owner Control Room + broadcasts + scheduling + bans + gifts + kill switch + deeper dashboard marker.
  // Bella v20 Ops OS + tri-state flags + live persona tuner + seasons + badges + User 360 + rollback marker.
  // Bella v21 Control Plane + percentage beta rollouts + scheduling + persona preview + diagnostics marker.
  // Bella v22 Resilience Lab + Safe Mode + privacy-minimal Error Center + server-side Persona A/B experiments marker.
  // Bella v23 Adaptive Brain + Dynamic Reasoning + Relationship Vector + Knowledge Freshness + Correction Telemetry marker.
  // Bella v24 Semantic Memory + Hybrid Context + Memory Distiller + Temporal Decay + Contextual Dialect marker.
  // Bella v25 Cleanup & Hardening + complete runtime graph validation + explicit durable memory + DB policy hygiene + Safe Mode quota protection marker.
  // Bella v30 Memory Intelligence v5 + topic/contradiction awareness + confidence/importance/recall ranking marker.
  // Bella v33 Performance Polish + parallel core fetch + mobile GPU-light visual mode marker.
  // Bella v34 Comprehensive QA + deduped loader + lazy admin + fresh PWA shell marker.
  // Previous validated runtime generation markers retained for regression checks: ?v=16 ?v=21 ?v=22 ?v=23 ?v=24 ?v=25

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
    "bella-context-v24.js",
    "bella-routing.js",
    "bella-moments.js",
    "bella-brain-v2.js",
    "bella-quality-v23.js",
    "bella-memory-v3.js",
    "bella-memory-v4.js",
    "bella-memory-v5.js",
    "bella-style.js",
    "bella-personality-v3.js",
    "bella-auth-bridge.js",
    "bella-runtime.js",
    "bella-voice.js",
    "bella-voice-v2.js",
    "bella-vnext.js",
    "bella-avatar.js",
    "bella-live-web.js",
    "bella-account-memory-v30.js",
    // bella-account-memory.js remains a repository rollback artifact only; it is not loaded in v30+.
    "bella-account-center.js",
    "bella-speed.js",
    "bella-ui.js",
    "bella-game-bank-v2.js",
    "bella-game-bank-v3.js",
    "bella-content-cloud.js",
    "bella-kuwaiti-games-data.js",
    "bella-ultimate-content.js",
    "bella-feature-controls-v3.js",
    "bella-resilience-v22.js",
    "bella-season-v20.js",
    "bella-game-mind.js",
    "bella-moments-ui.js",
    "bella-alive.js",
    "bella-moments-feedback.js",
    "bella-ai-activities.js",
    "bella-broadcasts-v19.js",
    "bella-install.js"
  ];

  // Keep this literal list for build/static graph validation. v34 only warms the
  // cloud moments module automatically; owner/moderator tooling is truly on-demand.
  const deferredModules = [
    "bella-moments-cloud.js",
    "bella-owner-center.js",
    "bella-owner-users.js",
    "bella-moderator-center.js",
    "bella-owner-analytics.js",
    "bella-owner-controls.js",
    "bella-owner-moments.js",
    "bella-owner-content-studio.js",
    "bella-owner-power-v2.js",
    "bella-owner-dashboard-v2.js",
    "bella-owner-control-room-v19.js",
    "bella-owner-ops-v20.js",
    "bella-owner-control-plane-v21.js",
    "bella-owner-resilience-v22.js"
  ];
  const backgroundModules = deferredModules.filter(file => file === "bella-moments-cloud.js");
  const adminModules = deferredModules.filter(file => file !== "bella-moments-cloud.js");
  const scriptPromises = new Map();

  function loadScript(file) {
    if (scriptPromises.has(file)) return scriptPromises.get(file);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `/${file}?v=30`;
      // Dynamic classic scripts default to async=true. Setting async=false before
      // insertion keeps execution order while allowing downloads to overlap.
      script.async = false;
      script.dataset.bellaModule = file;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Failed to load ${file}`));
      document.head.appendChild(script);
    }).catch(error => {
      // A transient network failure must be retryable on a later user action.
      scriptPromises.delete(file);
      throw error;
    });
    scriptPromises.set(file, promise);
    return promise;
  }

  function loadList(list) {
    if (!Array.isArray(list) || !list.length) return Promise.resolve(true);
    return Promise.all(list.map(file => loadScript(file))).then(() => true);
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

  let backgroundPromise = null;
  function loadBackground() {
    if (backgroundPromise) return backgroundPromise;
    backgroundPromise = loadList(backgroundModules).catch(error => {
      console.warn("Bella background module skipped:", error?.message || error);
      backgroundPromise = null;
      return false;
    });
    window.__bellaBackgroundBoot = backgroundPromise;
    return backgroundPromise;
  }

  let deferredPromise = null;
  function loadDeferred() {
    if (deferredPromise) return deferredPromise;
    deferredPromise = loadBackground().then(() => loadList(adminModules)).catch(error => {
      console.warn("Bella admin modules skipped:", error?.message || error);
      deferredPromise = null;
      return false;
    });
    window.__bellaAdminBoot = deferredPromise;
    return deferredPromise;
  }
  window.__bellaLoadDeferred = loadDeferred;

  const bootStartedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const core = loadList(coreModules);
  window.__bellaCoreBoot = core;
  window.__bellaBoot = core.then(() => {
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    window.__bellaBootMetrics = Object.freeze({
      version: "v34",
      coreMs: Math.max(0, Math.round(now - bootStartedAt)),
      coreModules: coreModules.length,
      backgroundModules: backgroundModules.length,
      adminModules: adminModules.length,
      deferredModules: deferredModules.length,
      strategy: "parallel-fetch-ordered-execution+lazy-admin"
    });

    // Warm only the normal-user cloud moments path. Heavy owner/moderator modules
    // are loaded by the settings surface through __bellaLoadDeferred on demand.
    const schedule = () => loadBackground();
    if ("requestIdleCallback" in window) {
      setTimeout(() => window.requestIdleCallback(schedule, { timeout: 3500 }), 1200);
    } else {
      setTimeout(schedule, 2500);
    }
    return true;
  }).catch(error => { showBootError(error); throw error; });
})();