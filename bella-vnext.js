(() => {
  "use strict";

  const KEY = "bella_vnext_v2";
  const SITE_URL = "https://fessl5pp-github-io-fessl5pps-projects.vercel.app/";
  const defaults = {
    version: 2,
    onboarded: false,
    name: "",
    firstSeen: Date.now(),
    lastGreetingDay: "",
    mood: { angry: 0, cute: 0, happy: 0 },
    memory: [],
    recentReplies: [],
    recentUser: [],
    stats: { messages: 0, totalChars: 0, humor: 0, warmth: 0, radar: 0, dira: 0, gameWins: 0 },
    praiseStreak: 0,
    voiceEnabled: false,
    sfxEnabled: true
  };

  let v = load();
  let sending = false;
  let audioCtx = null;
  let typingTimer = null;

  const baseAddMsg = window.addMsg;
  const baseOpenChat = window.openChat;
  const baseCloseChat = window.closeChat;
  const baseUpdateMood = window.updateMood;
  const baseShowTheme = window.showTheme;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      return saved ? { ...structuredClone(defaults), ...saved, mood: { ...defaults.mood, ...(saved.mood || {}) }, stats: { ...defaults.stats, ...(saved.stats || {}) } } : structuredClone(defaults);
    } catch {
      return structuredClone(defaults);
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
    if (typeof s !== "undefined") {
      if (v.name) s.userName = v.name;
      if (typeof save === "function") save();
    }
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[؟?!.,،؛:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasAny(text, arr) {
    const n = norm(text);
    return arr.some(x => n.includes(norm(x)));
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function relationship() {
    const total = Math.max(v.stats.messages || 0, typeof s !== "undefined" ? (s.messages || 0) : 0);
    if (total >= 120) return "من أهل بيلا";
    if (total >= 60) return "خوي بيلا";
    if (total >= 25) return "من الربع";
    if (total >= 8) return "نعرف بعض";
    return "تو نعرف بعض";
  }

  function styleProfile() {
    const count = Math.max(1, v.stats.messages || 1);
    const avg = (v.stats.totalChars || 0) / count;
    return {
      brevity: avg < 22 ? "short" : avg > 95 ? "long" : "medium",
      humor: clamp(Math.round((v.stats.humor || 0) / Math.max(1, count / 6)), 0, 3),
      warmth: clamp(Math.round((v.stats.warmth || 0) / Math.max(1, count / 7)), 0, 3)
    };
  }

  function seriousText(text) {
    return hasAny(text, ["توفى", "وفاة", "مات", "مستشفى", "عملية", "سرطان", "خايف", "خايفه", "مكتئب", "انتحار", "مصيبة", "كارثة", "حادث", "مرض خطير", "مشكلة كبيرة", "تهديد"]);
  }

  function updateMoodFromText(text) {
    const playful = /😂|🤣|هههه|ككك/.test(text);
    const angryHit = hasAny(text, ["غبي", "غبيه", "حمار", "حماره", "كلب", "تيس", "وصخ", "زباله", "خرا", "زق", "انقلع", "انثبر", "سامج", "غثيث", "تفشلين", "اكرهج", "اكرهك", "فاشله", "سخيفه"]);
    const cuteHit = hasAny(text, ["احبج", "احبچ", "احبك", "اعشقج", "فديتج", "اشتقت لج", "يا بعد جبدي", "يا قلبي", "يا حلاتج", "اموت فيج", "ذربه", "كيوت"]);
    const happyHit = /😂|🤣|هههه|ككك/.test(text) || hasAny(text, ["كفو", "عاش", "وناسه", "مستانس", "نجح", "ضبط", "خوش", "يا سلام"]);
    const apology = hasAny(text, ["اسف", "آسف", "سامحيني", "حقج علي", "هدي", "لا تزعلين"]);

    v.mood.angry *= 0.72;
    v.mood.cute *= 0.76;
    v.mood.happy *= 0.72;

    if (angryHit) v.mood.angry += playful ? 1.15 : 3.1;
    if (cuteHit) v.mood.cute += 2.8;
    if (happyHit) v.mood.happy += 2.1;
    if (apology) v.mood.angry -= 2.0;
    if (seriousText(text)) {
      v.mood.angry *= 0.45;
      v.mood.happy *= 0.25;
    }

    v.mood.angry = clamp(v.mood.angry, 0, 8);
    v.mood.cute = clamp(v.mood.cute, 0, 8);
    v.mood.happy = clamp(v.mood.happy, 0, 8);

    let mode = "chill";
    if (v.mood.angry >= 3.2 && v.mood.angry >= v.mood.cute + 0.4) mode = "angry";
    else if (v.mood.cute >= 3.0) mode = "cute";
    else if (v.mood.happy >= 2.5) mode = "auto";

    if (typeof s !== "undefined") {
      const old = s.mode;
      s.mode = mode;
      if (!Array.isArray(s.modesTried)) s.modesTried = [];
      if (!s.modesTried.includes(mode)) s.modesTried.push(mode);
      if (mode === "angry" && old !== "angry") s.angryUses = (s.angryUses || 0) + 1;
    }
    persist();
    updateMoodUI();
    return mode;
  }

  function moodLabel(mode) {
    return ({ auto: "😄 سعيدة", angry: "😡 معصبة", cute: "🥺 دلّوعة", chill: "🙂 النفسية وسط" })[mode] || "🙂 النفسية وسط";
  }

  function updateMoodUI() {
    if (typeof baseUpdateMood === "function") {
      try { baseUpdateMood(); } catch {}
    }
    const mode = typeof s !== "undefined" ? s.mode : "chill";
    const mood = document.getElementById("mood-pill");
    const status = document.getElementById("mode-status");
    const chatStatus = document.getElementById("chat-status");
    const a = document.getElementById("chatAvatar");
    const h = document.getElementById("heroAvatar");
    if (mood) mood.textContent = moodLabel(mode);
    if (status) status.textContent = moodLabel(mode);
    if (chatStatus) chatStatus.textContent = `${relationship()} · ${moodLabel(mode).replace(/^\S+\s/, "")}`;
    [a, h].forEach(el => {
      if (!el) return;
      el.classList.remove("mood-angry", "mood-cute", "mood-happy", "mood-chill");
      el.classList.add(mode === "angry" ? "mood-angry" : mode === "cute" ? "mood-cute" : mode === "auto" ? "mood-happy" : "mood-chill");
    });
    updateAchievements();
  }

  window.updateMood = updateMoodUI;

  function safeMemory(text) {
    const blocked = ["مرض", "تشخيص", "علاج", "دواء", "دين", "مذهب", "سياسة", "حزب", "جنس", "سر", "كلمة مرور", "باسورد", "رقم مدني", "بطاقة"];
    return !hasAny(text, blocked);
  }

  function addMemory(text) {
    const clean = String(text || "").trim().replace(/\s+/g, " ").slice(0, 90);
    if (!clean || !safeMemory(clean)) return false;
    if (!v.memory.some(x => norm(x) === norm(clean))) v.memory.push(clean);
    v.memory = v.memory.slice(-12);
    persist();
    return true;
  }

  function learnFromText(text) {
    const n = norm(text);
    const likes = [
      ["قهو", "يحب القهوة"], ["ماتشا", "يحب الماتشا"], ["شاي", "يحب الشاي"],
      ["بحر", "يحب قعدات البحر"], ["ماينكرافت", "يلعب ماينكرافت"], ["روبلوكس", "يلعب روبلوكس"],
      ["مجبوس", "يحب المجبوس"], ["شاورما", "يحب الشاورما"], ["افنيوز", "يروح الأفنيوز"], ["مارينا", "يحب مارينا/البحر"]
    ];
    if (hasAny(n, ["احب", "أحب", "افضل", "أفضل", "دايم", "عادة"])) {
      for (const [key, mem] of likes) if (n.includes(key)) addMemory(mem);
    }
    const rememberMatch = text.match(/(?:تذكري|تذكرين|احفظي|حفظي)\s+(?:ان|إن|اني|إني)?\s*(.{3,80})/i);
    if (rememberMatch) addMemory(rememberMatch[1]);
  }

  function trackStyle(text) {
    v.stats.messages += 1;
    v.stats.totalChars += String(text).length;
    if (/😂|🤣|هههه|ككك/.test(text) || hasAny(text, ["نكت", "ضحك", "استهبال", "قطه", "قطة"])) v.stats.humor += 1;
    if (hasAny(text, ["مشكور", "تسلمين", "احب", "فديت", "كفو", "ذوق"])) v.stats.warmth += 1;
    if (hasAny(text, ["احبج", "فديتج", "يا حلاتج", "كفو عليج"])) v.praiseStreak += 1;
    else v.praiseStreak = Math.max(0, v.praiseStreak - 1);
    persist();
  }

  function messageText(node) {
    const c = node.cloneNode(true);
    c.querySelectorAll(".vnext-time,.source-row").forEach(x => x.remove());
    return (c.innerText || "").trim();
  }

  function recentHistory(currentText) {
    const out = [];
    for (const node of document.querySelectorAll("#box .m")) {
      const text = messageText(node);
      if (!text || text.startsWith("بيلا تكتب")) continue;
      if (node.classList.contains("user")) out.push({ role: "user", content: text });
      else if (node.classList.contains("bot")) out.push({ role: "assistant", content: text });
    }
    if (out.length && out[out.length - 1].role === "user" && norm(out[out.length - 1].content) === norm(currentText)) out.pop();
    return out.slice(-14);
  }

  function addTimestampToLast() {
    const node = document.querySelector("#box .m:last-child");
    if (!node || node.querySelector(".vnext-time")) return;
    const time = document.createElement("span");
    time.className = "vnext-time";
    time.textContent = new Intl.DateTimeFormat("ar-KW", { hour: "numeric", minute: "2-digit" }).format(new Date());
    node.appendChild(time);
  }

  window.addMsg = function enhancedAddMsg(text, type) {
    baseAddMsg(text, type);
    addTimestampToLast();
  };

  function showTyping() {
    addMsg("بيلا تكتب", "bot");
    const node = document.querySelector("#box .m.bot:last-child");
    if (!node) return;
    let dots = 0;
    typingTimer = setInterval(() => {
      dots = (dots + 1) % 4;
      const t = node.querySelector(".vnext-time");
      node.firstChild.textContent = `بيلا تكتب${".".repeat(dots)}`;
      if (t) node.appendChild(t);
    }, 340);
  }

  function hideTyping() {
    if (typingTimer) clearInterval(typingTimer);
    typingTimer = null;
    const bots = [...document.querySelectorAll("#box .m.bot")];
    const last = bots[bots.length - 1];
    if (last && messageText(last).startsWith("بيلا تكتب")) last.remove();
  }

  function recordReply(reply) {
    v.recentReplies.push(String(reply).slice(0, 260));
    v.recentReplies = v.recentReplies.slice(-10);
    persist();
  }

  window.getAIReply = async function vNextAIReply(text) {
    const now = new Date();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        message: text,
        mode: typeof s !== "undefined" ? s.mode : "chill",
        userName: v.name || (typeof s !== "undefined" ? s.userName : ""),
        history: recentHistory(text),
        memory: v.memory,
        relationship: relationship(),
        styleProfile: seriousText(text) ? { ...styleProfile(), humor: 0, warmth: 3 } : styleProfile(),
        localHour: now.getHours(),
        localDate: now.toLocaleDateString("ar-KW", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        recentReplies: v.recentReplies
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return data.error || "صار شي بالربط الحين، جرب عقب شوي.";
    if (data.mode && typeof s !== "undefined") s.mode = data.mode;
    const reply = data.reply || "ما فهمتها عدل، عيدها لي بطريقة ثانية؟";
    recordReply(reply);
    return reply;
  };

  function splitReply(reply) {
    const text = String(reply || "").trim();
    if (text.length < 95) return [text];
    const parts = text.split(/(?<=[.!؟…])\s+|\n+/).map(x => x.trim()).filter(Boolean);
    if (parts.length < 2) return [text];
    const first = parts.shift();
    return [first, parts.join(" ")];
  }

  async function renderReply(reply, serious) {
    const parts = !serious && Math.random() < 0.34 ? splitReply(reply) : [reply];
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      addMsg(parts[i], "bot");
      replyFx();
      if (v.voiceEnabled) speak(parts[i]);
      if (i < parts.length - 1) await new Promise(r => setTimeout(r, 450 + Math.random() * 420));
    }
  }

  function repeatedReply(text) {
    const n = norm(text);
    const count = v.recentUser.filter(x => norm(x) === n).length;
    v.recentUser.push(text);
    v.recentUser = v.recentUser.slice(-6);
    persist();
    if (count >= 2) return "مو تونا على هالسالفة؟ 😭 إذا تقصد شي ثاني قولها لي من زاوية ثانية.";
    if (v.praiseStreak >= 4) {
      v.praiseStreak = 0;
      persist();
      return "خلصنا عاد لا تمدحني وايد وأصدق نفسي 😂 شالسالفة شتبي؟";
    }
    return null;
  }

  window.send = async function vNextSend() {
    if (sending) return;
    const input = document.getElementById("inp");
    const text = (input?.value || "").trim();
    if (!text) return;
    if (text.length > 4000) {
      showToast("اختصرها شوي، الرسالة طويلة حيل 😅");
      return;
    }

    sending = true;
    const sendBtn = document.querySelector(".send");
    if (sendBtn) sendBtn.disabled = true;

    trackStyle(text);
    learnFromText(text);
    updateMoodFromText(text);
    if (typeof handleTypingBehavior === "function") handleTypingBehavior(text);
    if (typeof detectAvatarReaction === "function") detectAvatarReaction(text);

    addMsg(text, "user");
    input.value = "";
    showTyping();

    let reply = repeatedReply(text);
    if (!reply && hasAny(text, ["شنو تتذكرين عني", "شنو حافظه عني", "ذاكرتج", "ذاكرتك"])) {
      hideTyping();
      openMemoryPanel();
      sending = false;
      if (sendBtn) sendBtn.disabled = false;
      return;
    }
    if (!reply && hasAny(text, ["انس كل شي", "انسي كل شي", "امسحي ذاكرتج", "امسح الذاكره"])) {
      v.memory = [];
      persist();
      reply = "تم، مسحت الأشياء اللي كنت حافظتها عنك من هالجهاز.";
    }
    if (!reply && typeof getReply === "function") {
      try { reply = getReply(text); } catch { reply = null; }
    }
    if (reply === null || reply === undefined) reply = await getAIReply(text);

    const minDelay = Math.min(1000, 280 + String(reply).length * 5);
    await new Promise(r => setTimeout(r, minDelay));
    hideTyping();
    if (reply) await renderReply(reply, seriousText(text));

    if (typeof s !== "undefined") {
      const oldLvl = s.lvl || 1;
      s.messages = (s.messages || 0) + 1;
      s.xp = (s.xp || 0) + 10;
      s.lvl = Math.floor(s.xp / 100) + 1;
      if (typeof updateBadges === "function") updateBadges();
      if (typeof updateUI === "function") updateUI();
      if (s.lvl > oldLvl) {
        if (typeof showLevelCard === "function") showLevelCard();
        levelFx();
      }
      if (typeof save === "function") save();
    }
    updateMoodUI();
    if (typeof updateSuggestions === "function") updateSuggestions(reply || text);
    sending = false;
    if (sendBtn) sendBtn.disabled = false;
  };

  function ensureAudio() {
    if (!v.sfxEnabled) return null;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      return audioCtx;
    } catch { return null; }
  }

  function tone(freq, duration, volume, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + duration + 0.02);
    } catch {}
  }

  function haptic(pattern = 10) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {} }
  function clickFx() { tone(430, .03, .008); }
  function replyFx() { tone(620, .045, .012); tone(800, .05, .009, .035); haptic(9); }
  function levelFx() { tone(520, .05, .015); tone(680, .06, .013, .06); tone(850, .075, .012, .13); haptic([12, 35, 18]); }

  function speak(text) {
    if (!v.voiceEnabled || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[😂🤣🥺😡🙂✨🌸💕]/g, ""));
      const voices = speechSynthesis.getVoices();
      u.voice = voices.find(x => /ar-KW/i.test(x.lang)) || voices.find(x => /^ar/i.test(x.lang)) || null;
      u.lang = u.voice?.lang || "ar-KW";
      u.rate = .96;
      u.pitch = 1.04;
      speechSynthesis.speak(u);
    } catch {}
  }

  function toggleVoice() {
    v.voiceEnabled = !v.voiceEnabled;
    persist();
    const btn = document.getElementById("bellaVoiceToggle");
    if (btn) btn.textContent = v.voiceEnabled ? "🔊" : "🔇";
    showToast(v.voiceEnabled ? "صوت بيلا اشتغل 🔊" : "طفيت صوت بيلا");
  }

  function startVoiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return showToast("الإملاء الصوتي مو مدعوم بهالمتصفح للأسف.");
    const rec = new SR();
    rec.lang = "ar-KW";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    const btn = document.getElementById("bellaMic");
    if (btn) btn.textContent = "🟢";
    rec.onresult = e => {
      const input = document.getElementById("inp");
      if (input) input.value = e.results[0][0].transcript;
    };
    rec.onerror = () => showToast("ما قدرت أسمع عدل، جرب مرة ثانية.");
    rec.onend = () => { if (btn) btn.textContent = "🎙️"; };
    rec.start();
  }

  function modal(id, html) {
    document.getElementById(id)?.remove();
    const el = document.createElement("div");
    el.id = id;
    el.className = "vnext-modal";
    el.innerHTML = `<div class="vnext-card">${html}</div>`;
    el.addEventListener("click", e => { if (e.target === el) el.remove(); });
    document.body.appendChild(el);
    return el;
  }

  function showToast(text) {
    if (typeof showPopupCustom === "function") return showPopupCustom(text);
    const t = document.createElement("div");
    t.className = "vnext-toast";
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function onboard() {
    if (v.onboarded) return;
    const el = modal("bellaOnboard", `
      <div class="vnext-logo">B</div>
      <h2>قبل لا نبلش 👀</h2>
      <p>شسمك؟ بخليه عندي بهالجهاز عشان أناديك فيه بالسوالف.</p>
      <input id="bellaNameInput" class="vnext-input" maxlength="24" placeholder="اكتب اسمك أو لقبك">
      <div class="vnext-actions"><button id="bellaNameSave" class="vnext-primary">يلا نبلش</button><button id="bellaNameSkip" class="vnext-ghost">خلها بدون اسم</button></div>
    `);
    el.querySelector("#bellaNameSave").onclick = () => {
      const name = el.querySelector("#bellaNameInput").value.trim().split(/\s+/)[0].slice(0, 18);
      if (!name) return;
      v.name = name; v.onboarded = true; persist(); el.remove();
      addMsg(`هلا ${name}، الحين نعرف بعض عدل 😌 شكو ماكو؟`, "bot");
    };
    el.querySelector("#bellaNameSkip").onclick = () => { v.onboarded = true; persist(); el.remove(); };
  }

  window.openMemoryPanel = function openMemoryPanel() {
    const items = v.memory.length ? v.memory.map((x, i) => `<li>${escapeHtml(x)} <button data-del="${i}">×</button></li>`).join("") : "<li>للحين ما حفظت عنك شي مفيد.</li>";
    const el = modal("bellaMemory", `
      <h2>ذاكرة بيلا 🧠</h2>
      <p>هذي أشياء بسيطة محفوظة <b>على جهازك</b> عشان السوالف تصير أذكى.</p>
      <ul class="memory-list">${items}</ul>
      <div class="vnext-actions"><button id="clearBellaMemory" class="danger-btn">امسحي الذاكرة</button><button class="vnext-ghost" onclick="this.closest('.vnext-modal').remove()">سكر</button></div>
    `);
    el.querySelectorAll("[data-del]").forEach(btn => btn.onclick = () => { v.memory.splice(Number(btn.dataset.del), 1); persist(); openMemoryPanel(); });
    el.querySelector("#clearBellaMemory").onclick = () => { v.memory = []; persist(); el.remove(); showToast("تم مسح ذاكرة بيلا من هالجهاز."); };
  };

  window.openPrivacy = function openPrivacy() {
    modal("bellaPrivacy", `
      <h2>الخصوصية 🔐</h2>
      <p>بيلا تحفظ الاسم والتفضيلات البسيطة وعدادات اللعب محلياً في متصفحك عشان تكمل السالفة. تقدر تمسحها بأي وقت من زر الذاكرة.</p>
      <p>ما نطلب منك كلمات مرور أو بيانات بنكية أو أرقام رسمية. رسائل الذكاء الاصطناعي تنرسل للسيرفر عشان يطلع الرد، ومفعّل عدم تخزين الردود في طلبات OpenAI قدر الإمكان.</p>
      <button class="vnext-primary" onclick="this.closest('.vnext-modal').remove()">تمام</button>
    `);
  };

  async function callDira(topic, title = "شكو ماكو بالديرة؟ 🇰🇼") {
    v.stats.dira += 1; persist();
    openChat();
    showTyping();
    try {
      const r = await fetch("/api/dira", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) });
      const data = await r.json().catch(() => ({}));
      hideTyping();
      const reply = data.reply || data.error || "ما قدرت أجيب شي الحين.";
      addMsg(`${title}\n${reply}`, "bot");
      const node = document.querySelector("#box .m.bot:last-child");
      if (node && Array.isArray(data.sources) && data.sources.length) {
        const row = document.createElement("div");
        row.className = "source-row";
        row.innerHTML = data.sources.map((src, i) => `<a href="${escapeAttr(src.url)}" target="_blank" rel="noopener">مصدر ${i + 1}</a>`).join("");
        node.appendChild(row);
      }
    } catch {
      hideTyping(); addMsg("الواير لعب فيني، ما قدرت أجيب سوالف الديرة الحين.", "bot");
    }
  }

  window.openDira = () => callDira("فعاليات وأماكن وترندات اجتماعية خفيفة ومطاعم وقهوة ورياضة في الكويت اليوم");

  window.openRadarPlus = function openRadarPlus() {
    const el = modal("bellaRadar", `
      <h2>رادار القز+ 📡</h2><p>اختار شنو خاطرك فيه.</p>
      <div class="choice-grid" id="radarType">
        <button data-v="قهوة">☕ قهوة</button><button data-v="مطعم">🍽️ مطعم</button><button data-v="بحر وتمشية">🌊 بحر</button><button data-v="طلعة">✨ طلعة</button>
      </div>
      <p>والجو؟</p>
      <div class="choice-grid" id="radarVibe">
        <button data-v="هادي">هادي</button><button data-v="كشخة">كشخة</button><button data-v="شبابي">شبابي</button><button data-v="عائلي">عائلي</button>
      </div>
      <button id="radarGo" class="vnext-primary" disabled>شغلي الرادار</button>
    `);
    let type = "", vibe = "";
    el.querySelectorAll("#radarType button").forEach(b => b.onclick = () => { type = b.dataset.v; el.querySelectorAll("#radarType button").forEach(x => x.classList.remove("selected")); b.classList.add("selected"); el.querySelector("#radarGo").disabled = !(type && vibe); });
    el.querySelectorAll("#radarVibe button").forEach(b => b.onclick = () => { vibe = b.dataset.v; el.querySelectorAll("#radarVibe button").forEach(x => x.classList.remove("selected")); b.classList.add("selected"); el.querySelector("#radarGo").disabled = !(type && vibe); });
    el.querySelector("#radarGo").onclick = () => { el.remove(); v.stats.radar += 1; persist(); callDira(`أماكن ${type} في الكويت بجو ${vibe}، أعطني 3 خيارات حديثة ومفيدة مع سبب بسيط لكل اختيار`, "رادار القز لقط لك 📡"); };
  };

  const quiz = [
    { q: "شنو معنى «اشكره» بالكويتي؟", a: 1, o: ["يمكن", "بشكل واضح وصريح", "بسرعة", "بعدين"] },
    { q: "كمّل: اللي بالجدر...", a: 2, o: ["يشويه", "على قد لحافك", "يطلعه الملاس", "ما يطيح"] },
    { q: "إذا واحد قال «شكو؟» شقاعد يسأل غالباً؟", a: 0, o: ["شنو السالفة/شنو دخلك حسب السياق", "وين السيارة", "كم الساعة", "شنو ناكل"] },
    { q: "«حدي مستانس» معناها؟", a: 3, o: ["تعبان", "زعلان", "مستعجل", "وايد مستانس"] }
  ];

  window.startKuwaitiChallenge = function startKuwaitiChallenge() {
    const item = quiz[Math.floor(Math.random() * quiz.length)];
    const el = modal("bellaQuiz", `<h2>تحدي كويتي 🇰🇼</h2><p class="quiz-q">${item.q}</p><div class="quiz-options">${item.o.map((x, i) => `<button data-i="${i}">${x}</button>`).join("")}</div><small>الصح يعطيك +25 XP</small>`);
    el.querySelectorAll("[data-i]").forEach(btn => btn.onclick = () => {
      const ok = Number(btn.dataset.i) === item.a;
      if (ok) {
        if (typeof s !== "undefined") { s.xp = (s.xp || 0) + 25; s.lvl = Math.floor(s.xp / 100) + 1; if (typeof updateUI === "function") updateUI(); if (typeof save === "function") save(); }
        v.stats.gameWins += 1; persist(); btn.classList.add("correct"); showToast("كفووو +25 XP 🔥");
      } else { btn.classList.add("wrong"); showToast("لااا مو هذي 😭"); }
      setTimeout(() => el.remove(), 900);
    });
  };

  function updateAchievements() {
    const host = document.querySelector(".badges-wrap");
    if (!host || document.getElementById("vnextAchievements")) return;
    const box = document.createElement("div");
    box.id = "vnextAchievements";
    box.className = "vnext-achievements";
    host.appendChild(box);
    refreshAchievements();
  }

  function refreshAchievements() {
    const box = document.getElementById("vnextAchievements");
    if (!box) return;
    const total = typeof s !== "undefined" ? (s.messages || 0) : v.stats.messages;
    const chips = [
      [total >= 25, "🗣️ راعي سوالف"],
      [v.stats.radar >= 3, "☕ راعي قز"],
      [v.stats.gameWins >= 3, "🇰🇼 ولد الديرة"],
      [new Date().getHours() >= 2 && new Date().getHours() <= 5, "🌙 سماري"],
      [(typeof s !== "undefined" ? s.angryUses : 0) >= 5, "😮‍💨 صبر أيوب"]
    ];
    box.innerHTML = chips.map(([on, text]) => `<span class="ach-chip ${on ? "on" : ""}">${text}</span>`).join("");
  }

  function enhanceThemes() {
    const box = document.querySelector("#themeModal .theme-box");
    if (!box || box.querySelector(".sw5")) return;
    const lvl = typeof s !== "undefined" ? (s.lvl || 1) : 1;
    const pearl = document.createElement("div");
    pearl.className = `theme-swatch sw5 ${lvl < 6 ? "locked" : ""}`;
    pearl.title = lvl < 6 ? "يفتح Level 6" : "لؤلؤ";
    pearl.onclick = () => lvl >= 6 ? setTheme("theme-pearl") : showToast("يفتح لك بليفل 6 🐚");
    const diwa = document.createElement("div");
    diwa.className = `theme-swatch sw6 ${lvl < 12 ? "locked" : ""}`;
    diwa.title = lvl < 12 ? "يفتح Level 12" : "ديوانية";
    diwa.onclick = () => lvl >= 12 ? setTheme("theme-diwa") : showToast("يفتح لك بليفل 12 🧿");
    box.append(pearl, diwa);
  }

  window.showTheme = function showThemeVNext() {
    if (typeof baseShowTheme === "function") baseShowTheme();
    setTimeout(enhanceThemes, 0);
  };

  window.giveGift = function giveGiftGradual(type) {
    if (typeof s === "undefined") return;
    const cost = type === "rose" ? 20 : 35;
    if ((s.xp || 0) < cost) return addMsg(`ما عندك XP كافي 😏 تحتاج ${cost}.`, "bot");
    s.xp -= cost;
    s.gifts = (s.gifts || 0) + 1;
    if (type === "rose") { v.mood.cute += 1.6; v.mood.angry = Math.max(0, v.mood.angry - 1.1); }
    else { v.mood.happy += 1.0; v.mood.angry = Math.max(0, v.mood.angry - .8); }
    persist(); updateMoodFromText(type === "rose" ? "فديتج" : "خوش"); if (typeof updateUI === "function") updateUI();
    addMsg(type === "rose" ? "واي وردة؟ 😭 أوكي خفّت الطنقرة شوي." : "ككاو؟ أوهوو جذي تعرف تعدّل النفسية 😌", "bot");
  };

  async function makeStoryBlob() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 1080, 1920);
    g.addColorStop(0, "#11172b"); g.addColorStop(.5, "#20144b"); g.addColorStop(1, "#07101d");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
    ctx.textAlign = "right"; ctx.direction = "rtl";
    ctx.fillStyle = "white"; ctx.font = "bold 64px Arial"; ctx.fillText("Bella | بيلا الكويتية 🇰🇼", 990, 120);
    ctx.fillStyle = "#b9c2d3"; ctx.font = "34px Arial"; ctx.fillText(`${relationship()} · ${moodLabel(typeof s !== "undefined" ? s.mode : "chill")}`, 990, 180);
    const msgs = [...document.querySelectorAll("#box .m.user, #box .m.bot")].slice(-7).map(n => ({ user: n.classList.contains("user"), text: messageText(n).slice(0, 180) }));
    let y = 300;
    for (const m of msgs) {
      const lines = wrapCanvas(ctx, m.text, 760, 38);
      const h = Math.max(86, lines.length * 52 + 36);
      ctx.fillStyle = m.user ? "#0a84ff" : "#252b38";
      roundRect(ctx, m.user ? 250 : 70, y, 760, h, 30); ctx.fill();
      ctx.fillStyle = "white"; ctx.font = "34px Arial"; ctx.textAlign = "right";
      lines.forEach((line, i) => ctx.fillText(line, m.user ? 970 : 790, y + 58 + i * 52));
      y += h + 28;
      if (y > 1580) break;
    }
    ctx.textAlign = "center"; ctx.fillStyle = "#c8d1e1"; ctx.font = "30px Arial"; ctx.fillText("دش سولف ويا بيلا", 540, 1760);
    ctx.fillStyle = "white"; ctx.font = "26px Arial"; ctx.fillText(SITE_URL.replace("https://", ""), 540, 1810);
    try {
      const qr = await fetch(`https://quickchart.io/qr?size=180&text=${encodeURIComponent(SITE_URL)}`).then(r => r.blob()).then(createImageBitmap);
      ctx.drawImage(qr, 450, 1530, 180, 180);
    } catch {}
    return new Promise(resolve => canvas.toBlob(resolve, "image/png", .94));
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  }

  function wrapCanvas(ctx, text, max, font) {
    ctx.font = `${font}px Arial`;
    const words = String(text).split(/\s+/); const lines = []; let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > max && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line); return lines.slice(0, 4);
  }

  window.shareChat = async function shareStory() {
    showToast("قاعد أجهز لك الستوري 👀");
    try {
      const blob = await makeStoryBlob();
      if (!blob) throw new Error("no blob");
      const file = new File([blob], "bella-story.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Bella | بيلا الكويتية", text: "سولف ويا بيلا 🇰🇼", url: SITE_URL, files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "bella-story.png"; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast("جهزت لك صورة الستوري 📸");
      }
    } catch { showToast("ما قدرت أجهز المشاركة هالمرة."); }
  };

  function timeGreeting() {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (v.lastGreetingDay === day) return;
    v.lastGreetingDay = day; persist();
    const h = now.getHours();
    const name = v.name ? ` ${v.name}` : "";
    const line = h >= 2 && h <= 5 ? `ها${name}.. للحين صاحي؟ 😭 شالسالفة؟` : h < 11 ? `صباح الخير${name}، شكو ماكو اليوم؟` : h >= 19 ? `مساك الله بالخير${name}، شصار وياك اليوم؟` : `هلا${name}، شلون يومك للحين؟`;
    setTimeout(() => addMsg(line, "bot"), 300);
  }

  function injectUI() {
    const header = document.querySelector(".header-actions");
    if (header && !document.getElementById("bellaMemoryBtn")) {
      header.insertAdjacentHTML("afterbegin", `
        <button class="tiny" id="bellaMemoryBtn" onclick="openMemoryPanel()">🧠</button>
        <button class="tiny" onclick="openDira()">🇰🇼</button>
        <button class="tiny" onclick="openRadarPlus()">📡</button>
        <button class="tiny" onclick="startKuwaitiChallenge()">🧩</button>
        <button class="tiny" id="bellaVoiceToggle">${v.voiceEnabled ? "🔊" : "🔇"}</button>
      `);
      document.getElementById("bellaVoiceToggle").onclick = toggleVoice;
    }
    const inputArea = document.querySelector(".input-area");
    if (inputArea && !document.getElementById("bellaMic")) {
      const mic = document.createElement("button"); mic.id = "bellaMic"; mic.className = "mic-btn"; mic.textContent = "🎙️"; mic.onclick = startVoiceInput;
      inputArea.insertBefore(mic, inputArea.querySelector(".send"));
    }
    const heroActions = document.querySelector(".hero-actions");
    if (heroActions && !document.getElementById("heroMemory")) {
      heroActions.insertAdjacentHTML("beforeend", `<button class="ghost" id="heroMemory" onclick="openMemoryPanel()">ذاكرة بيلا 🧠</button><button class="ghost" onclick="openPrivacy()">الخصوصية 🔐</button><button class="ghost" onclick="openRadarPlus()">رادار القز+ 📡</button>`);
    }
    updateMoodUI();
  }

  window.openChat = function openChatVNext() {
    if (typeof baseOpenChat === "function") baseOpenChat(); else window.__openBella?.();
    injectUI();
    if (!v.onboarded) setTimeout(onboard, 120);
    else timeGreeting();
  };

  window.closeChat = function closeChatVNext() {
    if (typeof baseCloseChat === "function") baseCloseChat(); else window.__closeBella?.();
  };

  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])); }
  function escapeAttr(str) { return escapeHtml(str).replace(/`/g, "&#096;"); }

  document.addEventListener("pointerdown", e => { if (e.target.closest("button,.theme-swatch")) { ensureAudio(); clickFx(); } }, { passive: true });

  window.addEventListener("load", () => {
    if (typeof s !== "undefined") {
      if (v.name) s.userName = v.name;
      if (!s.mode || !["auto", "angry", "cute", "chill"].includes(s.mode)) s.mode = "chill";
    }
    injectUI();
    refreshAchievements();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js?v=5").catch(() => {});
  });
})();
