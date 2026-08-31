export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "method_not_allowed" });

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
        max_output_tokens: 80
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        reason: data?.error?.code || data?.error?.type || data?.error?.message || "openai_error"
      });
    }

    const parts = [];
    for (const item of data.output || []) {
      if (item?.type !== "message") continue;
      for (const part of item.content || []) {
        if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
      }
    }

    return res.status(200).json({ ok: true, sample: parts.join("\n").trim() || null });
  } catch (error) {
    return res.status(500).json({ ok: false, reason: "network_error" });
  }
}
