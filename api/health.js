export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const commit = String(process.env.VERCEL_GIT_COMMIT_SHA || "unknown").slice(0, 12);
  const environment = String(process.env.VERCEL_ENV || "unknown");

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Bella-Release", "v15");

  if (req.method === "HEAD") return res.status(204).end();

  return res.status(200).json({
    ok: true,
    app: "Bella",
    release: "v15",
    commit,
    environment,
    timestamp: new Date().toISOString()
  });
}
