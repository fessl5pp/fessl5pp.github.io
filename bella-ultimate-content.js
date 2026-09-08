(() => {
  "use strict";

  const STATE_KEY = "bella_ultimate_content_v1";
  const SOURCE_NAME = "Bella_Kuwaiti_Ultimate_Dictionary.pdf";
  const SOURCE_COUNTS = Object.freeze({ rumors: 200, wisdoms: 100, proverbs: 100 });

  const RUMOR_SEEDS = [
    { mood: "طقطقة", text: "يقولون مسوين ضريبة على اللي يطالعون الناس بنص عين بالأفنيوز.. جان نص الشعب مفلس!" },
    { mood: "حش بنات", text: "سمعت إن فلانة قايلة حق ريلها إن جنطتها أصلية واهيا ماخذتها من سوق السالمية بـ 15 دينار.. صيدة!" },
    { mood: "نغزة", text: "يقولون بيحطون رادار حق اللي يمشي بالجمعية ويدعم قاري الناس بدون ما يقول سوري.. يستاهلون!" },
    { mood: "شوارع", text: "سامعة إنهم بيمنعون الوانيتات يدخلون الدائري الثاني عشان المنظر العام.. يا ويلي من عيال بطنها!" },
    { mood: "فصلة", text: "يقولون فلان مسوي تان بالصبية وحاط دهن عود بدال زيت التان.. طالع ريحته بخور محترق!" },
    { mood: "دلع وهبة", text: "سمعت إن كافيه يديد بالشويخ منزل قهوة بطعم الفقع مع رشة هيل.. امبيه لوعوا جبدي بالفناكة!" },
    { mood: "جامعة", text: "يقولون اللي تلبس كعب بالجامعة وتداحج بالممرات بيعطونها إنذار إزعاج عام.. والله أريح!" },
    { mood: "كسل", text: "سمعت إن مطعم شاورما مشهور حاط خلطة سرية تخلي الواحد ينام 12 ساعة متواصلة.. يبيلي منها!" },
    { mood: "طقس وفصلة", text: "يقولون باجر درجة الحرارة بتصير تحت الصفر بالوفرة وينزل ثلج.. جهزوا الكوتات والفروات!" },
    { mood: "سيارات", text: "سامعة إن بيسوون لاين خاص حق اللي سياراتهم نظيفة بالشارع واللي مغبرة يصفط يغسلها.. زين يسوون!" },
    { mood: "دواوين", text: "يقولون الديوانية اللي ما فيها بلايستيشن 5 بينسحب ترخيصها.. شبابنا يضيعون جذي!" },
    { mood: "تسوق", text: "سمعت إنهم بيفتحون فرع زارا داخل كل بيت عشان يفتكون من زحمة التبديل بالويكند.. فكرة تجنن!" },
    { mood: "هباط", text: "يقولون فلان متعني رايح لندن أسبوع كامل بس عشان يصور كوب قهوة ويحط لوكيشن مايفير ويرد!" },
    { mood: "رجيم", text: "سمعت إن رفيجك مسوي رجيم قاطع الكارب بس يتعشى مجبوس لحم ويقول هذا بروتين صافي.. عيّار!" },
    { mood: "طقطقة", text: "يقولون بيسوون فحص نظر حق اللي يلبسون نظارات شمسية داخل المجمع بالليل.. شنو شايفين يعني؟!" },
    { mood: "حش", text: "سامعة إن الصالون الفلاني يطقون إبرة تخلي لسان الوحدة ينقط سكر بدال الحش.. يريت الكل يطقها!" },
    { mood: "دراما", text: "يقولون الدريول الفلاني كاشف كل أسرار العايلة وكاتب مذكرات بينزلها بكتاب معرض الكتاب الياي!" },
    { mood: "زواج", text: "سمعت إنهم يخلون المهر ربع دينار وبيت بقرطبة.. هين عاد، بالمشمش يبا!" },
    { mood: "بحر", text: "يقولون اللي ما يروح الخيران بالصيف تنلغي كويتيته شهرين.. امبيه مو هبة مالتهم!" },
    { mood: "مظاهر", text: "سامعة إن فلانة كل ما تسافر تصور جناح الطيارة 500 مرة عشان تثبت إنها بزنس كلاس.. مسكينة!" }
  ];

  const WISDOM_SEEDS = [
    { text: "إن طاعك الزمان وإلا طيعه", meaning: "الحكمة في مجاراة الظروف والتأقلم مع تقلبات الأيام بحكمة ومرونة." },
    { text: "مد ريولك على قد لحافك", meaning: "دعوة للقناعة والعيش ضمن الإمكانيات المادية المتاحة دون ديون أو تكلف." },
    { text: "اللي ما يعرف الصقر يشويه", meaning: "الجاهل بقيمة الشيء أو قدر الرجال يسيء التصرف ويضيع الفرص." },
    { text: "عتيج الصوف ولا يديد البريسم", meaning: "الأصيل والمجرب المضمون أولى بالتمسك به من الجديد المجهول." },
    { text: "من طق طبله قال أنا قبله", meaning: "ذم الفضول والتسرع في حشر النفس في شؤون ومناسبات الآخرين." },
    { text: "إمش سيده يحتار عدوك فيك", meaning: "الاستقامة والنزاهة تسد كل الثغرات أمام المتربصين والخصوم." },
    { text: "الصيت ولا الغنى", meaning: "السمعة الطيبة والذكر الحسن بين الناس أبقى وأنفع من تكديس الأموال." },
    { text: "اللي بالجدر يطلعه الملاس", meaning: "الأيام والأفعال كفيلة بإظهار الحقائق وكشف ما تكنه الصدور." },
    { text: "ما حك جلدك مثل ظفرك", meaning: "الاعتماد على النفس في قضاء الحوائج، فلا ينجز أمرك أحد مثلك." },
    { text: "من خاف سلم", meaning: "أخذ الحيطة والحذر والابتعاد عن مواطن الشبهات والتهلكة قمة العقل." },
    { text: "بو طبيع ما يجوز من طبعه", meaning: "صعوبة تغيير العادات والطباع المتأصلة في نفوس البشر." },
    { text: "ما كل بيضة شحمة", meaning: "التحذير من الانخداع بالمظاهر الخارجية البراقة؛ فالمخابر أهم." },
    { text: "فرخ البط عوام", meaning: "الأبناء يتوارثون طباع وشيم آبائهم وأجدادهم حتمًا." },
    { text: "كل يرى الناس بعين طبعه", meaning: "الإنسان يفسر تصرفات ونوايا الآخرين وفقًا لسريرته وأخلاقه." },
    { text: "إذا فات الفوت ما ينفع الصوت", meaning: "الندم والتحسر بعد فوات الأوان وضياع الفرصة لا يجدي نفعًا." },
    { text: "تجوع الحرة ولا تأكل بثدييها", meaning: "عزة النفس والشرف أعلى من كل مغريات الدنيا مهما قست الظروف." },
    { text: "النار ما تورث إلا الرماد", meaning: "قد يخرج من صلب الرجل الكريم والعظيم ولد خائب قليل المروءة." },
    { text: "عصفور باليد خير من عشرة على الشجرة", meaning: "الرضا بالمكسب المادي الحاضر والمضمون خير من المجهول." },
    { text: "الجار قبل الدار", meaning: "حسن اختيار الجار وصاحب الجوار أهم من جمال الدار وسعتها." },
    { text: "ركوب الخيل يبيله خيال", meaning: "المسؤوليات الجسيمة والمهام الكبرى تحتاج لأهل الكفاءة والخبرة." }
  ];

  const PROVERB_SEEDS = [
    { start: "إن طاعك الزمان...", answer: "وإلا طيعه" },
    { start: "مد ريولك...", answer: "على قد لحافك" },
    { start: "اللي ما يعرف الصقر...", answer: "يشويه" },
    { start: "من طق طبله...", answer: "قال أنا قبله" },
    { start: "عتيج الصوف...", answer: "ولا يديد البريسم" },
    { start: "إمش سيده...", answer: "يحتار عدوك فيك" },
    { start: "اللي بالجدر...", answer: "يطلعه الملاس" },
    { start: "الصيت...", answer: "ولا الغنى" },
    { start: "ما حك جلدك...", answer: "مثل ظفرك" },
    { start: "من خاف...", answer: "سلم" },
    { start: "بو طبيع...", answer: "ما يجوز من طبعه" },
    { start: "إذا فات الفوت...", answer: "ما ينفع الصوت" },
    { start: "كل ساقط...", answer: "وله لاقط" },
    { start: "لو كان فيه خير...", answer: "ما عافه الطير" },
    { start: "ما طاح إلا...", answer: "انبطح" },
    { start: "الفرس من خيالها...", answer: "والحرمة من رياييلها" },
    { start: "يا من شرا له من حلاله...", answer: "علة" },
    { start: "أذن من طين...", answer: "وأذن من عجين" },
    { start: "سمع من هني...", answer: "وطلع من هني" },
    { start: "النار ما تورث...", answer: "إلا الرماد" },
    { start: "الطول طول نخلة...", answer: "والعقل عقل صخلة" },
    { start: "يا شين نخلة...", answer: "ما تثمر" },
    { start: "كومة حجار...", answer: "ولا هالجار" },
    { start: "الجار قبل...", answer: "الدار" },
    { start: "ما كل بيضة...", answer: "شحمة" }
  ];

  function expandSeeds(items, count) {
    return Array.from({ length: count }, (_, index) => ({
      ...items[index % items.length],
      sourceNumber: index + 1,
      seedNumber: (index % items.length) + 1
    }));
  }

  const data = Object.freeze({
    source: SOURCE_NAME,
    sourceCounts: SOURCE_COUNTS,
    rumors: Object.freeze(expandSeeds(RUMOR_SEEDS, SOURCE_COUNTS.rumors)),
    wisdoms: Object.freeze(expandSeeds(WISDOM_SEEDS, SOURCE_COUNTS.wisdoms)),
    proverbs: Object.freeze(expandSeeds(PROVERB_SEEDS, SOURCE_COUNTS.proverbs)),
    uniqueRumors: Object.freeze(RUMOR_SEEDS.map((item, index) => ({ ...item, seedNumber: index + 1 }))),
    uniqueWisdoms: Object.freeze(WISDOM_SEEDS.map((item, index) => ({ ...item, seedNumber: index + 1 }))),
    uniqueProverbs: Object.freeze(PROVERB_SEEDS.map((item, index) => ({ ...item, seedNumber: index + 1 })))
  });

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return {
        wisdomDay: String(saved.wisdomDay || ""),
        wisdomAwarded: Boolean(saved.wisdomAwarded),
        recentProverbs: Array.isArray(saved.recentProverbs) ? saved.recentProverbs.slice(-8) : [],
        proverbWins: Math.max(0, Number(saved.proverbWins) || 0)
      };
    } catch {
      return { wisdomDay: "", wisdomAwarded: false, recentProverbs: [], proverbWins: 0 };
    }
  }

  let state = loadState();

  function persist() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[ـ]/g, "")
      .replace(/[؟?!.,،؛:…]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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

  function modal(id, html, wide = false) {
    document.getElementById(id)?.remove();
    const host = document.createElement("div");
    host.id = id;
    host.className = "vnext-modal";
    host.innerHTML = `<div class="vnext-card${wide ? " ultimate-wide" : ""}">${html}</div>`;
    host.addEventListener("click", event => { if (event.target === host) host.remove(); });
    document.body.appendChild(host);
    return host;
  }

  function toast(text) {
    try {
      if (typeof window.showToast === "function") return window.showToast(text);
      if (typeof window.showPopupCustom === "function") return window.showPopupCustom(text);
      return window.BellaMoments?.showToast?.(text);
    } catch {}
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

  function kuwaitDayKey() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function hashDay(value) {
    let hash = 2166136261;
    for (const ch of String(value)) {
      hash ^= ch.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  function ensureStyles() {
    if (document.getElementById("bellaUltimateContentStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaUltimateContentStyles";
    style.textContent = `
      .ultimate-wide{width:min(860px,calc(100vw - 24px));max-height:min(82vh,780px);overflow:auto}
      .ultimate-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
      .ultimate-head h2{margin:0}.ultimate-head p{margin:5px 0 0;color:var(--muted);line-height:1.65}
      .ultimate-close{border:0;background:transparent;color:inherit;font-size:20px;cursor:pointer}
      .ultimate-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}
      .ultimate-toolbar input{flex:1;min-width:180px}
      .ultimate-source-note{display:block;color:var(--muted);font-size:12px;line-height:1.65;margin:8px 0 12px}
      .ultimate-rumor-list{display:grid;gap:9px;max-height:54vh;overflow:auto;padding-inline-end:3px}
      .ultimate-rumor{border:1px solid rgba(255,255,255,.11);border-radius:16px;padding:11px 12px;background:rgba(255,255,255,.045);line-height:1.7}
      .ultimate-rumor b{display:flex;gap:8px;align-items:center;margin-bottom:4px;font-size:12px;color:var(--muted)}
      .ultimate-chip{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:3px 8px;font-size:11px}
      .ultimate-question{font-size:18px;font-weight:900;line-height:1.9;margin:14px 0}
      .ultimate-options{display:grid;gap:9px;margin:12px 0}.ultimate-options button{text-align:right;line-height:1.65}
      .ultimate-options button.correct{outline:2px solid rgba(68,210,125,.65)}.ultimate-options button.wrong{opacity:.58}
      .ultimate-feedback{min-height:28px;color:var(--muted);line-height:1.65;margin-top:8px}
      .ultimate-proverb-input{width:100%;box-sizing:border-box;margin:8px 0 10px}
      .ultimate-count{font-weight:900}
      @media(max-width:560px){.ultimate-wide{max-height:88vh}.ultimate-question{font-size:16px}.ultimate-rumor-list{max-height:57vh}}
    `;
    document.head.appendChild(style);
  }

  function openRumorList() {
    ensureStyles();
    const host = modal("bellaUltimateRumors", `
      <div class="ultimate-head"><div><h2>قائمة الإشاعات 👂</h2><p><span class="ultimate-count">200</span> إشاعة من ملف بيلا، مرتبة داخل قسم الألعاب.</p></div><button class="ultimate-close" aria-label="إغلاق">✕</button></div>
      <div class="ultimate-toolbar"><input id="bellaRumorSearch" class="vnext-input" placeholder="دور بكلمة أو مود"><button id="bellaRumorRandom" class="vnext-primary">🎲 إشاعة عشوائية</button><button id="bellaRumorToggle" class="vnext-ghost">عرض 200 مدخل</button></div>
      <small class="ultimate-source-note">المصدر يحتوي 200 مدخل، ويتكرر نفس بنك الـ20 إشاعة عبر الأرقام. العرض الافتراضي يشيل التكرار عشان القائمة تكون أرتب، وتقدر تعرض الـ200 مثل الملف.</small>
      <div class="ultimate-rumor-list" id="bellaRumorList"></div>
    `, true);
    host.querySelector(".ultimate-close").onclick = () => host.remove();
    const list = host.querySelector("#bellaRumorList");
    const search = host.querySelector("#bellaRumorSearch");
    const toggle = host.querySelector("#bellaRumorToggle");
    let expanded = false;

    const render = () => {
      const q = norm(search.value);
      const rows = expanded ? data.rumors : data.uniqueRumors;
      const filtered = rows.filter(item => !q || norm(`${item.text} ${item.mood}`).includes(q));
      list.innerHTML = filtered.length ? filtered.map(item => `
        <article class="ultimate-rumor"><b><span class="ultimate-chip">${escapeHtml(item.mood)}</span><span>#${item.sourceNumber || item.seedNumber}</span></b><div>${escapeHtml(item.text)}</div></article>
      `).join("") : `<div class="ultimate-feedback">ما لقيت إشاعة بهالكلمة.</div>`;
      toggle.textContent = expanded ? "عرض بدون تكرار" : "عرض 200 مدخل";
    };
    search.addEventListener("input", render);
    toggle.onclick = () => { expanded = !expanded; render(); };
    host.querySelector("#bellaRumorRandom").onclick = () => {
      const item = data.uniqueRumors[Math.floor(Math.random() * data.uniqueRumors.length)];
      toast(`👂 ${item.text}`);
    };
    render();
  }

  function wisdomChoices(item) {
    const distractors = shuffle(data.uniqueWisdoms.filter(x => x.text !== item.text)).slice(0, 2).map(x => x.meaning);
    return shuffle([item.meaning, ...distractors]);
  }

  function openWisdomGame(forceRandom = false) {
    ensureStyles();
    const day = kuwaitDayKey();
    if (state.wisdomDay !== day) {
      state.wisdomDay = day;
      state.wisdomAwarded = false;
      persist();
    }
    const pool = data.uniqueWisdoms;
    const item = forceRandom ? pool[Math.floor(Math.random() * pool.length)] : pool[hashDay(day) % pool.length];
    const choices = wisdomChoices(item);
    const host = modal("bellaWisdomGame", `
      <div class="ultimate-head"><div><h2>لعبة حكمة اليوم 🧿</h2><p>اقرأ الحكمة واختار معناها الصح.</p></div><button class="ultimate-close" aria-label="إغلاق">✕</button></div>
      <div class="ultimate-question">«${escapeHtml(item.text)}»</div>
      <div class="ultimate-options">${choices.map((choice, index) => `<button class="vnext-ghost" data-choice="${index}">${escapeHtml(choice)}</button>`).join("")}</div>
      <div class="ultimate-feedback" id="bellaWisdomFeedback">${state.wisdomAwarded && !forceRandom ? "مكافأة حكمة اليوم أخذتها اليوم؛ تقدر تلعب عادي." : "الصح يعطيك +15 XP مرة وحدة باليوم."}</div>
      <div class="vnext-actions"><button id="bellaWisdomAnother" class="vnext-ghost">حكمة ثانية</button></div>
    `);
    host.querySelector(".ultimate-close").onclick = () => host.remove();
    const feedback = host.querySelector("#bellaWisdomFeedback");
    let answered = false;
    host.querySelectorAll("[data-choice]").forEach(button => button.onclick = () => {
      if (answered) return;
      const choice = choices[Number(button.dataset.choice)];
      const correct = choice === item.meaning;
      if (correct) {
        answered = true;
        button.classList.add("correct");
        const canAward = !forceRandom && !state.wisdomAwarded;
        if (canAward) {
          state.wisdomAwarded = true;
          persist();
          awardXP(15);
        }
        feedback.textContent = canAward ? "صح عليك 🔥 +15 XP" : "صح عليك ✅";
      } else {
        button.classList.add("wrong");
        feedback.textContent = "مو هذي 👀 جرب خيار ثاني.";
      }
    });
    host.querySelector("#bellaWisdomAnother").onclick = () => openWisdomGame(true);
  }

  function pickProverb() {
    let candidates = data.uniqueProverbs.filter(item => !state.recentProverbs.includes(item.seedNumber));
    if (!candidates.length) { state.recentProverbs = []; candidates = [...data.uniqueProverbs]; }
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    state.recentProverbs.push(item.seedNumber);
    state.recentProverbs = state.recentProverbs.slice(-8);
    persist();
    return item;
  }

  function openProverbGame() {
    ensureStyles();
    const item = pickProverb();
    const host = modal("bellaProverbGame", `
      <div class="ultimate-head"><div><h2>أكمل المثل 🧠</h2><p>كمّل المثل الكويتي مثل ما هو بالملف.</p></div><button class="ultimate-close" aria-label="إغلاق">✕</button></div>
      <div class="ultimate-question">${escapeHtml(item.start)}</div>
      <input id="bellaProverbAnswer" class="vnext-input ultimate-proverb-input" maxlength="90" autocomplete="off" placeholder="اكتب التكملة">
      <div class="ultimate-feedback" id="bellaProverbFeedback">الجواب الصح يعطيك +20 XP.</div>
      <div class="vnext-actions"><button id="bellaProverbCheck" class="vnext-primary">شيّك جوابي</button><button id="bellaProverbHint" class="vnext-ghost">تلميح</button><button id="bellaProverbNext" class="vnext-ghost">مثل ثاني</button></div>
    `);
    host.querySelector(".ultimate-close").onclick = () => host.remove();
    const input = host.querySelector("#bellaProverbAnswer");
    const feedback = host.querySelector("#bellaProverbFeedback");
    const check = host.querySelector("#bellaProverbCheck");
    let won = false;

    const checkAnswer = () => {
      if (won) return;
      const guess = norm(input.value);
      const right = norm(item.answer);
      if (!guess) return;
      if (guess === right || (right.length >= 4 && guess.includes(right))) {
        won = true;
        state.proverbWins += 1;
        persist();
        awardXP(20);
        feedback.textContent = `صح عليك ✅ ${item.start.replace(/\.\.\.$/, "")} ${item.answer} — +20 XP`;
        check.disabled = true;
      } else {
        feedback.textContent = "مو هي 👀 جرّب مرة ثانية أو خذ تلميح.";
      }
    };
    check.onclick = checkAnswer;
    input.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); checkAnswer(); } });
    host.querySelector("#bellaProverbHint").onclick = () => {
      const words = item.answer.trim().split(/\s+/);
      feedback.textContent = `💡 التكملة ${words.length} ${words.length === 1 ? "كلمة" : "كلمات"}، وتبدأ بـ «${words[0].slice(0, 1)}»`;
    };
    host.querySelector("#bellaProverbNext").onclick = openProverbGame;
    setTimeout(() => input.focus(), 50);
  }

  function decorateActivities() {
    const hub = document.getElementById("bellaActivities");
    if (!hub) return false;
    const sections = [...hub.querySelectorAll(".bella-activities-section")];
    const games = sections.find(section => /الألعاب/.test(section.textContent || ""));
    const gameGrid = games?.querySelector(".bella-activities-grid");
    if (gameGrid && !gameGrid.querySelector("[data-bella-rumor-list]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.bellaRumorList = "1";
      button.innerHTML = "<span>👂</span><b>قائمة الإشاعات</b><small>200 إشاعة من ملف بيلا</small>";
      button.onclick = () => { window.closeBellaActivities?.(); openRumorList(); };
      gameGrid.appendChild(button);
    }

    const wisdomButton = hub.querySelector('[data-action="dailyWisdom"]');
    if (wisdomButton) {
      const label = wisdomButton.querySelector("b");
      if (label) label.textContent = "لعبة حكمة اليوم";
      if (!wisdomButton.querySelector("small")) wisdomButton.insertAdjacentHTML("beforeend", "<small>اختبر معنى الحكمة</small>");
    }

    const proverbButton = hub.querySelector('[data-action="startProverbGame"]');
    if (proverbButton) {
      const label = proverbButton.querySelector("b");
      if (label) label.textContent = "أكمل المثل";
      const small = proverbButton.querySelector("small");
      if (small) small.textContent = "أمثال الملف الكويتي";
    }
    return true;
  }

  function install() {
    ensureStyles();
    window.dailyWisdom = () => openWisdomGame(false);
    window.startProverbGame = openProverbGame;
    window.openBellaRumorList = openRumorList;
    decorateActivities();
    const observer = new MutationObserver(() => decorateActivities());
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  window.BellaUltimateContent = Object.freeze({
    data,
    openRumors: openRumorList,
    openWisdomGame,
    openProverbGame,
    decorateActivities,
    status: () => ({
      source: SOURCE_NAME,
      sourceCounts: { ...SOURCE_COUNTS },
      uniqueCounts: { rumors: RUMOR_SEEDS.length, wisdoms: WISDOM_SEEDS.length, proverbs: PROVERB_SEEDS.length },
      wisdomAwardedToday: state.wisdomDay === kuwaitDayKey() && state.wisdomAwarded,
      proverbWins: state.proverbWins
    })
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
