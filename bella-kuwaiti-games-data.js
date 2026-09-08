(() => {
  "use strict";

  // Bella Kuwaiti Ultimate Dictionary integration.
  // The supplied PDF reports 200 rumors + 100 wisdoms + 100 complete-the-proverb rows.
  // Its numbered tables repeat smaller source banks, so we preserve BOTH views:
  // the exact numbered counts for lists/games and the unique bank for variety/ambient moments.
  const DATA = {
    source: "Bella_Kuwaiti_Ultimate_Dictionary.pdf",
    reportedCounts: { rumors: 200, wisdoms: 100, proverbs: 100 },
    uniqueCounts: { rumors: 20, wisdoms: 20, proverbs: 25 },
    rumors: [
      { id: 1, style: "طقطقة", text: "يقولون مسوين ضريبة على اللي يطالعون الناس بنص عين بالافنيوز.. جان نص الشعب مفلس!" },
      { id: 2, style: "حش بنات", text: "سمعت إن فلانة قايلة حق ريلها إن جنطتها أصلية واهيا ماخذتها من سوق السالمية بـ 15 دينار.. صيدة!" },
      { id: 3, style: "نغزة", text: "يقولون بيحطون رادار حق اللي يمشي بالجمعية ويدعم قاري الناس بدون ما يقول سوري.. يستاهلون!" },
      { id: 4, style: "شوارع", text: "سامعة إنهم بيمنعون الوانيتات يدخلون الدائري الثاني عشان المنظر العام.. يا ويلي من عيال بطنها!" },
      { id: 5, style: "فصلة", text: "يقولون فلان مسوي تان بالصبية وحاط دهن عود بدال زيت التان.. طالع ريحته بخور محترق!" },
      { id: 6, style: "دلع وهبة", text: "سمعت إن كافيه يديد بالشويخ منزل قهوة بطعم الفقع مع رشة هيل.. امبيه لوعوا جبدنا بالفناتك!" },
      { id: 7, style: "جامعة", text: "يقولون اللي تلبس كعب بالجامعة وتدابج بالممرات بيعطونها إنذار إزعاج عام.. والله أريح!" },
      { id: 8, style: "كسل", text: "سمعت إن مطعم شاورما مشهور حاط خلطة سرية تخلي الواحد ينام ١٢ ساعة متواصلة.. يبيلي منها!" },
      { id: 9, style: "طقس وفصلة", text: "يقولون باجر درجة الحرارة بتصير تحت الصفر بالوفرة وبينزل ثلج.. جهزوا الكوتات والفروات!" },
      { id: 10, style: "سيارات", text: "سامعة إن بيسوون لاين خاص حق اللي سياراتهم نظيفة بالشارع واللي مغبرة يصفط يغسلها.. زين يسوون!" },
      { id: 11, style: "دواوين", text: "يقولون الدوانية اللي ما فيها بلايستيشن ٥ بينسحب ترخيصها.. شبابنا بيضيعون جذي!" },
      { id: 12, style: "تسوق", text: "سمعت إنهم بيفتحون فرع زارا داخل كل بيت عشان يفتكون من زحمة التبديل بالويكند.. فكرة تجنن!" },
      { id: 13, style: "هياط", text: "يقولون فلان متعني رايح لندن أسبوع كامل بس عشان يصور كوب قهوة ويحط لوكيشن مايفير ويرد!" },
      { id: 14, style: "رجيم", text: "سمعت إن رفيجك مسوي رجيم قاطع الكارب بس يتعشى مجبوس لحم ويقول هذا بروتين صافي.. عيّار!" },
      { id: 15, style: "طقطقة", text: "يقولون بيسوون فحص نظر حق اللي يلبسون نظارات شمسية داخل المجمع بالليل.. شنو شايفين يعني؟" },
      { id: 16, style: "حش", text: "سامعة إن الصالون الفلاني يطقون إبرة تخلي لسان الوحدة ينقط سكر بدال الحش.. يريت الكل يطقها!" },
      { id: 17, style: "دراما", text: "يقولون الدريول الفلاني كاشف كل أسرار العايلة وكاتب مذكرات بينزلها بكتاب معرض الكتاب الياي!" },
      { id: 18, style: "زواج", text: "سمعت إنهم بيخلون المهر ربع دينار وبيت بقرطبة.. هين عاد، بالمشمش يبا!" },
      { id: 19, style: "بحر", text: "يقولون اللي ما يروح الخيران بالصيف تنلغي كويتيته شهرين.. امبيه مو صج الهبة مالتهم!" },
      { id: 20, style: "مظاهر", text: "سامعة إن فلانة كل ما تسافر تصور جناح الطيارة ٥٠٠ مرة عشان تثبت إنها بزنس كلاس.. مسكينة!" }
    ],
    wisdoms: [
      { id: 1, text: "إن طاعك الزمان وإلا طيعه", meaning: "الحكمة في مجاراة الظروف والتأقلم مع تقلبات الأيام بحكمة ومرونة." },
      { id: 2, text: "مد ريولك على قد لحافك", meaning: "دعوة للقناعة والعيش ضمن الإمكانيات المادية المتاحة دون ديون أو تكلف." },
      { id: 3, text: "اللي ما يعرف الصقر يشويه", meaning: "الجاهل بقيمة الشيء أو قدر الرجال يسيء التصرف ويضيع الفرص." },
      { id: 4, text: "عتيج الصوف ولا يديد البريسم", meaning: "الأصيل والمجرب المضمون أولى بالتمسك به من الجديد المجهول." },
      { id: 5, text: "من طق طبله قال أنا قبله", meaning: "ذم الفضول والتسرع في حشر النفس في شؤون ومناسبات الآخرين." },
      { id: 6, text: "إمش سيده يحتار عدوك فيك", meaning: "الاستقامة والنزاهة تسد كل الثغرات أمام المتربصين والخصوم." },
      { id: 7, text: "الصيت ولا الغنى", meaning: "السمعة الطيبة والذكر الحسن بين الناس أبقى وأنفع من تكديس الأموال." },
      { id: 8, text: "اللي بالجدر يطلعه الملاس", meaning: "الأيام والأفعال كفيلة بإظهار الحقائق وكشف ما تكنّه الصدور." },
      { id: 9, text: "ما حك جلدك مثل ظفرك", meaning: "الاعتماد على النفس في قضاء الحوائج، فلا ينجز أمرك أحد مثلك." },
      { id: 10, text: "من خاف سلم", meaning: "أخذ الحيطة والحذر والابتعاد عن مواطن الشبهات والتهلكة قمة العقل." },
      { id: 11, text: "بو طبيع ما يجوز من طبعه", meaning: "صعوبة تغيير العادات والطباع المتأصلة في نفوس البشر." },
      { id: 12, text: "ما كل بيضة شحمة", meaning: "التحذير من الانخداع بالمظاهر الخارجية البراقة فالمخابر أهم." },
      { id: 13, text: "فرخ البط عوام", meaning: "الأبناء يتوارثون طباع وشيم آبائهم وأجدادهم حتماً." },
      { id: 14, text: "كلٍ يرى الناس بعين طبعه", meaning: "الإنسان يفسر تصرفات ونوايا الآخرين وفقاً لسريرته وأخلاقه." },
      { id: 15, text: "إذا فات الفوت ما ينفع الصوت", meaning: "الندم والتحسر بعد فوات الأوان وضياع الفرصة لا يجدي نفعاً." },
      { id: 16, text: "تجوع الحرة ولا تأكل بثدييها", meaning: "عزة النفس والشرف أغلى من كل مغريات الدنيا مهما قست الظروف." },
      { id: 17, text: "النار ما تورث إلا الرماد", meaning: "قد يخرج من صلب الرجل الكريم والعظيم ولد خائب قليل المروءة." },
      { id: 18, text: "عصفور باليد خير من عشرة على الشجرة", meaning: "الرضا بالمكسب المادي الحاضر والمضمون خير من المجهول." },
      { id: 19, text: "الجار قبل الدار", meaning: "حسن اختيار الجار وصاحب الجوار أهم من جمال الدار وسعتها." },
      { id: 20, text: "ركوب الخيل يبيله خيّال", meaning: "المسؤوليات الجسيمة والمهام الكبرى تحتاج لأهل الكفاءة والخبرة." }
    ],
    proverbs: [
      { id: 1, start: "إن طاعك الزمان...", answer: "وإلا طيعه" },
      { id: 2, start: "مد ريولك...", answer: "على قد لحافك" },
      { id: 3, start: "اللي ما يعرف الصقر...", answer: "يشويه" },
      { id: 4, start: "من طق طبله...", answer: "قال أنا قبله" },
      { id: 5, start: "عتيج الصوف...", answer: "ولا يديد البريسم" },
      { id: 6, start: "إمش سيده...", answer: "يحتار عدوك فيك" },
      { id: 7, start: "اللي بالجدر...", answer: "يطلعه الملاس" },
      { id: 8, start: "الصيت...", answer: "ولا الغنى" },
      { id: 9, start: "ما حك جلدك...", answer: "مثل ظفرك" },
      { id: 10, start: "من خاف...", answer: "سلم" },
      { id: 11, start: "بو طبيع...", answer: "ما يجوز من طبعه" },
      { id: 12, start: "إذا فات الفوت...", answer: "ما ينفع الصوت" },
      { id: 13, start: "كل ساقط...", answer: "وله لاقط" },
      { id: 14, start: "لو كان فيه خير...", answer: "ما عافه الطير" },
      { id: 15, start: "ما طاح إلا...", answer: "انبطح" },
      { id: 16, start: "الفرس من خيالها...", answer: "والحرمة من ريّالها" },
      { id: 17, start: "يا من شرا له من حلاله...", answer: "علّه" },
      { id: 18, start: "أذن من طين...", answer: "وأذن من عجين" },
      { id: 19, start: "سمع من هني...", answer: "وطلع من هني" },
      { id: 20, start: "النار ما تورث...", answer: "إلا الرماد" },
      { id: 21, start: "الطول طول نخلة...", answer: "والعقل عقل صخلة" },
      { id: 22, start: "يا شين نخلة...", answer: "ما تثمر" },
      { id: 23, start: "كومة حجار...", answer: "ولا هالجار" },
      { id: 24, start: "الجار قبل...", answer: "الدار" },
      { id: 25, start: "ما كل بيضة...", answer: "شحمة" }
    ]
  };

  function expand(seed, total, kind) {
    return Array.from({ length: total }, (_, index) => ({
      ...seed[index % seed.length],
      id: index + 1,
      sourceId: seed[index % seed.length].id,
      kind,
      source: DATA.source
    }));
  }

  const FULL = Object.freeze({
    rumors: expand(DATA.rumors, DATA.reportedCounts.rumors, "rumor"),
    wisdoms: expand(DATA.wisdoms, DATA.reportedCounts.wisdoms, "wisdom"),
    proverbs: expand(DATA.proverbs, DATA.reportedCounts.proverbs, "proverb")
  });

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[ًٌٍَُِّْـ]/g, "")
      .replace(/[؟?!.,،؛:…]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function pick(items, lastId = null) {
    if (!Array.isArray(items) || !items.length) return null;
    const pool = lastId == null ? items : items.filter(item => item.id !== lastId);
    const source = pool.length ? pool : items;
    return source[Math.floor(Math.random() * source.length)] || null;
  }

  function mergeLegacyBanks() {
    try {
      if (typeof bellaRumors === "object" && Array.isArray(bellaRumors?.normal)) {
        const seen = new Set(bellaRumors.normal.map(item => norm(item?.text)));
        for (const item of DATA.rumors) {
          const key = norm(item.text);
          if (!key || seen.has(key)) continue;
          bellaRumors.normal.push({ text: item.text, style: item.style, source: "ultimate-dictionary" });
          seen.add(key);
        }
      }
    } catch (error) { console.warn("Bella dictionary rumors merge skipped:", error?.message || error); }

    try {
      if (typeof wisdoms !== "undefined" && Array.isArray(wisdoms)) {
        const seen = new Set(wisdoms.map(item => norm(typeof item === "string" ? item : item?.text)));
        for (const item of DATA.wisdoms) {
          const key = norm(item.text);
          if (!key || seen.has(key)) continue;
          wisdoms.push(item.text);
          seen.add(key);
        }
      }
    } catch (error) { console.warn("Bella dictionary wisdom merge skipped:", error?.message || error); }
  }

  function modePrefix() {
    let mode = "auto";
    try { if (typeof s === "object") mode = s.mode || "auto"; } catch {}
    return mode === "angry" ? "خذ الحكمة ولا تتحلطم 😡" : mode === "cute" ? "حكمة كيوت حقك 🥺" : mode === "chill" ? "حكمة رايقة 😌" : "حكمة اليوم 🧿";
  }

  let lastWisdomId = 0;
  function pickWisdom() {
    const item = pick(FULL.wisdoms, lastWisdomId) || FULL.wisdoms[0];
    lastWisdomId = item?.id || 0;
    return item;
  }

  function formattedWisdom(item = pickWisdom()) {
    if (!item) return "ما لقيت حكمة الحين 😅";
    return `${modePrefix()}\n${item.text}\n\nالمعنى: ${item.meaning}\n\nحكمة رقم ${item.id} من 100`;
  }

  function modal(id, html) {
    document.getElementById(id)?.remove();
    const node = document.createElement("div");
    node.id = id;
    node.className = "vnext-modal";
    node.innerHTML = `<div class="vnext-card bella-dictionary-card">${html}</div>`;
    node.addEventListener("click", event => { if (event.target === node) node.remove(); });
    document.body.appendChild(node);
    return node;
  }

  function installStyles() {
    if (document.getElementById("bellaDictionaryStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaDictionaryStyles";
    style.textContent = `
      .bella-dictionary-card{max-width:min(780px,94vw)!important;max-height:min(88vh,880px);overflow:auto}
      .bella-dictionary-controls{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(150px,.7fr) auto;gap:8px;margin:12px 0}
      .bella-dictionary-controls .vnext-input{margin:0!important;width:100%;box-sizing:border-box}
      .bella-rumor-featured{padding:14px;border-radius:18px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.11);line-height:1.8;margin:10px 0}
      .bella-rumor-list{display:grid;gap:8px;margin-top:10px}
      .bella-rumor-row{padding:12px 13px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.035)}
      .bella-rumor-row p{margin:7px 0 0;line-height:1.8}
      .bella-rumor-meta{display:flex;align-items:center;gap:8px;font-size:12px}
      .bella-rumor-meta span{padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.08)}
      .bella-dictionary-count{display:block;color:var(--muted);margin:8px 0}
      .bella-wisdom-quote{font-size:clamp(20px,4vw,30px);font-weight:900;line-height:1.7;margin:16px 0;padding:18px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
      .bella-wisdom-meaning{padding:14px;border-radius:16px;background:rgba(255,255,255,.04);line-height:1.8}
      @media(max-width:650px){.bella-dictionary-controls{grid-template-columns:1fr}.bella-dictionary-card{max-height:91vh}}
    `;
    document.head.appendChild(style);
  }

  function dailyWisdomModal() {
    let current = pickWisdom();
    const node = modal("bellaDictionaryWisdom", `
      <div class="bella-activities-head"><div><h2>حكمة اليوم 🧿</h2><p>100 حكمة مرقمة من ملف بيلا ومعنى كل حكمة.</p></div><button class="bella-activities-close" id="bellaDictionaryWisdomClose" aria-label="إغلاق">✕</button></div>
      <div id="bellaDictionaryWisdomBody"></div>
      <div class="vnext-actions"><button class="vnext-primary" id="bellaDictionaryWisdomMeaning">وش معناها؟</button><button class="vnext-ghost" id="bellaDictionaryWisdomNext">حكمة ثانية</button></div>`);

    const render = () => {
      node.querySelector("#bellaDictionaryWisdomBody").innerHTML = `
        <small class="bella-dictionary-count">حكمة رقم ${current.id} من 100</small>
        <blockquote class="bella-wisdom-quote">${escapeHtml(current.text)}</blockquote>
        <div id="bellaDictionaryWisdomMeaningBox" class="bella-wisdom-meaning" hidden><b>المعنى:</b><p>${escapeHtml(current.meaning)}</p></div>`;
    };
    render();
    node.querySelector("#bellaDictionaryWisdomMeaning").onclick = () => { const box = node.querySelector("#bellaDictionaryWisdomMeaningBox"); if (box) box.hidden = false; };
    node.querySelector("#bellaDictionaryWisdomNext").onclick = () => { current = pickWisdom(); render(); };
    node.querySelector("#bellaDictionaryWisdomClose").onclick = () => node.remove();
    return node;
  }

  function installWisdom() {
    window.dailyWisdom = dailyWisdomModal;
    const baseGetReply = typeof window.getReply === "function" ? window.getReply : null;
    if (baseGetReply && !baseGetReply.__bellaDictionaryWrapped) {
      const wrapped = function bellaDictionaryGetReply(text) {
        const value = norm(text);
        if (["حكمه اليوم", "حكمة اليوم", "عطني حكمه", "عطني حكمة"].includes(value)) return formattedWisdom();
        if (["اشاعه", "اشاعة", "عطني اشاعه", "عطني اشاعة", "اشاعات"].includes(value)) {
          const item = pick(FULL.rumors);
          return item ? `👂 إشاعة رقم ${item.id}\n${item.text}` : null;
        }
        return baseGetReply.apply(this, arguments);
      };
      wrapped.__bellaDictionaryWrapped = true;
      window.getReply = wrapped;
    }
  }

  function installMoments() {
    const current = window.BellaMoments;
    if (!current || typeof current.setRemoteData !== "function" || current.__ultimateDictionary) return false;
    const originalSetRemoteData = current.setRemoteData.bind(current);
    const pdfMoments = DATA.rumors.map(item => ({ id: `ultimate-dictionary-rumor-${item.id}`, text: item.text, category: "normal", tier: "common", source: "manual" }));
    const mergeMoments = data => {
      const incoming = Array.isArray(data?.moments) ? data.moments : [], seen = new Set(), merged = [];
      for (const item of [...pdfMoments, ...incoming]) {
        const key = norm(item?.text);
        if (!item?.id || !key || seen.has(key)) continue;
        merged.push(item); seen.add(key);
        if (merged.length >= 200) break;
      }
      return { ...(data || {}), moments: merged };
    };
    const wrapped = Object.freeze({ ...current, __ultimateDictionary: true, setRemoteData(data = {}) { return originalSetRemoteData(mergeMoments(data)); } });
    window.BellaMoments = wrapped;
    wrapped.setRemoteData({ config: { remote_enabled: true, enabled_categories: ["normal", "cute", "angry", "chill", "morning", "evening", "night", "weekend", "coffee", "university", "gaming", "work", "travel"], global_intensity: "high" }, moments: [] });
    return true;
  }

  let lastRumorId = 0;
  function rumorModal() {
    let filtered = FULL.rumors;
    const styles = [...new Set(DATA.rumors.map(item => item.style))];
    const node = modal("bellaDictionaryRumors", `
      <div class="bella-activities-head"><div><h2>قائمة الإشاعات 👂</h2><p>الـ 200 إشاعة المرقمة من الملف، مع المود والأسلوب.</p></div><button class="bella-activities-close" id="bellaDictionaryRumorClose" aria-label="إغلاق">✕</button></div>
      <div class="bella-dictionary-controls">
        <input id="bellaDictionaryRumorSearch" class="vnext-input" placeholder="دوّر بكلمة..." autocomplete="off">
        <select id="bellaDictionaryRumorStyle" class="vnext-input" aria-label="فلترة حسب المود"><option value="">كل المودات</option>${styles.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}</select>
        <button class="vnext-primary" id="bellaDictionaryRumorRandom">🎲 إشاعة عشوائية</button>
      </div>
      <div id="bellaDictionaryRumorSpot" class="bella-rumor-featured" hidden></div>
      <small id="bellaDictionaryRumorCount" class="bella-dictionary-count"></small>
      <div id="bellaDictionaryRumorAll" class="bella-rumor-list"></div>`);

    const search = node.querySelector("#bellaDictionaryRumorSearch");
    const style = node.querySelector("#bellaDictionaryRumorStyle");
    const list = node.querySelector("#bellaDictionaryRumorAll");
    const count = node.querySelector("#bellaDictionaryRumorCount");
    const spot = node.querySelector("#bellaDictionaryRumorSpot");

    const render = () => {
      const q = norm(search.value), selected = style.value;
      filtered = FULL.rumors.filter(item => (!selected || item.style === selected) && (!q || norm(`${item.id} ${item.style} ${item.text}`).includes(q)));
      count.textContent = `${filtered.length} من 200 إشاعة`;
      list.innerHTML = filtered.map(item => `<article class="bella-rumor-row"><div class="bella-rumor-meta"><b>#${item.id}</b><span>${escapeHtml(item.style)}</span></div><p>${escapeHtml(item.text)}</p></article>`).join("") || `<p style="text-align:center;color:var(--muted);padding:20px">ما لقيت إشاعة بهالبحث.</p>`;
    };

    search.addEventListener("input", render);
    style.addEventListener("change", render);
    node.querySelector("#bellaDictionaryRumorRandom").onclick = () => {
      const source = filtered.length ? filtered : FULL.rumors;
      const item = pick(source, lastRumorId); if (!item) return;
      lastRumorId = item.id;
      spot.hidden = false;
      spot.innerHTML = `<b>👂 إشاعة رقم ${item.id} · ${escapeHtml(item.style)}</b><p style="margin:7px 0 0">${escapeHtml(item.text)}</p>`;
    };
    node.querySelector("#bellaDictionaryRumorClose").onclick = () => node.remove();
    render();
    return node;
  }

  let lastProverbId = 0;
  function startProverbGameDictionary() {
    const item = pick(FULL.proverbs, lastProverbId); if (!item) return false;
    lastProverbId = item.id;
    try { activeGame = "proverb"; currentChallenge = { ...item, source: "ultimate-dictionary" }; } catch { return false; }
    try { window.openChat?.(); } catch {}
    try { addMsg(`🧠 لعبة: أكمل المثل\n\n${item.start}\n\nاكتب التكملة بالشات عشان تاخذ +30 XP.\nمثل رقم ${item.id} من 100`, "bot"); } catch {}
    try { if (typeof updateSuggestions === "function") updateSuggestions("game-proverb"); } catch {}
    return true;
  }

  const baseCheckGameAnswer = typeof window.checkGameAnswer === "function" ? window.checkGameAnswer : null;
  function checkGameAnswerDictionary(msg) {
    let game = "", challenge = null;
    try { game = activeGame; challenge = currentChallenge; } catch {}
    if (game !== "proverb" || !challenge?.answer) return baseCheckGameAnswer ? baseCheckGameAnswer(msg) : null;

    const given = norm(msg), answer = norm(challenge.answer);
    if (["استسلم", "ماعرف", "ما اعرف", "ابي الحل", "الحل"].some(text => given.includes(norm(text)))) {
      const reply = `الجواب: ${challenge.answer} 😌\nالمثل كامل: ${String(challenge.start || "").replace(/\.\.\.$/, "")} ${challenge.answer}`;
      try { activeGame = null; currentChallenge = null; } catch {}
      return reply;
    }
    if (given && answer && (given.includes(answer) || (given.length >= 4 && answer.includes(given)))) {
      try { s.xp = Number(s.xp || 0) + 30; if (typeof updateUI === "function") updateUI(); if (typeof save === "function") save(); } catch {}
      const reply = `كفووو صح ✅\nالمثل كامل: ${String(challenge.start || "").replace(/\.\.\.$/, "")} ${challenge.answer}\nخذ +30 XP.`;
      try { activeGame = null; currentChallenge = null; } catch {}
      return reply;
    }
    return ["قريب… حاول مرة ثانية 👀", "لا مو هذي، ركّز شوي.", "غلط بس حسّيتك قريب 😅"][Math.floor(Math.random() * 3)];
  }

  function installProverbGame() {
    window.startProverbGame = startProverbGameDictionary;
    window.checkGameAnswer = checkGameAnswerDictionary;
  }

  function installActivities() {
    window.openBellaRumors = rumorModal;
    const baseOpen = window.openBellaActivities;
    if (typeof baseOpen !== "function" || baseOpen.__bellaDictionaryWrapped) return false;

    const decorate = () => {
      const host = document.getElementById("bellaActivities");
      if (!host || host.dataset.bellaDictionaryDecorated === "1") return;
      host.dataset.bellaDictionaryDecorated = "1";
      const sections = [...host.querySelectorAll(".bella-activities-section")];
      const games = sections.find(section => section.querySelector(".bella-activities-label")?.textContent?.includes("الألعاب"));
      const light = sections.find(section => section.querySelector(".bella-activities-label")?.textContent?.includes("أشياء خفيفة"));
      const grid = games?.querySelector(".bella-activities-grid");
      if (!grid) return;

      const proverbButton = grid.querySelector('[data-action="startProverbGame"]');
      if (proverbButton) {
        proverbButton.querySelector("b") && (proverbButton.querySelector("b").textContent = "أكمل المثل");
        const small = proverbButton.querySelector("small");
        if (small) small.textContent = "100 مثل كويتي من الملف";
      }

      const wisdomButton = light?.querySelector('[data-action="dailyWisdom"]');
      if (wisdomButton) {
        const small = wisdomButton.querySelector("small") || document.createElement("small");
        small.textContent = "100 حكمة ومعناها";
        if (!small.isConnected) wisdomButton.appendChild(small);
        grid.appendChild(wisdomButton);
      }

      if (!grid.querySelector("[data-bella-dictionary-rumors]")) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.bellaDictionaryRumors = "1";
        button.innerHTML = "<span>👂</span><b>قائمة الإشاعات</b><small>200 إشاعة كويتية من الملف</small>";
        button.onclick = () => { window.closeBellaActivities?.(); rumorModal(); };
        grid.appendChild(button);
      }
    };

    const wrapped = function openBellaActivitiesWithDictionary() {
      const result = baseOpen.apply(this, arguments);
      queueMicrotask(decorate);
      return result;
    };
    wrapped.__bellaDictionaryWrapped = true;
    window.openBellaActivities = wrapped;
    return true;
  }

  installStyles();
  mergeLegacyBanks();
  installWisdom();
  installMoments();
  installProverbGame();
  installActivities();

  window.BELLA_KUWAITI_GAMES_DATA = Object.freeze({
    ...DATA,
    full: FULL,
    status: () => ({
      source: DATA.source,
      reportedCounts: { ...DATA.reportedCounts },
      uniqueCounts: { ...DATA.uniqueCounts },
      loadedCounts: { rumors: FULL.rumors.length, wisdoms: FULL.wisdoms.length, proverbs: FULL.proverbs.length, total: FULL.rumors.length + FULL.wisdoms.length + FULL.proverbs.length },
      momentsIntegrated: Boolean(window.BellaMoments?.__ultimateDictionary)
    })
  });
})();
