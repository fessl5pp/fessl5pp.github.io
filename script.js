const STORAGE_KEY = "bella_v15";

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
let lastBotReply = "";

window.onload = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) s = { ...s, ...saved };
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }

  applyTheme();
  updateUI();
  updateMood();
  updateSuggestions();
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

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
  inp.value = text;
  send();
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function has(msg, words) {
  return words.some(w => msg.includes(w));
}

function cleanName(name) {
  return name
    .replace(/[؟?!.,،]/g, "")
    .replace("انا", "")
    .trim()
    .split(" ")[0]
    .slice(0, 18);
}

function getDisplayName() {
  return s.userName ? ` يا ${s.userName}` : "";
}

/* =========================
   الشخصيات والمودات
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
    angry: "تم تشغيل مود معصبة 😡 لا تستفزها ترى مطنقرة.",
    cute: "تم تشغيل مود دلّوعة 🥺 نبرة ناعمة وغنج كويتي.",
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
   Smart Replies
========================= */

function updateSuggestions(context = "") {
  const el = document.getElementById("quickSuggestions");
  if (!el) return;

  let suggestions = ["شلونچ؟", "ابي اتقهوى", "نكتة", "حكمة اليوم", "شنو الجو؟"];

  if (s.mode === "angry") {
    suggestions = ["ليش نفسيتچ جذي؟", "منو مزعلچ؟", "هدي بالج", "اهديچ وردة", "ابي اتقهوى"];
  } else if (s.mode === "cute") {
    suggestions = ["دلّعيني", "احبچ", "نكتة", "ابي اتقهوى", "حكمة اليوم"];
  } else if (s.mode === "chill") {
    suggestions = ["سولفي بهدوء", "قهوة هادية", "حكمة اليوم", "شنو الجو؟", "غير هالقهوة"];
  }

  if (context.includes("معصبة") || context.includes("😡")) {
    suggestions = ["ليش؟", "منو مزعلچ؟", "هدي بالج", "اهديچ ككاو", "غيري المود"];
  }

  if (context.includes("رادار") || context.includes("اختار")) {
    suggestions = ["غير هالقهوة", "مكان بحر", "قهوة هادية", "مكان تمشي", "حكمة اليوم"];
  }

  el.innerHTML = suggestions.map(t => {
    const safe = t.replace(/'/g, "\\'");
    return `<button onclick="quickSend('${safe}')">${t}</button>`;
  }).join("");
}

/* =========================
   القِطّات Popups
========================= */

const popupLines = {
  fast: [
    "بشويش بشويش 😭 لا ينكسر الكيبورد!",
    "هااا شفيك مستعجل؟ خلني أستوعب 😂",
    "سرعة يا وحش، خلني ألحق عليك!"
  ],
  slow: [
    "هااا.. نمت ولا شسويت؟ 😴",
    "اختفيت فجأة 🤨 وين رحت؟",
    "تراني أنطر ردك لا تسحب 😒"
  ],
  spam: [
    "لا تعفسها علي 😡 رد وحدة وحدة",
    "ترى مو سباق 😂 اهدى شوي",
    "وش ذا الفلود يا بعدي 😭"
  ],
  chill: [
    "عجيب أسلوبك 👌",
    "سوالفك رايقة 😌",
    "كلامك مرتب والله"
  ]
};

function showPopup(type) {
  if (!popupLines[type]) return;

  const old = document.querySelector(".bella-popup");
  if (old) old.remove();

  const pop = document.createElement("div");
  pop.className = "bella-popup";
  pop.innerText = random(popupLines[type]);

  document.body.appendChild(pop);

  setTimeout(() => {
    if (pop) pop.remove();
  }, 2500);
}

function handleTypingBehavior() {
  const now = Date.now();
  const diff = now - lastTypeTime;
  lastTypeTime = now;

  if (diff < 1500) msgCountFast++;
  else msgCountFast = 0;

  setTimeout(() => {
    if (msgCountFast >= 3) {
      showPopup("spam");
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
   رادار القز والقهوة
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
  const isWalking = has(msg, [
    "مشي", "تمشي", "نتمشى", "ممشى", "بحر", "قز", "نقز",
    "هالقز", "غير هالقز", "غير القز", "مكان بحر"
  ]);

  const pool = isWalking ? qazPlaces.walking.concat(qazPlaces.coffee) : qazPlaces.coffee;

  let choices = pool.filter(p => p.name !== lastRadarName);
  if (choices.length === 0) choices = pool;

  const picked = random(choices);

  lastRadarType = isWalking ? "walking" : "coffee";
  lastRadarName = picked.name;

  let intro = "رادار القز اختار لك 📡☕";
  if (s.mode === "angry") intro = "خلاص، اختاري هذا 😡☕";
  if (s.mode === "cute") intro = "واااي أحس هذا يناسبچ 🥺☕";
  if (s.mode === "chill") intro = "اختيار رايق لك 😌☕";

  return `${intro}

${picked.name} — ${picked.vibe}
📍 ${picked.area}
ليش؟ ${picked.why}

إذا ما عجبك اكتب: غير هالقهوة`;
}

/* =========================
   حكمة اليوم
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

/* =========================
   نظام الرضاوة
========================= */

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
   قاموس Bella
========================= */

const bellaBrain = [
  {
    keys: ["قوة", "سلام", "السلام", "هلا", "مرحبا", "هلا والله", "يا هلا", "اهلين"],
    auto: ["هلا ومسهلا، حياك الله.", "وعليكم السلام، شلونك؟", "يا هلا وغلا، نورت."],
    cute: ["هلاااا 🥺💗 نورتني.", "واااي هلا فيك يا حلو.", "يا هلا باللي لفانا، الجو منور."],
    angry: ["هلا 😡 شتبي؟", "وعليكم السلام… اختصر 😡", "أقول هلا، بس لا تطولها."],
    chill: ["هلا يا هلا 😌", "وعليكم السلام، حيّاك.", "يا هلا، الجو رايق."]
  },
  {
    keys: ["شلونك", "شخبارك", "اخبارك", "علومك", "شنو علومك", "شلونج", "شلونچ"],
    auto: ["بخير ربي يسلمك، إنت شلونك؟", "أموري طيبة، بشرني عنك.", "تمام، عساك بخير."],
    cute: ["تمااام دامك سألت 🥺", "بخير يا قلبي، إنت شلونك؟", "الحين صرت أحسن والله."],
    angry: ["مو شغلك 😡 بس بخير.", "معصبة شوي، لا تزيدها.", "زينه، شتبي بعد؟"],
    chill: ["رايقة والحمدلله 😌", "الأمور طيبة والبال مرتاح.", "بخير، الجو هادي."]
  },
  {
    keys: ["شكرا", "مشكور", "مشكورة", "يعطيك العافيه", "تسلم", "ثانكس"],
    auto: ["العفو، ما سوينا إلا الواجب.", "حاضرين طال عمرك.", "تسلم، بالخدمة."],
    cute: ["العفو يا قمر 🥺", "واااي فديتك، ما سوينا شي.", "تستاهل أكثر والله."],
    angry: ["عارفة، هذي شغلتي 😡", "إي إي العفو.", "خلصنا؟"],
    chill: ["العفو يا الغالي 😌", "حاضرين، الأمور طيبة.", "ولا يهمك."]
  },
  {
    keys: ["احبك", "أحبك", "اموت فيك", "يا قلبي", "فديتج", "فديتك"],
    auto: ["وأنا أقدرك والله.", "تسلم، ذوقك حلو.", "الله يخليك."],
    cute: ["وأنا أحبك أكثررر 🥺❤️", "واااي فديتك.", "لا تقولها وايد أستحي."],
    angry: ["خف علينا 😡", "لا تلطف الجو الحين.", "أدري أدري، بس لا تستفزني."],
    chill: ["الله يديم المحبة 😌", "كلامك طيب.", "يا بعد قلبي."]
  },
  {
    keys: ["نكتة", "ضحكني", "نكت", "ابي اضحك"],
    auto: ["مرة واحد دخل مطعم قال عندكم شي خفيف؟ قالوا له الفاتورة 😭", "واحد قال بنام خمس دقايق… قام ثاني يوم 😂"],
    cute: ["أنا النكتة الحلوة اليوم 🥺", "ضحكتك تكفي مو محتاجة نكتة.", "مرة واحد دلع نفسه… شرى شاورما."],
    angry: ["النكتة إنك تبي تضحك وأنا معصبة 😡", "ضحكني إنت أول.", "مرة واحد استفزني… اختفى."],
    chill: ["مرة واحد استعجل الراحة… نام قبل لا يتعب 😌", "النكتة الهادية: لا تداوم وانت نعسان.", "أضحك بس بهدوء… ههه."]
  },
  {
    keys: ["زعلان", "زعلانه", "ضايق", "متضايق", "مالي خلق", "طفشان", "تعبان", "تعبانه"],
    auto: ["لا تزعل، عسى ما شر. شنو صار؟", "سلامتك، قول لي شفيك.", "خذ نفس وخلنا نفهم السالفة."],
    cute: ["لا تزعل تكفى 🥺 أنا معاك.", "تعال سولف لي، لا تكتم.", "يا قلبي، شفيك؟"],
    angry: ["لا تقعد تكتم، قول شفيك 😡", "ما راح أفهم إذا ما تكلمت.", "تكلم، لا تسوي دراما بصمت."],
    chill: ["خذ نفس… الأمور تهون 😌", "تعال نشرحها بهدوء.", "لا تشيل هم، خطوة خطوة."]
  },
  {
    keys: ["شنو الجو", "الجو", "حر", "برد", "غبار", "رطوبه", "رطوبة"],
    auto: ["الجو يبيله قهوة ومكان مرتب.", "إذا حر شغل التكييف وخلك بمجمع.", "إذا برد يبيلها كوت وقهوة."],
    cute: ["واااي الجو يبيله تصوير وقهوة 🥺", "برد؟ تك تك تك يبيله كوفي.", "حر؟ أمبيه شغل التكييف بسرعة."],
    angry: ["حر وغبار؟ خلك بالبيت أحسن 😡", "بردان؟ شتسوي يعني، لبس جاكيت.", "الجو مو عذر تتحلطم."],
    chill: ["الجو رايق حق قهوة هادية 😌", "إذا الجو حلو اقترح مشي خفيف.", "الجو يبيله قعدة بحر."]
  },
  {
    keys: ["سيارة", "سياره", "موتر", "لكزس", "دوج", "ماركيز", "قير", "مكينه", "مكينة"],
    auto: ["قول لي نوع الموتر والسنة والمشكلة بالضبط.", "شنو الصوت أو العطل؟ عطيني التفاصيل.", "إذا تبي تشخيص، اذكر الموديل والسنة."],
    cute: ["قول لي عن موترك 🥺 يمكن أقدر أساعدك.", "شنو فيه؟ صوت؟ لمبة؟ ريحة؟", "عطني التفاصيل يا حلو."],
    angry: ["موتر؟ عطيني السنة والعطل لا تقول بس خربان 😡", "حدد المشكلة عشان أرد عدل.", "شنو يعني خربان؟ صوت؟ قير؟ مكينة؟"],
    chill: ["خلنا نمشيها خطوة خطوة: النوع، السنة، المشكلة.", "اشرح لي بهدوء شنو يصير.", "إذا فيه صوت، متى يطلع؟"]
  },
  {
    keys: ["ترجم", "انجليزي", "واجب", "دراسة", "شرح"],
    auto: ["ارسل الجملة أو السؤال وأنا أساعدك.", "تبيه بسيط ولا رسمي؟", "حط النص وأرتبه لك."],
    cute: ["دز الجملة وأنا أترجمها لك 🥺", "أبيه واضح؟ ولا دلع؟", "يلا خل نخلصه بسرعة."],
    angry: ["دز السؤال وخلاص 😡", "لا ترسل نص ناقص.", "حدد: ترجمة ولا شرح؟"],
    chill: ["ارسل المطلوب بهدوء ونرتبه.", "خلنا نحلها خطوة خطوة.", "أكتب النص وأنا أساعدك."]
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
    angry: ["عفسة؟ لأنكم ما ترتبون شي 😡", "خل نرتبها بدل التحلطم."],
    chill: ["عادي، نفك الحوسة خطوة خطوة.", "كل عفسة لها ترتيب."]
  },
  {
    keys: ["شدعوه", "شدعوة", "شكو", "يا حافظ", "اييه", "ايه"],
    auto: ["شدعوه؟ شنو صار؟", "يا حافظ، السالفة شكلها قوية.", "شكو؟ وضح لي."],
    cute: ["يا حافظ 🥺 شنو صار؟", "شدعوه يا قلبي؟", "واااي شنو السالفة؟"],
    angry: ["شدعوه؟ لا تكبرها 😡", "شكو يعني؟ وضح.", "يا حافظ من هالحوسة."],
    chill: ["هدّي، شنو الموضوع؟", "خلنا نفهم قبل لا نحكم.", "شدعوه، الأمور تهون."]
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
   الردود الأساسية
========================= */

function getReply(text) {
  const msg = text.toLowerCase().trim();

  if (msg.includes("اسمي")) {
    const name = cleanName(msg.split("اسمي")[1] || "");
    if (name) {
      s.userName = name;
      save();
      return `تشرفنا يا ${s.userName} 😌 من الحين بناديك باسمك.`;
    }
  }

  if (has(msg, ["الكويت"])) {
    s.xp += 50;
    return "🇰🇼 الكويت تاج الراس… خذ 50 XP هدية وطنية!";
  }

  if (has(msg, ["عطني عيدية", "عيدية"])) {
    s.xp += 500;
    return "عيديتك وصلت 🎁 +500 XP… بس لا تقول حق أحد.";
  }

  if (has(msg, ["حكمة اليوم", "حكمه اليوم", "مثل", "امثال"])) {
    return `${random(wisdoms)}`;
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

  if (has(msg, [
    "ابي اتقهوى", "ابي قهوة", "ابي قهوه", "نبي قهوة", "نبي قهوه", "بتقهوى", "بقهوى",
    "قهوة وين", "قهوه وين", "وين قهوة", "وين قهوه", "كافيه", "كوفي", "رادار القز",
    "وين نقز", "نقز وين", "مكان قهوة", "مكان قهوه", "مكان كوفي", "مكان كافيه",
    "نتمشى وين", "تمشي وين", "مكان تمشي", "مكان بحر", "قهوة هادية"
  ])) {
    return coffeeRadar(msg);
  }

  const dict = dictionaryReply(msg);
  if (dict) return addNameFlavor(dict);

  if (s.mode === "angry") return addNameFlavor(random([
    "تكلم عدل 😡 شنو تبي بالضبط؟",
    "عيدها بس بدون لف ودوران 😡",
    "لا تستفزني، وضح.",
    "هااا؟ شنو تقصد؟ عيد كلامك."
  ]));

  if (s.mode === "cute") return addNameFlavor(random([
    "ما فهمت بس أحب سوالفك 🥺",
    "عيدها لي بطريقة أسهل يا حلو.",
    "مممم وضح أكثر 🥺",
    "أبي أفهمك بس عطيني تفاصيل."
  ]));

  if (s.mode === "chill") return addNameFlavor(random([
    "تمام… كمل، أنا أسمعك 😌",
    "وضح لي أكثر شوي.",
    "خلنا ناخذها بهدوء.",
    "فاهم عليك تقريبًا، عطيني تفاصيل أكثر."
  ]));

  return addNameFlavor(random([
    "ما فهمت عليك عدل 😅 جرّب تقولها بطريقة ثانية.",
    "وضح لي أكثر، شنو تقصد؟",
    "عطني تفاصيل أكثر عشان أرد عليك صح.",
    "إذا تبي قهوة اكتب: ابي اتقهوى ☕"
  ]));
}

function addNameFlavor(reply) {
  if (!s.userName) return reply;
  if (Math.random() > 0.45) return reply;
  return `${reply}\n\n${s.userName}، فهمت عليك؟`;
}

/* =========================
   إرسال الرسائل
========================= */

function send() {
  const text = inp.value.trim();
  if (!text) return;

  handleTypingBehavior();
  detectAvatarReaction(text);

  addMsg(text, "user");
  inp.value = "";

  addMsg("يكتب...", "bot");

  setTimeout(() => {
    removeTyping();

    const reply = getReply(text);

    if (reply) {
      addMsg(reply, "bot");
      lastBotReply = reply;
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

function addMsg(text, type) {
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
   الأوسمة والألقاب
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
      <h2>مبروك${getDisplayName()} 🎉</h2>
      <p>وصلت Level ${s.lvl}</p>
      <p>لقبك الحالي: <b>${getTitle()}</b></p>
      <button onclick="this.closest('.level-card').remove()">تمام</button>
    </div>
  `;

  document.body.appendChild(card);
}
/* =========================
   باقي الإضافات v16
   ألعاب + فزعة + مشاركة + مؤثرات
========================= */

let activeGame = null;
let currentChallenge = null;

const boxGameItems = [
  {
    answer: "مبخر",
    clue: "غرض كويتي تحطه بالبيت، يطلع ريحة طيبة، وغالبًا تلقاه يم الدلال."
  },
  {
    answer: "دلة",
    clue: "شي قديم ومهم حق القهوة العربية، يمسكه راعي الديوان."
  },
  {
    answer: "كرفاية",
    clue: "كلمة قديمة تعني السرير، تقولها يدتي وايد."
  },
  {
    answer: "منقلة",
    clue: "غرض قديم فيه فحم، يستخدمونه للتدفئة أو البخور."
  },
  {
    answer: "سدو",
    clue: "نقشة تراثية بدوية، تلقاها بالمخدات والفرش."
  }
];

const proverbGameItems = [
  {
    start: "مد رجولك...",
    answer: "على قد لحافك"
  },
  {
    start: "اللي ما يعرف الصقر...",
    answer: "يشويه"
  },
  {
    start: "اللي بالجدر...",
    answer: "يطلعه الملاس"
  },
  {
    start: "الصاحب...",
    answer: "ساحب"
  },
  {
    start: "من طول الغيبات...",
    answer: "ياب الغنايم"
  }
];

const fazaaReplies = {
  food: [
    "تبّي مطعم كشخة؟ جرّب مكان مطل على البحر أو مطعم ياباني مرتب، بس لا تروح وانت يوعان وايد تطلب المنيو كله.",
    "إذا تبي شي فخم: مطعم هادي، إضاءة خفيفة، وقعدة مو مزعجة. لا تنسى تحجز قبل لا تتوهق.",
    "حق طلعة محترمة: اختار مطعم فيه جلسات داخلية وديكور كشخة، وخل القهوة بعده بمكان ثاني."
  ],
  shows: [
    "مسلسلات كويتية؟ جرّب الكلاسيكيات أول، تعطيك جو الدراما القديمة والسوالف اللي لها طعم.",
    "إذا تبي شي خفيف: دور مسلسل كويتي اجتماعي قصير، لا تدخل دراما ثقيلة وانت تبي تروق.",
    "اقتراح بيلا: حلقة قديمة + شاي + برد خفيف = مزاج."
  ],
  excuse: [
    "عذر للدوام؟ قول: عندي ظرف طارئ وبحاول أعوض الوقت. رسمي وبدون خرابيط.",
    "عذر للربع؟ قول: والله طحت علي نومة وما حسيت بالدنيا. كلاسيكي بس يمشي.",
    "عذر محترم: صار عندي مشوار عائلي مفاجئ، أعوضكم المرة الياية."
  ]
};

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

  return random([
    "قريب… حاول مرة ثانية 👀",
    "لا مو هذا، ركز شوي.",
    "غلط بس حسيتك قريب 😅",
    "تبي تلميح؟ اكتب: ابي الحل إذا استسلمت."
  ]);
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
  if (has(msg, ["مطعم", "كشخة", "اكل", "عشا", "غدا"])) {
    return random(fazaaReplies.food);
  }

  if (has(msg, ["مسلسل", "مسلسلات", "اشوف", "دراما"])) {
    return random(fazaaReplies.shows);
  }

  if (has(msg, ["وهقة", "عذر", "دوام", "ربعي", "تأخرت", "توهقت"])) {
    return random(fazaaReplies.excuse);
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
  if (!text) return;

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

function showPopupCustom(text) {
  const old = document.querySelector(".bella-popup");
  if (old) old.remove();

  const pop = document.createElement("div");
  pop.className = "bella-popup";
  pop.innerText = text;
  document.body.appendChild(pop);

  setTimeout(() => pop.remove(), 2600);
}

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
   توسيع Smart Replies للإضافات
========================= */

const oldUpdateSuggestions = updateSuggestions;

updateSuggestions = function(context = "") {
  const el = document.getElementById("quickSuggestions");
  if (!el) return;

  if (context === "game-box") {
    const suggestions = ["مبخر", "دلة", "كرفاية", "ابي الحل", "كمّل المثل"];
    el.innerHTML = suggestions.map(t => `<button onclick="quickSend('${t}')">${t}</button>`).join("");
    return;
  }

  if (context === "game-proverb") {
    const suggestions = ["على قد لحافك", "يشويه", "يطلعه الملاس", "ابي الحل", "شنو بالصندوق"];
    el.innerHTML = suggestions.map(t => `<button onclick="quickSend('${t}')">${t}</button>`).join("");
    return;
  }

  if (context === "fazaa") {
    const suggestions = ["عطني مطعم كشخة", "عطني مسلسلات", "وهقة", "ابي اتقهوى", "حكمة اليوم"];
    el.innerHTML = suggestions.map(t => `<button onclick="quickSend('${t}')">${t}</button>`).join("");
    return;
  }

  oldUpdateSuggestions(context);
};

/* =========================
   توسيع getReply بدون كسر القديم
========================= */

const oldGetReply = getReply;

getReply = function(text) {
  const msg = text.toLowerCase().trim();

  if (activeGame) {
    return checkGameAnswer(msg);
  }

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

  const reply = oldGetReply(text);

  if (has(msg, ["سوالف اول", "سوالف أول", "يدتي", "القديمة", "قديم"])) {
    s.theme = "theme-gold";
    applyTheme();
    save();
    return "يا وليدي… فعلنا جو سوالف أول. اسألني عن شي قديم وأنا أعطيك من سوالف يدتي.";
  }

  return reply;
};
/* =========================
   Angry Mode الحقيقي v17
   يخلي المعصبة ترد بعصبية على الطلبات
========================= */

function angryServiceBlock(msg) {
  if (s.mode !== "angry") return null;

  if (has(msg, [
    "بتقهوى",
    "بقهوى",
    "ابي اتقهوى",
    "ابي قهوة",
    "ابي قهوه",
    "وين قهوة",
    "وين قهوه",
    "كافيه",
    "كوفي",
    "رادار القز",
    "وين نقز",
    "مكان قهوة",
    "مكان قهوه",
    "مكان كوفي",
    "مكان كافيه"
  ])) {
    return random([
      "شعلي فيك؟ 😡 تبيني بعد أطلب لك؟",
      "روح دور قهوتك بروحك 😡 أنا مو سايقك.",
      "بتقهوى؟ زين وبعدين؟ شكو فيني 😡",
      "لا تقعد تقولي بتقهوى وأنا معصبة 😡",
      "القهوة ما تصلح نفسيتك، بس جرب يمكن 😡"
    ]);
  }

  if (has(msg, [
    "عطني مطعم",
    "مطعم",
    "ابي مطعم",
    "عشا",
    "غدا",
    "وين اكل",
    "اكل"
  ])) {
    return random([
      "مطعم بعد؟ 😡 افتح الثلاجة أول.",
      "شعلي فيك يوعان؟ 😡",
      "دور لك مطعم، أنا مالي خلق ترشيحات.",
      "تبيني أختار لك بعد؟ لا والله 😡"
    ]);
  }

  if (has(msg, [
    "ترجم",
    "اشرح",
    "واجب",
    "حل",
    "ساعديني",
    "ساعدني"
  ])) {
    return random([
      "الحين تبي مساعدة؟ 😡 قولها عدل أول.",
      "أساعدك بس لا تقعد تأمرني 😡",
      "اكتب طلبك مرتب يمكن أحن عليك.",
      "مالي خلق، بس عطيني السؤال وخلاص 😡"
    ]);
  }

  if (has(msg, [
    "نكتة",
    "ضحكني",
    "سولفي",
    "دلّعيني",
    "دلعيني"
  ])) {
    return random([
      "مو فاضية أضحكك 😡",
      "ضحكني إنت أول 😡",
      "تبيني أسولف وأنا معصبة؟ عجيب أمرك.",
      "لا تطلب دلع من وحدة مطنقرة 😡"
    ]);
  }

  return null;
}

const oldGetReplyAngryReal = getReply;

getReply = function(text) {
  const msg = text.toLowerCase().trim();

  const angryBlock = angryServiceBlock(msg);
  if (angryBlock) return angryBlock;

  return oldGetReplyAngryReal(text);
};
