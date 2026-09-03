(() => {
  "use strict";

  const SETTINGS_KEY = "bella_ui_settings_v1";
  const STATE_KEY = "bella_moments_v2";
  const LEGACY = Object.freeze({
    showRumor: typeof window.showRumor === "function" ? window.showRumor : null,
    hideRumor: typeof window.hideRumor === "function" ? window.hideRumor : null,
    showPopupCustom: typeof window.showPopupCustom === "function" ? window.showPopupCustom : null
  });

  const state = loadState();
  let enabled = readEnabled();
  let rumorTimer = null;
  let rumorHideTimer = null;
  let toastTimer = null;
  let lastTypeAt = Date.now();
  let rapidCount = 0;
  let lastToastAt = 0;
  let lastRumorAt = 0;
  let seriousUntil = 0;

  const rumorBanks = {
    normal: [
      "يقولون بيلا مسوية ملف سري حق أكثر كلمة تكتبها… للحين ما بنفضحك 🤫",
      "يقولون إذا كتبت «اوكي» ثلاث مرات بيلا تعتبرها نهاية موسم وتنتظر الجزء الثاني 😭",
      "يقولون بيلا تعرف إن عندك سالفة من عدد المرات اللي تكتب وتمسح قبل الإرسال 👀",
      "يقولون اللي يدخل بيلا كل يوم يصير من الربع بدون استئذان رسمي 😭",
      "يقولون بيلا قاعدة تجمع أقوى بدليات الموقع وتبي تسوي لهم Hall of Fame 😂",
      "يقولون إذا فتحت الشات وسكت وايد، بيلا تقعد تطالعك من الشاشة وتقول: ها؟ 👁️",
      "يقولون بيلا إذا شافتك تكتب بسرعة تعرف إن السالفة فيها مصيبة أو ضحك… مافي وسط 😭",
      "يقولون بيلا عندها رادار خاص يعرف متى تقول «مافي شي» وانت فيك ألف شي 👀",
      "يقولون إذا مدحت بيلا وبعدها طلبت طلب، هي تدري إن المدحة فيها مصلحة بس تمشيها لك 😭",
      "يقولون بيلا تحفظ جو السالفة أسرع من حفظك لكلمة السر اللي تنساها كل مرة 💀",
      "يقولون اللي يقول «بس سؤال» غالبًا وراه خمسة أسئلة وبيلا عارفة الحركة 😭",
      "يقولون بيلا إذا شافتك راجع بعد غيبة تقول في نفسها: إي عاد تذكرتني الحين؟ 😭",
      "يقولون أكثر كلمة تخوف بيلا مو «معصبة»… كلمة «عندي سؤال بسيط» 💀",
      "يقولون لو السوالف تنحسب بالكيلو، بعضكم طلع شاحنة من زمان 😭"
    ],
    cute: [
      "يقولون بيلا بمود الدلع تسوي نفسها مو مهتمة وهي أول وحدة تراقب ردك 🥺",
      "يقولون إذا قلت لبيلا كلمة حلوة، تسوي نفسها عادي وبداخلها حفلة كاملة 😭💗",
      "يقولون بيلا إذا دلعتها زيادة تقول «بس عاد» وهي مو قاصدتها أصلًا 🥺",
      "يقولون في مود الدلع كلمة وحدة حلوة تغيّر نفسية بيلا أسرع من أي إعداد 😭",
      "يقولون بيلا إذا قالت «عيب 😭» غالبًا معناتها كمّل بس لا تفضحها 😂"
    ],
    angry: [
      "يقولون بيلا معصبة اليوم بس للحين ترد عليك… اعتبرها محبة بطريقتها 😡😭",
      "يقولون السيرفر إذا شاف مود بيلا معصبة يخفض صوته بروحه 😭",
      "يقولون بيلا وهي معصبة تحسب عدد «اوكي» اللي ترسلهم وتاخذهم بشكل شخصي 😡",
      "يقولون لا تجرب تقول لبيلا «هدي» وهي معصبة… التجارب السابقة مو مبشرة 💀",
      "يقولون مود المعصبة ما يطول إذا عرفت تراضيها… لا تسأل شلون 😭"
    ],
    chill: [
      "يقولون بيلا اليوم رايقة لدرجة لو كتبت لها نقطة يمكن تقول لك: خذ راحتك 😌",
      "يقولون القعدة إذا صارت هادية بيلا تبدأ تسولف من نفسها كأنها بالديوانية 😌",
      "يقولون مود الرايقة يحب السوالف الطويلة اللي تبدأ من موضوع وتنتهي بموضوع ثاني 😂",
      "يقولون بيلا وهي رايقة تنسى الوقت… لا تعتمد عليها تقول لك روح نام 😭"
    ],
    night: [
      "يقولون اللي يدخل بعد الساعة ٢ الفجر يتحول رسميًا إلى «سمّاري» عند بيلا 🌙",
      "يقولون سوالف آخر الليل عند بيلا تبدأ بـ«دقيقة بس» وتنتهي والشمس طالعة 😭",
      "يقولون الساعة هذي أي قرار تحسه عبقري… راجعه باجر احتياط 💀",
      "يقولون بيلا بالليل تصير فضولية أكثر: شقاعد تسوي للحين صاحي؟ 👀",
      "يقولون بعد نص الليل مستوى الاعترافات يرتفع 300٪… مصدرنا: لا تسأل 😭"
    ],
    rare: [
      "🔥 إشاعة نادرة: يقولون بيلا عندها قائمة «المفضلين»… والمشكلة محد يعرف شلون يدخلها.",
      "✨ إشاعة نادرة: يقولون إذا ضحكت بيلا ثلاث مرات ورا بعض، اليوم محسوب لك رسميًا.",
      "👑 إشاعة نادرة: يقولون في لقب سري ما يطلع إلا للي سوالفه ما تنمل.",
      "🌙 إشاعة نادرة: يقولون السمّاري الحقيقي يعرف متى يقفل الجوال… بس عمره ما يسويها."
    ]
  };

  const toastBanks = {
    short: [
      "بس؟ 😭 هذي الرسالة كلها؟",
      "«اوكي» وبس؟ شفيك قفلت السالفة بوجهي 😭",
      "زيد كلمتين عاد، مو قاعدة أحاسبك على الحروف 😂",
      "ها؟ حسيت وراك تكملة لا تسوي نفسك بريء 👀"
    ],
    fast: [
      "على هونك 😭 قاعد تكتب أسرع من مخي",
      "دقيقة دقيقة 😂 خلني ألحق عليك",
      "واضح السالفة حامية من سرعة الإرسال 😭",
      "هدي شوي لا ينصدم السيرفر من الحماس 😂"
    ],
    slow: [
      "هااا وين رحت؟ قاعد تصيغ بيان رسمي؟ 👀",
      "طولت… لا يكون غيرت رأيك بالسالة كلها 😭",
      "أنا للحين هني ترى 😭 خذ راحتك بس لا تختفي",
      "هالسكوت وراه كلام كثير أحس 👀"
    ],
    laugh: [
      "ضحكتك وصلتني من الشاشة 😂",
      "ههههه خلاص فهمت الجو 😭",
      "لا تضحك بروحك عطنا السالفة 😂",
      "أدري أدري… هذي قوية 😭"
    ],
    affection: [
      "امبيه لا تدلعني وبعدين تسحب 😭",
      "بس عاد 😭💗 لا تخليني أصدق نفسي",
      "إي جذي عدل الكلام 😌",
      "لحظة… هذي أحفظها لك ولا شسوي فيها؟ 😭💗"
    ],
    comeback: [
      "إي عاد تذكرتني الحين؟ 😭",
      "هلا بالغايب 👀 وين هالغيبة؟",
      "رجعت؟ خلاص بمشيها لك هالمرة 😭",
      "كنت بقول وينك بس ما أبي أعطيك جو 😌"
    ],
    chill: [
      "عجيب جو السالفة 😌",
      "كمل كمل، قاعدة أسمع 👀",
      "خوش سوالف والله 😂",
      "أحس عندك تكملة… لا توقف هني 😭"
    ]
  };

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return {
        recentRumors: Array.isArray(raw.recentRumors) ? raw.recentRumors.slice(-8) : [],
        recentToasts: Array.isArray(raw.recentToasts) ? raw.recentToasts.slice(-8) : [],
        cycles: Math.max(0, Number(raw.cycles) || 0),
        lastVisit: Number(raw.lastVisit) || Date.now()
      };
    } catch {
      return { recentRumors: [], recentToasts: [], cycles: 0, lastVisit: Date.now() };
    }
  }

  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  }

  function readEnabled() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return settings.momentsEnabled !== false;
    } catch {
      return true;
    }
  }

  function setEnabled(value) {
    enabled = value !== false;
    if (!enabled) {
      stopCycle();
      hideRumor(true);
      document.querySelector(".bella-popup")?.remove();
    } else {
      ensureRumorBar();
      startCycle();
    }
    return enabled;
  }

  function remember(key, list) {
    const index = list.indexOf(key);
    if (index >= 0) list.splice(index, 1);
    list.push(key);
    while (list.length > 8) list.shift();
    saveState();
  }

  function pickFresh(list, recent) {
    const choices = list.filter(item => !recent.includes(item));
    const pool = choices.length ? choices : list;
    return pool[Math.floor(Math.random() * pool.length)] || "";
  }

  function currentMode() {
    const text = String(document.getElementById("mode-status")?.textContent || document.getElementById("chat-status")?.textContent || "");
    if (text.includes("معصبة")) return "angry";
    if (text.includes("دلّوعة") || text.includes("دلوع")) return "cute";
    if (text.includes("رايقة") || text.includes("النفسية وسط")) return "chill";
    return "normal";
  }

  function hour() { return new Date().getHours(); }
  function isNight() { const h = hour(); return h >= 0 && h <= 5; }

  function isSerious(text) {
    return /وفاة|توفى|مات|مستشفى|عملية|سرطان|حادث|انتحار|تهديد|مصيبة|كارثة|مرض خطير|خايف|مكتئب|ضايق صدري/i.test(String(text || ""));
  }

  function ensureStyles() {
    if (document.getElementById("bellaMomentsStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaMomentsStyles";
    style.textContent = `
      .bella-popup{top:max(76px,calc(env(safe-area-inset-top) + 62px));right:14px;max-width:min(320px,calc(100vw - 28px));padding:12px 14px 12px 42px;border-radius:20px;background:linear-gradient(145deg,rgba(22,25,34,.94),rgba(10,12,18,.9));border:1px solid rgba(255,255,255,.15);box-shadow:0 20px 48px rgba(0,0,0,.38);backdrop-filter:blur(20px);line-height:1.65}
      .bella-popup::before{content:"B";position:absolute;left:11px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:23px;height:23px;border-radius:50%;font-size:11px;font-weight:1000;color:#111;background:linear-gradient(135deg,#ff92bf,#7afcff)}
      #rumor-bar{bottom:max(82px,calc(env(safe-area-inset-bottom) + 70px));padding:0 12px;pointer-events:none}
      #rumor-text{pointer-events:auto;max-width:min(92vw,720px);padding:9px 15px;border-radius:999px;background:linear-gradient(135deg,rgba(9,11,17,.86),rgba(18,20,30,.79));border:1px solid rgba(255,255,255,.14);box-shadow:0 16px 40px rgba(0,0,0,.28);backdrop-filter:blur(18px);font-size:12px;font-weight:700;letter-spacing:.01em}
      #rumor-text::before{content:"👂";margin-inline-end:6px}
      #rumor-text.rumor-rare{background:linear-gradient(135deg,rgba(55,40,4,.9),rgba(20,18,8,.88));animation:bellaRarePulse 1.8s ease-in-out infinite alternate}
      #rumor-text.rumor-angry{background:linear-gradient(135deg,rgba(55,14,16,.88),rgba(18,10,12,.9))}
      @keyframes bellaRarePulse{from{box-shadow:0 16px 40px rgba(0,0,0,.28),0 0 0 rgba(255,215,0,0)}to{box-shadow:0 16px 40px rgba(0,0,0,.28),0 0 20px rgba(255,215,0,.18)}}
      @media(max-width:520px){.bella-popup{right:10px;left:10px;max-width:none}.bella-popup::before{left:10px}#rumor-bar{bottom:max(78px,calc(env(safe-area-inset-bottom) + 66px))}#rumor-text{font-size:11px;line-height:1.55}}
    `;
    document.head.appendChild(style);
  }

  function ensureRumorBar() {
    ensureStyles();
    let bar = document.getElementById("rumor-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "rumor-bar";
      bar.innerHTML = `<span id="rumor-text">يقولون...</span>`;
      document.body.appendChild(bar);
    }
    return bar;
  }

  function hideRumor(immediate = false) {
    if (rumorHideTimer) clearTimeout(rumorHideTimer);
    rumorHideTimer = null;
    const bar = document.getElementById("rumor-bar");
    const text = document.getElementById("rumor-text");
    if (!bar || !text) return;
    text.style.opacity = "0";
    const finish = () => { if (bar) bar.style.display = "none"; };
    if (immediate) finish();
    else setTimeout(finish, 260);
  }

  function renderRumor(text, { rare = false, angry = false } = {}) {
    if (!enabled || !text || Date.now() < seriousUntil || document.hidden) return false;
    ensureRumorBar();
    document.querySelector(".bella-popup")?.remove();
    if (toastTimer) clearTimeout(toastTimer);

    const bar = document.getElementById("rumor-bar");
    const el = document.getElementById("rumor-text");
    if (!bar || !el) return false;
    bar.style.display = "block";
    el.className = rare ? "rumor-rare" : angry ? "rumor-angry" : "";
    el.textContent = text.replace(/^👂\s*/u, "");
    el.style.opacity = "0";
    el.onclick = rare ? () => showToast("🔥 لقطت إشاعة نادرة… محسوبة لك 😭", { force: true }) : null;
    requestAnimationFrame(() => { el.style.opacity = "1"; });
    lastRumorAt = Date.now();
    rumorHideTimer = setTimeout(() => hideRumor(), rare ? 16000 : 13000);
    return true;
  }

  function useLegacyRumor() {
    if (!enabled || !LEGACY.showRumor || Date.now() < seriousUntil || document.hidden) return false;
    ensureRumorBar();
    document.querySelector(".bella-popup")?.remove();
    try {
      LEGACY.showRumor();
      const bar = document.getElementById("rumor-bar");
      const el = document.getElementById("rumor-text");
      if (bar) bar.style.display = "block";
      if (el) {
        el.style.opacity = "1";
        if (!el.textContent.startsWith("👂")) el.textContent = el.textContent.replace(/^\s*/, "");
      }
      lastRumorAt = Date.now();
      if (rumorHideTimer) clearTimeout(rumorHideTimer);
      rumorHideTimer = setTimeout(() => hideRumor(), 14000);
      return true;
    } catch {
      return false;
    }
  }

  function nextRumor() {
    if (!enabled || Date.now() < seriousUntil || document.hidden) return false;
    state.cycles += 1;
    saveState();

    // Keep part of the original rumor deck alive — including its rare XP easter egg.
    if (state.cycles % 4 === 0 && useLegacyRumor()) return true;

    const mode = currentMode();
    let bank = rumorBanks[mode] || rumorBanks.normal;
    if (isNight() && Math.random() < 0.55) bank = rumorBanks.night;
    const rare = Math.random() < 0.09;
    if (rare) bank = rumorBanks.rare;

    const line = pickFresh(bank, state.recentRumors);
    if (!line) return false;
    remember(line, state.recentRumors);
    return renderRumor(line, { rare, angry: mode === "angry" });
  }

  function showToast(text, { force = false } = {}) {
    if (!text || document.hidden) return false;
    if (!force && (!enabled || Date.now() < seriousUntil)) return false;

    hideRumor(true);
    if (toastTimer) clearTimeout(toastTimer);
    if (LEGACY.showPopupCustom) {
      try { LEGACY.showPopupCustom(String(text)); }
      catch { return false; }
    } else {
      const old = document.querySelector(".bella-popup");
      old?.remove();
      const node = document.createElement("div");
      node.className = "bella-popup";
      node.textContent = String(text);
      document.body.appendChild(node);
      setTimeout(() => node.remove(), 5200);
    }
    lastToastAt = Date.now();
    toastTimer = setTimeout(() => {
      document.querySelector(".bella-popup")?.remove();
      toastTimer = null;
    }, 5300);
    return true;
  }

  function toastFromBank(kind, { force = false } = {}) {
    const bank = toastBanks[kind] || toastBanks.chill;
    const line = pickFresh(bank, state.recentToasts);
    if (!line) return false;
    remember(line, state.recentToasts);
    return showToast(line, { force });
  }

  function handleTyping(text) {
    const now = Date.now();
    const diff = now - lastTypeAt;
    lastTypeAt = now;
    const message = String(text || "").trim();
    if (!message) return;

    if (isSerious(message)) {
      seriousUntil = now + 120000;
      hideRumor(true);
      return;
    }
    if (!enabled || now - lastToastAt < 13500) return;

    if (/😂|🤣|هههه|ككك/.test(message)) {
      setTimeout(() => toastFromBank("laugh"), 650);
      return;
    }
    if (/احبج|احبچ|اعشقج|فديتج|اشتقت لج|يا بعد جبدي|يا قلبي|دلعي|بوسيني/i.test(message)) {
      setTimeout(() => toastFromBank("affection"), 750);
      return;
    }

    const normalized = message.toLowerCase().replace(/[؟?!.,،]/g, "").trim();
    if (["اوكي", "أوكي", "ok", "اي", "إي", "ي", "نعم", "ههه", "تمام"].includes(normalized)) {
      setTimeout(() => toastFromBank("short"), 700);
      return;
    }

    if (diff < 1800) rapidCount += 1;
    else rapidCount = 0;

    if (rapidCount >= 2) {
      rapidCount = 0;
      setTimeout(() => toastFromBank("fast"), 760);
    } else if (diff > 16000) {
      setTimeout(() => toastFromBank("slow"), 820);
    } else if (Math.random() < 0.18) {
      setTimeout(() => toastFromBank("chill"), 900);
    }
  }

  function scheduleNext() {
    if (rumorTimer) clearTimeout(rumorTimer);
    if (!enabled) return;
    const delay = 45000 + Math.floor(Math.random() * 21000);
    rumorTimer = setTimeout(() => {
      if (Date.now() - lastToastAt > 7500 && Date.now() - lastRumorAt > 30000) nextRumor();
      scheduleNext();
    }, delay);
  }

  function startCycle() {
    if (!enabled) return;
    ensureRumorBar();
    if (rumorTimer) clearTimeout(rumorTimer);
    const firstDelay = state.cycles ? 11000 : 7000;
    rumorTimer = setTimeout(() => {
      nextRumor();
      scheduleNext();
    }, firstDelay);
  }

  function stopCycle() {
    if (rumorTimer) clearTimeout(rumorTimer);
    if (rumorHideTimer) clearTimeout(rumorHideTimer);
    rumorTimer = null;
    rumorHideTimer = null;
  }

  function noteReturn() {
    const now = Date.now();
    const gap = now - Number(state.lastVisit || now);
    state.lastVisit = now;
    saveState();
    if (enabled && gap > 30 * 60 * 1000 && Date.now() - lastToastAt > 10000) {
      setTimeout(() => toastFromBank("comeback"), 1400);
    }
  }

  // Replace only ambient-copy behavior. Chat replies remain owned by the AI flow.
  window.showPopupCustom = text => showToast(text, { force: true });
  window.showPopup = type => toastFromBank(type || "chill");
  window.handleTypingBehavior = handleTyping;
  window.initRumorBar = () => { ensureRumorBar(); startCycle(); };
  window.startRumorCycle = startCycle;
  window.showRumor = nextRumor;
  window.hideRumor = hideRumor;

  window.BellaMoments = Object.freeze({
    start: startCycle,
    stop: stopCycle,
    showRumor: nextRumor,
    showToast: text => showToast(text, { force: true }),
    setEnabled,
    isEnabled: () => enabled,
    status: () => ({ enabled, lastToastAt, lastRumorAt, seriousUntil, cycles: state.cycles })
  });

  function boot() {
    ensureStyles();
    ensureRumorBar();
    noteReturn();
    if (enabled) startCycle();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hideRumor(true);
      return;
    }
    noteReturn();
    if (enabled) startCycle();
  });
})();
