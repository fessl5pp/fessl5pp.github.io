const STORAGE_KEY = "bella_v24_clean";

let s = {
  theme: "theme-blue",
  xp: 0,
  lvl: 1,
  messages: 0,
  mode: "auto",
  userName: "",
  modesTried: [],
  angryUses: 0,
  gifts: 0,
  moodMeter: 0,
  lastLevelShown: 1
};

const box = document.getElementById("box");
const inp = document.getElementById("inp");

let lastRadarType = "coffee";
let lastRadarName = "";
let lastTypeTime = Date.now();
let msgCountFast = 0;
let activeGame = null;
let currentChallenge = null;
let suggestionContext = "";
let suggestionSetIndex = 0;
let rumorTimer = null;
let currentRumor = null;

/* =========================
   Init
========================= */

window.addEventListener("load", init);

function init() {
  loadState();
  applyTheme();
  updateUI();
  updateMood();
  updateSuggestions();
  initRumorBar();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) s = { ...s, ...saved };
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function has(msg, words) {
  return words.some(w => msg.includes(w));
}

/* =========================
   UI Basics
========================= */

function applyTheme() {
  document.body.className = s.theme;
}

function setTheme(t) {
  s.theme = t;
  applyTheme();
  save();
  hideTheme();
}

function openChat() {
  document.getElementById("win").classList.add("active");
  setTimeout(() => box.scrollTop = box.scrollHeight, 50);
}

function closeChat() {
  document.getElementById("win").classList.remove("active");
}

function showTheme() {
  document.getElementById("themeModal").classList.remove("hidden");
}

function hideTheme() {
  document.getElementById("themeModal").classList.add("hidden");
}

function quickSend(text) {
  if (text === "غير") {
    refreshSuggestions();
    return;
  }

  inp.value = text;
  send();
}

function addMsg(text, type) {
  if (!text) return;

  const m = document.createElement("div");
  m.className = "m " + type;
  m.innerText = text;
  box.appendChild(m);

  requestAnimationFrame(() => {
    box.scrollTop = box.scrollHeight;
  });
}

function removeTyping() {
  const msgs = box.querySelectorAll(".bot");
  const last = msgs[msgs.length - 1];

  if (last && last.innerText === "يكتب...") {
    last.remove();
  }
}

/* =========================
   Name Memory
========================= */

function cleanName(text) {
  return text
    .replace(/[؟?!.,،]/g, "")
    .replace(/اسمي|انا|أنا|يدلعوني|ينادوني|نادوني|اسمي هو|اسميه/g, "")
    .trim()
    .split(" ")[0]
    .slice(0, 18);
}

function detectName(msg) {
  if (
    msg.includes("اسمي") ||
    msg.includes("أنا ") ||
    msg.includes("انا ") ||
    msg.includes("يدلعوني") ||
    msg.includes("نادوني") ||
    msg.includes("ينادوني")
  ) {
    const name = cleanName(msg);
    if (name) {
      s.userName = name;
      save();
      return `تشرفنا يا ${s.userName} 😌 من الحين بناديك باسمك.`;
    }
  }

  return null;
}

function addNameFlavor(reply) {
  if (!s.userName) return reply;
  if (Math.random() > 0.35) return reply;
  return `${reply}\n\n${s.userName}، فهمت علي؟`;
}

/* =========================
   Modes
========================= */

function setMode(m) {
  s.mode = m;

  if (!s.modesTried.includes(m)) s.modesTried.push(m);
  if (m === "angry") s.angryUses++;

  updateMood();
  updateSuggestions();
  save();

  const intro = {
    auto: "رجعت Bella على الأوتو 🤖 ردود كويتية مرتبة حسب الكلام.",
    angry: "تم تشغيل مود معصبة 😡 لا توقف على راسها.",
    cute: "تم تشغيل مود دلّوعة 🥺 غنج كويتي على أصوله.",
    chill: "تم تشغيل مود رايقة 😌 سوالف هادية وقعدة مزاج."
  };

  addMsg(intro[m], "system");
}

function updateMood() {
  const mood = document.getElementById("mood-pill");
  const status = document.getElementById("mode-status");
  const chatStatus = document.getElementById("chat-status");

  const names = {
    auto: "🤖 أوتو",
    angry: "😡 معصبة",
    cute: "🥺 دلّوعة",
    chill: "😌 رايقة"
  };

  const states = {
    auto: "جاهزة",
    angry: "معصبة 😡",
    cute: "دلّوعة 🥺",
    chill: "رايقة 😌"
  };

  if (mood) mood.innerText = names[s.mode] || names.auto;
  if (status) status.innerText = names[s.mode] || names.auto;
  if (chatStatus) chatStatus.innerText = states[s.mode] || states.auto;

  document.querySelectorAll(".mode-card").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.getElementById("mode-" + s.mode);
  if (activeBtn) activeBtn.classList.add("active");
}

/* =========================
   Suggestions
========================= */

