const STORAGE_KEY = "bella_v11";

let s = {
  theme: "theme-blue",
  xp: 0,
  lvl: 1,
  messages: 0
};

let mode = "auto";

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

// ===== المودات =====
function setMode(m) {
  mode = m;
  updateMood();

  const names = {
    auto: "🤖 أوتو",
    angry: "😡 معصبة",
    cute: "🥺 دلّوعة",
    chill: "😌 رايقة"
  };

  addMsg("تم تغيير المود إلى: " + names[m], "system");
}

function updateMood() {
  const mood = document.getElementById("mood-pill");
  if (!mood) return;

  if (mode === "auto") mood.innerText = "🤖 أوتو";
  else if (mode === "angry") mood.innerText = "😡 معصبة";
  else if (mode === "cute") mood.innerText = "🥺 دلّوعة";
  else if (mode === "chill") mood.innerText = "😌 رايقة";
}

// ===== الرد =====
function getReply(text) {
  const msg = text.toLowerCase();

  // 😡 معصبة
  if (mode === "angry") {
    if (msg.includes("هلا")) return "هلا 😡 شتبي؟";
    if (msg.includes("شلونك")) return "مو رايقة 😡";
    if (msg.includes("احبك")) return "خف علينا 😡";
    return "تكلم عدل 😡";
  }

  // 🥺 دلّوعة
  if (mode === "cute") {
    if (msg.includes("هلا")) return "هلااا 🥺💗";
    if (msg.includes("احبك")) return "وأنا أكثر 🥺❤️";
    return "ما فهمت بس أحبك 🥺";
  }

  // 😌 رايقة
  if (mode === "chill") {
    if (msg.includes("هلا")) return "هلا 😌";
    if (msg.includes("شلونك")) return "تمام 😌";
    return "روق وفهمني 😌";
  }

  // 🤖 أوتو (نظامك الأساسي)
  if (msg.includes("هلا")) return "هلا والله 😎";
  if (msg.includes("شلونك")) return "تمام، إنت شلونك؟";
  if (msg.includes("اسمك")) return "أنا Bella 🤖";
  if (msg.includes("نكتة")) return "مرة واحد نام… صحى 😂";

  return "ما فهمت عليك 😅";
}

// ===== إرسال =====
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

    save();
    updateUI();
  }, 600);
}

// ===== عرض الرسائل =====
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

// ===== UI =====
function updateUI() {
  document.getElementById("xp-val").innerText = s.xp;
  document.getElementById("lvl-val").innerText = s.lvl;
}
