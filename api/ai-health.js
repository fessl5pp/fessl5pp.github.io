export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, reason: "missing_key" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: "رد فقط بكلمة: شغال",
        reasoning: { effort: "low" },
        text: { verbosity: "low", format: { type: "text" } },
        max_output_tokens: 200
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ ok: false, reason: data?.error?.code || data?.error?.message || "openai_error" });
    }

    const parts = [];
    for (const item of data.output || []) {
      if (item?.type !== "message") continue;
      for (const part of item.content || []) {
        if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
      }
    }

    const sample = parts.join("\n").trim();
    return res.status(sample ? 200 : 502).json({ ok: Boolean(sample), sample: sample || null, status: data.status || null });
  } catch (error) {
    return res.status(500).json({ ok: false, reason: "network_error" });
  }
}
