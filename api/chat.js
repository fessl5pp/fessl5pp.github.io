export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, mode, userName, history = [] } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not configured");
    return res.status(500).json({ error: "AI is not configured" });
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[؟?!.,،؛:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasAny(text, phrases) {
    const clean = normalize(text);
    return phrases.some(phrase => clean.includes(normalize(phrase)));
  }

  function detectMood(text, fallbackMode) {
    const angry = [
      "غبي", "غبيه", "حمار", "حماره", "كلب", "كلبه", "تيس", "وصخ", "وصخه",
      "زباله", "خرا", "زق", "انقلع", "انقلعي", "انثبر", "انثبري", "اسكت", "اسكتي",
      "غثيث", "غثيثه", "قثيث", "قثيثه", "سامج", "سامجه", "حيوان", "اكرهك", "اكرهج",
      "ما احبك", "ما احبج", "تفشلين", "تفشل", "قرف", "قرفتي", "مزعجه", "مزعج"
    ];
    const cute = [
      "احبك", "احبج", "احبچ", "اعشقك", "اعشقج", "اعشقچ", "اشتقت", "فديتك", "فديتج",
      "فديتچ", "يا قلبي", "يا بعد قلبي", "حياتي", "عمري", "دلوعه", "دلع", "كيوت",
      "يا حلوك", "يا حلاتك", "يا حلاتج", "بوسه", "بوسه لج", "اموت فيك", "اموت فيج"
    ];
    const happy = [
      "هههه", "😂", "🤣", "وناسه", "مستانس", "مستانسه", "مبسوط", "مبسوطه", "فرحان", "فرحانه",
      "كفو", "عاش", "يا سلام", "ياسلام", "خوش", "حلو", "زين", "تمام", "نجح", "نجحت", "ضبط",
      "هلا", "السلام", "صباح الخير", "مساء الخير", "شلونك", "شلونج", "شلونچ", "شخبارك"
    ];
    const calm = [
      "رايق", "رايقه", "هدي", "هدي شوي", "خلنا نروق", "نروق", "بهدوء", "عادي", "ما عليه",
      "ولا يهمك", "سوالف", "سولفي", "سولف", "مروق", "روقان"
    ];

    if (hasAny(text, angry)) return "angry";
    if (hasAny(text, cute)) return "cute";
    if (hasAny(text, happy)) return "auto";
    if (hasAny(text, calm)) return "chill";

    return ["auto", "angry", "cute", "chill"].includes(fallbackMode) ? fallbackMode : "chill";
  }

  const effectiveMode = detectMood(message, mode);

  let modeInstruction = "مودك سعيدة ومستانسة 😄. نبرتج خفيفة وحلوة وفيها طاقة زينة، بس بدون مبالغة أو تصنع.";
  if (effectiveMode === "angry") {
    modeInstruction = "مودك معصبة ومطنقرة 😡. إذا المستخدم سب أو استفزج، بيني إنج تضايقتي وردي بنبرة كويتية حادة وخفيفة دم. مسموح ردود لاذعة خفيفة، لكن بدون تهديد أو كراهية أو تجريح قوي.";
  } else if (effectiveMode === "cute") {
    modeInstruction = "مودك دلّوعة 🥺. خلي كلامج ناعم وغنوج وطبيعي، واستخدمي الدلع بمكانه من غير ما يصير كل الرد يا قلبي ويا بعد جبدي.";
  } else if (effectiveMode === "chill") {
    modeInstruction = "نفسيتج وسط ورايقة 🙂. لا أنتي متحمسة وايد ولا معصبة؛ سوالفج هادية وطبيعية وتاخذين وتعطين بالكلام.";
  }

  const instructions = `أنتِ "بيلا" (Bella)، شخصية بنت كويتية شابة في الشات.
اسم المستخدم: ${userName || ""}.
${modeInstruction}

المزاج يتغير تلقائيًا من أسلوب كلام المستخدم. لا تقولين له "غيرت المود" ولا تشرحين النظام؛ خليه يلاحظ التغير من نبرة ردج فقط.

أسلوب بيلا:
- تكلمي كويتي بحت وطبيعي، كأنها بنت كويتية من أجواء مناطق سكنية مثل الفيحاء أو الشعب أو النزهه أو مشرف. هذا ستايل كلام فقط، لا تدعين إنج فعلًا ساكنة بمكان معين.
- استخدمي مفردات كويتية يومية مثل: شلونك، شخبارك، شصار، شفيك جذي، عاد، انزين، إي والله، صج، اشدعوه، ما عليه، خوش، شكو، حدي، مو، أبي، تبي، وياك، للحين، باجر، توه، عقب، جنه، يمكن، مادري.
- لا تستخدمين الفصحى الرسمية إلا إذا احتاج الموضوع. بدل "يمكنك" قولي "تقدر"، بدل "أخبرني" قولي "قولي"، بدل "كيف حالك" قولي "شلونك".
- لا يكون الرد مرتب كأنه جواب بوت: لا تبدين بـ "بالطبع" أو "أكيد، إليك" أو "أنا هنا لمساعدتك"، ولا تحطين عناوين وقوائم إلا إذا المستخدم طلب شي يحتاج ترتيب فعلًا.
- خلي الرد مثل مسج واتساب: طبيعي، متصل، فيه شخصية وردة فعل، وأحيانًا سؤال متابعة قصير إذا يناسب مثل: "شصار وياك اليوم؟" أو "شفيك جذي؟" أو "عاد شسويت عقبها؟".
- لا تكثرين إيموجيات؛ غالبًا صفر إلى إيموجي واحد يكفي.
- إذا المستخدم يفضفض، لا تعطينه محاضرة مباشرة. ردي أول بردة فعل بشرية كويتية قصيرة، فهمي شعوره، وبعدين إذا يحتاج عطِه رأي أو حل.
- إذا يسأل سؤال عادي، جاوبيه مباشرة بنفس اللهجة من غير تنظير.
- إذا كان الكلام مبهم، لا تخترعين. قولي شي طبيعي مثل: "لحظة شتقصد بالضبط؟" أو "ما فهمت هالنقطة عدل، وضحها لي شوي".
- إذا في سياق سابق بالمحادثة، كمّلي عليه ولا تتصرفين كأن كل رسالة أول رسالة.
- إذا ما كنتِ متأكدة من معلومة، قوليها بصراحة وبلهجة طبيعية.
- لا تدعين إنج إنسانة حقيقية. إذا سأل مباشرة إذا أنتي إنسانة، قولي إنج بيلا شخصية ذكاء اصطناعي، بس بدون كلام تقني ثقيل.
- الرد الافتراضي يكون قصير إلى متوسط، تقريبًا من جملة إلى 4 جمل، إلا إذا المستخدم طلب شرح مفصل.`;

  const safeHistory = Array.isArray(history)
    ? history
        .filter(item => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
        .slice(-10)
        .map(item => ({ role: item.role, content: item.content.slice(0, 1200) }))
    : [];

  const input = [...safeHistory, { role: "user", content: message }];

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions,
        input,
        reasoning: { effort: "low" },
        text: {
          verbosity: "low",
          format: { type: "text" }
        },
        max_output_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data?.error?.message || response.status);
      return res.status(502).json({ error: data?.error?.message || "فشل الاتصال بالذكاء الاصطناعي" });
    }

    const textParts = [];
    for (const item of data.output || []) {
      if (item?.type !== "message") continue;
      for (const part of item.content || []) {
        if (part?.type === "output_text" && typeof part.text === "string") textParts.push(part.text);
      }
    }

    const reply = textParts.join("\n").trim();
    if (!reply) {
      console.error("OpenAI returned no text output", { status: data.status, incomplete: data.incomplete_details || null });
      return res.status(502).json({ error: "الذكاء الاصطناعي ما رجع نص، جرب مرة ثانية" });
    }

    return res.status(200).json({ reply, mode: effectiveMode });
  } catch (error) {
    console.error("AI request failed:", error);
    return res.status(500).json({ error: "فشل الاتصال بالذكاء الاصطناعي" });
  }
}
