export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const base = `${proto}://${host}`;
  const result = { syntax: false, chat: null, dira: null };

  try {
    const js = await fetch(`${base}/bella-vnext.js?v=5`).then(r => r.text());
    new Function(js);
    result.syntax = true;
  } catch (e) {
    result.syntaxError = String(e?.message || e);
  }

  try {
    const r = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "شلونج؟ ردي رد كويتي قصير", mode: "chill", history: [], memory: [], relationship: "تو نعرف بعض", recentReplies: [] })
    });
    const data = await r.json().catch(() => ({}));
    result.chat = { status: r.status, ok: r.ok, reply: data.reply || null, error: data.error || null };
  } catch (e) {
    result.chat = { status: 0, ok: false, error: String(e?.message || e) };
  }

  try {
    const r = await fetch(`${base}/api/dira`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "فعاليات خفيفة بالكويت" })
    });
    const data = await r.json().catch(() => ({}));
    result.dira = { status: r.status, ok: r.ok, reply: data.reply?.slice(0, 180) || null, sources: Array.isArray(data.sources) ? data.sources.length : 0, error: data.error || null };
  } catch (e) {
    result.dira = { status: 0, ok: false, error: String(e?.message || e) };
  }

  const ok = result.syntax && result.chat?.ok && result.dira?.ok;
  return res.status(ok ? 200 : 500).json({ ok, ...result });
}
