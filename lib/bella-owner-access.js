const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const OWNER_TIMEOUT_MS = 2500;

function bearerToken(req) {
  const value = String(req?.headers?.authorization || req?.headers?.Authorization || "");
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export async function requireBellaOwner(req, res) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Owner sign-in required", control: "owner_auth_required" });
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OWNER_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_bella_owner`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: "{}"
    });
    const data = await response.json().catch(() => false);
    const isOwner = Array.isArray(data) ? data[0] === true : data === true;
    if (!response.ok || !isOwner) {
      res.status(403).json({ error: "Owner access required", control: "owner_access_required" });
      return null;
    }
    return { token };
  } catch (error) {
    console.error("Bella owner access check failed:", error?.name || error?.message || "unknown");
    res.status(503).json({ error: "Owner access check unavailable", control: "owner_access_unavailable" });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
