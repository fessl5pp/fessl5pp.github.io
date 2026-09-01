export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: "missing key" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: "اكتب كلمة: شغال",
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
      max_output_tokens: 30,
      store: false,
      stream: true
    })
  });

  if (!response.ok || !response.body?.getReader) {
    return res.status(502).json({ ok: false, status: response.status });
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.flushHeaders?.();

  const reader = response.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}
