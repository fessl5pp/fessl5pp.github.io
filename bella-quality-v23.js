(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const COOLDOWN_MS = 30000;
  const sent = new Map();
  let sentCount = 0;
  let lastSignal = null;

  function token() {
    try { return String(JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.access_token || ""); }
    catch { return ""; }
  }

  function clamp(value) { return Math.max(0, Math.min(100, Number(value) || 0)); }
  function bucket(value) { return Math.min(4, Math.floor(clamp(value) / 25)); }

  function normalizeKind(value) {
    const kind = String(value || "correction").toLowerCase();
    return ["explicit_wrong", "clarification", "negation", "correction"].includes(kind) ? kind : "correction";
  }

  function normalizeStage(value) {
    const stage = String(value || "new").toLowerCase();
    return ["new", "familiar", "friends", "close"].includes(stage) ? stage : "new";
  }

  async function recordCorrection(kind = "correction", relationship = {}) {
    if (navigator.onLine === false) return false;
    const vector = relationship?.vector || relationship?.relationshipVector || relationship || {};
    const stage = normalizeStage(relationship?.stage || vector?.stage);
    const safeKind = normalizeKind(kind);
    const f = bucket(vector?.familiarity);
    const w = bucket(vector?.warmth);
    const p = bucket(vector?.playfulness);
    const key = `${safeKind}|${stage}|${f}|${w}|${p}`;
    const now = Date.now();
    if (now - Number(sent.get(key) || 0) < COOLDOWN_MS) return false;
    sent.set(key, now);

    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    const accessToken = token();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bella_record_quality_metric_v23`, {
        method: "POST",
        headers,
        keepalive: true,
        body: JSON.stringify({
          p_signal_kind: safeKind,
          p_relationship_stage: stage,
          p_familiarity_bucket: f,
          p_warmth_bucket: w,
          p_playfulness_bucket: p
        })
      });
      if (!response.ok) return false;
      sentCount += 1;
      lastSignal = { kind: safeKind, stage, buckets: { familiarity: f, warmth: w, playfulness: p }, at: now };
      return true;
    } catch {
      return false;
    }
  }

  window.BellaQualityV23 = Object.freeze({
    recordCorrection,
    snapshot: () => ({ sentCount, lastSignal, policy: "aggregate-only; no raw message text or user identifier" })
  });
})();
