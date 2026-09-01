(() => {
  "use strict";

  const STORAGE_KEY = "bella_legacy_plus_v1";
  const MAX_RADAR_HISTORY = 6;
  const MAX_GAME_HISTORY = 4;

  const state = loadState();
  const originals = Object.create(null);

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        radar: Array.isArray(raw.radar) ? raw.radar.slice(-MAX_RADAR_HISTORY) : [],
        games: {
          box: Array.isArray(raw.games?.box) ? raw.games.box.slice(-MAX_GAME_HISTORY) : [],
          proverb: Array.isArray(raw.games?.proverb) ? raw.games.proverb.slice(-MAX_GAME_HISTORY) : []
        },
        wisdom: String(raw.wisdom || ""),
        gameStreak: Number.isFinite(raw.gameStreak) ? Math.max(0, raw.gameStreak) : 0
      };
    } catch {
      return { radar: [], games: { box: [], proverb: [] }, wisdom: "", gameStreak: 0 };
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function remember(list, value, max) {
    if (!value) return;
    const index = list.indexOf(value);
    if (index >= 0) list.splice(index, 1);
    list.push(value);
    while (list.length > max) list.shift();
    saveState();
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function currentMode() {
    const text = cleanText(document.getElementById("mode-status")?.textContent || document.getElementById("chat-status")?.textContent);
    if (text.includes("معصبة")) return "angry";
    if (text.includes("دلّوعة") || text.includes("دلوع")) return "cute";
    if (text.includes("رايقة") || text.includes("رايق")) return "chill";
    return "auto";
  }

  function lastBotNode() {
    const nodes = document.querySelectorAll("#box .m.bot");
    return nodes[nodes.length - 1] || null;
  }

  function nodeText(node) {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".vnext-time,.source-row,.bella-error-actions").forEach(el => el.remove());
    return (copy.innerText || copy.textContent || "").trim();
  }

  function installWrapper(name, factory) {
    const base = window[name];
    if (typeof base !== "function" || base.__bellaLegacyPlusWrapped) return false;
    originals[name] = base;
    const wrapped = factory(base);
    if (typeof wrapped !== "function") return false;
    wrapped.__bellaLegacyPlusWrapped = true;
    wrapped.__bellaLegacyPlusOriginal = base;
    window[name] = wrapped;
    return true;
  }

  function extractRadarName(reply) {
    const lines = String(reply || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const placeLine = lines.find(line => line.includes(" — "));
    return placeLine ? placeLine.split(" — ")[0].trim() : "";
  }

  function enhanceRadar() {
    installWrapper("coffeeRadar", original => function legacyPlusCoffeeRadar(message) {
      let reply = "";
      let picked = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        reply = original.call(this, message);
        picked = extractRadarName(reply);
        if (!picked || !state.radar.includes(picked) || attempt === 4) break;
      }
      if (picked) remember(state.radar, picked, MAX_RADAR_HISTORY);

      const asksLive = /مفتوح|الحين|الان|الآن|زحمة|ازدحام|ساعات|دوام|كم يبعد|قريب مني/.test(String(message || ""));
      if (asksLive) {
        reply += "\n\nملاحظة: هذي ترشيحات بيلا المحفوظة، مو فحص مباشر للحالة الحين. إذا تبي شي حي استخدم «شكو ماكو؟».";
      } else {
        reply += "\n\n📡 ما راح أعيد لك آخر الأماكن بسرعة؛ الرادار يتذكر اختياراته الأخيرة.";
      }
      return reply;
    });

    installWrapper("socialRadarReply", original => function legacyPlusSocialRadar() {
      const reply = original.apply(this, arguments);
      return `📡 رادار بيلا الاجتماعي — للوناسة، مو إحصائية حقيقية:\n\n${reply}`;
    });
  }

  const wisdomDeck = [
    { text: "مد رجولك على قد لحافك.", note: "يعني سوّ أمورك على قد إمكانياتك ولا تحمل نفسك فوق طاقتها." },
    { text: "اللي ما يعرف الصقر يشويه.", note: "اللي ما يعرف قيمة الشي ممكن يضيعه وهو ما يدري." },
    { text: "اللي بالجدر يطلعه الملاس.", note: "الأيام والمواقف تبين اللي مخفي." },
    { text: "من طول الغيبات ياب الغنايم.", note: "إذا غبت مدة، الناس تتوقع رجعت ومعاك خبر أو شي زين." },
    { text: "الصاحب ساحب.", note: "الناس اللي حولك يأثرون عليك أكثر مما تتوقع." },
    { text: "من شب على شي شاب عليه.", note: "العادة اللي تكبر وياك غالبًا تكمل معاك." },
    { text: "ما كل مدلقم يوز.", note: "المظهر بروحه ما يكفي للحكم على الشي أو الشخص." },
    { text: "القرادة ما تحك إلا ظهر البعير.", note: "بعض المشاكل الصغيرة ما تبين إلا على اللي يتحمل وايد." }
  ];

  function enhanceWisdom() {
    installWrapper("dailyWisdom", () => function legacyPlusDailyWisdom() {
      const choices = wisdomDeck.filter(item => item.text !== state.wisdom);
      const picked = choices[Math.floor(Math.random() * choices.length)] || wisdomDeck[0];
      state.wisdom = picked.text;
      saveState();

      const mode = currentMode();
      const prefix = mode === "angry" ? "خذ الحكمة ولا تتحلطم 😡"
        : mode === "cute" ? "حكمة كيوت حقك 🥺"
        : mode === "chill" ? "حكمة رايقة 😌"
        : "حكمة اليوم 🧿";

      window.addMsg?.(`${prefix}\n${picked.text}\n\nالمعنى: ${picked.note}`, "bot");
      window.updateSuggestions?.(picked.text);
    });
  }

  function challengeSignature(text) {
    return cleanText(text)
      .replace(/^🎁 لعبة: شنو بالصندوق؟\s*/u, "")
      .replace(/^🧠 لعبة: كمّل المثل\s*/u, "")
      .replace(/اكتب الجواب.*$/u, "")
      .replace(/كمّل المثل.*$/u, "")
      .slice(0, 220);
  }

  function startFreshChallenge(original, kind) {
    let signature = "";
    let node = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      original();
      node = lastBotNode();
      signature = challengeSignature(nodeText(node));
      if (!signature || !state.games[kind].includes(signature) || attempt === 4) break;
      node?.remove();
    }
    if (signature) remember(state.games[kind], signature, MAX_GAME_HISTORY);
    if (node) {
      const hint = document.createElement("div");
      hint.className = "bella-legacy-hint";
      hint.textContent = state.gameStreak > 1 ? `🔥 سلسلتك الحالية: ${state.gameStreak}` : "🎯 التحديات تقلل تكرار آخر الأسئلة.";
      node.appendChild(hint);
    }
  }

  function enhanceGames() {
    installWrapper("startBoxGame", original => function legacyPlusStartBoxGame() {
      startFreshChallenge(() => original.apply(this, arguments), "box");
    });

    installWrapper("startProverbGame", original => function legacyPlusStartProverbGame() {
      startFreshChallenge(() => original.apply(this, arguments), "proverb");
    });

    installWrapper("checkGameAnswer", original => function legacyPlusCheckGameAnswer(message) {
      const reply = original.apply(this, arguments);
      if (!reply) return reply;
      if (/صح ✅|كفووو! صح/.test(reply)) {
        state.gameStreak += 1;
        saveState();
        return state.gameStreak >= 2 ? `${reply}\n🔥 فوز متتالي: ${state.gameStreak}` : reply;
      }
      if (/الجواب هو:/.test(reply)) {
        state.gameStreak = 0;
        saveState();
      }
      return reply;
    });
  }

  function enhanceFazaa() {
    installWrapper("openFazaa", () => function legacyPlusOpenFazaa() {
      window.addMsg?.(
        "🚨 فزعة بيلا اشتغلت\n\nقول لي شنو تبي بالضبط:\n• مطعم / عشا\n• طلعة أو قز\n• مسلسل\n• صياغة اعتذار أو عذر محترم\n\nكل ما قلت المنطقة والميزانية أو الجو اللي تبيه، أضبطها لك أكثر.",
        "bot"
      );
      window.updateSuggestions?.("fazaa");
    });

    installWrapper("fazaaReply", original => function legacyPlusFazaaReply(message) {
      const msg = String(message || "").toLowerCase();

      if (/مطعم|عشا|غدا|غداء|اكل|أكل|وين اكل/.test(msg)) {
        if (/بحر|واجهة/.test(msg)) return "إذا تبي مطعم على البحر، عطِني منطقتك وميزانيتك واذا تبي هادي أو كشخة. ولأسماء ومواعيد حية استخدم «شكو ماكو؟».";
        if (/كشخ|فاخر|راقي/.test(msg)) return "تمام، تبي كشخة. قل لي: أي منطقة وكم حدود الميزانية للشخص؟ بعدها أضيقها لك بدل اقتراح عام.";
        return "أضبط لك المطعم، بس عطِني شيئين: المنطقة + الميزانية. وإذا تبي الأماكن المفتوحة الحين استخدم «شكو ماكو؟».";
      }

      if (/طلعة|قز|وين اروح|وين أروح|مكان/.test(msg)) {
        return "للطلعة عطِني الجو اللي تبيه: بحر، قهوة، مشي، مجمع، أو شي هادي. وإذا تبي اقتراح سريع الحين افتح «رادار القز».";
      }

      if (/مسلسل|مسلسلات|اشوف|أشوف|دراما/.test(msg)) {
        if (/قديم|كويتي/.test(msg)) return "إذا مودك كويتي قديم: قل لي تبي كوميدي، اجتماعي، ولا دراما، وأنا أرتب لك نوع يناسب القعدة بدل اسم عشوائي.";
        return "قل لي شنو مودك: كوميدي، غموض، أكشن، ولا دراما؟ أعطيك اقتراح أنسب من قائمة ثابتة.";
      }

      if (/وهقة|عذر|اعتذار|دوام|تأخرت|توهقت|ربعي/.test(msg)) {
        return "إذا تبي صياغة تمشي باحترام، خلك مختصر وصادق: «تأخرت بسبب ظرف شخصي، أعتذر منكم وبعوضها». إذا تقول لي الموقف أصيغها لك رسمي أو للربع.";
      }

      return original.apply(this, arguments);
    });
  }

  async function robustCopy(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function enhanceSharing() {
    installWrapper("shareChat", original => function legacyPlusShareChat() {
      const result = original.apply(this, arguments);
      const card = document.querySelector(".share-card:last-of-type .share-card-inner");
      if (card && navigator.share && !card.querySelector(".bella-native-share")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bella-native-share";
        button.textContent = "مشاركة بالجهاز";
        button.onclick = async () => {
          try {
            await navigator.share({ title: "Bella | بيلا الكويتية", text: window.__bellaShareText || "" });
          } catch (error) {
            if (error?.name !== "AbortError") window.showPopupCustom?.("ما تمت المشاركة، تقدر تنسخ النص بدلها.");
          }
        };
        const closeButton = [...card.querySelectorAll("button")].find(btn => btn.textContent.includes("إغلاق"));
        if (closeButton) card.insertBefore(button, closeButton);
        else card.appendChild(button);
      }
      return result;
    });

    if (typeof window.copyShareText === "function") {
      originals.copyShareText = window.copyShareText;
      window.copyShareText = async function legacyPlusCopyShareText() {
        const ok = await robustCopy(window.__bellaShareText || "");
        window.showPopupCustom?.(ok ? "تم نسخ المحادثة 🔥" : "ما قدرت أنسخ تلقائيًا، انسخها يدويًا.");
        return ok;
      };
      window.copyShareText.__bellaLegacyPlusWrapped = true;
    }
  }

  function enhanceRumors() {
    installWrapper("showRumor", original => function legacyPlusShowRumor() {
      const result = original.apply(this, arguments);
      setTimeout(() => {
        const el = document.getElementById("rumor-text");
        if (!el) return;
        const text = String(el.textContent || "").replace(/^👂\s*/, "");
        if (!text.startsWith("سوالف بيلا — مزح:")) el.textContent = `👂 سوالف بيلا — مزح: ${text}`;
        el.setAttribute("aria-label", "سوالف بيلا الترفيهية، محتوى مزاح وليست أخباراً حقيقية");
      }, 320);
      return result;
    });

    window.addEventListener("load", () => {
      const bar = document.getElementById("rumor-bar");
      if (bar) {
        bar.setAttribute("role", "status");
        bar.setAttribute("aria-live", "polite");
      }
    }, { once: true });
  }

  function installStyles() {
    if (document.getElementById("bellaLegacyPlusStyle")) return;
    const style = document.createElement("style");
    style.id = "bellaLegacyPlusStyle";
    style.textContent = `
      .bella-legacy-hint{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;opacity:.72}
      .share-card-inner .bella-native-share{font-weight:800}
    `;
    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    enhanceRadar();
    enhanceWisdom();
    enhanceGames();
    enhanceFazaa();
    enhanceSharing();
    enhanceRumors();
  }

  install();

  window.BellaLegacyPlus = Object.freeze({
    version: 1,
    state: () => JSON.parse(JSON.stringify(state)),
    originals: () => Object.keys(originals),
    install
  });
})();
