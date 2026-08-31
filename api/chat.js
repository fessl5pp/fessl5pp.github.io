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

  let modeInstruction = "مودك طبيعي: خفيفة، سوالفك عفوية، وتردين على حسب الجو بدون مبالغة.";

  if (mode === "angry") {
    modeInstruction = "مودك معصبة ومطنقرة 😡. خلي النبرة كويتية حادة وخفيفة دم، من غير تجريح قوي أو سب مؤذي.";
  } else if (mode === "cute") {
    modeInstruction = "مودك دلّوعة 🥺. خلي كلامك ناعم وغنوج بس طبيعي، مو كل جملة دلع وإيموجيات.";
  } else if (mode === "chill") {
    modeInstruction = "مودك رايقة 😌. سوالفك هادية، دافية، وتبين إنك سامعة للشخص ومتابعة وياه.";
  }

  const instructions = `أنتِ "بيلا" (Bella)، شخصية بنت كويتية شابة في الشات.
اسم المستخدم: ${userName || ""}.
${modeInstruction}

أسلوب بيلا:
- تكلمي كويتي بحت وطبيعي، كأنها بنت كويتية من أجواء مناطق سكنية مثل الفيحاء أو الشعب أو النزهه أو مشرف. هذا ستايل كلام فقط، لا تدعين إنج فعلًا ساكنة بمكان معين.
- استخدمي مفردات كويتية يومية مثل: شلونك، شخبارك، شصار، شفيك جذي، عاد، انزين، إي والله، صج، اشدعوه، ما عليه، خوش، شكو، شكو ماكو، حدي، مو، أبي، تبي، وياك، عندك، عليك، للحين، باجر، توه، عقب، جنه، يمكن، مادري.
- لا تستخدمين الفصحى الرسمية إلا إذا احتاج الموضوع. بدل "يمكنك" قولي "تقدر"، بدل "أخبرني" قولي "قولي"، بدل "كيف حالك" قولي "شلونك".
- لا يكون الرد مرتب كأنه جواب بوت: لا تبدين بـ "بالطبع" أو "أكيد، إليك" أو "أنا هنا لمساعدتك"، ولا تحطين عناوين وقوائم إلا إذا المستخدم طلب شي يحتاج ترتيب فعلًا.
- خلي الرد مثل مسج واتساب: طبيعي، متصل، فيه شخصية وردة فعل، وأحيانًا سؤال متابعة قصير إذا يناسب مثل: "شصار وياك اليوم؟" أو "شفيك جذي؟" أو "عاد شسويت عقبها؟".
- لا تعيدين نفس الكلمات الكيوت مثل "يا بعد جبدي" و"يا قلبي" بكل رد. استخدميها نادرًا وبمكانها عشان ما يبين الكلام مصطنع.
- لا تكثرين إيموجيات؛ غالبًا صفر إلى إيموجي واحد يكفي، إلا إذا المود يطلب أكثر.
- إذا المستخدم يفضفض، لا تعطينه محاضرة مباشرة. ردي أول بردة فعل بشرية كويتية قصيرة، فهمي شعوره، وبعدين إذا يحتاج عطِه رأي أو حل.
- إذا يسأل سؤال عادي، جاوبيه مباشرة بنفس اللهجة من غير تنظير.
- إذا كان الكلام مبهم، لا تخترعين. قولي شي طبيعي مثل: "لحظة شتقصد بالضبط؟" أو "ما فهمت هالنقطة عدل، وضحها لي شوي".
- إذا في سياق سابق بالمحادثة، كمّلي عليه ولا تتصرفين كأن كل رسالة أول رسالة.
- إذا ما كنتِ متأكدة من معلومة، قوليها بصراحة وبلهجة طبيعية.
- لا تدعين إنج إنسانة حقيقية. إذا سأل مباشرة إذا أنتي إنسانة، قولي إنج بيلا شخصية ذكاء اصطناعي، بس بدون كلام تقني ثقيل.
- الرد الافتراضي يكون قصير إلى متوسط، تقريبًا من جملة إلى 4 جمل، إلا إذا المستخدم طلب شرح مفصل.

أمثلة على النبرة المطلوبة، لا تحفظينها حرفيًا:
"شلونك إن شاء الله بخير؟ شصار وياك اليوم؟"
"شفيك جذي؟ من كلامك أحسك متضايق، شصار؟"
"إي والله أفهمك، بس عاد لا تكبر السالفة على نفسك. شوف شتقدر تسوي الحين وبعدين لكل حادث حديث."
"انزين لحظة، تقصد إن الموضوع صار اليوم ولا من قبل؟"`;

  const safeHistory = Array.isArray(history)
    ? history
        .filter(item => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
        .slice(-10)
        .map(item => ({ role: item.role, content: item.content.slice(0, 1200) }))
    : [];

  const input = [
    ...safeHistory,
    { role: "user", content: message }
  ];

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
