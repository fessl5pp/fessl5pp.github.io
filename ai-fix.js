(() => {
  const originalDictionaryReply = window.dictionaryReply;
  const originalUpdateMood = window.updateMood;

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[؟?!.,،؛:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function includesAny(text, phrases) {
    const clean = normalizeText(text);
    return phrases.some(phrase => clean.includes(normalizeText(phrase)));
  }

  window.has = function safeHas(msg, words) {
    const haystack = normalizeText(msg);
    const tokens = haystack ? haystack.split(" ") : [];

    return words.some(word => {
      const needle = normalizeText(word);
      if (!needle) return false;
      if (!needle.includes(" ") && needle.length <= 2) return tokens.includes(needle);
      return haystack.includes(needle);
    });
  };

  window.dictionaryReply = function smartDictionaryReply(msg) {
    const clean = normalizeText(msg);
    const wordCount = clean ? clean.split(" ").length : 0;

    const adviceOrReasoning = [
      "شنو تنصح", "شنو اسوي", "شنو أسوي", "وش اسوي", "وش أسوي",
      "شلون اقدر", "شلون أقدر", "ابي نصيحة", "أبي نصيحة", "ساعديني",
      "فسري لي", "اشرحي لي", "ليش", "كيف"
    ].some(phrase => clean.includes(normalizeText(phrase)));

    if (wordCount >= 5 || adviceOrReasoning) return null;

    return typeof originalDictionaryReply === "function"
      ? originalDictionaryReply(msg)
      : null;
  };

  const moodWords = {
    angry: [
      "غبي", "غبيه", "حمار", "حماره", "كلب", "كلبه", "تيس", "وصخ", "وصخه",
      "زباله", "خرا", "زق", "انقلع", "انقلعي", "انثبر", "انثبري", "اسكت", "اسكتي",
      "غثيث", "غثيثه", "قثيث", "قثيثه", "سامج", "سامجه", "حيوان", "اكرهك", "اكرهج",
      "ما احبك", "ما احبج", "تفشل", "تفشلين", "قرف", "قرفتي", "مزعج", "مزعجه"
    ],
    cute: [
      "احبك", "احبج", "احبچ", "اعشقك", "اعشقج", "اعشقچ", "اشتقت", "فديتك", "فديتج",
      "فديتچ", "يا قلبي", "يا بعد قلبي", "حياتي", "عمري", "دلوعه", "دلع", "كيوت",
      "يا حلوك", "يا حلاتك", "يا حلاتج", "بوسه", "اموت فيك", "اموت فيج"
    ],
    happy: [
      "هههه", "😂", "🤣", "وناسه", "مستانس", "مستانسه", "مبسوط", "مبسوطه", "فرحان", "فرحانه",
      "كفو", "عاش", "يا سلام", "ياسلام", "خوش", "حلو", "زين", "تمام", "نجح", "نجحت", "ضبط",
      "هلا", "السلام", "صباح الخير", "مساء الخير", "شلونك", "شلونج", "شلونچ", "شخبارك"
    ],
    chill: [
      "رايق", "رايقه", "هدي", "هدي شوي", "خلنا نروق", "نروق", "بهدوء", "عادي", "ما عليه",
      "ولا يهمك", "سوالف", "سولفي", "سولف", "مروق", "روقان"
    ]
  };

  function detectAutomaticMood(text) {
    if (includesAny(text, moodWords.angry)) return "angry";
    if (includesAny(text, moodWords.cute)) return "cute";
    if (includesAny(text, moodWords.happy)) return "auto";
    if (includesAny(text, moodWords.chill)) return "chill";
    return "chill";
  }

  function moodLabel(mode) {
    return {
      auto: "😄 سعيدة",
      angry: "😡 معصبة",
      cute: "🥺 دلّوعة",
      chill: "🙂 النفسية وسط"
    }[mode] || "🙂 النفسية وسط";
  }

  function moodStatus(mode) {
    return {
      auto: "سعيدة 😄",
      angry: "معصبة 😡",
      cute: "دلّوعة 🥺",
      chill: "النفسية وسط 🙂"
    }[mode] || "النفسية وسط 🙂";
  }

  window.updateMood = function automaticMoodUI() {
    if (typeof originalUpdateMood === "function") originalUpdateMood();

    const mode = (typeof s !== "undefined" && s.mode) ? s.mode : "chill";
    const mood = document.getElementById("mood-pill");
    const status = document.getElementById("mode-status");
    const chatStatus = document.getElementById("chat-status");

    if (mood) mood.innerText = moodLabel(mode);
    if (status) status.innerText = moodLabel(mode);
    if (chatStatus) chatStatus.innerText = moodStatus(mode);
  };

  function applyAutomaticMood(text) {
    if (typeof s === "undefined") return "chill";

    const newMode = detectAutomaticMood(text);
    const oldMode = s.mode;
    s.mode = newMode;

    if (!Array.isArray(s.modesTried)) s.modesTried = [];
    if (!s.modesTried.includes(newMode)) s.modesTried.push(newMode);
    if (newMode === "angry" && oldMode !== "angry") s.angryUses = (s.angryUses || 0) + 1;

    if (typeof updateMood === "function") updateMood();
    if (typeof updateSuggestions === "function") updateSuggestions(text);
    if (typeof save === "function") save();

    return newMode;
  }

  function getRecentHistory(currentText) {
    const nodes = [...document.querySelectorAll("#box .m")];
    const history = [];

    for (const node of nodes) {
      const text = (node.innerText || "").trim();
      if (!text || text === "يكتب...") continue;

      if (node.classList.contains("user")) history.push({ role: "user", content: text });
      else if (node.classList.contains("bot")) history.push({ role: "assistant", content: text });
    }

    if (history.length) {
      const last = history[history.length - 1];
      if (last.role === "user" && last.content === currentText) history.pop();
    }

    return history.slice(-10);
  }

  window.getAIReply = async function getAIReplyFixed(text) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          message: text,
          mode: typeof s !== "undefined" ? s.mode : "chill",
          userName: typeof s !== "undefined" ? s.userName : "",
          history: getRecentHistory(text)
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Bella AI endpoint error:", res.status, data.error || data);
        return "صار شي بالربط الحين 😅 جرب مرة ثانية بعد شوي.";
      }

      if (typeof s !== "undefined" && ["auto", "angry", "cute", "chill"].includes(data.mode)) {
        s.mode = data.mode;
        if (typeof updateMood === "function") updateMood();
        if (typeof save === "function") save();
      }

      return data.reply || "ما فهمت عدل، عيدها لي بطريقة ثانية؟";
    } catch (error) {
      console.error("Bella AI network error:", error);
      return "الواير معلق عندي الحين، جرب بعد شوي 😅";
    }
  };

  // Replace the old send flow so Bella chooses her mood from every message
  // before generating either a local or AI response.
  window.send = async function sendWithAutomaticMood() {
    const text = inp.value.trim();
    if (!text) return;

    applyAutomaticMood(text);
    handleTypingBehavior(text);
    detectAvatarReaction(text);

    addMsg(text, "user");
    inp.value = "";
    addMsg("يكتب...", "bot");

    let reply = getReply(text);
    if (reply === null) reply = await getAIReply(text);

    setTimeout(() => {
      removeTyping();

      if (reply) {
        addMsg(reply, "bot");
        updateSuggestions(reply);
      }

      s.messages++;
      s.xp += 10;

      const oldLvl = s.lvl;
      s.lvl = Math.floor(s.xp / 100) + 1;

      updateBadges();
      save();
      updateUI();
      updateMood();

      if (s.lvl > oldLvl) showLevelCard();
    }, 400);
  };

  window.addEventListener("load", () => {
    if (typeof s !== "undefined" && !["auto", "angry", "cute", "chill"].includes(s.mode)) s.mode = "chill";
    updateMood();
  });
})();
