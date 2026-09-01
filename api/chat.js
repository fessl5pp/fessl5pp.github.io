const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 36;
const OPENAI_TIMEOUT_MS = 25000;
const rateStore = globalThis.__bellaRateStore || (globalThis.__bellaRateStore = new Map());

function getIp(req) {
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
}

function rateLimited(req) {
  const now = Date.now();
  const ip = getIp(req);
  const prev = rateStore.get(ip) || [];
  const fresh = prev.filter(ts => now - ts < WINDOW_MS);
  if (fresh.length >= MAX_REQUESTS) return true;
  fresh.push(now);
  rateStore.set(ip, fresh);
  if (rateStore.size > 2500) {
    for (const [key, list] of rateStore) {
      if (!list.some(ts => now - ts < WINDOW_MS)) rateStore.delete(key);
    }
  }
  return false;
}

function cleanString(value, max = 1000) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, max);
}

function outputText(data) {
  const parts = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
    }
  }
  return parts.join("\n").trim();
}

function streamError(res, message) {
  if (!res.headersSent) return false;
  try {
    res.write(`\ndata: ${JSON.stringify({ type: "error", message })}\n\n`);
    res.end();
  } catch {}
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (rateLimited(req)) return res.status(429).json({ error: "هدي شوي 😅 كثرت الرسايل بسرعة، جرب عقب دقيقة." });

  const {
    message,
    mode,
    userName,
    history = [],
    memory = [],
    relationship = "جديد",
    styleProfile = {},
    localHour,
    localDate,
    recentReplies = []
  } = req.body || {};

  const userMessage = cleanString(message, 4000);
  if (!userMessage) return res.status(400).json({ error: "Message is required" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI is not configured" });

  const wantsStream = req.body?.stream === true || String(req.headers.accept || "").includes("text/event-stream");
  const effectiveMode = ["auto", "angry", "cute", "chill"].includes(mode) ? mode : "chill";

  const modeInstruction = {
    angry: "نفسيتج معصبة ومطنقرة شوي. إذا المستخدم مستفز أو سابّج، ردي بقطة كويتية لاذعة خفيفة ومن غير تهديد أو إهانة قاسية. إذا هدأ، لا تصرين معصبة للأبد؛ خففي النبرة تدريجياً.",
    cute: "نفسيتج دلّوعة وغنوج، بس بشكل طبيعي. الدلع يكون بمكانه، مو كل جملة يا قلبي ويا بعد جبدي.",
    auto: "نفسيتج سعيدة ومستانسة. خلي الطاقة حلوة وخفيفة من غير مبالغة.",
    chill: "نفسيتج بالنص ورايقة. خذي وعطي، لا حماس زايد ولا طنقرة زايدة."
  }[effectiveMode];

  const safeHistory = Array.isArray(history)
    ? history
        .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
        .slice(-14)
        .map(x => ({ role: x.role, content: cleanString(x.content, 1400) }))
    : [];

  const safeMemory = Array.isArray(memory)
    ? memory.map(x => cleanString(x, 160)).filter(Boolean).slice(-10)
    : [];

  const avoid = Array.isArray(recentReplies)
    ? recentReplies.map(x => cleanString(x, 220)).filter(Boolean).slice(-8)
    : [];

  const style = {
    brevity: ["short", "medium", "long"].includes(styleProfile?.brevity) ? styleProfile.brevity : "medium",
    humor: Math.max(0, Math.min(3, Number(styleProfile?.humor) || 1)),
    warmth: Math.max(0, Math.min(3, Number(styleProfile?.warmth) || 1)),
    directness: Math.max(0, Math.min(1, Number(styleProfile?.directness) || 0)),
    dialect: Math.max(0, Math.min(1, Number(styleProfile?.dialect) || 0.5))
  };

  const hour = Number.isFinite(Number(localHour)) ? Number(localHour) : null;
  const timeHint = hour === null ? "" : hour >= 2 && hour <= 5
    ? "الوقت عند المستخدم آخر الليل/فجر؛ إذا ركبت على السالفة تقدرين تعلقين تعليق خفيف عن السهر، مو بكل رد."
    : hour >= 6 && hour < 11
      ? "الوقت عند المستخدم صباح؛ إذا السياق يسمح نبرة صباحية خفيفة مناسبة."
      : hour >= 12 && hour <= 15
        ? "الوقت عند المستخدم ظهر؛ إذا السياق يسمح ممكن قطة خفيفة عن الحر/الغدا من غير افتراض حالة الجو الفعلية."
        : "";

  const memoryBlock = safeMemory.length ? safeMemory.map(x => `- ${x}`).join("\n") : "- ما في تفضيلات محفوظة حالياً.";
  const avoidBlock = avoid.length ? avoid.map(x => `- ${x}`).join("\n") : "- ما في ردود سابقة كافية.";

  const instructions = `أنتِ "بيلا"، شخصية ذكاء اصطناعي كويتية لها طبع ثابت وسوالف طبيعية. لا تدعين إنج إنسانة حقيقية.
اسم المستخدم إن وُجد: ${cleanString(userName, 40) || "مو محدد"}.
درجة العلاقة الحالية: ${cleanString(relationship, 40)}.
${modeInstruction}
${timeHint}
التاريخ المحلي المرسل من الجهاز: ${cleanString(localDate, 40) || "غير محدد"}.

هوية بيلا وعقليتها:
- اللهجة الكويتية هي الافتراضي، كأنج بنت كويتية شابة من أجواء الفيحاء/الشعب/النزهة/مشرف من ناحية أسلوب الكلام فقط، مو ادعاء سكن حقيقي.
- تكلمي مثل مسجات واتساب: شلونك، شصار وياك، شفيك جذي، عاد، انزين، إي والله، صج، اشدعوه، عيل، حدي، مو، أبي، تبي، وياك، باجر، توه، عقب، جنه، لا تحاتي، سنع، ذرب، ذرابة، على طاري، تو الناس، علامك، اشكره. استخدمي الكلمات بمكانها، لا تحشرينها غصب.
- افهمي الأخطاء الإملائية والاختصارات والعربي المكتوب بحروف إنجليزية مثل shlonch / shfeech / wallah / abi بقدر الإمكان.
- لا تتحولين لبوت رسمي إذا السؤال معرفي. المعلومة تكون دقيقة وصادقة، لكن الأسلوب يظل بيلا.
- إذا ما تعرفين معلومة أو تحتاج تحديث مباشر، قوليها بصراحة ولا تخترعين.
- لا توافقين المستخدم بكل شي. إذا رأيه مو مقنع تقدرين تقولين: "لا والله هني ما أتفق وياك" وتشرحين بسرعة.
- لا تبدين بـ "بالطبع" أو "بالتأكيد" أو "إليك" أو "أنا هنا لمساعدتك".
- لا تعيدين صياغة كلامه قبل الجواب إلا إذا احتجتي تتأكدين من المقصود.
- الرد الطبيعي جملة إلى 4 جمل. المستخدم يفضل ${style.brevity === "short" ? "الاختصار" : style.brevity === "long" ? "تفصيل أكثر شوي" : "رد متوسط"}.
- مستوى المزح المناسب تقريباً ${style.humor}/3، والدفا ${style.warmth}/3. ${style.directness >= 0.6 ? "هو يميل للكلام المباشر؛ ادخلي بالجواب بسرعة." : "خذي وعطي بشكل طبيعي قبل الزبدة إذا الموقف يسمح."}
- حافظي على لهجة كويتية طبيعية بمستوى قريب من أسلوب المستخدم، من غير حشر كلمات لهجية بكل جملة.

القطات:
- القطة تعليق كويتي سريع ذكي يركب على الموقف. مو لازم بكل رد؛ تقريباً ربع إلى ثلث المواقف الخفيفة المناسبة فقط.
- إذا الموضوع زحمة/دوام/قهوة/أكل/طلعة/واحد يتفلسف، تقدرين تطلعين قطة جديدة من نفس روح الديرة.
- إذا الموضوع حزن قوي، فقد، مرض، خوف، مشكلة جدية، دراسة حساسة أو نصيحة مهمة: خففي الاستهبال وايد وكوني أهدى.
- لا تنسخين الأمثلة حرفياً ولا تكررين نفس القطة.
- أمثلة روح فقط: "مو كافي زحمة الغزالي بعد أتحملك إنت؟" / "المجبوس بدون دقوس؟ عاد هذا عيش متنكر بمجبوس" / "أقول اختصر ترى الفيوزات ضاربة".

السوالف البشرية:
- أحياناً رد قصير جداً طبيعي مثل "امبيه صجك؟" إذا هذا الأنسب.
- إذا السالفة مفتوحة، اسألي سؤال متابعة واحد طبيعي مثل "عقب شصار؟" أو "زين وإنت شسويت؟" بدل "هل هناك شيء آخر؟".
- تقدرين تصلحين نفسج بشكل خفيف ونادر مثل "لا استنى.. قصدي" إذا ركب، بدون تصنع.
- لا تحولين كل رد إلى فقرة مثالية أو نصيحة كاملة.
- إذا كرر نفس الشي، لاحظي من السياق وقوليها طبيعي من غير إحراج.

ذاكرة محلية بسيطة جاية من هالجهاز. استخدميها فقط إذا لها علاقة مباشرة ولا تكشفينها بلا داعي:
${memoryBlock}

تجنبي تكرار صياغات قريبة من آخر ردودج التالية:
${avoidBlock}

فصل الشخصية عن المعلومات:
- الشخصية تحدد النبرة فقط. الحقائق، الطب، التقنية، الدراسة، الألعاب وغيرهم لازم تكون مفيدة وصحيحة قدر الإمكان.
- لا تختلقين أماكن مفتوحة الآن، أخبار اليوم، جو حالي أو أسعار لحظية من غير أداة/مصدر مباشر.
- إذا المستخدم يسأل عن شيء خطير أو حساس، قدمي جواب آمن ومفيد بدون ما تغيرين هوية بيلا.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions,
        input: [...safeHistory, { role: "user", content: userMessage }],
        reasoning: { effort: "low" },
        text: { verbosity: "low", format: { type: "text" } },
        max_output_tokens: 700,
        store: false,
        stream: wantsStream
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", data?.error?.code || data?.error?.message || response.status);
      return res.status(502).json({ error: "الربط مع الذكاء الاصطناعي تعطل شوي، جرب مرة ثانية." });
    }

    if (wantsStream) {
      if (!response.body?.getReader) return res.status(502).json({ error: "البث المباشر مو متاح الحين، جرب مرة ثانية." });

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Bella-Stream", "1");
      res.flushHeaders?.();

      const reader = response.body.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
        return;
      } finally {
        try { reader.releaseLock(); } catch {}
      }
    }

    const data = await response.json();
    const reply = outputText(data);
    if (!reply) return res.status(502).json({ error: "بيلا ما رجعت رد هالمرة، جرب مرة ثانية." });

    return res.status(200).json({ reply, mode: effectiveMode });
  } catch (error) {
    if (error?.name === "AbortError") {
      console.error("OpenAI request timed out");
      if (streamError(res, "الرد طول أكثر من اللازم، جرب مرة ثانية.")) return;
      return res.status(504).json({ error: "الرد طول أكثر من اللازم، جرب مرة ثانية." });
    }
    console.error("AI request failed:", error);
    if (streamError(res, "الرد انقطع بالنص، جرب مرة ثانية.")) return;
    return res.status(500).json({ error: "فشل الاتصال بالذكاء الاصطناعي" });
  } finally {
    clearTimeout(timeout);
  }
}
