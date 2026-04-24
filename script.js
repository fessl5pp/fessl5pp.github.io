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

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    removeTyping();
    addMsg(data.reply || "ما وصلني رد 😅", "bot");

  } catch (e) {
    removeTyping();
    addMsg("فيه مشكلة بالسيرفر 😅", "bot");
  }

  s.messages++;
  s.xp += 10;
  s.lvl = Math.floor(s.xp / 100) + 1;

  save();
  updateUI();
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
