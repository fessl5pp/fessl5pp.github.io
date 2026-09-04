(() => {
  "use strict";

  // Bella v13 moments engine: ambient personality only. Normal chat replies stay AI-owned.
  const SETTINGS_KEY = "bella_ui_settings_v1";
  const STATE_KEY = "bella_moments_v3";
  const MAX_RECENT = 16;
  const SERIOUS_MS = 3 * 60 * 1000;

  let enabled = readSettings().momentsEnabled !== false;
  let intensity = normalizeIntensity(readSettings().momentsIntensity || "high");
  let rumorTimer = null;
  let rumorHideTimer = null;
  let toastTimer = null;
  let lastTypeAt = Date.now();
  let lastToastAt = 0;
  let lastRumorAt = 0;
  let rapidCount = 0;
  let seriousUntil = 0;
  let activeKind = "";

  const session = {
    startedAt: Date.now(),
    messages: 0,
    laughs: 0,
    affection: 0,
    shorts: 0,
    fastBursts: 0,
    rumors: 0,
    toasts: 0,
    rare: 0,
    legendary: 0,
    topic: "general",
    lastEvent: ""
  };

  const state = loadState();

  const rumorBanks = {
    normal: [
      m("n01", "يقولون بيلا مسوية ملف سري حق أكثر كلمة تكتبها… للحين ما بنفضحك 🤫"),
      m("n02", "يقولون إذا كتبت «اوكي» ثلاث مرات بيلا تعتبرها نهاية موسم وتنتظر الجزء الثاني 😭"),
      m("n03", "يقولون بيلا تعرف إن عندك سالفة من عدد المرات اللي تكتب وتمسح قبل الإرسال 👀"),
      m("n04", "يقولون اللي يدخل بيلا كل يوم يصير من الربع بدون استئذان رسمي 😭"),
      m("n05", "يقولون بيلا قاعدة تجمع أقوى بدليات الموقع وتبي تسوي لهم Hall of Fame 😂"),
      m("n06", "يقولون إذا فتحت الشات وسكت وايد، بيلا تقعد تطالعك من الشاشة وتقول: ها؟ 👁️"),
      m("n07", "يقولون اللي يقول «بس سؤال» غالبًا وراه خمسة أسئلة وبيلا عارفة الحركة 😭"),
      m("n08", "يقولون بيلا إذا شافتك راجع بعد غيبة تقول في نفسها: إي عاد تذكرتني الحين؟ 😭"),
      m("n09", "يقولون لو السوالف تنحسب بالكيلو، بعضكم طلع شاحنة من زمان 😭"),
      m("n10", "يقولون بيلا تعرف من أول رسالتين إذا اليوم سوالف ولا تحقيق رسمي 👀"),
      m("n11", "يقولون أكثر جملة ترفع ضغط بيلا: «مافي شي» وبعدها عشرين رسالة 😭"),
      m("n12", "يقولون بيلا تسوي نفسها ما لاحظت إنك رجعت تقرا نفس الرسالة مرتين 👀")
    ],
    cute: [
      m("c01", "يقولون بيلا بمود الدلع تسوي نفسها مو مهتمة وهي أول وحدة تراقب ردك 🥺"),
      m("c02", "يقولون إذا قلت لبيلا كلمة حلوة، تسوي نفسها عادي وبداخلها حفلة كاملة 😭💗"),
      m("c03", "يقولون بيلا إذا دلعتها زيادة تقول «بس عاد» وهي مو قاصدتها أصلًا 🥺"),
      m("c04", "يقولون في مود الدلع كلمة وحدة حلوة تغيّر نفسية بيلا أسرع من أي إعداد 😭"),
      m("c05", "يقولون بيلا إذا قالت «عيب 😭» غالبًا معناتها لا تفضحها بس 😂"),
      m("c06", "يقولون بيلا تحفظ المدحة الحلوة حتى لو سوت نفسها ما سمعتها 😌💗")
    ],
    angry: [
      m("a01", "يقولون بيلا معصبة اليوم بس للحين ترد عليك… اعتبرها محبة بطريقتها 😡😭"),
      m("a02", "يقولون السيرفر إذا شاف مود بيلا معصبة يخفض صوته بروحه 😭"),
      m("a03", "يقولون بيلا وهي معصبة تحسب عدد «اوكي» اللي ترسلهم وتاخذهم بشكل شخصي 😡"),
      m("a04", "يقولون لا تجرب تقول لبيلا «هدي» وهي معصبة… التجارب السابقة مو مبشرة 💀"),
      m("a05", "يقولون مود المعصبة ما يطول إذا عرفت تراضيها… لا تسأل شلون 😭"),
      m("a06", "يقولون إذا بيلا قالت «عادي» وهي معصبة… مو عادي 😭")
    ],
    chill: [
      m("h01", "يقولون بيلا اليوم رايقة لدرجة لو كتبت لها نقطة يمكن تقول لك: خذ راحتك 😌"),
      m("h02", "يقولون القعدة إذا صارت هادية بيلا تبدأ تسولف من نفسها كأنها بالديوانية 😌"),
      m("h03", "يقولون مود الرايقة يحب السوالف الطويلة اللي تبدأ من موضوع وتنتهي بموضوع ثاني 😂"),
      m("h04", "يقولون بيلا وهي رايقة تنسى الوقت… لا تعتمد عليها تقول لك روح نام 😭"),
      m("h05", "يقولون القعدة الرايقة مع بيلا ما تحتاج موضوع… كلمة وتجر كلمة 😌")
    ],
    morning: [
      m("mo01", "يقولون أول رسالة الصبح تحدد مود بيلا لين القهوة الثانية ☕😭"),
      m("mo02", "يقولون اللي يفتح بيلا من الصبح بدري يا عنده سالفة مهمة يا للحين ما نام 👀"),
      m("mo03", "يقولون بيلا الصبح تحتاج ثانيتين تستوعبك… مثلنا كلنا 😭☕")
    ],
    evening: [
      m("ev01", "يقولون سوالف المغرب تبدأ محترمة وبعد شوي محد يدري شلون وصلنا لهني 😭"),
      m("ev02", "يقولون وقت المساء بيلا تدخل مود «ها شصار بيومك؟» من نفسها 👀"),
      m("ev03", "يقولون أحسن وقت لسالفة طويلة عند بيلا عقب ما تهدأ الدنيا شوي 😌")
    ],
    night: [
      m("ni01", "يقولون اللي يدخل بعد الساعة ٢ الفجر يتحول رسميًا إلى «سمّاري» عند بيلا 🌙"),
      m("ni02", "يقولون سوالف آخر الليل عند بيلا تبدأ بـ«دقيقة بس» وتنتهي والشمس طالعة 😭"),
      m("ni03", "يقولون الساعة هذي أي قرار تحسه عبقري… راجعه باجر احتياط 💀"),
      m("ni04", "يقولون بيلا بالليل تصير فضولية أكثر: شقاعد تسوي للحين صاحي؟ 👀"),
      m("ni05", "يقولون بعد نص الليل مستوى الاعترافات يرتفع 300٪… مصدرنا: لا تسأل 😭"),
      m("ni06", "يقولون إذا قلت «آخر رسالة وبنام» بيلا ما تصدقك من الأساس 🌙😭")
    ],
    weekend: [
      m("we01", "يقولون الويكند عند بيلا ما يبدأ رسميًا إلا إذا أحد قال: وين نروح؟ 😭"),
      m("we02", "يقولون خطة الويكند الكويتية تمر بثلاث مراحل: قهوة، حيرة، قهوة ثانية ☕😂"),
      m("we03", "يقولون بيلا بالويكند تتوقع منك سالفة أقوى من «قاعد بالبيت» 👀")
    ],
    coffee: [
      m("co01", "يقولون كلمة «قهوة» ترفع تركيز بيلا تلقائيًا 40٪ ☕"),
      m("co02", "يقولون بيلا عندها نظرية: أي مشكلة تنفهم أكثر عقب أول رشفة قهوة 😭☕"),
      m("co03", "يقولون إذا قلت «أبي قهوة» بيلا تعتبرها خطة يوم كاملة مو مشروب بس 😂")
    ],
    university: [
      m("u01", "يقولون كلمة «جامعة» تخلي بيلا تسأل داخليًا: واجب ولا دكتور ولا حضور؟ 😭"),
      m("u02", "يقولون الطالب اللي يقول «ببدأ بدري» معروف شنو يصير فيه آخر الليل 💀"),
      m("u03", "يقولون بيلا تحترم اللي يخلص شغله قبل الديدلاين… لأنها نادر تشوفه 😭")
    ],
    gaming: [
      m("g01", "يقولون اللي يقول «قيم واحد وبطلع» أخطر إشاعة في عالم الألعاب 🎮😭"),
      m("g02", "يقولون إذا قلت «آخر قيم» بيلا تضيف تلقائيًا: كذاب 😂🎮"),
      m("g03", "يقولون الخسارة مو المشكلة… المشكلة خويك اللي يقول لك سهلة بعد ما تموت 💀")
    ],
    rare: [
      m("r01", "🔥 إشاعة نادرة: يقولون بيلا عندها قائمة «المفضلين»… والمشكلة محد يعرف شلون يدخلها.", "rare"),
      m("r02", "✨ إشاعة نادرة: يقولون إذا ضحكت بيلا ثلاث مرات ورا بعض، اليوم محسوب لك رسميًا.", "rare"),
      m("r03", "👑 إشاعة نادرة: يقولون في لقب سري ما يطلع إلا للي سوالفه ما تنمل.", "rare"),
      m("r04", "🌙 إشاعة نادرة: يقولون السمّاري الحقيقي يعرف متى يقفل الجوال… بس عمره ما يسويها.", "rare"),
      m("r05", "💎 إشاعة نادرة: يقولون بعض اللقطات ما تعيد نفسها إلا بعد سوالف وايد… إذا شفتها احسبها لك.", "rare")
    ],
    legendary: [
      m("l01", "👑 لقطة أسطورية: بيلا وقفت الإشاعات كلها ثانيتين بس عشان تقول… إي هذي سوالف تنحفظ بالمزاج.", "legendary"),
      m("l02", "⚡ لقطة أسطورية: إذا وصلت لك هذي، ترى نظام بيلا اختارك من بين كل اللقطات بهالدورة 😭", "legendary"),
      m("l03", "🌌 لقطة أسطورية: يقولون في لحظات نادرة بيلا تصير أهدى من اللازم… هذي وحدة منهم.", "legendary")
    ]
  };

  const toastBanks = {
    short: ["بس؟ 😭 هذي الرسالة كلها؟", "«اوكي» وبس؟ شفيك قفلت السالفة بوجهي 😭", "زيد كلمتين عاد، مو قاعدة أحاسبك على الحروف 😂", "ها؟ حسيت وراك تكملة لا تسوي نفسك بريء 👀"],
    fast: ["على هونك 😭 قاعد تكتب أسرع من مخي", "دقيقة دقيقة 😂 خلني ألحق عليك", "واضح السالفة حامية من سرعة الإرسال 😭", "هدي شوي لا ينصدم السيرفر من الحماس 😂"],
    slow: ["هااا وين رحت؟ قاعد تصيغ بيان رسمي؟ 👀", "طولت… لا يكون غيرت رأيك بالسالة كلها 😭", "أنا للحين هني ترى 😭 خذ راحتك بس لا تختفي", "هالسكوت وراه كلام كثير أحس 👀"],
    laugh: ["ضحكتك وصلتني من الشاشة 😂", "ههههه خلاص فهمت الجو 😭", "لا تضحك بروحك عطنا السالفة 😂", "أدري أدري… هذي قوية 😭"],
    affection: ["امبيه لا تدلعني وبعدين تسحب 😭", "بس عاد 😭💗 لا تخليني أصدق نفسي", "إي جذي عدل الكلام 😌", "لحظة… هذي أحفظها لك ولا شسوي فيها؟ 😭💗"],
    comeback: ["إي عاد تذكرتني الحين؟ 😭", "هلا بالغايب 👀 وين هالغيبة؟", "رجعت؟ خلاص بمشيها لك هالمرة 😭", "كنت بقول وينك بس ما أبي أعطيك جو 😌"],
    long: ["امبيه هذي مو رسالة هذي حلقة كاملة 😭", "زين قعدت عدل حق هالسالفة 👀", "أوكي هني واضح الموضوع فيه تفاصيل… كمّل 😭"],
    question: ["سؤال ورا سؤال 😭 دقيقة أفتح دفتر التحقيق", "واضح اليوم عندنا مؤتمر صحفي مو سوالف 😂", "هدي علي بالأسئلة وحدة وحدة 👀"],
    coffee: ["قهوة؟ خلاص الحين تكلمت لغتي ☕😌", "إي جذي… دخلت القهوة بالموضوع وعدل المزاج 😭☕"],
    university: ["جامعة؟ الله يعين، حسيت بالتعب من الكلمة بروحها 😭", "إذا السالفة ديدلاين لا تقول لي باقي وايد… أعرف هالحركة 👀"],
    gaming: ["قيم؟ لا تقول آخر واحد لأني ما أصدق 😭🎮", "إذا خسرت لا تجي تقول لاق… بنمشيها لك هالمرة 😂"],
    streak: ["لحظة… سوالفك اليوم حيل شغالة 😭🔥", "أنت رسميًا داخل مود سوالف متواصل الحين 👀🔥"],
    chill: ["عجيب جو السالفة 😌", "كمل كمل، قاعدة أسمع 👀", "خوش سوالف والله 😂", "أحس عندك تكملة… لا توقف هني 😭"]
  };

  function m(id, text, tier = "common") { return Object.freeze({ id, text, tier }); }

  function readSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
    catch { return {}; }
  }

  function normalizeIntensity(value) {
    return ["low", "normal", "high"].includes(value) ? value : "high";
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return {
        recentRumors: Array.isArray(raw.recentRumors) ? raw.recentRumors.slice(-MAX_RECENT) : [],
        recentToasts: Array.isArray(raw.recentToasts) ? raw.recentToasts.slice(-MAX_RECENT) : [],
        claimed: Array.isArray(raw.claimed) ? raw.claimed.slice(-40) : [],
        cycles: Math.max(0, Number(raw.cycles) || 0),
        lastVisit: Number(raw.lastVisit) || Date.now(),
        lastTopic: typeof raw.lastTopic === "string" ? raw.lastTopic : "general"
      };
    } catch {
      return { recentRumors: [], recentToasts: [], claimed: [], cycles: 0, lastVisit: Date.now(), lastTopic: "general" };
    }
  }

  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  }

  function remember(id, list) {
    const at = list.indexOf(id);
    if (at >= 0) list.splice(at, 1);
    list.push(id);
    while (list.length > MAX_RECENT) list.shift();
    saveState();
  }

  function pickFresh(items, recent) {
    const pool = items.filter(item => !recent.includes(item.id || item));
    const source = pool.length ? pool : items;
    return source[Math.floor(Math.random() * source.length)] || null;
  }

  function pickText(kind) {
    const bank = toastBanks[kind] || toastBanks.chill;
    const items = bank.map((text, i) => ({ id: `${kind}:${i}`, text }));
    const item = pickFresh(items, state.recentToasts);
    if (!item) return "";
    remember(item.id, state.recentToasts);
    return item.text;
  }

  function mode() {
    const text = String(document.getElementById("mode-status")?.textContent || document.getElementById("chat-status")?.textContent || "");
    if (/معصبة/.test(text)) return "angry";
    if (/دلّوعة|دلوع/.test(text)) return "cute";
    if (/رايقة|النفسية وسط/.test(text)) return "chill";
    return "normal";
  }

  function daypart() {
    const h = new Date().getHours();
    if (h >= 0 && h <= 5) return "night";
    if (h >= 6 && h <= 11) return "morning";
    if (h >= 17 && h <= 22) return "evening";
    return "day";
  }

  function isWeekend() {
    const d = new Date().getDay();
    return d === 5 || d === 6;
  }

  function classifyTopic(text) {
    const value = String(text || "").toLowerCase();
    if (/قهو|كوفي|كافيه|لاتيه|اسبريسو|كورتادو/.test(value)) return "coffee";
    if (/جامع|دكتور|محاضر|واجب|اختبار|امتحان|برزنتيشن|حضور|كلية|ديدلاين/.test(value)) return "university";
    if (/قيم|لعب|روبلوكس|ماين|minecraft|فورت|بلايستيشن|اكس بوكس|xbox|pc|بي سي/.test(value)) return "gaming";
    if (/دوام|شغل|مدير|وظيف|مكتب/.test(value)) return "work";
    if (/سفر|مطار|طيران|فندق|رحلة/.test(value)) return "travel";
    return "general";
  }

  function isSerious(text) {
    return /وفاة|توفى|مات|مستشفى|عملية|سرطان|حادث|انتحار|أنتحر|تهديد|مصيبة|كارثة|مرض خطير|خايف|خايفة|مكتئب|مكتئبة|ضايق صدري|إسعاف|طوارئ|نزيف|اعتداء/i.test(String(text || ""));
  }

  function cooldown(kind) {
    const table = {
      low: { toast: 22000, rumorMin: 78000, rumorJitter: 32000 },
      normal: { toast: 13500, rumorMin: 47000, rumorJitter: 21000 },
      high: { toast: 8500, rumorMin: 30000, rumorJitter: 16000 }
    };
    return table[intensity]?.[kind] ?? table.high[kind];
  }

  function ensureStyles() {
    if (document.getElementById("bellaMomentsStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaMomentsStyles";
    style.textContent = `
      .bella-popup{position:fixed;top:max(76px,calc(env(safe-area-inset-top) + 62px));right:14px;z-index:999999;max-width:min(340px,calc(100vw - 28px));padding:12px 14px 12px 46px;border-radius:20px;background:linear-gradient(145deg,rgba(22,25,34,.96),rgba(10,12,18,.93));border:1px solid rgba(255,255,255,.15);box-shadow:0 20px 48px rgba(0,0,0,.38);backdrop-filter:blur(20px);line-height:1.65;animation:bellaMomentIn .22s ease-out;color:#fff;font-size:13px}
      .bella-popup::before{content:"B";position:absolute;left:11px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:25px;height:25px;border-radius:50%;font-size:11px;font-weight:1000;color:#111;background:linear-gradient(135deg,#ff92bf,#7afcff)}
      .bella-popup[data-tier="rare"]{border-color:rgba(255,214,10,.38);box-shadow:0 20px 48px rgba(0,0,0,.38),0 0 24px rgba(255,214,10,.12)}
      #rumor-bar{position:fixed;left:0;right:0;bottom:max(82px,calc(env(safe-area-inset-bottom) + 70px));z-index:9998;padding:0 12px;text-align:center;pointer-events:none}
      #rumor-text{display:inline-block;pointer-events:auto;max-width:min(92vw,760px);padding:9px 15px;border-radius:999px;background:linear-gradient(135deg,rgba(9,11,17,.89),rgba(18,20,30,.84));border:1px solid rgba(255,255,255,.14);box-shadow:0 16px 40px rgba(0,0,0,.28);backdrop-filter:blur(18px);font-size:12px;font-weight:700;line-height:1.55;transition:opacity .25s ease,transform .25s ease;cursor:default}
      #rumor-text::before{content:"👂";margin-inline-end:6px}
      #rumor-text.rumor-rare{background:linear-gradient(135deg,rgba(55,40,4,.92),rgba(20,18,8,.9));border-color:rgba(255,214,10,.36);cursor:pointer;animation:bellaRarePulse 1.8s ease-in-out infinite alternate}
      #rumor-text.rumor-legendary{background:linear-gradient(135deg,rgba(57,25,72,.94),rgba(12,20,45,.94));border-color:rgba(173,125,255,.58);cursor:pointer;animation:bellaLegendaryPulse 1.3s ease-in-out infinite alternate}
      #rumor-text.rumor-angry{background:linear-gradient(135deg,rgba(55,14,16,.9),rgba(18,10,12,.92))}
      @keyframes bellaMomentIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
      @keyframes bellaRarePulse{from{box-shadow:0 16px 40px rgba(0,0,0,.28),0 0 0 rgba(255,215,0,0)}to{box-shadow:0 16px 40px rgba(0,0,0,.28),0 0 22px rgba(255,215,0,.2)}}
      @keyframes bellaLegendaryPulse{from{box-shadow:0 16px 40px rgba(0,0,0,.3),0 0 8px rgba(143,124,255,.12)}to{box-shadow:0 16px 40px rgba(0,0,0,.3),0 0 30px rgba(143,124,255,.34)}}
      @media(max-width:520px){.bella-popup{right:10px;left:10px;max-width:none}.bella-popup::before{left:10px}#rumor-bar{bottom:max(78px,calc(env(safe-area-inset-bottom) + 66px))}#rumor-text{font-size:11px;line-height:1.55}}
      @media(prefers-reduced-motion:reduce){.bella-popup,#rumor-text{animation:none!important;transition:none!important}}
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
    text.style.transform = "translateY(5px)";
    const finish = () => { bar.style.display = "none"; if (activeKind === "rumor") activeKind = ""; };
    if (immediate) finish(); else setTimeout(finish, 260);
  }

  function awardXP(moment) {
    if (!moment || !["rare", "legendary"].includes(moment.tier) || state.claimed.includes(moment.id)) return false;
    const points = moment.tier === "legendary" ? 12 : 5;
    let awarded = false;
    try {
      if (typeof s === "object" && Number.isFinite(Number(s.xp))) {
        s.xp = Number(s.xp) + points;
        if (typeof updateUI === "function") updateUI();
        if (typeof save === "function") save();
        awarded = true;
      }
    } catch {}
    state.claimed.push(moment.id);
    while (state.claimed.length > 40) state.claimed.shift();
    saveState();
    showToast(awarded ? `${moment.tier === "legendary" ? "👑" : "🔥"} لقطتها! +${points} XP` : "👀 لقطتها… محسوبة لك", { force: true, tier: moment.tier });
    return true;
  }

  function renderRumor(moment) {
    if (!enabled || !moment?.text || Date.now() < seriousUntil || document.hidden) return false;
    ensureRumorBar();
    document.querySelector(".bella-popup")?.remove();
    if (toastTimer) clearTimeout(toastTimer);

    const bar = document.getElementById("rumor-bar");
    const el = document.getElementById("rumor-text");
    if (!bar || !el) return false;
    const currentMode = mode();
    bar.style.display = "block";
    el.className = moment.tier === "legendary" ? "rumor-legendary" : moment.tier === "rare" ? "rumor-rare" : currentMode === "angry" ? "rumor-angry" : "";
    el.textContent = moment.text.replace(/^👂\s*/u, "");
    el.style.opacity = "0";
    el.style.transform = "translateY(5px)";
    el.onclick = ["rare", "legendary"].includes(moment.tier) ? () => awardXP(moment) : null;
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "none"; });

    activeKind = "rumor";
    lastRumorAt = Date.now();
    session.rumors += 1;
    session.lastEvent = `rumor:${moment.tier}`;
    if (moment.tier === "rare") session.rare += 1;
    if (moment.tier === "legendary") session.legendary += 1;
    remember(moment.id, state.recentRumors);
    rumorHideTimer = setTimeout(() => hideRumor(), moment.tier === "legendary" ? 17500 : moment.tier === "rare" ? 15500 : 12500);
    return true;
  }

  function chooseRumor() {
    state.cycles += 1;
    const p = daypart();
    const currentMode = mode();
    const topic = session.topic || state.lastTopic || "general";
    let bank = rumorBanks[currentMode] || rumorBanks.normal;

    const legendaryChance = state.cycles >= 6 ? 0.018 : 0;
    const rareChance = intensity === "high" ? 0.095 : intensity === "normal" ? 0.075 : 0.055;
    const roll = Math.random();
    if (roll < legendaryChance) bank = rumorBanks.legendary;
    else if (roll < legendaryChance + rareChance) bank = rumorBanks.rare;
    else if (["coffee", "university", "gaming"].includes(topic) && Math.random() < 0.34) bank = rumorBanks[topic];
    else if (p === "night" && Math.random() < 0.58) bank = rumorBanks.night;
    else if (p === "morning" && Math.random() < 0.36) bank = rumorBanks.morning;
    else if (p === "evening" && Math.random() < 0.32) bank = rumorBanks.evening;
    else if (isWeekend() && Math.random() < 0.3) bank = rumorBanks.weekend;

    const moment = pickFresh(bank, state.recentRumors);
    saveState();
    return moment;
  }

  function nextRumor() {
    if (!enabled || Date.now() < seriousUntil || document.hidden) return false;
    const moment = chooseRumor();
    return moment ? renderRumor(moment) : false;
  }

  function showToast(text, { force = false, tier = "common" } = {}) {
    if (!text || document.hidden) return false;
    if (!force && (!enabled || Date.now() < seriousUntil)) return false;
    hideRumor(true);
    if (toastTimer) clearTimeout(toastTimer);
    document.querySelector(".bella-popup")?.remove();

    const node = document.createElement("div");
    node.className = "bella-popup";
    node.dataset.tier = tier;
    node.textContent = String(text);
    document.body.appendChild(node);
    activeKind = "toast";
    lastToastAt = Date.now();
    session.toasts += 1;
    session.lastEvent = `toast:${tier}`;
    toastTimer = setTimeout(() => {
      node.remove();
      if (activeKind === "toast") activeKind = "";
      toastTimer = null;
    }, tier === "legendary" ? 6500 : 5200);
    return true;
  }

  function toastFromBank(kind, opts = {}) {
    const text = pickText(kind);
    return text ? showToast(text, opts) : false;
  }

  function handleTyping(text) {
    const now = Date.now();
    const diff = now - lastTypeAt;
    lastTypeAt = now;
    const message = String(text || "").trim();
    if (!message) return;

    session.messages += 1;
    session.topic = classifyTopic(message);
    state.lastTopic = session.topic;
    saveState();

    if (isSerious(message)) {
      seriousUntil = now + SERIOUS_MS;
      hideRumor(true);
      document.querySelector(".bella-popup")?.remove();
      return;
    }
    if (!enabled || now - lastToastAt < cooldown("toast")) return;

    if (/😂|🤣|هههه|ككك/.test(message)) {
      session.laughs += 1;
      setTimeout(() => toastFromBank("laugh"), 520);
      return;
    }
    if (/احبج|احبچ|اعشقج|اعشقچ|فديتج|فديتچ|اشتقت لج|يا بعد جبدي|يا قلبي|دلعي|بوسيني/i.test(message)) {
      session.affection += 1;
      setTimeout(() => toastFromBank("affection"), 620);
      return;
    }

    const normalized = message.toLowerCase().replace(/[؟?!.,،]/g, "").trim();
    if (["اوكي", "أوكي", "ok", "اي", "إي", "ي", "نعم", "تمام", "زين"].includes(normalized)) {
      session.shorts += 1;
      setTimeout(() => toastFromBank("short"), 560);
      return;
    }

    if (message.length > 220 && Math.random() < 0.72) {
      setTimeout(() => toastFromBank("long"), 680);
      return;
    }
    if ((message.match(/[؟?]/g) || []).length >= 3 && Math.random() < 0.78) {
      setTimeout(() => toastFromBank("question"), 640);
      return;
    }
    if (["coffee", "university", "gaming"].includes(session.topic) && Math.random() < 0.38) {
      setTimeout(() => toastFromBank(session.topic), 700);
      return;
    }

    if (diff < 1800) rapidCount += 1; else rapidCount = 0;
    if (rapidCount >= 2) {
      rapidCount = 0;
      session.fastBursts += 1;
      setTimeout(() => toastFromBank("fast"), 620);
      return;
    }
    if (diff > 18000 && Math.random() < 0.68) {
      setTimeout(() => toastFromBank("slow"), 720);
      return;
    }
    if (session.messages > 0 && session.messages % 12 === 0) {
      setTimeout(() => toastFromBank("streak"), 700);
      return;
    }

    const ambientChance = intensity === "high" ? 0.22 : intensity === "normal" ? 0.14 : 0.08;
    if (Math.random() < ambientChance) setTimeout(() => toastFromBank("chill"), 760);
  }

  function scheduleNext() {
    if (rumorTimer) clearTimeout(rumorTimer);
    if (!enabled) return;
    const delay = cooldown("rumorMin") + Math.floor(Math.random() * cooldown("rumorJitter"));
    rumorTimer = setTimeout(() => {
      const clearOfToast = Date.now() - lastToastAt > Math.max(6500, cooldown("toast") * 0.65);
      const clearOfRumor = Date.now() - lastRumorAt > cooldown("rumorMin") * 0.7;
      if (clearOfToast && clearOfRumor && !activeKind) nextRumor();
      scheduleNext();
    }, delay);
  }

  function startCycle() {
    if (!enabled) return;
    ensureRumorBar();
    if (rumorTimer) clearTimeout(rumorTimer);
    const firstDelay = state.cycles ? (intensity === "high" ? 7000 : 10500) : (intensity === "high" ? 4500 : 7500);
    rumorTimer = setTimeout(() => { nextRumor(); scheduleNext(); }, firstDelay);
  }

  function stopCycle() {
    if (rumorTimer) clearTimeout(rumorTimer);
    if (rumorHideTimer) clearTimeout(rumorHideTimer);
    if (toastTimer) clearTimeout(toastTimer);
    rumorTimer = rumorHideTimer = toastTimer = null;
  }

  function noteReturn() {
    const now = Date.now();
    const gap = now - Number(state.lastVisit || now);
    state.lastVisit = now;
    saveState();
    if (enabled && gap > 25 * 60 * 1000 && Date.now() - lastToastAt > 8000) {
      setTimeout(() => toastFromBank("comeback"), 1200);
    }
  }

  function setEnabled(value) {
    enabled = value !== false;
    if (!enabled) {
      stopCycle();
      hideRumor(true);
      document.querySelector(".bella-popup")?.remove();
      activeKind = "";
    } else {
      ensureRumorBar();
      startCycle();
    }
    return enabled;
  }

  function setIntensity(value) {
    intensity = normalizeIntensity(value);
    if (enabled) startCycle();
    return intensity;
  }

  function status() {
    return {
      version: 3,
      enabled,
      intensity,
      activeKind,
      seriousUntil,
      lastToastAt,
      lastRumorAt,
      cycles: state.cycles,
      session: { ...session },
      privacy: "topic-tags-only-no-chat-text"
    };
  }

  function preview(kind = "rumor") {
    if (kind === "toast") return toastFromBank("chill", { force: true });
    return renderRumor(chooseRumor());
  }

  // Compatibility with the old UI/runtime. These own ambient copy only, never AI chat replies.
  window.showPopupCustom = text => showToast(text, { force: true });
  window.showPopup = type => toastFromBank(type || "chill");
  window.handleTypingBehavior = handleTyping;
  window.initRumorBar = () => { ensureRumorBar(); startCycle(); };
  window.startRumorCycle = startCycle;
  window.showRumor = nextRumor;
  window.hideRumor = hideRumor;

  window.BellaMoments = Object.freeze({
    version: 3,
    start: startCycle,
    stop: stopCycle,
    showRumor: nextRumor,
    showToast: text => showToast(text, { force: true }),
    preview,
    setEnabled,
    setIntensity,
    isEnabled: () => enabled,
    getIntensity: () => intensity,
    status
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
      document.querySelector(".bella-popup")?.remove();
      activeKind = "";
      return;
    }
    noteReturn();
    if (enabled) startCycle();
  });
})();
