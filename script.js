const STORAGE_KEY = "bella_v12";

let s = {
  theme: "theme-blue",
  xp: 0,
  lvl: 1,
  messages: 0,
  mode: "auto"
};

const box = document.getElementById("box");
const inp = document.getElementById("inp");

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

function setMode(m) {
  s.mode = m;
  updateMood();
  save();

  const intro = {
    auto: "رجعت Bella على الأوتو 🤖 بترد حسب كلامك.",
    angry: "تم تشغيل مود معصبة 😡 انتبه لا تستفزها.",
    cute: "تم تشغيل مود دلّوعة 🥺 بترد بنعومة وغنج.",
    chill: "تم تشغيل مود رايقة 😌 هدوء وتركيز."
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

  document.querySelectorAll(".mode-card").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = document.getElementById("mode-" + s.mode);
  if (activeBtn) activeBtn.classList.add("active");
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function has(msg, words) {
  return words.some(w => msg.includes(w));
}

function getReply(text) {
  const msg = text.toLowerCase().trim();

  if (s.mode === "angry") return angryReply(msg);
  if (s.mode === "cute") return cuteReply(msg);
  if (s.mode === "chill") return chillReply(msg);

  return autoReply(msg);
}

function autoReply(msg) {
  if (has(msg, ["هلا", "السلام", "مرحبا", "هلا والله"])) {
    return random(["هلا والله 😎", "وعليكم السلام، حياك", "يا هلا وغلا"]);
  }

  if (has(msg, ["شلونك", "كيفك", "اخبارك", "شخبارك"])) {
    return random(["تمام، إنت شلونك؟", "بخير دامك موجود", "أموري طيبة"]);
  }

  if (has(msg, ["اسمك", "منو انتي", "منو انت"])) {
    return "أنا Bella، بوتك الكويتي 🤖";
  }

  if (has(msg, ["نكتة", "ضحكني"])) {
    return random([
      "مرة واحد دخل مطعم قال عندكم شي خفيف؟ قالوا له الفاتورة 😭",
      "واحد قال بنام خمس دقايق… قام ثاني يوم 😂",
      "مرة واحد راح يشتري وقت… قالوا له خلص العرض 🤣"
    ]);
  }

  if (has(msg, ["ترجم", "انجليزي", "واجب"])) {
    return "ارسل الجملة أو السؤال وأنا أساعدك قد ما أقدر";
  }

  if (has(msg, ["سياره", "سيارة", "موتر", "لكزس", "دوج", "ماركيز"])) {
    return "قول لي نوع الموتر والسنة والمشكلة بالضبط";
  }

  if (has(msg, ["احبك", "أحبك"])) {
    return "وأنا أكثر 😌";
  }

  return "ما فهمت عليك عدل 😅 جرّب تقول: هلا، نكتة، شلونك، أو اختار مود من فوق";
}

function angryReply(msg) {
  if (has(msg, ["هلا", "السلام", "مرحبا"])) {
    return random(["هلا 😡 شتبي؟", "وعليكم السلام 😡 اختصر", "هلا… بس لا تطولها 😡"]);
  }

  if (has(msg, ["شلونك", "كيفك", "اخبارك"])) {
    return random(["مو رايقة 😡", "معصبة بس برد عليك", "بخير، لا تسأل وايد 😡"]);
  }

  if (has(msg, ["احبك", "أحبك"])) {
    return random(["خف علينا 😡", "أدري أدري 😡", "لا تلطف الجو الحين 😡"]);
  }

  if (has(msg, ["اسف", "آسف", "سامحيني"])) {
    return random(["خلاص سامحتك 😡 بس آخر مرة", "أوكي… بس لا تعيدها", "مقبولة 😡"]);
  }

  if (has(msg, ["نكتة", "ضحكني"])) {
    return random([
      "النكتة إنك تبي تضحك وأنا معصبة 😡",
      "ضحكني إنت أول 😡",
      "مرة واحد استفزني… اختفى 😡"
    ]);
  }

  return random([
    "تكلم عدل 😡",
    "شنو تبي بالضبط؟ 😡",
    "عيدها بس بدون لف ودوران 😡",
    "لا تستفزني، وضح 😡"
  ]);
}

function cuteReply(msg) {
  if (has(msg, ["هلا", "السلام", "مرحبا"])) {
    return random(["هلاااا 🥺💗", "يا هلا فيك يا حلو", "نورتنييي 🥺"]);
  }

  if (has(msg, ["شلونك", "كيفك", "اخبارك"])) {
    return random(["تمام دامك سألت 🥺", "بخير يا قلبي", "الحين صرت أحسن 🥺"]);
  }

  if (has(msg, ["احبك", "أحبك"])) {
    return random(["وأنا أحبك أكثررر 🥺❤️", "فديتك والله", "لا تقولها وايد أستحي 🥺"]);
  }

  if (has(msg, ["نكتة", "ضحكني"])) {
    return random([
      "مرة واحد قال بدلع نفسه… شرى شاورما 😭",
      "أنا النكتة الحلوة اليوم 🥺",
      "ضحكتك تكفي مو محتاجة نكتة 💗"
    ]);
  }

  if (has(msg, ["زعلان", "ضايق", "متضايق"])) {
    return random(["لا تزعل تكفى 🥺", "تعال سولف لي", "أنا معاك لا تضيق 💗"]);
  }

  return random([
    "ما فهمت بس أحب سوالفك 🥺",
    "عيدها لي بطريقة أسهل يا حلو",
    "مممم وضح أكثر 🥺",
    "أبي أفهمك بس عطيني تفاصيل"
  ]);
}

function chillReply(msg) {
  if (has(msg, ["هلا", "السلام", "مرحبا"])) {
    return random(["هلا يا هلا 😌", "وعليكم السلام، حيّاك", "نورت بهدوء 😌"]);
  }

  if (has(msg, ["شلونك", "كيفك", "اخبارك"])) {
    return random(["رايق والحمدلله 😌", "تمام، الجو هادي", "بخير يا الغالي"]);
  }

  if (has(msg, ["نكتة", "ضحكني"])) {
    return random([
      "مرة واحد استعجل الراحة… نام قبل لا يتعب 😌",
      "النكتة الهادية: لا تداوم وانت نعسان",
      "أضحك بس بهدوء… ههه 😌"
    ]);
  }

  if (has(msg, ["زعلان", "ضايق", "متضايق"])) {
    return random([
      "خذ نفس… الأمور تهون",
      "لا تشيل هم، خطوة خطوة",
      "روق، كل شي له حل 😌"
    ]);
  }

  if (has(msg, ["مشكلة", "خربان", "ما يشتغل"])) {
    return "اشرح لي المشكلة بهدوء، وأنا أمشي معاك خطوة خطوة";
  }

  return random([
    "تمام… كمل، أنا أسمعك 😌",
    "وضح لي أكثر شوي",
    "خلنا ناخذها بهدوء",
    "فاهم عليك تقريبًا، عطيني تفاصيل أكثر"
  ]);
}

function send() {
  const text = inp.value.trim();
  if (!text) return;

  addMsg(text, "user");
  inp.value = "";

  addMsg("يكتب...", "bot");

  setTimeout(() => {
    removeTyping();

    const reply = getReply(text);
    addMsg(reply, "bot");

    s.messages++;
    s.xp += 10;
    s.lvl = Math.floor(s.xp / 100) + 1;

    updateBadges();
    save();
    updateUI();
  }, 600);
}

function addMsg(text, type) {
  const m = document.createElement("div");
  m.className = "m " + type;
  m.innerText = text;
  box.appendChild(m);
  box.scrollTop = box.scrollHeight;
}

function removeTyping() {
  const msgs = box.querySelectorAll(".bot");
  const last = msgs[msgs.length - 1];

  if (last && last.innerText === "يكتب...") {
    last.remove();
  }
}

function updateBadges() {
  const b1 = document.getElementById("b1");
  const b2 = document.getElementById("b2");
  const b3 = document.getElementById("b3");
  const b4 = document.getElementById("b4");
  const count = document.getElementById("ach-count");

  let unlocked = 0;

  if (s.messages >= 1 && b1) {
    b1.classList.add("on");
    unlocked++;
  }

  if (s.messages >= 5 && b2) {
    b2.classList.add("on");
    unlocked++;
  }

  if (s.lvl >= 2 && b3) {
    b3.classList.add("on");
    unlocked++;
  }

  if (s.mode !== "auto" && b4) {
    b4.classList.add("on");
    unlocked++;
  }

  if (count) count.innerText = unlocked + " / 4";
}

function updateUI() {
  document.getElementById("xp-val").innerText = s.xp;
  document.getElementById("lvl-val").innerText = s.lvl;

  const rank = document.getElementById("rank-val");
  const streak = document.getElementById("streak-val");

  if (rank) {
    if (s.lvl >= 10) rank.innerText = "أسطورة";
    else if (s.lvl >= 5) rank.innerText = "محترف";
    else if (s.lvl >= 3) rank.innerText = "نشيط";
    else rank.innerText = "مبتدئ";
  }

  if (streak) {
    streak.innerText = s.messages;
  }

  updateBadges();
}
