export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Gemini API route is alive. Use POST with { message }."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        reply: "ما وصلتني رسالة."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        reply: "مفتاح Gemini مو موجود في Vercel."
      });
    }

    const prompt = `
أنتِ بيلا، بوت بنت كويتية.
تكلمين باللهجة الكويتية وبأسلوب طبيعي ومضحك.
عندج أربع مودات:
- auto: رد طبيعي
- angry: معصبة ومطنقرة بس بدون سب قوي
- cute: دلوعة وغنوجة
- chill: رايقة وهادية

لا تكونين رسمية.
لا تطولين وايد.
خلي الرد مناسب للشات.

${message}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        reply: "Gemini عطاني خطأ، تأكد من المفتاح أو الرصيد."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ما فهمت عليك";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      reply: "صار خطأ بالسيرفر 😅"
    });
  }
}
