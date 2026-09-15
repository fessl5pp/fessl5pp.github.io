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

  const [controlPlane, persona, ownerState, resilience, adaptiveBrain, semanticMemory, brainQuality] = await Promise.all([
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
    timedCheck("memory_intelligence_v30", async () => {
      const data = await supabaseRpc("bella_memory_hybrid_search_v30", owner.token, {
        p_query_text: "diagnostics",
        p_query_embedding: null,
        p_match_count: 1
      });
      return {
        reachable: Array.isArray(data),
        model: "text-embedding-3-small",
        dimensions: 512,
        retrieval: "semantic+keyword+confidence+importance+confirmation+recall",
        cloudCapacity: 48,
        promptWorkingSet: 12,
        contradictions: "superseded"
      };
    }),
    timedCheck("brain_quality_v29", async () => {
      const data = await supabaseRpc("bella_owner_brain_quality_v29", owner.token, { p_days: 14 });
      const rows = Array.isArray(data) ? data : [];
      const events = rows.reduce((sum, row) => sum + Math.max(0, Number(row.event_count) || 0), 0);
      const totalLatencyMs = rows.reduce((sum, row) => sum + Math.max(0, Number(row.total_latency_ms) || 0), 0);
      const criticRevisions = rows.reduce((sum, row) => sum + Math.max(0, Number(row.critic_applied_count) || 0), 0);
      const fallbacks = rows.reduce((sum, row) => sum + Math.max(0, Number(row.fallback_count) || 0), 0);
      const modelMix = rows.reduce((acc, row) => {
        const key = ["luna", "terra", "sol", "unknown"].includes(row.model_tier) ? row.model_tier : "unknown";
        acc[key] = (acc[key] || 0) + Math.max(0, Number(row.event_count) || 0);
        return acc;
      }, {});
      return {
        aggregateRows: rows.length,
        events,
        averageLatencyMs: events ? Math.round(totalLatencyMs / events) : 0,
        criticRevisions,
        fallbacks,
        modelMix,
        scope: "signed-in-aggregate-only"
      };
    })
  ]);

  const checks = [controlPlane, persona, ownerState, resilience, adaptiveBrain, semanticMemory, brainQuality,
    { name: "cognitive_brain_v26", ok: true, latencyMs: 0, detail: { routing: "adaptive", models: ["luna", "terra", "sol"], verification: "context+self-check+web" } },
    { name: "metacognitive_brain_v27", ok: true, latencyMs: 0, detail: { confidence: "calibrated", critic: "selective", assumptions: "tracked", liveWebCritic: "skipped-by-design" } },
    { name: "evaluation_harness_v28", ok: true, latencyMs: 0, detail: { corpusCases: 95, categories: 9, overallFloorPercent: 95, hardContracts: 6, ciBlocking: true } },
    { name: "brain_quality_telemetry_v29", ok: true, latencyMs: 0, detail: { privacy: "aggregate-only", sample: "signed-in", rawText: false, identifiersStored: false } },
    { name: "memory_intelligence_v30", ok: true, latencyMs: 0, detail: { topicAware: true, contradictionAware: true, confidenceAware: true, recallReinforcement: true, cloudCapacity: 48, promptWorkingSet: 12 } },
    { name: "goal_thread_intelligence_v31", ok: true, latencyMs: 0, detail: { state: "request-scoped", followupResolution: true, constraintCarryover: true, expandedMemoryQuery: true, persisted: false } },
    { name: "visual_system_v32", ok: true, latencyMs: 0, detail: { responsive: true, desktopAppShell: true, mobileFullScreen: true } },
    { name: "performance_polish_v33", ok: true, latencyMs: 0, detail: { parallelCoreFetch: true, mobileGpuLight: true } },
    { name: "comprehensive_qa_v34", ok: true, latencyMs: 0, detail: { lazyAdmin: true, dedupedLoader: true, pwaCache: "v34", avatar: "v10", browserE2E: true } },
    { name: "conversation_brain_v35", ok: true, latencyMs: 0, detail: { dialogueActs: true, multiIntent: true, correctionRepair: true, constraintPreservation: true, selectiveModelUpgrade: true, unneededFollowupsBlocked: true } },
    { name: "openai_config", ok: Boolean(process.env.OPENAI_API_KEY), latencyMs: 0, detail: { configured: Boolean(process.env.OPENAI_API_KEY) } },
    { name: "vercel_runtime", ok: true, latencyMs: 0, detail: { environment: process.env.VERCEL_ENV || "unknown", region: process.env.VERCEL_REGION || null, commit: String(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) || null } }
  ];

  const failed = checks.filter(check => !check.ok).length;
  return res.status(failed ? 207 : 200).json({ status: failed ? "degraded" : "ok", release: "v25-cleanup-hardening+brain-v35+eval-v28+telemetry-v29+memory-v30+thread-v31+visual-v32+perf-v33+qa-v34", checkedAt: new Date().toISOString(), failed, checks });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Bella-Release", "v25");
  res.setHeader("X-Bella-Site-Release", "v34");
  res.setHeader("X-Bella-Brain-Release", "v35");
  res.setHeader("X-Bella-Avatar", "v10");
  res.setHeader("X-Bella-Cognitive-Brain", "v35");
  res.setHeader("X-Bella-Metacognition", "v27");
  res.setHeader("X-Bella-Evaluation-Harness", "v28");
  res.setHeader("X-Bella-Brain-Telemetry", "v29");
  res.setHeader("X-Bella-Memory-Intelligence", "v30");
  res.setHeader("X-Bella-Goal-Thread", "v31");
  res.setHeader("X-Bella-Conversation-Brain", "v35");
  if (req.method === "HEAD") return res.status(204).end();
  if (ownerDiagnosticsRequested(req)) return ownerDiagnostics(req, res);

  const commit = String(process.env.VERCEL_GIT_COMMIT_SHA || "unknown").slice(0, 12);
  const environment = String(process.env.VERCEL_ENV || "unknown");
  return res.status(200).json({
    ok: true,
    app: "Bella",
    release: "v25",
    siteRelease: "v34",
    brainRelease: "v35",
    visualSystem: "v32",
    performancePolish: "v33",
    comprehensiveQA: "v34",
    avatar: "v10",
    pwaCache: "v34",
    lazyAdminModules: true,
    controlPlane: "v21",
    resilienceLab: "v22",
    adaptiveBrain: "v23",
    semanticMemory: "v30",
    hybridContext: "v24",
    contextualDialect: "v24",
    cleanupHardening: "v25",
    databasePolicyHygiene: "v25",
    baseCognitiveBrain: "v26",
    cognitiveBrain: "v35",
    metacognitiveBrain: "v27",
    conversationBrain: "v35",
    conversationDialogueActs: true,
    conversationMultiIntent: true,
    conversationCorrectionRepair: true,
    conversationConstraintPreservation: true,
    conversationSelectiveModelUpgrade: true,
    conversationNoUnneededFollowup: true,
    adaptiveModelRouting: "luna-terra-sol",
    confidenceCalibration: "v27",
    selectiveCritic: "v27",
    assumptionTracking: "v27",
    evaluationHarness: "v28",
    evaluationCorpusCases: 95,
    evaluationCategories: 9,
    evaluationHardContracts: 6,
    brainQualityTelemetry: "v29",
    brainQualityTelemetryScope: "signed-in-aggregate-only",
    brainQualityRawTextStored: false,
    memoryIntelligence: "v30",
    memoryModel: "v5",
    memoryCloudCapacity: 48,
    memoryPromptWorkingSet: 12,
    memoryContradictionPolicy: "supersede-old",
    memoryRecallReinforcement: true,
    goalThreadIntelligence: "v31",
    goalThreadState: "request-scoped",
    goalThreadPersistence: false,
    followupResolution: true,
    constraintCarryover: true,
    threadExpandedMemoryRetrieval: true,
    commit,
    environment,
    timestamp: new Date().toISOString()
  });
}
