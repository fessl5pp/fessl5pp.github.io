(() => {
  "use strict";

  const BASE = window.BELLA_KUWAITI_GAMES_DATA;
  if (!BASE?.wisdoms?.length) return;

  const STATE_KEY = "bella_ultimate_wisdom_game_v1";
  const state = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return { day: String(saved.day || ""), awarded: Boolean(saved.awarded) };
    } catch { return { day: "", awarded: false }; }
  })();

  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function dayKey() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuwait", year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date());
    } catch { return new Date().toISOString().slice(0, 10); }
  }

  function hash(value) {
    let h = 2166136261;
    for (const ch of String(value)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function ensureStyles() {
    if (document.getElementById("bellaUltimateWisdomStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaUltimateWisdomStyles";
    style.textContent = `
      .bella-wisdom-game-q{font-size:clamp(20px,4vw,30px);font-weight:900;line-height:1.8;margin:14px 0;padding:16px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
      .bella-wisdom-game-options{display:grid;gap:9px;margin:12px 0}.bella-wisdom-game-options button{text-align:right;line-height:1.7}
      .bella-wisdom-game-options button.correct{outline:2px solid rgba(67,211,126,.68)}.bella-wisdom-game-options button.wrong{opacity:.58}
      .bella-wisdom-game-feedback{min-height:30px;line-height:1.7;color:var(--muted);margin:8px 0}
    `;
    document.head.appendChild(style);
  }

  function modal(html) {
    document.getElementById("bellaUltimateWisdomGame")?.remove();
    const host = document.createElement("div");
    host.id = "bellaUltimateWisdomGame";
    host.className = "vnext-modal";
    host.innerHTML = `<div class="vnext-card bella-dictionary-card">${html}</div>`;
    host.addEventListener("click", event => { if (event.target === host) host.remove(); });
    document.body.appendChild(host);
    return host;
  }

  function awardXP(points) {
    try {
      if (typeof s !== "object") return false;
      const oldLevel = Number(s.lvl || 1);
      s.xp = Number(s.xp || 0) + points;
      s.lvl = Math.floor(s.xp / 100) + 1;
      if (typeof updateUI === "function") updateUI();
      if (typeof save === "function") save();
      if (s.lvl > oldLevel && typeof showLevelCard === "function") showLevelCard();
      return true;
    } catch { return false; }
  }

  function choicesFor(item) {
    const wrong = shuffle(BASE.wisdoms.filter(row => row.id !== item.id)).slice(0, 2).map(row => row.meaning);
    return shuffle([item.meaning, ...wrong]);
  }

  function openWisdomGame(practice = false) {
    ensureStyles();
    const today = dayKey();
    if (state.day !== today) {
      state.day = today;
      state.awarded = false;
      saveState();
    }

    const pool = BASE.wisdoms;
    const item = practice ? pool[Math.floor(Math.random() * pool.length)] : pool[hash(today) % pool.length];
    const options = choicesFor(item);
    const host = modal(`
      <div class="bella-activities-head">
        <div><h2>لعبة حكمة اليوم 🧿</h2><p>حكمة من ملف بيلا — اختار معناها الصح.</p></div>
        <button class="bella-activities-close" id="bellaUltimateWisdomClose" aria-label="إغلاق">✕</button>
      </div>
      <small class="bella-dictionary-count">حكمة رقم ${item.id} من 100${practice ? " · تدريب" : " · حكمة اليوم"}</small>
      <div class="bella-wisdom-game-q">«${escapeHtml(item.text)}»</div>
      <div class="bella-wisdom-game-options">${options.map((option, index) => `<button class="vnext-ghost" data-wisdom-choice="${index}">${escapeHtml(option)}</button>`).join("")}</div>
      <div class="bella-wisdom-game-feedback" id="bellaUltimateWisdomFeedback">${!practice && state.awarded ? "أخذت مكافأة حكمة اليوم؛ تقدر تلعب بدون XP إضافي." : practice ? "تدريب بدون مكافأة يومية." : "الإجابة الصح تعطيك +15 XP مرة واحدة باليوم."}</div>
      <div class="vnext-actions"><button class="vnext-ghost" id="bellaUltimateWisdomAnother">حكمة ثانية</button></div>
    `);

    host.querySelector("#bellaUltimateWisdomClose").onclick = () => host.remove();
    const feedback = host.querySelector("#bellaUltimateWisdomFeedback");
    let solved = false;

    host.querySelectorAll("[data-wisdom-choice]").forEach(button => button.onclick = () => {
      if (solved) return;
      const selected = options[Number(button.dataset.wisdomChoice)];
      if (selected === item.meaning) {
        solved = true;
        button.classList.add("correct");
        const shouldAward = !practice && !state.awarded;
        if (shouldAward) {
          state.awarded = true;
          saveState();
          awardXP(15);
        }
        feedback.textContent = shouldAward ? "صح عليك 🔥 +15 XP" : `صح عليك ✅ المعنى: ${item.meaning}`;
      } else {
        button.classList.add("wrong");
        feedback.textContent = "مو هذي 👀 جرّب مرة ثانية.";
      }
    });

    host.querySelector("#bellaUltimateWisdomAnother").onclick = () => openWisdomGame(true);
    return host;
  }

  function decorateActivities() {
    const host = document.getElementById("bellaActivities");
    if (!host) return false;

    const wisdomButton = host.querySelector('[data-action="dailyWisdom"]');
    if (wisdomButton) {
      const label = wisdomButton.querySelector("b");
      if (label) label.textContent = "لعبة حكمة اليوم";
      let small = wisdomButton.querySelector("small");
      if (!small) { small = document.createElement("small"); wisdomButton.appendChild(small); }
      small.textContent = "اختبر معنى 100 حكمة";
    }

    const proverbButton = host.querySelector('[data-action="startProverbGame"]');
    if (proverbButton) {
      const label = proverbButton.querySelector("b");
      if (label) label.textContent = "أكمل المثل";
      const small = proverbButton.querySelector("small");
      if (small) small.textContent = "100 مثل كويتي من الملف";
    }

    const rumorButton = host.querySelector("[data-bella-dictionary-rumors]");
    if (rumorButton) {
      const label = rumorButton.querySelector("b");
      if (label) label.textContent = "قائمة الإشاعات";
      const small = rumorButton.querySelector("small");
      if (small) small.textContent = "200 إشاعة كويتية من الملف";
    }
    return true;
  }

  const baseOpenActivities = window.openBellaActivities;
  if (typeof baseOpenActivities === "function" && !baseOpenActivities.__bellaUltimateWisdomWrapped) {
    const wrapped = function bellaUltimateOpenActivities() {
      const result = baseOpenActivities.apply(this, arguments);
      queueMicrotask(decorateActivities);
      return result;
    };
    wrapped.__bellaUltimateWisdomWrapped = true;
    window.openBellaActivities = wrapped;
  }

  window.dailyWisdom = () => openWisdomGame(false);
  ensureStyles();
  decorateActivities();

  window.BellaUltimateContent = Object.freeze({
    source: BASE.source,
    reportedCounts: { ...BASE.reportedCounts },
    openRumors: () => window.openBellaRumors?.(),
    openWisdomGame,
    openProverbGame: () => window.startProverbGame?.(),
    decorateActivities,
    status: () => ({
      source: BASE.source,
      reportedCounts: { ...BASE.reportedCounts },
      wisdomGame: true,
      wisdomAwardedToday: state.day === dayKey() && state.awarded,
      rumorList: typeof window.openBellaRumors === "function",
      proverbGame: typeof window.startProverbGame === "function"
    })
  });
})();
