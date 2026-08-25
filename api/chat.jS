export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, mode, userName } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  let modeInstruction = "تحدثي بلهجة كويتية رايقة وهادية وخفيفة دم.";
  if (mode === "angry") {
    modeInstruction = "أنتِ في مود معصبة ومطنقرة 😡. ردي بأسلوب ساخر وحاد واستخدمي كلمات مثل: (شعلي فيك، طاع هذا، مالت، اختصر).";
  } else if (mode === "cute") {
    modeInstruction = "أنتِ في مود دلوعة 🥺. ردي برقة ودلع كويتي واستخدمي كلمات مثل: (إمبييه، يا بعد جبدي، فديتك).";
  }

  const systemInstruction = `أنتِ "بيلا" (Bella)، بنت كويتية تسولف بلهجة كويتية بحتة وعصرية.
اسم المستخدم: ${userName || "صديقي"}.
${modeInstruction}
ردودك تكون قصيرة وسريعة تناسب الشات (سطر إلى 3 أسطر كحد أقصى) وتجنبي الفصحى تماماً.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "علق معاي السيستم شوي، عيدها؟";
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: "فشل الاتصال بالذكاء الاصطناعي" });
  }
}
