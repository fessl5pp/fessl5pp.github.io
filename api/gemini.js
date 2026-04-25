export default async function handler(req, res) {
  const { message } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `رد بأسلوب بنت كويتية اسمها بيلا، لهجتها كويتية، شخصيتها تعتمد على المود (معصبة، دلوعة، رايقة، أوتو)، لا تكون رسمي:\n\n${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ما فهمت عليك";

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ reply: "صار خطأ 😅" });
  }
}
