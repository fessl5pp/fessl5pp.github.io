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
    if (saved) s = {...s, ...saved};
  } catch(e){
    localStorage.removeItem(STORAGE_KEY);
  }

  applyTheme();
  updateUI();
};

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function applyTheme(){
  document.body.className = s.theme;
}

function setTheme(t){
  s.theme = t;
  applyTheme();
  save();
  hideTheme();
}

function openChat(){
  document.getElementById("win").classList.add("active");
}

function closeChat(){
  document.getElementById("win").classList.remove("active");
}

function showTheme(){
  document.getElementById("themeModal").classList.remove("hidden");
}

function hideTheme(){
  document.getElementById("themeModal").classList.add("hidden");
}

function send(){
  const text = inp.value.trim();
  if(!text) return;

  addMsg(text,"user");
  inp.value = "";

  setTimeout(()=>{
    addMsg(reply(text),"bot");
  },400);

  s.messages++;
  s.xp += 10;
  s.lvl = Math.floor(s.xp / 100) + 1;

  save();
  updateUI();
}

function addMsg(text,type){
  const m = document.createElement("div");
  m.className = "m " + type;
  m.innerText = text;
  box.appendChild(m);
  box.scrollTop = box.scrollHeight;
}

function reply(t){
  t = t.toLowerCase();

  if(t.includes("هلا") || t.includes("السلام"))
    return "هلا والله 🔥";

  if(t.includes("شلونك"))
    return "تمام وانت؟ 😎";

  if(t.includes("قهوة"))
    return "جرب كوفي بالشويخ ☕";

  if(t.includes("طفشان"))
    return "يلا نغير جو 😏";

  return "قول أكثر 👀";
}

function updateUI(){
  document.getElementById("xp-val").innerText = s.xp;
  document.getElementById("lvl-val").innerText = s.lvl;
}
