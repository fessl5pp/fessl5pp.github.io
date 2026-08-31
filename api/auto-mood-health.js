export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${host}/api/chat`;
  const cases = [
    { name: "angry", message: "يا غبية شفيج" },
    { name: "cute", message: "احبج والله يا حلاتج" },
    { name: "happy", message: "ههههه كفو والله ضبطت" },
    { name: "neutral", message: "خلنا نسولف بهدوء شوي" }
  ];
  const results = [];
  for (const item of cases) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: item.message, mode: "chill", history: [] })
      });
      const data = await r.json().catch(() => ({}));
      results.push({ name: item.name, status: r.status, mode: data.mode || null, reply: data.reply || null, error: data.error || null });
    } catch (e) {
      results.push({ name: item.name, status: 0, mode: null, error: "network_error" });
    }
  }
  const ok = results.every(x => x.status === 200) &&
    results.find(x => x.name === "angry")?.mode === "angry" &&
    results.find(x => x.name === "cute")?.mode === "cute" &&
    results.find(x => x.name === "happy")?.mode === "auto" &&
    results.find(x => x.name === "neutral")?.mode === "chill";
  return res.status(ok ? 200 : 500).json({ ok, results });
}
