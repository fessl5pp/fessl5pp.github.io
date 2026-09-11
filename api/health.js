import { requireBellaOwner } from "../lib/bella-owner-access.js";

const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const CHECK_TIMEOUT_MS = 3000;

async function timedCheck(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, latencyMs: Date.now() - started, detail };
  } catch (error) {
    return { name, ok: false, latencyMs: Date.now() - started, error: String(error?.message || error || "unknown").slice(0, 180) };
  }
}

async function supabaseRpc(name, token, payload = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `${name} HTTP ${response.status}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function ownerDiagnosticsRequested(req) {
  if (String(req?.query?.owner || "") === "1") return true;
  try { return new URL(req.url || "/", "https://bella.local").searchParams.get("owner") === "1"; }
  catch { return false; }
}

async function ownerDiagnostics(req, res) {
  const owner = await requireBellaOwner(req, res);
  if (!owner) return;

  const [controlPlane, persona, ownerState] = await Promise.all([
    timedCheck("control_plane", async () => {
      const data = await supabaseRpc("bella_public_ops_v21", owner.token, { p_subject: "diagnostics-owner" });
      const row = Array.isArray(data) ? data[0] || {} : data || {};
      return {
        featureCount: Object.keys(row.feature_flags || {}).length,
        season: row.current_season?.name || null,
        personaRevision: Number(row.persona_style?.revision || 0)
      };
    }),
    timedCheck("persona_runtime", async () => {
      const data = await supabaseRpc("bella_public_persona_server_v20", owner.token, {});
      const row = Array.isArray(data) ? data[0] || {} : data || {};
      return { enabled: row.enabled !== false, revision: Number(row.revision || 0) };
    }),
    timedCheck("owner_rpc", async () => {
      const data = await supabaseRpc("bella_owner_ops_v20", owner.token, {});
      const row = Array.isArray(data) ? data[0] || {} : data || {};
      return { readable: !!row.feature_flags };
    })
  ]);

  const checks = [
    controlPlane,
    persona,
    ownerState,
    {
      name: "openai_config",
      ok: Boolean(process.env.OPENAI_API_KEY),
      latencyMs: 0,
      detail: { configured: Boolean(process.env.OPENAI_API_KEY) }
    },
    {
      name: "vercel_runtime",
      ok: true,
      latencyMs: 0,
      detail: {
        environment: process.env.VERCEL_ENV || "unknown",
        region: process.env.VERCEL_REGION || null,
        commit: String(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) || null
      }
    }
  ];

  const failed = checks.filter(check => !check.ok).length;
  return res.status(failed ? 207 : 200).json({
    status: failed ? "degraded" : "ok",
    release: "v21-control-plane",
    checkedAt: new Date().toISOString(),
    failed,
    checks
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Bella-Release", "v21");

  if (req.method === "HEAD") return res.status(204).end();
  if (ownerDiagnosticsRequested(req)) return ownerDiagnostics(req, res);

  const commit = String(process.env.VERCEL_GIT_COMMIT_SHA || "unknown").slice(0, 12);
  const environment = String(process.env.VERCEL_ENV || "unknown");
  return res.status(200).json({
    ok: true,
    app: "Bella",
    release: "v21",
    controlPlane: "v21",
    commit,
    environment,
    timestamp: new Date().toISOString()
  });
}
