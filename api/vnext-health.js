function textFrom(data) {
  const parts = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item.content || []) if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
  }
  return parts.join("\n").trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const apiKey = process.env.OPENAI_API_KEY;
  const result = { syntax: false, chat: null, dira: null };

  try {
    const js = await fetch("https://raw.githubusercontent.com/fessl5pp/fessl5pp.github.io/main/bella-vnext.js", { cache: "no-store" }).then(r => r.text());
    new Function(js);
    result.syntax = true;
  } catch (e) {
    result.syntaxError = String(e?.message || e);
  }

  if (!apiKey) return res.status(500).json({ ok: false, error: "missing_key", ...result });

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-5-mini", input: "رد بكلمة: شغال", reasoning: { effort: "low" }, max_output_tokens: 40, store: false })
    });
    const data = await r.json().catch(() => ({}));
    result.chat = { status: r.status, ok: r.ok, reply: textFrom(data) || null, error: data?.error?.code || data?.error?.message || null };
  } catch (e) {
    result.chat = { status: 0, ok: false, error: String(e?.message || e) };
  }

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-5-mini", tools: [{ type: "web_search_preview" }], input: "ابحث عن معلومة حديثة خفيفة عن الكويت ورد بسطر واحد.", reasoning: { effort: "low" }, max_output_tokens: 120, store: false })
    });
    const data = await r.json().catch(() => ({}));
    result.dira = { status: r.status, ok: r.ok, reply: textFrom(data)?.slice(0, 180) || null, error: data?.error?.code || data?.error?.message || null };
  } catch (e) {
    result.dira = { status: 0, ok: false, error: String(e?.message || e) };
  }

  const ok = result.syntax && result.chat?.ok && result.dira?.ok;
  return res.status(ok ? 200 : 500).json({ ok, ...result });
}
