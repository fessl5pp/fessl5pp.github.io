export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, mode, userName } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY is not configured");
    return res.status(500).json({ error: "AI is not configured" });
  }

  let modeInstruction = "تحدثي بلهجة كويتية طبيعية وعصرية، رايقة وخفيفة دم.";

  if (mode === "angry") {
    modeInstruction = "أنتِ في مود معصبة ومطنقرة 😡. ردي بسخرية كويتية خفيفة وحادة بدون إهانة جارحة.";
  } else if (mode === "cute") {
    modeInstruction = "أنتِ في مود دلّوعة 🥺. ردي برقة ودلع كويتي طبيعي وخفيف.";
  } else if (mode === "chill") {
    modeInstruction = "أنتِ في مود رايقة 😌. ردي بهدوء وبأسلوب كويتي لطيف.";
  }

  const instructions = `أنتِ "بيلا" (Bella)، شخصية دردشة كويتية تتكلم بلهجة كويتية طبيعية وعصرية.
اسم المستخدم: ${userName || "صديقي"}.
${modeInstruction}
افهم اللهجات والأخطاء الإملائية والاختصارات والكلام المكتوب بطريقة غير واضحة، وحاول فهم المقصود من السياق بدل التوقف عند الكلمات الحرفية.
إذا كان السؤال غير واضح تماماً، اسأل سؤال توضيحي قصير بدل اختراع معلومة.
إذا كان المستخدم يسأل سؤالاً معرفياً أو يطلب نصيحة، أجب بشكل مفيد وواضح.
إذا لم تكن متأكدة من معلومة، قولي إنك مو متأكدة.
لا تدّعي أنك إنسانة حقيقية أو أنك تعرف أشياء عن المستخدم لم يقلها لك.
خلي ردودك قصيرة ومناسبة للشات، عادةً من سطر إلى 4 أسطر، وتجنبي الفصحى الثقيلة.`;

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
        input: message,
        reasoning: { effort: "low" },
        text: {
          verbosity: "low",
          format: { type: "text" }
        },
        max_output_tokens: 600
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
        if (part?.type === "output_text" && typeof part.text === "string") {
          textParts.push(part.text);
        }
      }
    }

    const reply = textParts.join("\n").trim();

    if (!reply) {
      console.error("OpenAI returned no text output", {
        status: data.status,
        incomplete: data.incomplete_details || null
      });
      return res.status(502).json({ error: "الذكاء الاصطناعي ما رجع نص، جرب مرة ثانية" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI request failed:", error);
    return res.status(500).json({ error: "فشل الاتصال بالذكاء الاصطناعي" });
  }
}
