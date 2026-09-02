(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SITE_URL = "https://fessl5pp-github-io-fessl5pps-projects.vercel.app/";

  const SESSION_KEY = "bella_account_session_v1";
  const PROFILE_KEY = "bella_account_profile_v1";
  const LAST_USER_KEY = "bella_account_last_user_v1";
  const GUEST_BACKUP_KEY = "bella_guest_backup_v1";
  const LEGACY_KEY = "bella_clean_no_gemini_v31";
  const VNEXT_KEY = "bella_vnext_v2";
  const SETTINGS_KEY = "bella_ui_settings_v1";
  const MAX_MEMORY = 12;

  let session = readJson(SESSION_KEY, null);
  let profile = readJson(PROFILE_KEY, null);
  let user = null;
  let syncTimer = null;
  let syncing = false;
  let booted = false;

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function removeKey(key) {
    try { localStorage.removeItem(key); } catch {}
  }

  function cleanName(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 40);
  }

  function uniqueMemory(items) {
    const seen = new Set();
    const out = [];
    for (const item of Array.isArray(items) ? items : []) {
      const clean = String(item || "").replace(/\s+/g, " ").trim().slice(0, 160);
      const key = clean.toLowerCase();
      if (!clean || seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
    return out.slice(-MAX_MEMORY);
  }

  function numericMax(...values) {
    return Math.max(0, ...values.map(value => Number(value) || 0));
  }

  function safeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function localState() {
    return {
      legacy: safeObject(readJson(LEGACY_KEY, {})),
      vnext: safeObject(readJson(VNEXT_KEY, {})),
      settings: safeObject(readJson(SETTINGS_KEY, {}))
    };
  }

  function saveGuestBackup() {
    if (readJson(GUEST_BACKUP_KEY, null)) return;
    writeJson(GUEST_BACKUP_KEY, localState());
  }

  function restoreGuestBackup() {
    const backup = readJson(GUEST_BACKUP_KEY, null);
    if (!backup) {
      const legacy = safeObject(readJson(LEGACY_KEY, {}));
      const vnext = safeObject(readJson(VNEXT_KEY, {}));
      legacy.userName = "";
      vnext.name = "";
      vnext.onboarded = false;
      vnext.memory = [];
      writeJson(LEGACY_KEY, legacy);
      writeJson(VNEXT_KEY, vnext);
      return;
    }
    writeJson(LEGACY_KEY, safeObject(backup.legacy));
    writeJson(VNEXT_KEY, safeObject(backup.vnext));
    writeJson(SETTINGS_KEY, safeObject(backup.settings));
    removeKey(GUEST_BACKUP_KEY);
  }

  function snapshotLocal(displayName = "") {
    const { legacy, vnext, settings } = localState();
    const xp = numericMax(legacy.xp);
    const messages = numericMax(legacy.messages, vnext.stats?.messages);
    const gifts = numericMax(legacy.gifts);
    const level = Math.max(1, Number(legacy.lvl) || Math.floor(xp / 100) + 1);
    return {
      display_name: cleanName(displayName || vnext.name || legacy.userName || "مستخدم"),
      xp,
      level,
      messages,
      gifts,
      memory: uniqueMemory(vnext.memory),
      preferences: {
        theme: String(legacy.theme || "theme-blue"),
        randomSuggestions: settings.randomSuggestions === true,
        longContext: settings.longContext !== false,
        voiceEnabled: vnext.voiceEnabled === true,
        sfxEnabled: vnext.sfxEnabled !== false
      },
      state: {
        firstSeen: Number(vnext.firstSeen) || Date.now(),
        stats: safeObject(vnext.stats)
      },
      has_synced: true
    };
  }

  function mergeStats(localStats, remoteStats) {
    const a = safeObject(localStats);
    const b = safeObject(remoteStats);
    const keys = ["messages", "totalChars", "humor", "warmth", "radar", "dira", "gameWins"];
    const merged = { ...b, ...a };
    for (const key of keys) merged[key] = numericMax(a[key], b[key]);
    return merged;
  }

  function mergedCloudPayload(remote, displayName = "") {
    const local = snapshotLocal(displayName || remote?.display_name || profile?.display_name || "");
    const remotePrefs = safeObject(remote?.preferences);
    const remoteState = safeObject(remote?.state);
    return {
      user_id: user?.id,
      display_name: cleanName(displayName || remote?.display_name || local.display_name || "مستخدم"),
      xp: numericMax(local.xp, remote?.xp),
      level: Math.max(1, numericMax(local.level, remote?.level)),
      messages: numericMax(local.messages, remote?.messages),
      gifts: numericMax(local.gifts, remote?.gifts),
      memory: uniqueMemory([...(remote?.memory || []), ...(local.memory || [])]),
      preferences: {
        ...remotePrefs,
        ...local.preferences
      },
      state: {
        ...remoteState,
        ...local.state,
        firstSeen: Math.min(
          Number(remoteState.firstSeen) || Number(local.state.firstSeen) || Date.now(),
          Number(local.state.firstSeen) || Number(remoteState.firstSeen) || Date.now()
        ),
        stats: mergeStats(local.state.stats, remoteState.stats)
      },
      has_synced: true
    };
  }

  function applyProfileToLocal(remote) {
    if (!remote) return;
    const current = localState();
    const prefs = safeObject(remote.preferences);
    const remoteState = safeObject(remote.state);
    const remoteStats = safeObject(remoteState.stats);

    const legacy = { ...current.legacy };
    const vnext = { ...current.vnext };
    const settings = { ...current.settings };

    legacy.userName = cleanName(remote.display_name);
    legacy.xp = numericMax(legacy.xp, remote.xp);
    legacy.lvl = Math.max(1, numericMax(legacy.lvl, remote.level, Math.floor(legacy.xp / 100) + 1));
    legacy.messages = numericMax(legacy.messages, remote.messages);
    legacy.gifts = numericMax(legacy.gifts, remote.gifts);
    if (prefs.theme) legacy.theme = String(prefs.theme);

    vnext.name = cleanName(remote.display_name);
    vnext.onboarded = true;
    vnext.memory = uniqueMemory([...(remote.memory || []), ...(vnext.memory || [])]);
    vnext.stats = mergeStats(vnext.stats, remoteStats);
    if (remoteState.firstSeen) vnext.firstSeen = Math.min(Number(vnext.firstSeen) || Date.now(), Number(remoteState.firstSeen) || Date.now());
    if (typeof prefs.voiceEnabled === "boolean") vnext.voiceEnabled = prefs.voiceEnabled;
    if (typeof prefs.sfxEnabled === "boolean") vnext.sfxEnabled = prefs.sfxEnabled;

    if (typeof prefs.randomSuggestions === "boolean") settings.randomSuggestions = prefs.randomSuggestions;
    if (typeof prefs.longContext === "boolean") settings.longContext = prefs.longContext;

    writeJson(LEGACY_KEY, legacy);
    writeJson(VNEXT_KEY, vnext);
    writeJson(SETTINGS_KEY, settings);
    writeJson(PROFILE_KEY, remote);
    profile = remote;

    try {
      if (typeof s !== "undefined") {
        s.userName = cleanName(remote.display_name);
        s.xp = numericMax(s.xp, remote.xp);
        s.lvl = Math.max(1, numericMax(s.lvl, remote.level));
        s.messages = numericMax(s.messages, remote.messages);
      }
    } catch {}
  }

  function primeNameFromCache() {
    const cached = readJson(PROFILE_KEY, null);
    if (!cached?.display_name || !readJson(SESSION_KEY, null)?.access_token) return;
    const legacy = safeObject(readJson(LEGACY_KEY, {}));
    const vnext = safeObject(readJson(VNEXT_KEY, {}));
    legacy.userName = cleanName(cached.display_name);
    vnext.name = cleanName(cached.display_name);
    vnext.onboarded = true;
    writeJson(LEGACY_KEY, legacy);
    writeJson(VNEXT_KEY, vnext);
  }

  function authHeaders(token = "") {
    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function jsonRequest(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.msg || data?.message || data?.error_description || data?.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  function saveSession(data) {
    if (!data?.access_token) return null;
    session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || session?.refresh_token || "",
      expires_at: Date.now() + Math.max(60, Number(data.expires_in) || 3600) * 1000,
      token_type: data.token_type || "bearer"
    };
    writeJson(SESSION_KEY, session);
    return session;
  }

  function captureImplicitSession() {
    if (!location.hash || !location.hash.includes("access_token=")) return false;
    const params = new URLSearchParams(location.hash.slice(1));
    const accessToken = params.get("access_token");
    if (!accessToken) return false;
    saveSession({
      access_token: accessToken,
      refresh_token: params.get("refresh_token") || "",
      expires_in: Number(params.get("expires_in")) || 3600,
      token_type: params.get("token_type") || "bearer"
    });
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    return true;
  }

  async function refreshSession() {
    if (!session?.refresh_token) return null;
    try {
      const data = await jsonRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      return saveSession(data);
    } catch {
      clearSessionOnly();
      return null;
    }
  }

  async function validSession() {
    session = readJson(SESSION_KEY, session);
    if (!session?.access_token) return null;
    if (Number(session.expires_at || 0) < Date.now() + 60_000) return refreshSession();
    return session;
  }

  async function getUser() {
    const active = await validSession();
    if (!active) return null;
    try {
      const data = await jsonRequest(`${SUPABASE_URL}/auth/v1/user`, {
        headers: authHeaders(active.access_token)
      });
      user = data;
      return data;
    } catch {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
      try {
        const data = await jsonRequest(`${SUPABASE_URL}/auth/v1/user`, {
          headers: authHeaders(refreshed.access_token)
        });
        user = data;
        return data;
      } catch {
        clearSessionOnly();
        return null;
      }
    }
  }

  async function fetchProfile() {
    if (!user?.id || !session?.access_token) return null;
    const rows = await jsonRequest(
      `${SUPABASE_URL}/rest/v1/bella_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=*`,
      { headers: authHeaders(session.access_token) }
    );
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  async function upsertProfile(payload) {
    if (!user?.id || !session?.access_token) return null;
    const rows = await jsonRequest(`${SUPABASE_URL}/rest/v1/bella_profiles?on_conflict=user_id`, {
      method: "POST",
      headers: {
        ...authHeaders(session.access_token),
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({ ...payload, user_id: user.id })
    });
    const saved = Array.isArray(rows) ? rows[0] || null : null;
    if (saved) {
      profile = saved;
      writeJson(PROFILE_KEY, saved);
    }
    return saved;
  }

  async function bootstrapProfile() {
    const remote = await fetchProfile();
    if (!remote) return null;

    const lastUser = String(localStorage.getItem(LAST_USER_KEY) || "");
    const canAdoptThisDevice = !lastUser || lastUser === user.id;
    let next = remote;

    if (remote.has_synced !== true) {
      if (canAdoptThisDevice) {
        saveGuestBackup();
        next = await upsertProfile(mergedCloudPayload(remote, remote.display_name));
      } else {
        next = await upsertProfile({ ...remote, has_synced: true });
      }
    } else if (canAdoptThisDevice) {
      saveGuestBackup();
      const merged = mergedCloudPayload(remote, remote.display_name);
      next = await upsertProfile(merged);
    }

    applyProfileToLocal(next || remote);
    try { localStorage.setItem(LAST_USER_KEY, user.id); } catch {}
    return next || remote;
  }

  function profileForRemoteMerge(remote, localPayload) {
    const remotePrefs = safeObject(remote?.preferences);
    const remoteState = safeObject(remote?.state);
    return {
      user_id: user.id,
      display_name: cleanName(localPayload.display_name || remote?.display_name || "مستخدم"),
      xp: numericMax(localPayload.xp, remote?.xp),
      level: Math.max(1, numericMax(localPayload.level, remote?.level)),
      messages: numericMax(localPayload.messages, remote?.messages),
      gifts: numericMax(localPayload.gifts, remote?.gifts),
      memory: uniqueMemory([...(remote?.memory || []), ...(localPayload.memory || [])]),
      preferences: { ...remotePrefs, ...localPayload.preferences },
      state: {
        ...remoteState,
        ...localPayload.state,
        stats: mergeStats(localPayload.state?.stats, remoteState.stats)
      },
      has_synced: true
    };
  }

  async function syncNow() {
    if (syncing || !user?.id) return false;
    syncing = true;
    try {
      const active = await validSession();
      if (!active) return false;
      const remote = await fetchProfile();
      if (!remote) return false;
      const local = snapshotLocal(profile?.display_name || remote.display_name);
      const saved = await upsertProfile(profileForRemoteMerge(remote, local));
      if (saved) updateAccountButtons();
      return Boolean(saved);
    } catch (error) {
      console.warn("Bella account sync skipped:", error?.message || error);
      return false;
    } finally {
      syncing = false;
    }
  }

  function scheduleSync(delay = 1800) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncNow(), delay);
  }

  function clearSessionOnly() {
    session = null;
    user = null;
    profile = null;
    removeKey(SESSION_KEY);
    removeKey(PROFILE_KEY);
    updateAccountButtons();
  }

  async function signUp(name, email, password) {
    const clean = cleanName(name);
    if (clean.length < 2) throw new Error("اكتب اسم أو لقب من حرفين على الأقل.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("اكتب إيميل صحيح.");
    if (String(password || "").length < 8) throw new Error("كلمة المرور لازم تكون 8 خانات أو أكثر.");

    const redirectTo = `${SITE_URL}?account=confirmed`;
    const data = await jsonRequest(`${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email: email.trim(), password, data: { display_name: clean } })
    });

    if (data.access_token) {
      saveGuestBackup();
      saveSession(data);
      user = data.user || await getUser();
      await bootstrapProfile();
      return { active: true, confirmationRequired: false };
    }

    return { active: false, confirmationRequired: true };
  }

  async function signIn(email, password) {
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("اكتب إيميل صحيح.");
    if (!password) throw new Error("اكتب كلمة المرور.");
    const data = await jsonRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email: email.trim(), password })
    });
    saveGuestBackup();
    saveSession(data);
    user = data.user || await getUser();
    await bootstrapProfile();
    return true;
  }

  async function updateDisplayName(name) {
    const clean = cleanName(name);
    if (clean.length < 2) throw new Error("الاسم قصير حيل.");
    const remote = await fetchProfile();
    const local = snapshotLocal(clean);
    const saved = await upsertProfile(profileForRemoteMerge(remote, { ...local, display_name: clean }));
    if (saved) applyProfileToLocal(saved);
    return saved;
  }

  async function signOut() {
    try { await syncNow(); } catch {}
    try {
      if (session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: authHeaders(session.access_token)
        });
      }
    } catch {}
    restoreGuestBackup();
    clearSessionOnly();
    location.reload();
  }

  function friendlyError(error) {
    const text = String(error?.message || error || "").toLowerCase();
    if (text.includes("invalid login credentials")) return "الإيميل أو كلمة المرور مو صح.";
    if (text.includes("email not confirmed")) return "فعّل الإيميل أول من الرسالة اللي وصلتك، وعقب سجل دخول.";
    if (text.includes("user already registered")) return "هذا الإيميل عنده حساب من قبل. جرّب تسجيل الدخول.";
    if (text.includes("password should be")) return "كلمة المرور ضعيفة؛ خلها 8 خانات أو أكثر.";
    if (text.includes("rate limit")) return "كثرت المحاولات بسرعة، نطر شوي وجرب مرة ثانية.";
    return error?.message || "صار خطأ بالحساب، جرّب مرة ثانية.";
  }

  function ensureStyles() {
    if (document.getElementById("bellaAccountStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaAccountStyles";
    style.textContent = `
      .bella-account-grid{display:grid;gap:10px;margin-top:14px}
      .bella-account-grid label{display:grid;gap:6px;text-align:right;font-size:12px;font-weight:800}
      .bella-account-grid input{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.06);color:inherit;padding:12px;font:inherit;outline:none}
      .bella-account-grid input:focus{border-color:var(--accent)}
      .bella-account-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
      .bella-account-tabs button,.bella-account-action{border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:10px 12px;background:rgba(255,255,255,.06);color:inherit;font:inherit;font-weight:800;cursor:pointer}
      .bella-account-tabs button.active,.bella-account-action.primary{background:var(--accent);color:#fff;border-color:transparent}
      .bella-account-error{min-height:18px;color:#ffadad;font-size:12px;line-height:1.5;margin-top:8px}
      .bella-account-note{font-size:11px;color:var(--muted);line-height:1.7;margin:10px 0 0}
      .bella-account-status{padding:11px 12px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.05);text-align:right;line-height:1.7}
      .bella-account-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .bella-account-row button{flex:1;min-width:120px}
    `;
    document.head.appendChild(style);
  }

  function modalShell() {
    document.getElementById("bellaAccountModal")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaAccountModal";
    modal.className = "vnext-modal";
    modal.innerHTML = `<div class="vnext-card" role="dialog" aria-modal="true" aria-labelledby="bellaAccountTitle"></div>`;
    modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    return modal.querySelector(".vnext-card");
  }

  function setBusy(card, busy) {
    card.querySelectorAll("button,input").forEach(el => { el.disabled = busy; });
  }

  function openGuestAccount(mode = "signup") {
    const card = modalShell();
    card.innerHTML = `
      <h2 id="bellaAccountTitle">حساب بيلا 👤</h2>
      <p>الحساب اختياري. إذا سجلت، بيلا تعرف اسمك وتزامن تقدمك وذاكرتها البسيطة بين أجهزتك.</p>
      <div class="bella-account-tabs">
        <button id="bellaTabSignup" class="${mode === "signup" ? "active" : ""}">إنشاء حساب</button>
        <button id="bellaTabLogin" class="${mode === "login" ? "active" : ""}">تسجيل دخول</button>
      </div>
      <div class="bella-account-grid">
        <label id="bellaAccountNameWrap" ${mode === "login" ? "hidden" : ""}>الاسم أو اللقب<input id="bellaAccountName" maxlength="40" autocomplete="name" placeholder="مثال: فيصل"></label>
        <label>الإيميل<input id="bellaAccountEmail" type="email" autocomplete="email" inputmode="email" placeholder="name@example.com"></label>
        <label>كلمة المرور<input id="bellaAccountPassword" type="password" minlength="8" autocomplete="${mode === "login" ? "current-password" : "new-password"}" placeholder="8 خانات أو أكثر"></label>
      </div>
      <div id="bellaAccountError" class="bella-account-error"></div>
      <div class="bella-account-row"><button id="bellaAccountSubmit" class="bella-account-action primary">${mode === "signup" ? "أنشئ حسابي" : "دخول"}</button><button id="bellaAccountCancel" class="bella-account-action">إلغاء</button></div>
      <p class="bella-account-note">ما نخزن نص محادثاتك بالسحابة تلقائيًا. الحساب يزامن الاسم، XP/Level، التفضيلات وذاكرة بيلا المختصرة فقط.</p>
    `;

    const switchMode = next => { card.closest(".vnext-modal")?.remove(); openGuestAccount(next); };
    card.querySelector("#bellaTabSignup").onclick = () => switchMode("signup");
    card.querySelector("#bellaTabLogin").onclick = () => switchMode("login");
    card.querySelector("#bellaAccountCancel").onclick = () => card.closest(".vnext-modal")?.remove();
    card.querySelector("#bellaAccountSubmit").onclick = async () => {
      const errorEl = card.querySelector("#bellaAccountError");
      errorEl.textContent = "";
      const name = card.querySelector("#bellaAccountName")?.value || "";
      const email = card.querySelector("#bellaAccountEmail").value.trim();
      const password = card.querySelector("#bellaAccountPassword").value;
      setBusy(card, true);
      try {
        if (mode === "signup") {
          const result = await signUp(name, email, password);
          if (result.confirmationRequired) {
            card.innerHTML = `
              <h2>باقي التأكيد 📩</h2>
              <p>أرسلنا رسالة تأكيد إلى <b>${escapeHtml(email)}</b>. افتحها واضغط رابط التأكيد، وبعدها ارجع لبيلا وسجل دخول.</p>
              <p class="bella-account-note">حتى لو صفحة التأكيد سكرت أو حولتك، المهم يتم تأكيد الإيميل. بعدها حسابك يصير جاهز.</p>
              <div class="bella-account-row"><button id="bellaGoLogin" class="bella-account-action primary">روح لتسجيل الدخول</button><button id="bellaCloseConfirm" class="bella-account-action">سكر</button></div>`;
            card.querySelector("#bellaGoLogin").onclick = () => switchMode("login");
            card.querySelector("#bellaCloseConfirm").onclick = () => card.closest(".vnext-modal")?.remove();
            return;
          }
        } else {
          await signIn(email, password);
        }
        location.reload();
      } catch (error) {
        errorEl.textContent = friendlyError(error);
        setBusy(card, false);
      }
    };
  }

  function openSignedInAccount() {
    const card = modalShell();
    const email = user?.email || "";
    const name = cleanName(profile?.display_name || "مستخدم");
    card.innerHTML = `
      <h2 id="bellaAccountTitle">حسابك مع بيلا 👤</h2>
      <div class="bella-account-status"><b>${escapeHtml(name)}</b><br><span>${escapeHtml(email)}</span><br><small>☁️ الاسم والتقدم والذاكرة المختصرة تتزامن بين أجهزتك.</small></div>
      <div class="bella-account-grid"><label>اسم بيلا لك<input id="bellaSignedName" maxlength="40" value="${escapeHtmlAttr(name)}"></label></div>
      <div id="bellaAccountError" class="bella-account-error"></div>
      <div class="bella-account-row">
        <button id="bellaSaveName" class="bella-account-action primary">حفظ الاسم</button>
        <button id="bellaSyncNow" class="bella-account-action">مزامنة الآن</button>
        <button id="bellaSignOut" class="bella-account-action">تسجيل خروج</button>
      </div>
      <p class="bella-account-note">محادثاتك الكاملة ما تنرفع للحساب تلقائيًا. ذاكرة سياق السوالف الطويلة تبقى محليًا على الجهاز حسب إعدادك.</p>`;

    card.querySelector("#bellaSaveName").onclick = async () => {
      const errorEl = card.querySelector("#bellaAccountError");
      errorEl.textContent = "";
      setBusy(card, true);
      try {
        await updateDisplayName(card.querySelector("#bellaSignedName").value);
        location.reload();
      } catch (error) {
        errorEl.textContent = friendlyError(error);
        setBusy(card, false);
      }
    };
    card.querySelector("#bellaSyncNow").onclick = async () => {
      const button = card.querySelector("#bellaSyncNow");
      button.textContent = "جاري المزامنة...";
      const ok = await syncNow();
      button.textContent = ok ? "تمت المزامنة ✅" : "تعذرت المزامنة";
      setTimeout(() => { if (button.isConnected) button.textContent = "مزامنة الآن"; }, 1800);
    };
    card.querySelector("#bellaSignOut").onclick = () => signOut();
  }

  function openAccount() {
    ensureStyles();
    if (user?.id && profile) openSignedInAccount();
    else openGuestAccount("signup");
  }

  function updateAccountButtons() {
    const name = user?.id && profile?.display_name ? cleanName(profile.display_name) : "";
    const label = name ? `👤 ${name}` : "👤 الحساب";
    document.querySelectorAll("[data-bella-account-button]").forEach(button => {
      button.textContent = label;
      button.title = name ? `حساب ${name}` : "حساب بيلا";
    });
  }

  function installAccountButtons() {
    ensureStyles();
    const hero = document.querySelector(".hero-actions");
    if (hero && !hero.querySelector("[data-bella-account-button]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost";
      button.dataset.bellaAccountButton = "1";
      button.onclick = openAccount;
      hero.appendChild(button);
    }

    const more = document.querySelector("#bellaMoreMenu .bella-more-grid");
    if (more && !more.querySelector("[data-bella-account-button]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.bellaAccountButton = "1";
      button.onclick = () => {
        try { window.closeBellaMoreMenu?.(); } catch {}
        openAccount();
      };
      more.prepend(button);
    }
    updateAccountButtons();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function escapeHtmlAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function decorateMemoryAndPrivacy(node) {
    if (!(node instanceof HTMLElement)) return;
    if (node.id === "bellaMemory" && user?.id) {
      const paragraph = node.querySelector(".vnext-card > p");
      if (paragraph) paragraph.innerHTML = "هذي أشياء بسيطة محفوظة على <b>حسابك</b> وتتزامن بين أجهزتك. سياق المحادثة الطويل نفسه يبقى محليًا.";
    }
    if (node.id === "bellaPrivacy" && !node.querySelector(".bella-account-privacy")) {
      const card = node.querySelector(".vnext-card");
      if (!card) return;
      const note = document.createElement("p");
      note.className = "bella-account-privacy";
      note.textContent = "إذا سجلت بحساب بيلا، نزامن الاسم والتقدم والتفضيلات وذاكرة مختصرة اخترتها بيلا. ما نرفع نص محادثاتك الكاملة للحساب تلقائيًا.";
      const button = card.querySelector("button");
      if (button) card.insertBefore(note, button); else card.appendChild(note);
    }
  }

  async function bootstrap() {
    captureImplicitSession();
    const verified = await getUser();
    if (!verified) {
      booted = true;
      updateAccountButtons();
      return false;
    }
    try {
      await bootstrapProfile();
    } catch (error) {
      console.warn("Bella account profile bootstrap failed:", error?.message || error);
    }
    booted = true;
    updateAccountButtons();
    return true;
  }

  primeNameFromCache();

  window.BellaAccount = Object.freeze({
    open: openAccount,
    syncNow,
    isSignedIn: () => Boolean(user?.id && session?.access_token),
    displayName: () => cleanName(profile?.display_name || ""),
    email: () => user?.email || "",
    status: () => ({ signedIn: Boolean(user?.id), name: cleanName(profile?.display_name || ""), email: user?.email || "", booted })
  });

  window.__bellaAccountReady = bootstrap();

  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) decorateMemoryAndPrivacy(node);
  });

  function startUi() {
    installAccountButtons();
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && user?.id) syncNow();
    });
    window.addEventListener("pagehide", () => { if (user?.id) syncNow(); });
    setInterval(() => { if (user?.id && navigator.onLine !== false) syncNow(); }, 45_000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startUi, { once: true });
  else startUi();
})();
