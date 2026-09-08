(() => {
  "use strict";

  // Bella Kuwaiti Ultimate Dictionary integration.
  // The PDF repeats its numbered banks; this module keeps the unique entries
  // so the games feel varied instead of serving identical rows again and again.
  const DATA = {
  "source": "Bella_Kuwaiti_Ultimate_Dictionary.pdf",
  "reportedCounts": {
    "rumors": 200,
    "wisdoms": 100,
    "proverbs": 100
  },
  "uniqueCounts": {
    "rumors": 20,
    "wisdoms": 20,
    "proverbs": 25
  },
  "rumors": [
    {"id":1,"style":"طقطقة","text":"يقولون مسوين ضريبة على اللي يطالعون الناس بنص عين بالافنيوز.. جان نص الشعب مفلس!"},
    {"id":2,"style":"حش بنات","text":"سمعت إن فلانة قايلة حق ريلها إن جنطتها أصلية واهيا ماخذتها من سوق السالمية بـ 15 دينار.. صيدة!"},
    {"id":3,"style":"نغزة","text":"يقولون بيحطون رادار حق اللي يمشي بالجمعية ويدعم قاري الناس بدون ما يقول سوري.. يستاهلون!"},
    {"id":4,"style":"شوارع","text":"سامعة إنهم بيمنعون الوانيتات يدخلون الدائري الثاني عشان المنظر العام.. يا ويلي من عيال بطنها!"},
    {"id":5,"style":"فصلة","text":"يقولون فلان مسوي تان بالصبية وحاط دهن عود بدال زيت التان.. طالع ريحته بخور محترق!"},
    {"id":6,"style":"دلع وهبة","text":"سمعت إن كافيه يديد بالشويخ منزل قهوة بطعم الفقع مع رشة هيل.. امبيه لوعوا جبدنا بالفناتك!"},
    {"id":7,"style":"جامعة","text":"يقولون اللي تلبس كعب بالجامعة وتدابج بالممرات بيعطونها إنذار إزعاج عام.. والله أريح!"},
    {"id":8,"style":"كسل","text":"سمعت إن مطعم شاورما مشهور حاط خلطة سرية تخلي الواحد ينام ١٢ ساعة متواصلة.. يبيلي منها!"},
    {"id":9,"style":"طقس وفصلة","text":"يقولون باجر درجة الحرارة بتصير تحت الصفر بالوفرة وبينزل ثلج.. جهزوا الكوتات والفروات!"},
    {"id":10,"style":"سيارات","text":"سامعة إن بيسوون لاين خاص حق اللي سياراتهم نظيفة بالشارع واللي مغبرة يصفط يغسلها.. زين يسوون!"},
    {"id":11,"style":"دواوين","text":"يقولون الدوانية اللي ما فيها بلايستيشن ٥ بينسحب ترخيصها.. شبابنا بيضيعون جذي!"},
    {"id":12,"style":"تسوق","text":"سمعت إنهم بيفتحون فرع زارا داخل كل بيت عشان يفتكون من زحمة التبديل بالويكند.. فكرة تجنن!"},
    {"id":13,"style":"هياط","text":"يقولون فلان متعني رايح لندن أسبوع كامل بس عشان يصور كوب قهوة ويحط لوكيشن مايفير ويرد!"},
    {"id":14,"style":"رجيم","text":"سمعت إن رفيجك مسوي رجيم قاطع الكارب بس يتعشى مجبوس لحم ويقول هذا بروتين صافي.. عيّار!"},
    {"id":15,"style":"طقطقة","text":"يقولون بيسوون فحص نظر حق اللي يلبسون نظارات شمسية داخل المجمع بالليل.. شنو شايفين يعني؟"},
    {"id":16,"style":"حش","text":"سامعة إن الصالون الفلاني يطقون إبرة تخلي لسان الوحدة ينقط سكر بدال الحش.. يريت الكل يطقها!"},
    {"id":17,"style":"دراما","text":"يقولون الدريول الفلاني كاشف كل أسرار العايلة وكاتب مذكرات بينزلها بكتاب معرض الكتاب الياي!"},
    {"id":18,"style":"زواج","text":"سمعت إنهم بيخلون المهر ربع دينار وبيت بقرطبة.. هين عاد، بالمشمش يبا!"},
    {"id":19,"style":"بحر","text":"يقولون اللي ما يروح الخيران بالصيف تنلغي كويتيته شهرين.. امبيه مو صج الهبة مالتهم!"},
    {"id":20,"style":"مظاهر","text":"سامعة إن فلانة كل ما تسافر تصور جناح الطيارة ٥٠٠ مرة عشان تثبت إنها بزنس كلاس.. مسكينة!"}
  ],
  "wisdoms": [
    {"id":1,"text":"إن طاعك الزمان وإلا طيعه","meaning":"الحكمة في مجاراة الظروف والتأقلم مع تقلبات الأيام بحكمة ومرونة."},
    {"id":2,"text":"مد ريولك على قد لحافك","meaning":"دعوة للقناعة والعيش ضمن الإمكانيات المادية المتاحة دون ديون أو تكلف."},
    {"id":3,"text":"اللي ما يعرف الصقر يشويه","meaning":"الجاهل بقيمة الشيء أو قدر الرجال يسيء التصرف ويضيع الفرص."},
    {"id":4,"text":"عتيج الصوف ولا يديد البريسم","meaning":"الأصيل والمجرب المضمون أولى بالتمسك به من الجديد المجهول."},
    {"id":5,"text":"من طق طبله قال أنا قبله","meaning":"ذم الفضول والتسرع في حشر النفس في شؤون ومناسبات الآخرين."},
    {"id":6,"text":"إمش سيده يحتار عدوك فيك","meaning":"الاستقامة والنزاهة تسد كل الثغرات أمام المتربصين والخصوم."},
    {"id":7,"text":"الصيت ولا الغنى","meaning":"السمعة الطيبة والذكر الحسن بين الناس أبقى وأنفع من تكديس الأموال."},
    {"id":8,"text":"اللي بالجدر يطلعه الملاس","meaning":"الأيام والأفعال كفيلة بإظهار الحقائق وكشف ما تكنّه الصدور."},
    {"id":9,"text":"ما حك جلدك مثل ظفرك","meaning":"الاعتماد على النفس في قضاء الحوائج، فلا ينجز أمرك أحد مثلك."},
    {"id":10,"text":"من خاف سلم","meaning":"أخذ الحيطة والحذر والابتعاد عن مواطن الشبهات والتهلكة قمة العقل."},
    {"id":11,"text":"بو طبيع ما يجوز من طبعه","meaning":"صعوبة تغيير العادات والطباع المتأصلة في نفوس البشر."},
    {"id":12,"text":"ما كل بيضة شحمة","meaning":"التحذير من الانخداع بالمظاهر الخارجية البراقة فالمخابر أهم."},
    {"id":13,"text":"فرخ البط عوام","meaning":"الأبناء يتوارثون طباع وشيم آبائهم وأجدادهم حتماً."},
    {"id":14,"text":"كلٍ يرى الناس بعين طبعه","meaning":"الإنسان يفسر تصرفات ونوايا الآخرين وفقاً لسريرته وأخلاقه."},
    {"id":15,"text":"إذا فات الفوت ما ينفع الصوت","meaning":"الندم والتحسر بعد فوات الأوان وضياع الفرصة لا يجدي نفعاً."},
    {"id":16,"text":"تجوع الحرة ولا تأكل بثدييها","meaning":"عزة النفس والشرف أغلى من كل مغريات الدنيا مهما قست الظروف."},
    {"id":17,"text":"النار ما تورث إلا الرماد","meaning":"قد يخرج من صلب الرجل الكريم والعظيم ولد خائب قليل المروءة."},
    {"id":18,"text":"عصفور باليد خير من عشرة على الشجرة","meaning":"الرضا بالمكسب المادي الحاضر والمضمون خير من المجهول."},
    {"id":19,"text":"الجار قبل الدار","meaning":"حسن اختيار الجار وصاحب الجوار أهم من جمال الدار وسعتها."},
    {"id":20,"text":"ركوب الخيل يبيله خيّال","meaning":"المسؤوليات الجسيمة والمهام الكبرى تحتاج لأهل الكفاءة والخبرة."}
  ],
  "proverbs": [
    {"id":1,"start":"إن طاعك الزمان...","answer":"وإلا طيعه"},{"id":2,"start":"مد ريولك...","answer":"على قد لحافك"},{"id":3,"start":"اللي ما يعرف الصقر...","answer":"يشويه"},{"id":4,"start":"من طق طبله...","answer":"قال أنا قبله"},{"id":5,"start":"عتيج الصوف...","answer":"ولا يديد البريسم"},{"id":6,"start":"إمش سيده...","answer":"يحتار عدوك فيك"},{"id":7,"start":"اللي بالجدر...","answer":"يطلعه الملاس"},{"id":8,"start":"الصيت...","answer":"ولا الغنى"},{"id":9,"start":"ما حك جلدك...","answer":"مثل ظفرك"},{"id":10,"start":"من خاف...","answer":"سلم"},{"id":11,"start":"بو طبيع...","answer":"ما يجوز من طبعه"},{"id":12,"start":"إذا فات الفوت...","answer":"ما ينفع الصوت"},{"id":13,"start":"كل ساقط...","answer":"وله لاقط"},{"id":14,"start":"لو كان فيه خير...","answer":"ما عافه الطير"},{"id":15,"start":"ما طاح إلا...","answer":"انبطح"},{"id":16,"start":"الفرس من خيالها...","answer":"والحرمة من ريّالها"},{"id":17,"start":"يا من شرا له من حلاله...","answer":"علّه"},{"id":18,"start":"أذن من طين...","answer":"وأذن من عجين"},{"id":19,"start":"سمع من هني...","answer":"وطلع من هني"},{"id":20,"start":"النار ما تورث...","answer":"إلا الرماد"},{"id":21,"start":"الطول طول نخلة...","answer":"والعقل عقل صخلة"},{"id":22,"start":"يا شين نخلة...","answer":"ما تثمر"},{"id":23,"start":"كومة حجار...","answer":"ولا هالجار"},{"id":24,"start":"الجار قبل...","answer":"الدار"},{"id":25,"start":"ما كل بيضة...","answer":"شحمة"}
  ]
};

  function norm(value) {
    return String(value || "").toLowerCase().normalize("NFKC").replace(/[أإآ]/g, "ا").replace(/[ى]/g, "ي").replace(/[ة]/g, "ه").replace(/[؟?!.,،؛:…]/g, " ").replace(/\s+/g, " ").trim();
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

    try {
      if (typeof proverbGameItems !== "undefined" && Array.isArray(proverbGameItems)) {
        const keyOf = item => `${norm(item?.start)}|${norm(item?.answer)}`;
        const seen = new Set(proverbGameItems.map(keyOf));
        for (const item of DATA.proverbs) {
          const row = { start: item.start, answer: item.answer, source: "ultimate-dictionary" };
          const key = keyOf(row);
          if (!key || seen.has(key)) continue;
          proverbGameItems.push(row);
          seen.add(key);
        }
      }
    } catch (error) { console.warn("Bella dictionary proverb merge skipped:", error?.message || error); }
  }

  function wisdomCatalog() {
    const output = [], seen = new Set();
    for (const item of DATA.wisdoms) {
      const key = norm(item.text);
      if (!key || seen.has(key)) continue;
      output.push({ text: item.text, meaning: item.meaning || "" });
      seen.add(key);
    }
    try {
      if (typeof wisdoms !== "undefined" && Array.isArray(wisdoms)) {
        for (const item of wisdoms) {
          const text = typeof item === "string" ? item : item?.text;
          const key = norm(text);
          if (!key || seen.has(key)) continue;
          output.push({ text: String(text), meaning: "" });
          seen.add(key);
        }
      }
    } catch {}
    return output;
  }

  let lastWisdomKey = "";
  function formattedWisdom() {
    const bank = wisdomCatalog();
    if (!bank.length) return "ما لقيت حكمة الحين 😅";
    const fresh = bank.filter(item => norm(item.text) !== lastWisdomKey);
    const source = fresh.length ? fresh : bank;
    const item = source[Math.floor(Math.random() * source.length)];
    lastWisdomKey = norm(item.text);
    const mode = (() => { try { return typeof s === "object" ? s.mode : "auto"; } catch { return "auto"; } })();
    const prefix = mode === "angry" ? "خذ الحكمة ولا تتحلطم 😡" : mode === "cute" ? "حكمة كيوت حقك 🥺" : mode === "chill" ? "حكمة رايقة 😌" : "حكمة اليوم 🧿";
    return `${prefix}\n${item.text}${item.meaning ? `\n\nالمعنى: ${item.meaning}` : ""}`;
  }

  function installWisdom() {
    window.dailyWisdom = function dailyWisdomDictionary() {
      const reply = formattedWisdom();
      try { if (typeof addMsg === "function") addMsg(reply, "bot"); else window.addMsg?.(reply, "bot"); } catch {}
      try { if (typeof updateSuggestions === "function") updateSuggestions(reply); } catch {}
      return reply;
    };
    const baseGetReply = typeof window.getReply === "function" ? window.getReply : null;
    if (baseGetReply && !baseGetReply.__bellaDictionaryWrapped) {
      const wrapped = function bellaDictionaryGetReply(text) {
        const value = norm(text);
        if (["حكمه اليوم","حكمة اليوم","عطني حكمه","عطني حكمة"].includes(value)) return formattedWisdom();
        if (["اشاعه","اشاعة","عطني اشاعه","عطني اشاعة","اشاعات"].includes(value)) {
          const item = pick(DATA.rumors);
          return item ? `👂 ${item.text}` : null;
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
    wrapped.setRemoteData({ config: { remote_enabled: true, enabled_categories: ["normal","cute","angry","chill","morning","evening","night","weekend","coffee","university","gaming","work","travel"], global_intensity: "high" }, moments: [] });
    return true;
  }

  let lastRumorId = null;
  function rumorModal() {
    document.getElementById("bellaDictionaryRumors")?.remove();
    const modal = document.createElement("div");
    modal.id = "bellaDictionaryRumors";
    modal.className = "vnext-modal";
    modal.innerHTML = `<div class="vnext-card" role="dialog" aria-modal="true" aria-labelledby="bellaDictionaryRumorsTitle"><h2 id="bellaDictionaryRumorsTitle">إشاعات بيلا 👂</h2><p style="margin-top:4px">إشاعات كويتية خفيفة من ملف بيلا، بدون تكرار الصفوف المكررة.</p><div id="bellaDictionaryRumorSpot" style="padding:14px;border-radius:16px;background:rgba(255,255,255,.06);line-height:1.9;margin:14px 0"></div><div class="vnext-actions"><button class="vnext-primary" id="bellaDictionaryRumorNext">إشاعة ثانية 👂</button><button class="vnext-ghost" id="bellaDictionaryRumorList">عرض القائمة</button><button class="vnext-ghost" id="bellaDictionaryRumorClose">سكر</button></div><div id="bellaDictionaryRumorAll" hidden style="max-height:42vh;overflow:auto;margin-top:14px;text-align:right"></div></div>`;
    const spot = modal.querySelector("#bellaDictionaryRumorSpot"), all = modal.querySelector("#bellaDictionaryRumorAll");
    const showRandom = () => { const item = pick(DATA.rumors, lastRumorId); if (!item) return; lastRumorId = item.id; spot.textContent = `👂 ${item.text}`; };
    all.innerHTML = DATA.rumors.map(item => `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)"><small>${item.style || "إشاعة"}</small><br>${item.text}</div>`).join("");
    modal.querySelector("#bellaDictionaryRumorNext").onclick = showRandom;
    modal.querySelector("#bellaDictionaryRumorList").onclick = event => { all.hidden = !all.hidden; event.currentTarget.textContent = all.hidden ? "عرض القائمة" : "إخفاء القائمة"; };
    modal.querySelector("#bellaDictionaryRumorClose").onclick = () => modal.remove();
    modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
    document.body.appendChild(modal); showRandom(); return modal;
  }

  function installActivities() {
    window.openBellaRumors = rumorModal;
    const baseOpen = window.openBellaActivities;
    if (typeof baseOpen !== "function" || baseOpen.__bellaDictionaryWrapped) return false;
    const decorate = () => {
      const host = document.getElementById("bellaActivities");
      if (!host || host.querySelector("[data-bella-dictionary-rumors]")) return;
      const games = [...host.querySelectorAll(".bella-activities-section")].find(section => section.querySelector(".bella-activities-label")?.textContent?.includes("الألعاب"));
      const grid = games?.querySelector(".bella-activities-grid");
      if (!grid) return;
      const button = document.createElement("button"); button.type = "button"; button.dataset.bellaDictionaryRumors = "1";
      button.innerHTML = "<span>👂</span><b>إشاعات بيلا</b><small>إشاعات كويتية عشوائية وقائمة كاملة</small>";
      button.onclick = () => { window.closeBellaActivities?.(); rumorModal(); };
      grid.appendChild(button);
    };
    const wrapped = function openBellaActivitiesWithDictionary() { const result = baseOpen.apply(this, arguments); queueMicrotask(decorate); return result; };
    wrapped.__bellaDictionaryWrapped = true;
    window.openBellaActivities = wrapped;
    return true;
  }

  mergeLegacyBanks();
  installWisdom();
  installMoments();
  installActivities();

  window.BELLA_KUWAITI_GAMES_DATA = Object.freeze({ ...DATA, status: () => ({ rumors: DATA.rumors.length, wisdoms: DATA.wisdoms.length, proverbs: DATA.proverbs.length, momentsIntegrated: Boolean(window.BellaMoments?.__ultimateDictionary) }) });
})();
