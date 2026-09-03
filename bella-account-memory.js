(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const VNEXT_KEY = "bella_vnext_v2";
  const SNAPSHOT_KEY = "bella_cloud_memory_snapshot_v2";
  const MAX_MEMORY = 12;
  const SYNC_INTERVAL_MS = 45000;
  let installed = false;
  let syncing = false;
  let syncTimer = null;
  let lastLocalSignature = "";

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function cleanMemory(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 160);
  }

  function memoryKey(value) {
    return cleanMemory(value)
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[؟?!.,،؛:]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  function uniqueMemory(items) {
    const seen = new Set();
    const out = [];
    for (const item of Array.isArray(items) ? items : []) {
      const clean = cleanMemory(item);
      const key = memoryKey(clean);
      if (!clean || !key || seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
    return out.slice(-MAX_MEMORY);
  }

  function categoryFor(text) {
    const value = memoryKey(text);
    if (/ماينكرافت|روبلوكس|فورتنايت|قيم|العاب|يلعب|العب/.test(value)) return "gaming";
    if (/قهو|ماتشا|شاي|مجبوس|شاورما|مطعم|اكل|يحب الاكل/.test(value)) return "food";
    if (/افنيوز|مارينا|بحر|مكان|منطقه|قعده|طلعه/.test(value)) return "places";
    if (/يحب|يفضل|افضل|ما يحب|مايفضل/.test(value)) return "preference";
    return "general";
  }

  function categoryLabel(category) {
    return ({ gaming: "🎮 ألعاب", food: "☕ أكل وقهوة", places: "📍 أماكن", preference: "❤️ تفضيل", general: "🧠 عام" })[category] || "🧠 عام";
  }

  function localMemory() {
    return uniqueMemory(readJson(VNEXT_KEY, {})?.memory);
  }

  function setLocalMemory(items) {
    const state = readJson(VNEXT_KEY, {}) || {};
    state.memory = uniqueMemory(items);
    writeJson(VNEXT_KEY, state);
    lastLocalSignature = state.memory.map(memoryKey).join("|");
  }

  function jwtSubject(token) {
    try {
      const part = String(token || "").split(".")[1];
      if (!part) return "";
      const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
      return String(JSON.parse(atob(padded))?.sub || "");
    } catch { return ""; }
  }

  async function authContext() {
    try { await Promise.resolve(window.__bellaAccountReady); } catch {}
    let session = readJson(SESSION_KEY, null);
    if (!session?.access_token) return null;
    if (Number(session.expires_at || 0) < Date.now() + 60000) {
      try { await window.BellaAccount?.syncNow?.(); } catch {}
      session = readJson(SESSION_KEY, null);
    }
    const userId = jwtSubject(session?.access_token);
    if (!session?.access_token || !userId) return null;
    return { token: session.access_token, userId };
  }

  function headers(token, extra = {}) {
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...extra
    };
  }

  async function fetchRows(ctx) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bella_memories?user_id=eq.${encodeURIComponent(ctx.userId)}&select=id,memory_key,memory_text,category,source,created_at,updated_at,deleted_at&order=updated_at.asc`,
      { headers: headers(ctx.token) }
    );
    if (!response.ok) throw new Error(`memory fetch ${response.status}`);
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  }

  async function upsertRows(ctx, items, source = "bella") {
    const rows = uniqueMemory(items).map(memory_text => ({
      user_id: ctx.userId,
      memory_key: memoryKey(memory_text),
      memory_text,
      category: categoryFor(memory_text),
      source,
      deleted_at: null
    })).filter(row => row.memory_key);
    if (!rows.length) return true;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/bella_memories?on_conflict=user_id,memory_key`, {
      method: "POST",
      headers: headers(ctx.token, { Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(rows)
    });
    if (!response.ok) throw new Error(`memory upsert ${response.status}`);
    return true;
  }

  async function tombstoneKey(ctx, key) {
    if (!key) return false;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bella_memories?user_id=eq.${encodeURIComponent(ctx.userId)}&memory_key=eq.${encodeURIComponent(key)}`,
      {
        method: "PATCH",
        headers: headers(ctx.token, { Prefer: "return=minimal" }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      }
    );
    if (!response.ok) throw new Error(`memory delete ${response.status}`);
    return true;
  }

  async function tombstoneAll(ctx) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bella_memories?user_id=eq.${encodeURIComponent(ctx.userId)}&deleted_at=is.null`,
      {
        method: "PATCH",
        headers: headers(ctx.token, { Prefer: "return=minimal" }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      }
    );
    if (!response.ok) throw new Error(`memory clear ${response.status}`);
    return true;
  }

  async function patchLegacyProfileMemory(ctx, memory) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bella_profiles?user_id=eq.${encodeURIComponent(ctx.userId)}`,
      {
        method: "PATCH",
        headers: headers(ctx.token, { Prefer: "return=minimal" }),
        body: JSON.stringify({ memory: uniqueMemory(memory) })
      }
    );
    return response.ok;
  }

  function saveSnapshot(userId, items) {
    writeJson(SNAPSHOT_KEY, {
      user_id: userId,
      keys: uniqueMemory(items).map(memoryKey),
      synced_at: Date.now()
    });
  }

  function activeRows(rows) {
    return rows.filter(row => !row.deleted_at && row.memory_text && row.memory_key);
  }

  async function syncExactMemory(options = {}) {
    if (syncing) return false;
    const ctx = await authContext();
    if (!ctx) return false;
    syncing = true;
    try {
      const local = localMemory();
      let rows = await fetchRows(ctx);
      const remoteByKey = new Map(rows.map(row => [String(row.memory_key || ""), row]));
      const tombstones = new Set(rows.filter(row => row.deleted_at).map(row => String(row.memory_key || "")));
      const snapshot = readJson(SNAPSHOT_KEY, null);
      const priorKeys = snapshot?.user_id === ctx.userId && Array.isArray(snapshot.keys) ? new Set(snapshot.keys) : new Set();
      const localByKey = new Map(local.map(item => [memoryKey(item), item]));

      const newlyLocal = [];
      for (const [key, text] of localByKey) {
        if (!key || tombstones.has(key)) continue;
        if (!remoteByKey.has(key) || (!priorKeys.has(key) && options.forceUploadLocal === true)) newlyLocal.push(text);
        else if (!priorKeys.has(key) && snapshot?.user_id !== ctx.userId) newlyLocal.push(text);
      }
      if (!rows.length && local.length) newlyLocal.push(...local);
      if (newlyLocal.length) await upsertRows(ctx, newlyLocal, "bella");

      if (snapshot?.user_id === ctx.userId) {
        for (const key of priorKeys) {
          if (localByKey.has(key)) continue;
          const row = remoteByKey.get(key);
          if (row && !row.deleted_at) await tombstoneKey(ctx, key);
        }
      }

      rows = await fetchRows(ctx);
      const finalActive = activeRows(rows).map(row => row.memory_text).slice(-MAX_MEMORY);
      setLocalMemory(finalActive);
      saveSnapshot(ctx.userId, finalActive);
      await patchLegacyProfileMemory(ctx, finalActive);
      decorateOpenPanel(rows);
      return true;
    } catch (error) {
      console.warn("Bella cloud memory sync skipped:", error?.message || error);
      return false;
    } finally {
      syncing = false;
    }
  }

  async function remember(text) {
    const clean = cleanMemory(text);
    if (!clean) return false;
    const ctx = await authContext();
    if (!ctx) return false;
    try {
      await upsertRows(ctx, [clean], "user");
      const next = uniqueMemory([...localMemory(), clean]);
      setLocalMemory(next);
      saveSnapshot(ctx.userId, next);
      await patchLegacyProfileMemory(ctx, next);
      await syncExactMemory();
      return true;
    } catch (error) {
      console.warn("Bella cloud memory add failed:", error?.message || error);
      return false;
    }
  }

  async function forget(text) {
    const key = memoryKey(text);
    if (!key) return false;
    const ctx = await authContext();
    if (!ctx) return false;
    try {
      await tombstoneKey(ctx, key);
      const next = localMemory().filter(item => memoryKey(item) !== key);
      setLocalMemory(next);
      saveSnapshot(ctx.userId, next);
      await patchLegacyProfileMemory(ctx, next);
      decorateOpenPanel();
      return true;
    } catch (error) {
      console.warn("Bella cloud memory delete failed:", error?.message || error);
      return false;
    }
  }

  async function clear() {
    const ctx = await authContext();
    if (!ctx) return false;
    try {
      await tombstoneAll(ctx);
      setLocalMemory([]);
      saveSnapshot(ctx.userId, []);
      await patchLegacyProfileMemory(ctx, []);
      decorateOpenPanel();
      return true;
    } catch (error) {
      console.warn("Bella cloud memory clear failed:", error?.message || error);
      return false;
    }
  }

  function panelMemoryText(li) {
    if (!li) return "";
    const clone = li.cloneNode(true);
    clone.querySelectorAll("button,.bella-memory-category").forEach(node => node.remove());
    return cleanMemory(clone.textContent || "");
  }

  function decorateOpenPanel(rows = null) {
    const modal = document.getElementById("bellaMemory");
    if (!modal || modal.dataset.cloudMemoryV2 === "1") return;
    modal.dataset.cloudMemoryV2 = "1";

    const signedIn = Boolean(window.BellaAccount?.isSignedIn?.());
    const description = modal.querySelector("p");
    if (description) {
      description.innerHTML = signedIn
        ? "هذي الأشياء اللي بيلا متذكرتها عنك. <b>☁️ مرتبطة بحسابك ومتزامنة بين أجهزتك.</b> تقدر تمسح أي معلومة بروحها."
        : "هذي الأشياء محفوظة <b>على جهازك فقط</b>. سجل دخول إذا تبي تتزامن بين أجهزتك.";
    }

    const knownRows = Array.isArray(rows) ? rows : [];
    const rowMap = new Map(knownRows.map(row => [String(row.memory_key || ""), row]));
    modal.querySelectorAll(".memory-list li").forEach(li => {
      const text = panelMemoryText(li);
      if (!text || text.includes("للحين ما حفظت")) return;
      const row = rowMap.get(memoryKey(text));
      const badge = document.createElement("small");
      badge.className = "bella-memory-category";
      badge.textContent = categoryLabel(row?.category || categoryFor(text));
      badge.style.marginInlineStart = "8px";
      badge.style.opacity = ".72";
      li.appendChild(badge);
    });

    if (signedIn && !modal.querySelector("#bellaCloudMemoryAdd")) {
      const tools = document.createElement("div");
      tools.id = "bellaCloudMemoryAdd";
      tools.className = "vnext-actions";
      tools.style.marginTop = "12px";
      tools.innerHTML = `<input id="bellaCloudMemoryInput" maxlength="160" placeholder="مثال: أحب القهوة بدون سكر" aria-label="معلومة جديدة لبيلا"><button id="bellaCloudMemorySave" class="vnext-primary" type="button">احفظيها ☁️</button>`;
      const actions = modal.querySelector(".vnext-actions");
      if (actions) actions.before(tools); else modal.appendChild(tools);
      const input = tools.querySelector("#bellaCloudMemoryInput");
      const button = tools.querySelector("#bellaCloudMemorySave");
      button.onclick = async () => {
        const value = cleanMemory(input.value);
        if (!value) return;
        button.disabled = true;
        button.textContent = "أحفظها...";
        const ok = await remember(value);
        button.disabled = false;
        button.textContent = "احفظيها ☁️";
        if (ok) {
          input.value = "";
          try { window.showToast?.("تم حفظها بحسابك ☁️"); } catch {}
          modal.remove();
          setTimeout(() => window.openMemoryPanel?.(), 0);
        } else {
          try { window.showToast?.("ما قدرت أزامنها الحين، جرب مرة ثانية."); } catch {}
        }
      };
    }

    modal.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const deleteButton = target.closest("[data-del]");
      if (deleteButton) {
        const li = deleteButton.closest("li");
        const text = panelMemoryText(li);
        setTimeout(() => text ? forget(text) : syncExactMemory(), 100);
        return;
      }
      if (target.closest("#clearBellaMemory")) setTimeout(() => clear(), 100);
    }, { capture: true });
  }

  function scheduleSync(delay = 350) {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncExactMemory(), delay);
  }

  function watchLocalMemory() {
    const signature = localMemory().map(memoryKey).join("|");
    if (!lastLocalSignature) {
      lastLocalSignature = signature;
      return;
    }
    if (signature !== lastLocalSignature) {
      lastLocalSignature = signature;
      scheduleSync(300);
    }
  }

  function install() {
    if (installed) return true;
    installed = true;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.id === "bellaMemory" || node.querySelector?.("#bellaMemory")) setTimeout(() => decorateOpenPanel(), 0);
        }
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && window.BellaAccount?.isSignedIn?.()) scheduleSync(0);
    });
    window.addEventListener("pagehide", () => {
      if (window.BellaAccount?.isSignedIn?.()) syncExactMemory();
    });
    window.addEventListener("storage", event => {
      if (event.key === VNEXT_KEY && window.BellaAccount?.isSignedIn?.()) scheduleSync(150);
    });
    setInterval(watchLocalMemory, 2500);
    setInterval(() => {
      if (window.BellaAccount?.isSignedIn?.() && navigator.onLine !== false) syncExactMemory();
    }, SYNC_INTERVAL_MS);
    return true;
  }

  async function finishEmailConfirmation() {
    const url = new URL(location.href);
    if (url.searchParams.get("account") !== "confirmed") return;
    try { await Promise.resolve(window.__bellaAccountReady); } catch {}
    if (!window.BellaAccount?.isSignedIn?.()) return;
    url.searchParams.delete("account");
    url.hash = "";
    location.replace(`${url.pathname}${url.search}` || "/");
  }

  window.BellaAccountMemory = Object.freeze({
    syncExactMemory,
    remember,
    forget,
    clear,
    install,
    status: () => ({ signedIn: Boolean(window.BellaAccount?.isSignedIn?.()), syncing, localCount: localMemory().length })
  });

  async function start() {
    install();
    try { await Promise.resolve(window.__bellaAccountReady); } catch {}
    lastLocalSignature = localMemory().map(memoryKey).join("|");
    if (window.BellaAccount?.isSignedIn?.()) await syncExactMemory({ forceUploadLocal: true });
    finishEmailConfirmation();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
