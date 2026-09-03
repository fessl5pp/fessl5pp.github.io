const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const CONTROL_TIMEOUT_MS = 3000;

function normalizeRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data && typeof data === "object" ? data : null;
}

export async function claimBellaAi(kind = "chat") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONTROL_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bella_claim_ai_request`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({ p_kind: kind === "live_web" ? "live_web" : "chat" })
    });
    const data = normalizeRow(await response.json().catch(() => null));
    if (!response.ok || !data) throw new Error(`Bella control HTTP ${response.status}`);
    return {
      allowed: data.allowed === true,
      reason: String(data.reason || ""),
      used: Math.max(0, Number(data.used) || 0),
      dailyLimit: Math.max(0, Number(data.daily_limit) || 0),
      liveWebEnabled: data.live_web_enabled !== false,
      maintenanceEnabled: data.maintenance_enabled === true,
      controlAvailable: true
    };
  } catch (error) {
    console.warn("Bella control check unavailable:", error?.name || error?.message || "unknown");
    return {
      allowed: true,
      reason: "control_unavailable",
      used: 0,
      dailyLimit: 0,
      liveWebEnabled: true,
      maintenanceEnabled: false,
      controlAvailable: false
    };
  } finally {
    clearTimeout(timeout);
  }
}
