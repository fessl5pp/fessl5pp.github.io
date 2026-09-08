(() => {
  "use strict";

  const BASE = window.BELLA_KUWAITI_GAMES_DATA;
  if (!BASE?.wisdoms?.length) return;

  const STATE_KEY = "bella_ultimate_wisdom_game_v2";
  const LETTERS = ["أ", "ب", "ج", "د"];
  const state = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return { day: String(saved.day || ""), awarded: Boolean(saved.awarded) };
    } catch { return { day: "", awarded: false }; }
  })();

  const BOX_ITEMS = [
    { answer: "مبخر", clue: "غرض كويتي تحطه بالبيت ويطلع ريحة طيبة، وغالبًا تلقاه يم الدلال." },
    { answer: "دلة", clue: "شي مهم حق القهوة العربية، يمسكه راعي الديوانية وقت الصب." },
    { answer: "كرفاية", clue: "كلمة قديمة تعني السرير، تسمعها من الأولين." },
    { answer: "منقلة", clue: "غرض قديم فيه فحم، يستخدمونه للتدفئة أو للبخور." },
    { answer: "سدو", clue: "نقشة تراثية بدوية تلقاها بالمخدات والفرش." },
    { answer: "ملاس", clue: "أداة مطبخ كبيرة للغرف، وداخلة بمثل كويتي مشهور." },
    { answer: "استكانة", clue: "كوب صغير ينصبون فيه الجاي." },
    { answer: "صينية", clue: "تنحط عليها الاستكانات والدلال وقت التقديم." }
  ];

  const KUWAITI_CHALLENGES = [
    { question: "شنو معنى «دريشة»؟", answer: "نافذة", wrong: ["باب", "ممر", "سطح"] },
    { question: "شنو معنى «جوتي»؟", answer: "حذاء", wrong: ["قميص", "ساعة", "قبعة"] },
    { question: "شنو معنى «قوطي»؟", answer: "علبة", wrong: ["ملعقة", "كيس", "صحن"] },
    { question: "شنو «الصمون»؟", answer: "خبز", wrong: ["حلوى", "قهوة", "أرز"] },
    { question: "شنو «الديوانية»؟", answer: "مجلس للضيوف والسوالف", wrong: ["مطبخ", "مخزن", "غرفة نوم"] },
    { question: "شنو «الملاس»؟", answer: "مغرفة كبيرة", wrong: ["سكين", "فنجال", "منشفة"] },
    { question: "شنو «الاستكانة»؟", answer: "كوب جاي صغير", wrong: ["دلة قهوة", "صحن رز", "علبة تمر"] },
    { question: "شنو «الدلة»؟", answer: "إبريق القهوة العربية", wrong: ["مبخر", "منقلة", "صينية"] },
    { question: "شنو «المبخر»؟", answer: "وعاء للبخور", wrong: ["قدر طبخ", "فنجال", "سلة"] },
    { question: "شنو «السدو»؟", answer: "نسيج ونقشة تراثية", wrong: ["أكلة شعبية", "لعبة بحرية", "نوع قهوة"] }
  ];

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

  function pick(items, exclude = null) {
    const pool = exclude == null ? items : items.filter(item => item !== exclude);
    const source = pool.length ? pool : items;
    return source[Math.floor(Math.random() * source.length)];
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

  function clearLegacyGameState() {
    try { activeGame = null; } catch {}
    try { currentChallenge = null; } catch {}
  }

  function ensureStyles() {
    if (document.getElementById("bellaChoiceGameStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaChoiceGameStyles";
    style.textContent = `
      .bella-choice-game-card{max-width:min(700px,94vw)!important}
      .bella-choice-game-q{font-size:clamp(19px,4vw,28px);font-weight:900;line-height:1.8;margin:14px 0;padding:17px;border-radius:19px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
      .bella-choice-game-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
      .bella-choice-option{min-height:62px;display:flex;align-items:center;gap:10px;text-align:right;line-height:1.55}
      .bella-choice-letter{display:inline-grid;place-items:center;min-width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.08);font-weight:900}
      .bella-choice-option.correct{outline:2px solid rgba(67,211,126,.75);background:rgba(67,211,126,.09)}
      .bella-choice-option.wrong{outline:2px solid rgba(235,93,93,.58);opacity:.7}
      .bella-choice-result{min-height:34px;font-size:16px;font-weight:800;line-height:1.7;margin:9px 0}
      .bella-choice-result.ok{color:#76d99a}.bella-choice-result.no{color:#ef8e8e}
      .bella-choice-note{display:block;color:var(--muted);line-height:1.6;margin:6px 0 10px}
      @media(max-width:560px){.bella-choice-game-options{grid-template-columns:1fr}.bella-choice-option{min-height:56px}}
    `;
    document.head.appendChild(style);
  }

  function modal(id, html) {
    document.querySelectorAll(".bella-choice-game-modal").forEach(node => node.remove());
    const host = document.createElement("div");
    host.id = id;
    host.className = "vnext-modal bella-choice-game-modal";
    host.innerHTML = `<div class="vnext-card bella-choice-game-card">${html}</div>`;
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

  function openChoiceGame({ id, title, subtitle, meta = "", question, options, answer, reward = 0, rewardAllowed = true, nextLabel = "سؤال ثاني", onNext }) {
    ensureStyles();
    clearLegacyGameState();
    const exactOptions = shuffle([...new Set(options)]).slice(0, 4);
    if (!exactOptions.includes(answer)) exactOptions[exactOptions.length - 1] = answer;
    while (exactOptions.length < 4) exactOptions.push(`خيار ${exactOptions.length + 1}`);
    const finalOptions = shuffle(exactOptions).slice(0, 4);

    const host = modal(id, `
      <div class="bella-activities-head">
        <div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div>
        <button class="bella-activities-close" data-close-game aria-label="إغلاق">✕</button>
      </div>
      ${meta ? `<small class="bella-choice-note">${escapeHtml(meta)}</small>` : ""}
      <div class="bella-choice-game-q">${escapeHtml(question)}</div>
      <div class="bella-choice-game-options">
        ${finalOptions.map((option, index) => `<button type="button" class="vnext-ghost bella-choice-option" data-game-choice="${index}"><span class="bella-choice-letter">${LETTERS[index]}</span><span>${escapeHtml(option)}</span></button>`).join("")}
      </div>
      <div class="bella-choice-result" data-game-result aria-live="polite">اختر واحد من الأربع خيارات 👆</div>
      <div class="vnext-actions"><button type="button" class="vnext-primary" data-next-game hidden>${escapeHtml(nextLabel)}</button></div>
    `);

    host.querySelector("[data-close-game]").onclick = () => host.remove();
    const result = host.querySelector("[data-game-result]");
    const next = host.querySelector("[data-next-game]");
    let solved = false;

    host.querySelectorAll("[data-game-choice]").forEach(button => {
      button.onclick = () => {
        if (solved || button.disabled) return;
        const selected = finalOptions[Number(button.dataset.gameChoice)];
        if (selected === answer) {
          solved = true;
          button.classList.add("correct");
          host.querySelectorAll("[data-game-choice]").forEach(item => { item.disabled = true; });
          if (rewardAllowed && reward > 0) awardXP(reward);
          result.className = "bella-choice-result ok";
          result.textContent = rewardAllowed && reward > 0 ? `صح ✅ كفو! +${reward} XP` : "صح ✅ كفو!";
          next.hidden = typeof onNext !== "function";
        } else {
          button.classList.add("wrong");
          button.disabled = true;
          result.className = "bella-choice-result no";
          result.textContent = "غلط ❌ جرّب خيار ثاني.";
        }
      };
    });

    if (typeof onNext === "function") next.onclick = () => onNext();
    return host;
  }

  function wisdomChoices(item) {
    const wrong = shuffle(BASE.wisdoms.filter(row => row.id !== item.id)).slice(0, 3).map(row => row.meaning);
    return [item.meaning, ...wrong];
  }

  function openWisdomGame(practice = false) {
    const today = dayKey();
    if (state.day !== today) {
      state.day = today;
      state.awarded = false;
      saveState();
    }
    const pool = BASE.wisdoms;
    const item = practice ? pick(pool) : pool[hash(today) % pool.length];
    const rewardAllowed = practice ? true : !state.awarded;
    return openChoiceGame({
      id: "bellaWisdomChoiceGame",
      title: "لعبة حكمة اليوم 🧿",
      subtitle: "اقرأ الحكمة واضغط المعنى الصحيح من 4 خيارات.",
      meta: `حكمة رقم ${item.id} من ${BASE.reportedCounts?.wisdoms || 100}`,
      question: `«${item.text}»`,
      options: wisdomChoices(item),
      answer: item.meaning,
      reward: practice ? 5 : 15,
      rewardAllowed,
      nextLabel: "حكمة ثانية",
      onNext: () => openWisdomGame(true)
    }).addEventListener("click", event => {
      const button = event.target.closest("[data-game-choice]");
      if (!button || practice || state.awarded) return;
      const chosen = button.querySelector("span:last-child")?.textContent || "";
      if (chosen === item.meaning) {
        state.awarded = true;
        saveState();
      }
    });
  }

  function openProverbGame() {
    const item = pick(BASE.proverbs);
    const wrong = shuffle(BASE.proverbs.filter(row => row.id !== item.id)).slice(0, 3).map(row => row.answer);
    return openChoiceGame({
      id: "bellaProverbChoiceGame",
      title: "أكمل المثل 🧠",
      subtitle: "اختار التكملة الصح من 4 خيارات — بدون ما تدخل الشات.",
      meta: `من بنك ${BASE.reportedCounts?.proverbs || 100} مثل كويتي`,
      question: item.start,
      options: [item.answer, ...wrong],
      answer: item.answer,
      reward: 30,
      nextLabel: "مثل ثاني",
      onNext: openProverbGame
    });
  }

  function openBoxGame() {
    const item = pick(BOX_ITEMS);
    const wrong = shuffle(BOX_ITEMS.filter(row => row !== item)).slice(0, 3).map(row => row.answer);
    return openChoiceGame({
      id: "bellaBoxChoiceGame",
      title: "شنو بالصندوق؟ 🎁",
      subtitle: "اقرأ التلميح واختار الجواب من 4 خيارات.",
      question: item.clue,
      options: [item.answer, ...wrong],
      answer: item.answer,
      reward: 30,
      nextLabel: "صندوق ثاني",
      onNext: openBoxGame
    });
  }

  function openKuwaitiChallenge() {
    const item = pick(KUWAITI_CHALLENGES);
    return openChoiceGame({
      id: "bellaKuwaitiChoiceGame",
      title: "تحدي كويتي 🇰🇼",
      subtitle: "سؤال سريع، 4 خيارات، واضغط جوابك مباشرة.",
      question: item.question,
      options: [item.answer, ...item.wrong],
      answer: item.answer,
      reward: 20,
      nextLabel: "سؤال ثاني",
      onNext: openKuwaitiChallenge
    });
  }

  function decorateActivities() {
    const host = document.getElementById("bellaActivities");
    if (!host) return false;

    const wisdomButton = host.querySelector('[data-action="dailyWisdom"]');
    if (wisdomButton) {
      const label = wisdomButton.querySelector("b");
      if (label) label.textContent = "حكمة اليوم";
      let small = wisdomButton.querySelector("small");
      if (!small) { small = document.createElement("small"); wisdomButton.appendChild(small); }
      small.textContent = "4 خيارات · صح أو غلط";
    }

    const proverbButton = host.querySelector('[data-action="startProverbGame"]');
    if (proverbButton) {
      const label = proverbButton.querySelector("b");
      if (label) label.textContent = "أكمل المثل";
      const small = proverbButton.querySelector("small");
      if (small) small.textContent = "4 خيارات · بدون شات";
    }

    const boxButton = host.querySelector('[data-action="startBoxGame"]');
    if (boxButton) {
      const small = boxButton.querySelector("small");
      if (small) small.textContent = "4 خيارات · بدون شات";
    }

    const kuwaitButton = host.querySelector('[data-action="startKuwaitiChallenge"]');
    if (kuwaitButton) {
      const small = kuwaitButton.querySelector("small");
      if (small) small.textContent = "4 خيارات · بدون شات";
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
  if (typeof baseOpenActivities === "function" && !baseOpenActivities.__bellaChoiceGamesWrapped) {
    const wrapped = function bellaChoiceGamesOpenActivities() {
      const result = baseOpenActivities.apply(this, arguments);
      queueMicrotask(decorateActivities);
      return result;
    };
    wrapped.__bellaChoiceGamesWrapped = true;
    window.openBellaActivities = wrapped;
  }

  window.dailyWisdom = () => openWisdomGame(false);
  window.startProverbGame = openProverbGame;
  window.startBoxGame = openBoxGame;
  window.startKuwaitiChallenge = openKuwaitiChallenge;

  ensureStyles();
  decorateActivities();

  window.BellaUltimateContent = Object.freeze({
    source: BASE.source,
    reportedCounts: { ...BASE.reportedCounts },
    openRumors: () => window.openBellaRumors?.(),
    openWisdomGame,
    openProverbGame,
    openBoxGame,
    openKuwaitiChallenge,
    decorateActivities,
    status: () => ({
      source: BASE.source,
      reportedCounts: { ...BASE.reportedCounts },
      choiceGames: true,
      optionsPerQuestion: 4,
      chatBasedGames: false,
      wisdomAwardedToday: state.day === dayKey() && state.awarded,
      rumorList: typeof window.openBellaRumors === "function"
    })
  });
})();