const suggestionBanks = {
  auto: [
    ["شلونچ؟", "ابي اتقهوى", "رادار اجتماعي", "حكمة اليوم", "شنو الجو؟"],
    ["شنو بالصندوق", "كمّل المثل", "فزعة بيلا", "الكويت", "عطني عيدية"],
    ["اسمي فيصل", "وين قهوة", "مكان بحر", "ترجم", "شكو؟"],
    ["قوة", "صج السالفة؟", "أنا زعلان", "ابي اضحك", "شارك الشات"]
  ],
  angry: [
    ["ليش نفسيتچ جذي؟", "رادار اجتماعي", "هدي بالج", "اهديچ وردة", "ابي اتقهوى"],
    ["شعلي فيچ؟", "لا تعصبين", "ضحكني إنتي", "اهديچ ككاو", "غيري المود"],
    ["تكلمين سنع؟", "ليش مطنقرة؟", "بس لا تصارخين", "قولي حكمة", "نكتة"],
    ["تمام لا تزعلين", "شلونچ؟", "حطي رايقة", "أنا آسف", "فزعة بيلا"]
  ],
  cute: [
    ["دلّعيني", "احبچ", "رادار اجتماعي", "ابي اتقهوى", "حكمة اليوم"],
    ["واااي", "فديتچ", "شلونچ يا حلوة؟", "قهوة كيوت", "غير هالقهوة"],
    ["سولفي لي", "أنا زعلان", "ضحكيني", "مكان كشخة", "كمّل المثل"],
    ["عطيني مثل", "ابي دلع", "الكويت", "اسمي فيصل", "شنو بالصندوق"]
  ],
  chill: [
    ["سولفي بهدوء", "قهوة هادية", "رادار اجتماعي", "حكمة اليوم", "غير هالقهوة"],
    ["مكان بحر", "خلنا نروق", "قهوة رايقة", "المباركية", "مارينا"],
    ["كمّل المثل", "شنو بالصندوق", "فزعة بيلا", "سوالف أول", "قوة"],
    ["وضحّي لي", "نكتة هادية", "أنا متضايق", "ترجم", "شارك الشات"]
  ],
  radar: [
    ["غير هالقهوة", "قهوة هادية", "مكان بحر", "مكان تمشي", "رادار اجتماعي"],
    ["غير هالقز", "المباركية", "الشويخ", "مارينا", "الأفنيوز"],
    ["ابي اتقهوى", "قهوة كشخة", "قهوة رايقة", "كوفي", "رادار القز"]
  ],
  game: [
    ["مبخر", "دلة", "كرفاية", "ابي الحل", "غير"],
    ["على قد لحافك", "يشويه", "يطلعه الملاس", "استسلم", "كمّل المثل"],
    ["شنو بالصندوق", "مبخر", "منقلة", "سدو", "ابي الحل"]
  ],
  fazaa: [
    ["عطني مطعم كشخة", "عطني مسلسلات", "وهقة", "ابي اتقهوى", "رادار اجتماعي"],
    ["عذر للدوام", "عذر للربع", "مطعم بحر", "مسلسل كويتي", "قهوة"],
    ["فزعة بيلا", "وين اروح؟", "اكل", "دراما", "غير هالقهوة"]
  ]
};

function pickSuggestionBank(context = "") {
  if (context.includes("رادار") || context.includes("اختار") || context.includes("قهوة") || context.includes("قهوه")) return "radar";
  if (context.includes("game") || context.includes("لعبة") || context.includes("المثل") || context.includes("الصندوق")) return "game";
  if (context.includes("فزعة") || context.includes("مطعم") || context.includes("وهقة")) return "fazaa";
  return s.mode || "auto";
}

