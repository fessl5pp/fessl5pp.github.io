import { requireBellaOwner } from "../lib/bella-owner-access.js";

const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const CHECK_TIMEOUT_MS = 3000;

async function timedCheck(name, fn) {
  const started = Date.now();
  try { return { name, ok: true, latencyMs: Date.now() - started, detail: await fn() }; }
  catch (error) { return { name, ok: false, latencyMs: Date.now() - started, error: String(error?.message || error || "unknown").slice(0, 180) }; }
}

async function supabaseRpc(name, token, payload = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `${name} HTTP ${response.status}`);
    return data;
  } finally { clearTimeout(timeout); }
}

function ownerDiagnosticsRequested(req) {
  if (String(req?.query?.owner || "") === "1") return true;
  try { return new URL(req.url || "/", "https://bella.local").searchParams.get("owner") === "1"; }
  catch { return false; }
}

async function ownerDiagnostics(req, res) {
  const owner = await requireBellaOwner(req, res);
  if (!owner) return;

  const [controlPlane, persona, ownerState, resilience, adaptiveBrain, semanticMemory] = await Promise.all([
    timedCheck("control_plane", async () => {
      const data = await supabaseRpc("bella_public_ops_v21", owner.token, { p_subject: "diagnostics-owner" });
      const row = Array.isArray(data) ? data[0] || {} : data || {};
      return { featureCount: Object.keys(row.feature_flags || {}).length, season: row.current_season?.name || null, personaRevision: Number(row.persona_style?.revision || 0) };
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
    }),
    timedCheck("resilience_v22", async () => {
      const data = await supabaseRpc("bella_owner_resilience_v22", owner.token, { p_event_limit: 5 });
      const row = Array.isArray(data) ? data[0] || {} : data || {};
      return {
        safeMode: row.resilience_config?.safe_mode === true,
        telemetryEnabled: row.resilience_config?.telemetry_enabled !== false,
        telemetrySamplePercent: Number(row.resilience_config?.telemetry_sample_percent ?? 0),
        experimentCount: Array.isArray(row.experiments) ? row.experiments.length : 0,
        recentEventCount: Array.isArray(row.latest_events) ? row.latest_events.length : 0
      };
    }),
    timedCheck("adaptive_brain_v23", async () => {
      const data = await supabaseRpc("bella_owner_quality_metrics_v23", owner.token, { p_days: 14 });
      const rows = Array.isArray(data) ? data : [];
      return { correctionBuckets: rows.length, correctionSignals: rows.reduce((sum, row) => sum + Math.max(0, Number(row.event_count) || 0), 0) };
    }),
    timedCheck("semantic_memory_v24", async () => {
      const data = await supabaseRpc("bella_memory_hybrid_search_v24", owner.token, {
        p_query_text: "diagnostics",
        p_query_embedding: null,
        p_match_count: 1
      });
      return { reachable: Array.isArray(data), model: "text-embedding-3-small", dimensions: 512, retrieval: "hybrid-exact+semantic" };
    })
  ]);

  const checks = [controlPlane, persona, ownerState, resilience, adaptiveBrain, semanticMemory,
    { name: "openai_config", ok: Boolean(process.env.OPENAI_API_KEY), latencyMs: 0, detail: { configured: Boolean(process.env.OPENAI_API_KEY) } },
    { name: "vercel_runtime", ok: true, latencyMs: 0, detail: { environment: process.env.VERCEL_ENV || "unknown", region: process.env.VERCEL_REGION || null, commit: String(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) || null } }
  ];

  const failed = checks.filter(check => !check.ok).length;
  return res.status(failed ? 207 : 200).json({ status: failed ? "degraded" : "ok", release: "v24-semantic-memory", checkedAt: new Date().toISOString(), failed, checks });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Bella-Release", "v24");
  if (req.method === "HEAD") return res.status(204).end();
  if (ownerDiagnosticsRequested(req)) return ownerDiagnostics(req, res);

  const commit = String(process.env.VERCEL_GIT_COMMIT_SHA || "unknown").slice(0, 12);
  const environment = String(process.env.VERCEL_ENV || "unknown");
  return res.status(200).json({
    ok: true,
    app: "Bella",
    release: "v24",
    controlPlane: "v21",
    resilienceLab: "v22",
    adaptiveBrain: "v23",
    semanticMemory: "v24",
    hybridContext: "v24",
    contextualDialect: "v24",
    commit,
    environment,
    timestamp: new Date().toISOString()
  });
}
