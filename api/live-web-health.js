export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: "missing_key" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-5-mini",
        tools: [{ type: "web_search", search_context_size: "low" }],
        tool_choice: "required",
        input: "Search the web for today's date in Kuwait and reply with only the date.",
        reasoning: { effort: "low" },
        text: { verbosity: "low", format: { type: "text" } },
        max_output_tokens: 80,
        store: false
      })
    });
    const data = await response.json().catch(() => ({}));
    const usedWeb = Array.isArray(data?.output) && data.output.some(item => item?.type === "web_search_call");
    return res.status(response.ok && usedWeb ? 200 : 502).json({
      ok: response.ok && usedWeb,
      status: response.status,
      usedWeb,
      error: data?.error?.code || data?.error?.message || null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.name || "failed" });
  } finally {
    clearTimeout(timer);
  }
}
