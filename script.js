const STORAGE_KEY = "bella_v10";

let s = {
  theme: "theme-blue",
  xp: 0,
  lvl: 1,
  messages: 0
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

async function send() {
  const text = inp.value.trim();
  if (!text) return;

  addMsg(text, "user");
  inp.value = "";

  addMsg("يكتب...", "bot");

  setTimeout(() => {
    removeTyping();

    let reply = "ما فهمت عليك 😅 جرّب تكتب: هلا، شلونك، اسمك";

    if (text.includes("هلا") || text.includes("السلام") || text.includes("مرحبا")) {
      reply = "هلا والله، نورت 😎";
    } else if (text.includes("شلونك") || text.includes("كيفك") || text.includes("اخبارك")) {
      reply = "تمام يا بعدي، أنت شلونك؟";
    } else if (text.includes("اسمك") || text.includes("منو انت") || text.includes("منو انتي")) {
      reply = "أنا Bella، بوتك الكويتي الذكي 😏";
    } else if (text.includes("احبك") || text.includes("أحبك")) {
      reply = "وأنا أكثر والله 😌";
    } else if (text.includes("باي") || text.includes("مع السلامة")) {
      reply = "مع السلامة، ناطرتك ترجع 👋";
    } else if (text.includes("شكرا") || text.includes("مشكور")) {
      reply = "العفو يا الغالي 🌹";
    } else if (text.includes("نكتة") || text.includes("ضحكني")) {
      reply = "مرة واحد دخل مطعم قال عندكم شي خفيف؟ قالوا له الفاتورة 😭";
    }

    addMsg(reply, "bot");

    s.messages++;
    s.xp += 10;
    s.lvl = Math.floor(s.xp / 100) + 1;

    save();
    updateUI();
  }, 700);
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

function updateUI() {
  document.getElementById("xp-val").innerText = s.xp;
  document.getElementById("lvl-val").innerText = s.lvl;
}