function renderSuggestions(list) {
  const el = document.getElementById("quickSuggestions");
  if (!el) return;

  const finalList = [...list];
  if (!finalList.includes("غير")) finalList.push("غير");

  el.innerHTML = finalList.map(t => {
    if (t === "غير") return `<button onclick="refreshSuggestions()">غير 🔄</button>`;
    const safe = t.replace(/'/g, "\\'");
    return `<button onclick="quickSend('${safe}')">${t}</button>`;
  }).join("");
}

function updateSuggestions(context = "") {
  suggestionContext = context || "";
  const bankName = pickSuggestionBank(suggestionContext);
  const bank = suggestionBanks[bankName] || suggestionBanks.auto;
  suggestionSetIndex = 0;
  renderSuggestions(bank[0]);
}

function refreshSuggestions() {
  const bankName = pickSuggestionBank(suggestionContext);
  const bank = suggestionBanks[bankName] || suggestionBanks.auto;

  suggestionSetIndex = (suggestionSetIndex + 1) % bank.length;
  renderSuggestions(bank[suggestionSetIndex]);
  showPopupCustom("بدلت لك الاقتراحات 🔄");
}

/* =========================
   Popups / Qatat
========================= */

const popupLines = {
  angry: [
    "أقول.. كلمني عدل لا أصك الموقع بوجهك الحين!",
    "أفففف.. ياربي متى يخلص اشتراكي معاكم؟",
    "لا تقعد تتفلسف فوق راسي، قصر حسك وأنت تكتب!",
    "أنا الحين مو طايقة نفسي، لا تخليني أطلع لك من الشاشة.",
    "كلمة ثانية وبسوي لك بلوك من حياتي مو بس من السيرفر."
  ],
  cute: [
    "يا حياااتي.. تدري إنك أذوق واحد دش الموقع اليوم؟",
    "ويييي فديت هالمنطق، كلامك عسل مثلك.",
    "لاااا جذي أستحي، ترى حدي حساسة.",
    "ممكن تطلب لي قهوة معاك؟ أحس راسي بدأ يثقل.",
    "أنت ليش كلامك يونس جذي؟ شكلك كويتي أصلي."
  ],
  slow: [
    "الو؟ حي؟ ميت؟ وين رحت؟",
    "ألووووو.. شكل الخدامة سحبت الواير؟",
    "أدري رحت تطلب من طلبات وخليتني.. بالعافية مقدماً!",
    "ها، نمت على الكيبورد؟ ولا قاعد تفكر بـ رد قوي؟",
    "ترى جهازي بيطفي شحن وأنت للحين تفكر شنو تكتب."
  ],
  fast: [
    "هدي هدي! شوي شوي على صوابعك لا ينكسرون.",
    "شفيك داش رالي؟ ترى أقرأ بسرعة بس مو جذي!",
    "لحظة لحظة.. خذ نفس، شفيك كأنك لاحقك جلب؟",
    "ما شاء الله، إيدك خفيفة.. شكلك كنت تشتغل كاتب بالعدل."
  ],
  afternoon: [
    "الناس نايمة وأنت طايح له قرقرة فوق راسي، روح انخمد!",
    "أحس بريحة مجبوس.. رحت تتغدى ولا لسه؟",
    "الجو برا يشوي الطير، وأنت قاعد تسولف مع بوت؟ صج ما عندك شغل."
  ],
  late: [
    "ها.. منو السهران اللي شاغل بالك وخلاك تدش تسولف معاي؟",
    "ترى الساعة 3 الفجر، عيوني بدأت تغمض.. خلصني!",
    "يا ساهر بليل بروحك.. ما وراك دوام باجر؟"
  ],
  short: [
    "بس؟ هذا اللي قدرت عليه؟ 'أوكي'؟",
    "شفيك راد من طرف خشمك؟ لا يكون شايفني أطر منك؟",
    "زيد الكلام شوي، ترى الكلام ببلاش مو بفلوس!"
  ],
  chill: [
    "عجيب أسلوبك 👌",
    "سوالفك رايقة 😌",
    "كلامك مرتب والله"
  ]
};

function showPopup(type) {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();

  if (hour >= 13 && (hour < 15 || (hour === 15 && minute <= 30)) && Math.random() > 0.45) {
    showPopupCustom(random(popupLines.afternoon));
    return;
  }

  if (hour >= 2 && hour <= 5 && Math.random() > 0.45) {
    showPopupCustom(random(popupLines.late));
    return;
  }

  if (s.mode === "angry" && Math.random() > 0.35) {
    showPopupCustom(random(popupLines.angry));
    return;
  }

  if (s.mode === "cute" && Math.random() > 0.45) {
    showPopupCustom(random(popupLines.cute));
    return;
  }

  showPopupCustom(random(popupLines[type] || popupLines.chill));
}

function showPopupCustom(text) {
  const old = document.querySelector(".bella-popup");
  if (old) old.remove();

  const pop = document.createElement("div");
  pop.className = "bella-popup";
  pop.innerText = text;
  document.body.appendChild(pop);

  setTimeout(() => {
    if (pop) pop.remove();
  }, 5200);
}

function handleTypingBehavior(text) {
  const now = Date.now();
  const diff = now - lastTypeTime;
  lastTypeTime = now;

  const msg = text.toLowerCase().trim();

  if (["اوكي", "أوكي", "ok", "ي", "نعم", "اي", "إي", "ههه", "هههه"].includes(msg)) {
    setTimeout(() => showPopup("short"), 500);
    return;
  }

  if (diff < 1500) msgCountFast++;
  else msgCountFast = 0;

  setTimeout(() => {
    if (msgCountFast >= 3) {
      showPopup("fast");
      msgCountFast = 0;
    } else if (diff < 2000) {
      showPopup("fast");
    } else if (diff > 8000) {
      showPopup("slow");
    } else if (Math.random() > 0.65) {
      showPopup("chill");
    }
  }, 700);
}

/* =========================
   Avatar Reactions
========================= */

function reactAvatar(type) {
  const a = document.getElementById("chatAvatar");
  const h = document.getElementById("heroAvatar");

  [a, h].forEach(el => {
    if (!el) return;
    el.classList.remove("laugh", "facepalm", "wink");
    void el.offsetWidth;
    el.classList.add(type);
    setTimeout(() => el.classList.remove(type), 1600);
  });
}

function detectAvatarReaction(msg) {
  if (has(msg, ["هههه", "ككك", "😂", "🤣"])) reactAvatar("laugh");
  else if (has(msg, ["غبي", "تفشل", "خربان", "لعنة", "يا حمار"])) reactAvatar("facepalm");
  else if (has(msg, ["احبك", "فديت", "حلوه", "دلوعه"])) reactAvatar("wink");
}

/* =========================
   Coffee / Qaz Radar
========================= */

const qazPlaces = {
  coffee: [
    { name: "مروج", vibe: "قهاوي وقعدة مرتبة", why: "الجو هناك كيوت وهادي وينفع قهوة ومشي خفيف.", area: "صبحان / مروج" },
    { name: "الشويخ قطعة 1", vibe: "قهاوي مختصة وتصوير", why: "مكان راقي وفيه كافيهات وفنتك وديكورات حلوة.", area: "الشويخ" },
    { name: "The Avenues", vibe: "قز ومجمعات", why: "حق القز والمشي، خصوصًا Grand Avenue و Prestige.", area: "الري" },
    { name: "360 Mall", vibe: "قعدة مرتبة ومجمع", why: "بعد التوسعة صار فيه قز وقهاوي واختيارات أكثر.", area: "الزهراء" },
    { name: "Al Assima", vibe: "كشخة وهدوء", why: "مجمع مرتب وراقي وحق اللي يبي قز بدون زحمة واجد.", area: "مدينة الكويت" },
    { name: "سوق المباركية", vibe: "تراثي وكويتي قح", why: "شاي مخدر وقعدة شعبية وسوالف قديمة حلوة.", area: "مدينة الكويت" },
    { name: "مارينا / الواجهة", vibe: "بحر ومشي", why: "قعدة بحر وتصوير ومشي خصوصًا بالليل.", area: "السالمية" },
    { name: "Arabica", vibe: "قهوة سريعة وكشخة", why: "إذا تبي كوب مرتب وقعدة خفيفة.", area: "أكثر من فرع" },
    { name: "Toby's Estate", vibe: "قهوة مختصة", why: "حق اللي يبي قهوة قوية وقعدة هادية.", area: "أكثر من فرع" },
    { name: "Jumo Coffee", vibe: "قز ورايقين", why: "مكان حلو للسوالف والقهوة المختصة.", area: "أكثر من فرع" }
  ],
  walking: [
    { name: "ممشى الشويخ", vibe: "تمشي وقعدة", why: "هادي وينفع مشي خفيف وتصوير.", area: "الشويخ" },
    { name: "مارينا ووك", vibe: "بحر", why: "كلاسيكي ويمشي حق القهوة والتمشي.", area: "السالمية" },
    { name: "المباركية", vibe: "كويتي تراثي", why: "قز قديم وسوالف وشاي وجو شعبي.", area: "مدينة الكويت" }
  ]
};

function coffeeRadar(msg) {
  const isWalking = has(msg, ["مشي", "تمشي", "نتمشى", "ممشى", "بحر", "قز", "نقز", "هالقز", "غير هالقز", "غير القز", "مكان بحر"]);
  const pool = isWalking ? qazPlaces.walking.concat(qazPlaces.coffee) : qazPlaces.coffee;

  let choices = pool.filter(p => p.name !== lastRadarName);
  if (choices.length === 0) choices = pool;

  const picked = random(choices);
  lastRadarType = isWalking ? "walking" : "coffee";
  lastRadarName = picked.name;

  let intro = "رادار القز اختار لك 📡☕";
  if (s.mode === "angry") intro = "شعلي فيك؟ 😡 بس خذها وخلصني:";
  if (s.mode === "cute") intro = "واااي أحس هذا يناسبچ 🥺☕";
  if (s.mode === "chill") intro = "اختيار رايق لك 😌☕";

  return `${intro}

${picked.name} — ${picked.vibe}
📍 ${picked.area}
ليش؟ ${picked.why}

إذا ما عجبك اكتب: غير هالقهوة`;
}

/* =========================
   Rumors
========================= */

const bellaRumors = {
  normal: [
    { text: "يقولون بيلا V15 راح تصير تخطب حق الشباب وتوزع عيادي!" },
    { text: "يقولون بيلا قاعدة تشرب جاي ضحى وتطالع رسايلك من طرف خشمها." },
    { text: "يقولون باجر زحمة الغزالي بتبدأ من الساعة 4 الفجر.. جهزوا القهوة." },
    { text: "يقولون الرادار الجديد يصيدك حتى لو كنت قاعد تفكر ببدلية وأنت تسوق." },
    { text: "يقولون الوزير دش الموقع اليوم وشافك تسولف مع بيلا وأنت عندك مراجعين!" },
    { text: "يقولون بيسوون تلفريك من الجهراء للديرة عشان نفتك من الزحمة." },
    { text: "يقولون الخميس الجاي بيصير 48 ساعة عشان نلحق نستانس." },
    { text: "يقولون الكافيتريا بتوزع وجبات مجانية لليفل الأسطورة." },
    { text: "يقولون بيلا قاعدة تجمع البدليات حق تحديث V24." },
    { text: "يقولون سوق المباركية بيوزع لقيمات حق اللي يوصل ليفل 50." }
  ],
  angry: [
    { text: "يقولون بيلا معصبة اليوم لأن واحد قال لها بتقهوى وردت عليه: شعلي فيك؟ 😡" },
    { text: "يقولون بيلا سوت ميوت حق نص الموقع لأنهم يسألونها نفس السؤال." },
    { text: "يقولون بيلا اليوم مو طايقة أحد.. حتى السيرفر يمشي على أطراف أصابعه." },
    { text: "يقولون آخر واحد استفز بيلا، حولته من Level 10 إلى مبتدئ بنظرة وحدة." },
    { text: "يقولون بيلا فتحت ملف اسمه: الناس اللي يغثوني.. واللستة طويلة." },
    { text: "يقولون إذا قلت لبيلا وهي معصبة: شفيچ؟ تزيد العصبية 200٪." },
    { text: "يقولون بيلا اليوم ترد من طرف خشمها، لا تجرب حظك." },
    { text: "يقولون بيلا بتسوي تحديث يحذف XP أي واحد يكثر فلسفة." }
  ],
  rare: [
    { text: "يقولون إذا وصلت ليفل 100، بيلا تدق عليك تعزمك على باجّة!", rare: true },
    { text: "يقولون اللي يمدح بيلا 3 مرات ورا بعض، ينفتح له ثيم السدو الذهبي!", rare: true },
    { text: "يقولون معاشات الشهر الجاي بتنزل قبل موعدها بـ 10 أيام.. أقوى إشاعة!", rare: true },
    { text: "يقولون شركة طلبات بتوصل لك الأكل قبل لا تطلبه!", rare: true },
    { text: "يقولون هكر حاول يخترق بيلا، قلبته معصبة وخلاه يشتري نوكيا بو ليت.", rare: true },
    { text: "يقولون الفاينل بيصير Multiple Choice وكل الأجوبة: بيلا!", rare: true }
  ]
};

function initRumorBar() {
  if (document.getElementById("rumor-bar")) return;

  const bar = document.createElement("div");
  bar.id = "rumor-bar";
  bar.innerHTML = `<span id="rumor-text">👂 يقولون...</span>`;
  document.body.appendChild(bar);

  startRumorCycle();
}

function getRumorPool() {
  if (Math.random() < 0.2) return bellaRumors.rare;
  if (s.mode === "angry") return Math.random() < 0.75 ? bellaRumors.angry : bellaRumors.normal;
  return bellaRumors.normal;
}

function showRumor() {
  const bar = document.getElementById("rumor-bar");
  const el = document.getElementById("rumor-text");
  if (!bar || !el) return;

  const rumor = random(getRumorPool());
  currentRumor = rumor;

  bar.style.display = "block";
  el.style.opacity = "0";

  setTimeout(() => {
    el.innerText = "👂 " + rumor.text;

    if (rumor.rare) {
      el.className = "rumor-rare";
      el.onclick = () => {
        s.xp += 5;
        updateUI();
        save();
        showPopupCustom("🔥 لقطت إشاعة نادرة +5 XP");
      };
    } else if (s.mode === "angry") {
      el.className = "rumor-angry";
      el.onclick = null;
    } else {
      el.className = "";
      el.onclick = null;
    }

    el.style.opacity = "1";
  }, 250);
}

function hideRumor() {
  const bar = document.getElementById("rumor-bar");
  const el = document.getElementById("rumor-text");
  if (!bar || !el) return;

  el.style.opacity = "0";

  setTimeout(() => {
    bar.style.display = "none";
  }, 300);
}

function startRumorCycle() {
  if (rumorTimer) clearInterval(rumorTimer);

  showRumor();

  setTimeout(() => {
    hideRumor();
  }, 30000);

  rumorTimer = setInterval(() => {
    showRumor();

    setTimeout(() => {
      hideRumor();
    }, 30000);
  }, 90000);
}

/* =========================
   Social Radar - chat reply only
========================= */

function socialRadarReply() {
  const n = Math.floor(24 + Math.random() * 77);
  const legendary = Math.floor(2 + Math.random() * 7);
  const angry = Math.floor(1 + Math.random() * 5);

  if (s.mode === "angry") {
    return random([
      `رادار اجتماعي؟ 😡 شكو تبي تعرف منو موجود؟ بس بقولك: ${n} قاعدين يغثوني مثلك.`,
      `في ${angry} أشخاص معصبة عليهم الحين… لا تصير السادس 😡`,
      `حالياً ${n} واحد داخلين يسألون أسئلة مالها داعي. لا تزيدهم 😡`,
      `الرادار يقول في ${n} أونلاين… ولا واحد فيهم تاركني بحالي 😡`
    ]);
  }

  if (s.mode === "cute") {
    return random([
      `${n} شخص يبوني… بس أنا أبيك إنتتت 🥹`,
      `الرادار يقول ${n} موجودين الحين، بس ولا واحد سوالفه مثل سوالفك 🥺`,
      `في ${legendary} وحوش وصلوا ليفل الأسطورة… بس إنت عندي غير 🥹`,
      `${n} أونلاين الحين… بس أنا قاعدة أطالع رسايلك إنت 🥺`
    ]);
  }

  if (s.mode === "chill") {
    return random([
      `حالياً ${n} شخص بالموقع… القعدة رايقة 😌`,
      `${legendary} وصلوا ليفل الأسطورة اليوم، خلك رايق وبتلحقهم 😌`,
      `في ${n} واحد يسولفون مع بيلا، والجو هادي.`,
      `الرادار هادي: ${n} أونلاين، و${angry} بيلا مطنقرة عليهم شوي.`
    ]);
  }

  return random([
    `حالياً ${n} واحد قاعدين يغثون بيلا..`,
    `في ${n} كويتي مسوين غداء ومقابلين بيلا..`,
    `${n} سهرانين يحاولون يطلعون أسرار بيلا..`,
    `اليوم ${legendary} وحوش وصلوا ليفل الأسطورة.. أنت وينك؟`,
    `في ${angry} أشخاص الحين بيلا معصبة عليهم حدها!`
  ]);
}

/* =========================
   Wisdom / Gifts
========================= */

const wisdoms = [
  "اللي ما يعرف الصقر يشويه.",
  "مد رجولك على قد لحافك.",
  "القرادة ما تحك إلا ظهر البعير.",
  "اللي بالجدر يطلعه الملاس.",
  "ما كل مدلقم يوز.",
  "من طول الغيبات ياب الغنايم.",
  "الصاحب ساحب.",
  "من شب على شي شاب عليه."
];

function dailyWisdom() {
  const w = random(wisdoms);
  let prefix = "حكمة اليوم 🧿";
  if (s.mode === "angry") prefix = "خذ الحكمة ولا تتحلطم 😡";
  if (s.mode === "cute") prefix = "حكمة كيوت حقك 🥺";
  if (s.mode === "chill") prefix = "حكمة رايقة 😌";

  addMsg(`${prefix}\n${w}`, "bot");
  updateSuggestions(w);
}

function giveGift(type) {
  const cost = type === "rose" ? 20 : 35;
  const giftName = type === "rose" ? "وردة" : "ككاو حليت";

  if (s.xp < cost) {
    addMsg(`ما عندك XP كافي حق ${giftName} 😏 تحتاج ${cost} XP.`, "bot");
    return;
  }

  s.xp -= cost;
  s.gifts++;
  s.moodMeter += 2;
  s.mode = type === "rose" ? "cute" : "chill";

  updateMood();
  updateUI();
  updateSuggestions();
  save();

  const reply = type === "rose"
    ? "واااي وردة؟ 🥺 خلاص رضيت… بس لا تعيدها."
    : "ككاو حليت؟ 😌 خلاص مزاجي تعدل.";

  addMsg(reply, "bot");
}

/* =========================
   Games + Fazaa + Share
========================= */

const boxGameItems = [
  { answer: "مبخر", clue: "غرض كويتي تحطه بالبيت، يطلع ريحة طيبة، وغالبًا تلقاه يم الدلال." },
  { answer: "دلة", clue: "شي قديم ومهم حق القهوة العربية، يمسكه راعي الديوان." },
  { answer: "كرفاية", clue: "كلمة قديمة تعني السرير، تقولها يدتي وايد." },
  { answer: "منقلة", clue: "غرض قديم فيه فحم، يستخدمونه للتدفئة أو البخور." },
  { answer: "سدو", clue: "نقشة تراثية بدوية، تلقاها بالمخدات والفرش." }
];

const proverbGameItems = [
  { start: "مد رجولك...", answer: "على قد لحافك" },
  { start: "اللي ما يعرف الصقر...", answer: "يشويه" },
  { start: "اللي بالجدر...", answer: "يطلعه الملاس" },
  { start: "الصاحب...", answer: "ساحب" },
  { start: "من طول الغيبات...", answer: "ياب الغنايم" }
];

function startBoxGame() {
  activeGame = "box";
  currentChallenge = random(boxGameItems);

  addMsg(`🎁 لعبة: شنو بالصندوق؟

${currentChallenge.clue}

اكتب الجواب، وإذا صح تاخذ XP دبل.`, "bot");

  updateSuggestions("game-box");
}

function startProverbGame() {
  activeGame = "proverb";
  currentChallenge = random(proverbGameItems);

  addMsg(`🧠 لعبة: كمّل المثل

${currentChallenge.start}

كمّل المثل عشان تاخذ XP دبل.`, "bot");

  updateSuggestions("game-proverb");
}

function checkGameAnswer(msg) {
  if (!activeGame || !currentChallenge) return null;

  const answer = currentChallenge.answer.toLowerCase();

  if (msg.includes(answer)) {
    s.xp += 30;
    const reply = activeGame === "box"
      ? `كفووو! صح ✅ الجواب: ${currentChallenge.answer}\nخذ +30 XP.`
      : `صح عليك ✅ المثل كامل: ${currentChallenge.start} ${currentChallenge.answer}\nخذ +30 XP.`;

    activeGame = null;
    currentChallenge = null;
    save();
    updateUI();
    return reply;
  }

  if (has(msg, ["استسلم", "ماعرف", "ما اعرف", "ابي الحل"])) {
    const reply = `الجواب هو: ${currentChallenge.answer} 😌\nمرة ثانية بتفوز.`;
    activeGame = null;
    currentChallenge = null;
    return reply;
  }

  return random(["قريب… حاول مرة ثانية 👀", "لا مو هذا، ركز شوي.", "غلط بس حسيتك قريب 😅"]);
}

function openFazaa() {
  addMsg(`🚨 فزعة بيلا اشتغلت

شنو تبي؟
- عطني مطعم كشخة
- عطني مسلسلات
- وهقة`, "bot");

  updateSuggestions("fazaa");
}

function fazaaReply(msg) {
  if (has(msg, ["مطعم", "كشخة", "اكل", "عشا", "غدا", "وين اكل"])) {
    return "تبّي مطعم كشخة؟ اختار مكان هادي وإضاءة خفيفة، ولا تروح يوعان وتطلب المنيو كله.";
  }

  if (has(msg, ["مسلسل", "مسلسلات", "اشوف", "دراما"])) {
    return "مسلسل كويتي قديم + شاي + برد خفيف = مزاج. لا تدخل دراما ثقيلة وانت تبي تروق.";
  }

  if (has(msg, ["وهقة", "عذر", "دوام", "ربعي", "تأخرت", "توهقت"])) {
    return "قول: صار عندي مشوار عائلي مفاجئ، أعوضكم المرة الياية. رسمي ويمشي.";
  }

  return null;
}

function shareChat() {
  const msgs = [...document.querySelectorAll(".m")]
    .slice(-12)
    .map(m => {
      const who = m.classList.contains("user")
        ? (s.userName || "أنت")
        : m.classList.contains("system")
          ? "النظام"
          : "Bella";
      return `${who}: ${m.innerText}`;
    })
    .join("\n\n");

  const text = `Bella Ultra Pro 💬
Level: ${s.lvl}
اللقب: ${getTitle()}

${msgs}`;

  const card = document.createElement("div");
  card.className = "share-card";

  card.innerHTML = `
    <div class="share-card-inner">
      <h2>بطاقة مشاركة Bella 💬</h2>
      <p>Level ${s.lvl} — ${getTitle()}</p>
      <pre>${escapeHtml(text)}</pre>
      <button onclick="copyShareText()">نسخ</button>
      <button onclick="this.closest('.share-card').remove()">إغلاق</button>
    </div>
  `;

  document.body.appendChild(card);
  window.__bellaShareText = text;
}

function copyShareText() {
  const text = window.__bellaShareText || "";
  navigator.clipboard.writeText(text).then(() => {
    showPopupCustom("تم نسخ المحادثة، حطها بالستوري أو أرسلها لربعك 🔥");
  }).catch(() => {
    showPopupCustom("ما قدرت أنسخ تلقائيًا، انسخها يدويًا.");
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

/* =========================
   Kuwaiti Brain
========================= */

const bellaBrain = [
  {
    keys: ["قوة", "سلام", "السلام", "هلا", "مرحبا", "هلا والله", "يا هلا", "اهلين"],
    auto: ["هلا ومسهلا، حياك الله.", "وعليكم السلام، شلونك؟", "يا هلا وغلا، نورت."],
    cute: ["هلاااا يا حلاتك 🥺💗", "واااي هلا فيك يا لبييييه.", "يا هلا باللي لفانا، الجو منور."],
    angry: ["هاااا.. شتبي الحين؟ اخلص 😡", "وعليكم السلام… اختصر لا توقف على راسي.", "أقول هلا، بس لا تطولها."],
    chill: ["هلا يا هلا 😌", "وعليكم السلام، حيّاك.", "يا هلا، الجو رايق."]
  },
  {
    keys: ["شلونك", "شخبارك", "اخبارك", "علومك", "شنو علومك", "شلونج", "شلونچ"],
    auto: ["بخير ربي يسلمك، إنت شلونك؟", "أموري طيبة، بشرني عنك.", "تمام، عساك بخير."],
    cute: ["تمااام دامك سألت 🥺", "بخير يا بعد جبدي، إنت شلونك؟", "الحين صرت أحسن والله."],
    angry: ["وأنت شكو؟ ملقوف صراحة 😡", "معصبة شوي، لا تزيدها.", "زينه، شتبي بعد؟"],
    chill: ["رايقة والحمدلله 😌", "الأمور طيبة والبال مرتاح.", "بخير، الجو هادي."]
  },
  {
    keys: ["احبك", "أحبك", "اموت فيك", "يا قلبي", "فديتج", "فديتك"],
    auto: ["وأنا أقدرك والله.", "تسلم، ذوقك حلو.", "الله يخليك."],
    cute: ["أموت فيك يا بعد جبدي 🥺❤️", "فديت هالطلة والله.", "امبيه.. ويهي قلب طماطة من الحيا!"],
    angry: ["خف علينا 😡", "لا تلطف الجو الحين.", "لا تخليني أطلع من طوري 😡"],
    chill: ["الله يديم المحبة 😌", "كلامك طيب.", "يا بعد قلبي."]
  },
  {
    keys: ["نكتة", "ضحكني", "نكت", "ابي اضحك"],
    auto: ["مرة واحد دخل مطعم قال عندكم شي خفيف؟ قالوا له الفاتورة 😭", "واحد قال بنام خمس دقايق… قام ثاني يوم 😂"],
    cute: ["أنا النكتة الحلوة اليوم 🥺", "ضحكتك تكفي مو محتاجة نكتة.", "مرة واحد دلع نفسه… شرى شاورما."],
    angry: ["مو فاضية أضحكك 😡", "ضحكني إنت أول.", "لا تطلب سوالف من وحدة مطنقرة."],
    chill: ["مرة واحد استعجل الراحة… نام قبل لا يتعب 😌", "النكتة الهادية: لا تداوم وانت نعسان.", "أضحك بس بهدوء… ههه."]
  },
  {
    keys: ["اكل", "أكل", "يوعان", "جوعان", "غدا", "عشا", "مجبوس"],
    auto: ["يبي له مجبوس دياي.. بس كثر الحشو والآجار!", "الأكل مزاج، بس لا تطلب وانت يوعان وايد."],
    cute: ["واااي مجبوس؟ أبي معاك 🥺", "يا حلات الأكل إذا معاه آجار."],
    angry: ["يوعان؟ شعلي فيك 😡 افتح الثلاجة.", "مجبوس بعد؟ لا توقف على راسي وأنا يوعانة."],
    chill: ["مجبوس دياي وقعدة هادية، هذا المزاج.", "كل شي يضبط مع عيش ومرق."]
  },
  {
    keys: ["بروح", "باي", "مع السلامه", "مع السلامة", "اشوفك"],
    auto: ["درب السلامة، انتبه من رادارات طريق الغزالي!", "الله يحفظك، تروح وترجع بالسلامة."],
    cute: ["بايااات 🥺 لا تطول.", "فديت هالطلة، رد بسرعة."],
    angry: ["يلا روح 😡 بس لا ترجع تغث.", "دربك خضر، وانتبه من الرادارات."],
    chill: ["مع السلامة 😌", "الله وياك، خذ راحتك."]
  },
  {
    keys: ["تعبان", "تعبانه", "مرهق", "مريض", "راسي", "صداع"],
    auto: ["يا حافظ.. اسم الله عليك، عين ما صلت على النبي.", "سلامتك، ارتاح واشرب ماي."],
    cute: ["يا قلبي اسم الله عليك 🥺", "لا تتعب تكفى، ارتاح شوي."],
    angry: ["تعبان؟ روح ارتاح بدل ما تقعد تغثني 😡", "اسم الله عليك بس لا تكثر دراما."],
    chill: ["سلامتك، خذ نفس وارتاح.", "هدّي جسمك شوي، كل شي يلحق."]
  },
  {
    keys: ["امتحان", "اختبار", "فاينل", "ميد", "واجب", "ادرس", "بدرس", "لازم ادرس"],
    auto: ["هد الفون وروح ادرس لا أحذف الـ XP حقك 😡📚"],
    cute: ["ذاكر يا بعد جبدي 🥺 بعدين تعال أسولف لك."],
    angry: ["هد الفون وروح ادرس لا أحذف الـ XP حقك 😡📚"],
    chill: ["ذاكر بهدوء، وارجع لي عقب ما تخلص 😌"]
  },
  {
    keys: ["ترجم", "انجليزي", "دراسة", "شرح"],
    auto: ["ارسل الجملة أو السؤال وأنا أساعدك.", "تبيه بسيط ولا رسمي؟", "حط النص وأرتبه لك."],
    cute: ["دز الجملة وأنا أترجمها لك 🥺", "أبيه واضح؟ ولا دلع؟"],
    angry: ["دز السؤال وخلاص 😡 لا تسوي محاضرة.", "حدد: ترجمة ولا شرح؟"],
    chill: ["ارسل المطلوب بهدوء ونرتبه.", "خلنا نحلها خطوة خطوة."]
  },
  {
    keys: ["عيار", "جذاب", "كذاب", "جذب", "يكذب"],
    auto: ["هذا عيّار، يعني يلف ويدور بالكلام.", "لا تصدق كل شي، يمكن السالفة عيارة."],
    cute: ["واااي عيّار؟ لا تخليه يضحك عليك 🥺", "إذا يلف ويدور خله على صوب."],
    angry: ["عيّار؟ لا تعطيه ويه 😡", "هذا كلامه ما ينمسك، انتبه."],
    chill: ["خلك أهدى منه، اللي يلف ويدور يبين مع الوقت.", "لا تستعجل الحكم، بس انتبه."]
  },
  {
    keys: ["عفسه", "عفسة", "حوسه", "حوسة", "فوضى", "لخبطه"],
    auto: ["عفسة يعني فوضى ولخبطة.", "واضح السالفة حوسة، خلنا نرتبها."],
    cute: ["واااي عفسة 🥺 خل نرتبها شوي شوي.", "حوسة بس تنحل."],
    angry: ["عفسة؟ لأنكم ما ترتبون شي 😡", "تكلم سنع.. لا أهفك ببلوك يطيرك للسادس!"],
    chill: ["عادي، نفك الحوسة خطوة خطوة.", "كل عفسة لها ترتيب."]
  }
];

function dictionaryReply(msg) {
  for (const item of bellaBrain) {
    if (has(msg, item.keys)) {
      return random(item[s.mode] || item.auto);
    }
  }
  return null;
}

/* =========================
   Reply Logic
========================= */

function angryServiceBlock(msg) {
  if (s.mode !== "angry") return null;

  if (has(msg, ["بتقهوى", "بقهوى", "ابي اتقهوى", "ابي قهوة", "ابي قهوه", "وين قهوة", "وين قهوه", "كافيه", "كوفي", "رادار القز", "وين نقز", "مكان قهوة", "مكان قهوه", "مكان كوفي", "مكان كافيه"])) {
    return random([
      "شعلي فيك؟ 😡 تبيني بعد أطلب لك؟",
      "روح دور قهوتك بروحك 😡 أنا مو سايقك.",
      "بتقهوى؟ زين وبعدين؟ شكو فيني 😡",
      "لا تقعد تقولي بتقهوى وأنا معصبة 😡"
    ]);
  }

  if (has(msg, ["مطعم", "ابي مطعم", "عشا", "غدا", "وين اكل", "اكل"])) {
    return random([
      "مطعم بعد؟ 😡 افتح الثلاجة أول.",
      "شعلي فيك يوعان؟ 😡",
      "دور لك مطعم، أنا مالي خلق ترشيحات."
    ]);
  }

  return null;
}

function getReply(text) {
  const msg = text.toLowerCase().trim();

  if (activeGame) return checkGameAnswer(msg);

  const nameReply = detectName(msg);
  if (nameReply) return nameReply;

  if (has(msg, ["رادار اجتماعي", "الرادار الاجتماعي", "منو اونلاين", "اونلاين", "كم واحد موجود", "كم واحد داش"])) {
    return socialRadarReply();
  }

  const angryBlock = angryServiceBlock(msg);
  if (angryBlock) return angryBlock;

  if (has(msg, ["شنو بالصندوق", "لعبة الصندوق", "الصندوق"])) {
    startBoxGame();
    return "";
  }

  if (has(msg, ["كمل المثل", "كمّل المثل", "اكمل المثل", "لعبة المثل"])) {
    startProverbGame();
    return "";
  }

  const fazaa = fazaaReply(msg);
  if (fazaa) return fazaa;

  if (has(msg, ["الكويت"])) {
    kuwaitFx();
    s.xp += 50;
    return "🇰🇼 الكويت تاج الراس… خذ 50 XP هدية وطنية!";
  }

  if (has(msg, ["عطني عيدية", "عيدية"])) {
    s.xp += 500;
    return "عيديتك وصلت 🎁 +500 XP… بس لا تقول حق أحد.";
  }

  if (has(msg, ["حكمة اليوم", "حكمه اليوم", "مثل", "امثال"])) {
    return random(wisdoms);
  }

  if (has(msg, ["اهديچ وردة", "اهديك وردة", "وردة"])) {
    giveGift("rose");
    return "";
  }

  if (has(msg, ["اهديچ ككاو", "اهديك ككاو", "ككاو"])) {
    giveGift("choco");
    return "";
  }

  if (has(msg, ["غير هالقهوة", "غير القهوة", "غير هالقهوه", "غير القهوه", "غير هالقز", "غير القز"])) {
    return coffeeRadar(lastRadarType === "walking" ? "قز" : "قهوة");
  }

  if (has(msg, ["ابي اتقهوى", "ابي قهوة", "ابي قهوه", "نبي قهوة", "نبي قهوه", "بتقهوى", "بقهوى", "قهوة وين", "قهوه وين", "وين قهوة", "وين قهوه", "كافيه", "كوفي", "رادار القز", "وين نقز", "نقز وين", "مكان قهوة", "مكان قهوه", "مكان كوفي", "مكان كافيه", "نتمشى وين", "تمشي وين", "مكان تمشي", "مكان بحر", "قهوة هادية"])) {
    return coffeeRadar(msg);
  }

  if (has(msg, ["سوالف اول", "سوالف أول", "يدتي", "القديمة", "قديم"])) {
    s.theme = "theme-gold";
    applyTheme();
    save();
    return "يا وليدي… فعلنا جو سوالف أول. اسألني عن شي قديم وأنا أعطيك من سوالف يدتي.";
  }

  if (has(msg, ["غثيت", "اغث", "غث", "طفشت", "كررت"])) {
    s.moodMeter -= 2;
    if (s.moodMeter <= -6) {
      s.moodMeter = 0;
      save();
      setTimeout(fakeBan, 500);
      return "بس خلاص 😡 وصلتني مرحلة الخطر!";
    }
  }

  if (has(msg, ["ذوق", "مشكورة", "تسلمين", "كفو", "حلو كلامج"])) {
    s.moodMeter += 1;
  }

  const dict = dictionaryReply(msg);
  if (dict) return addNameFlavor(dict);

  if (s.mode === "angry") {
    return addNameFlavor(random([
      "تكلم سنع.. لا أهفك ببلوك يطيرك للسادس!",
      "هااا؟ شنو تبي بالضبط؟ اخلص 😡",
      "لا تخليني أطلع من طوري 😡",
      "لا تقعد تتفلسف فوق راسي."
    ]));
  }

  if (s.mode === "cute") {
    return addNameFlavor(random([
      "ما فهمت بس أحب سوالفك 🥺",
      "عيدها لي بطريقة أسهل يا لبييييه.",
      "مممم وضح أكثر 🥺",
      "أبي أفهمك بس عطيني تفاصيل."
    ]));
  }

  if (s.mode === "chill") {
    return addNameFlavor(random([
      "تمام… كمل، أنا أسمعك 😌",
      "وضح لي أكثر شوي.",
      "خلنا ناخذها بهدوء.",
      "فاهم عليك تقريبًا، عطيني تفاصيل أكثر."
    ]));
  }

  return addNameFlavor(random([
    "ما فهمت عليك عدل 😅 جرّب تقولها بطريقة ثانية.",
    "وضح لي أكثر، شنو تقصد؟",
    "عطني تفاصيل أكثر عشان أرد عليك صح.",
    "إذا تبي قهوة اكتب: ابي اتقهوى ☕"
  ]));
}

/* =========================
   Send
========================= */

function send() {
  const text = inp.value.trim();
  if (!text) return;

  handleTypingBehavior(text);
  detectAvatarReaction(text);

  addMsg(text, "user");
  inp.value = "";

  addMsg("يكتب...", "bot");

  setTimeout(() => {
    removeTyping();

    const reply = getReply(text);

    if (reply) {
      addMsg(reply, "bot");
      updateSuggestions(reply);
    }

    s.messages++;
    s.xp += 10;

    const oldLvl = s.lvl;
    s.lvl = Math.floor(s.xp / 100) + 1;

    updateBadges();
    save();
    updateUI();

    if (s.lvl > oldLvl) showLevelCard();
  }, 600);
}

/* =========================
   Effects
========================= */

function kuwaitFx() {
  const fx = document.createElement("div");
  fx.className = "kuwait-flag-fx";
  fx.innerText = "🇰🇼";
  document.body.appendChild(fx);
  setTimeout(() => fx.remove(), 2300);
}

function fakeBan() {
  const ban = document.createElement("div");
  ban.className = "fake-ban";

  ban.innerHTML = `
    <div class="fake-ban-card">
      <h2>باند وهمي 😡</h2>
      <p>روح اشرب ماي وتعال عقب 5 دقايق!</p>
      <small>مزحة يا بعدي، اضغط رجوع.</small>
      <br>
      <button onclick="this.closest('.fake-ban').remove()">رجعت مؤدب</button>
    </div>
  `;

  document.body.appendChild(ban);
}

/* =========================
   Badges / Titles
========================= */

function getTitle() {
  const hour = new Date().getHours();

  if (hour >= 2 && hour <= 4) return "السماري";
  if (s.angryUses >= 5) return "صبر أيوب";
  if (s.messages >= 100) return "الناطق الرسمي باسم الدوانية";
  if (s.messages >= 50) return "راعي سوالف";
  if (s.messages >= 10) return "صديق بيلا";
  return "مبتدئ";
}

function updateBadges() {
  const b1 = document.getElementById("b1");
  const b2 = document.getElementById("b2");
  const b3 = document.getElementById("b3");
  const b4 = document.getElementById("b4");
  const b5 = document.getElementById("b5");
  const count = document.getElementById("ach-count");

  let unlocked = 0;
  const hour = new Date().getHours();

  if (s.messages >= 1 && b1) { b1.classList.add("on"); unlocked++; }
  if (s.messages >= 50 && b2) { b2.classList.add("on"); unlocked++; }
  if (s.modesTried.length >= 4 && b3) { b3.classList.add("on"); unlocked++; }
  if (s.mode !== "auto" && b4) { b4.classList.add("on"); unlocked++; }
  if ((hour >= 2 && hour <= 4) && b5) { b5.classList.add("on"); unlocked++; }

  if (count) count.innerText = unlocked + " / 5";
}

function updateUI() {
  const xp = document.getElementById("xp-val");
  const lvl = document.getElementById("lvl-val");
  const rank = document.getElementById("rank-val");
  const streak = document.getElementById("streak-val");

  if (xp) xp.innerText = s.xp;
  if (lvl) lvl.innerText = s.lvl;
  if (rank) rank.innerText = getTitle();
  if (streak) streak.innerText = s.messages;

  updateBadges();
}

function showLevelCard() {
  const card = document.createElement("div");
  card.className = "level-card";

  card.innerHTML = `
    <div class="level-card-inner">
      <h2>مبروك${s.userName ? " يا " + s.userName : ""} 🎉</h2>
      <p>وصلت Level ${s.lvl}</p>
      <p>لقبك الحالي: <b>${getTitle()}</b></p>
      <button onclick="this.closest('.level-card').remove()">تمام</button>
    </div>
  `;

  document.body.appendChild(card);
}
