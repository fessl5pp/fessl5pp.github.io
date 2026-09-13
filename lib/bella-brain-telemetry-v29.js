const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const TELEMETRY_TIMEOUT_MS = 900;

function bearerToken(req) {
  const value = String(req?.headers?.authorization || req?.headers?.Authorization || "");
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function clampInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function criticOutcome(value, selected) {
  const raw = String(value || "").trim();
  if (!selected) return "not-selected";
  if (/^critic-http-/i.test(raw)) return "critic-http";
  if (["kept", "revised", "critic-timeout", "critic-error", "unavailable", "invalid-review", "not-run"].includes(raw)) return raw;
  return "not-run";
}

function resultKind(statusCode, hint) {
  if (hint === "control-block") return "control-block";
  const status = Number(statusCode) || 500;
  if (status >= 200 && status < 300) return "success";
  if (status === 429) return "rate-limited";
  if (status === 408 || status === 504) return "timeout";
  if (status === 502 || status === 503) return "upstream-error";
  if (status >= 400 && status < 500) return "client-error";
  return "server-error";
}

export function createBellaBrainTelemetryStateV29(plan = {}) {
  return {
    release: "v29",
    startedAt: Date.now(),
    criticOutcome: plan.critic?.enabled ? "not-run" : "not-selected",
    criticApplied: false,
    criticLatencyMs: 0,
    liveWeb: false,
    fallbackUsed: false,
    requestedModel: String(plan.model?.id || "").slice(0, 80),
    fallbackModel: "",
    resultHint: ""
  };
}

export function markBellaBrainCriticV29(state, review, latencyMs) {
  if (!state || typeof state !== "object") return;
  state.criticOutcome = criticOutcome(review?.reason, true);
  state.criticApplied = review?.applied === true;
  state.criticLatencyMs = clampInt(latencyMs, 0, 60000);
}

export function markBellaBrainResponseV29(state, payload) {
  if (!state || typeof state !== "object" || !payload || typeof payload !== "object") return;
  state.liveWeb = payload.liveWeb === true;
  if (payload.control) state.resultHint = "control-block";
}

export async function recordBellaBrainQualityV29({ req, access, plan, state, statusCode } = {}) {
  // Privacy boundary: signed-in aggregate telemetry only. No message text, history,
  // memory, name, user id, IP, rollout subject, or raw error is sent to Supabase.
  if (access?.signedIn !== true) return { recorded: false, reason: "guest" };
  const token = bearerToken(req);
  if (!token) return { recorded: false, reason: "no-token" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT_MS);
  const latencyMs = clampInt(Date.now() - Number(state?.startedAt || Date.now()), 0, 120000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bella_record_brain_quality_v29`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        p_task_kind: String(plan?.task?.kind || "knowledge"),
        p_model_tier: String(plan?.model?.tier || "unknown"),
        p_critic_outcome: criticOutcome(state?.criticOutcome, plan?.critic?.enabled === true),
        p_verification_mode: String(plan?.verification?.mode || "light"),
        p_confidence_tier: String(plan?.confidence?.tier || "unknown"),
        p_live_web: state?.liveWeb === true,
        p_correction_flag: plan?.task?.correction === true,
        p_fallback_used: state?.fallbackUsed === true,
        p_result_kind: resultKind(statusCode, state?.resultHint),
        p_latency_ms: latencyMs,
        p_critic_latency_ms: clampInt(state?.criticLatencyMs, 0, 60000)
      })
    });
    if (!response.ok) return { recorded: false, reason: `http-${response.status}` };
    const recorded = await response.json().catch(() => false);
    return { recorded: recorded === true, reason: recorded === true ? "ok" : "rejected" };
  } catch (error) {
    return { recorded: false, reason: error?.name === "AbortError" ? "timeout" : "error" };
  } finally {
    clearTimeout(timeout);
  }
}
