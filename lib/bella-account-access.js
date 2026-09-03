const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const ACCESS_TIMEOUT_MS = 2500;

function bearerToken(req) {
  const value = String(req?.headers?.authorization || req?.headers?.Authorization || "");
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function normalizeRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data && typeof data === "object" ? data : null;
}

export async function checkBellaAccountAccess(req) {
  const token = bearerToken(req);
  if (!token) return { allowed: true, signedIn: false, status: "guest", role: "guest" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ACCESS_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bella_account_status`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: "{}",
      signal: controller.signal
    });

    if (response.status === 401 || response.status === 403) {
      return { allowed: true, signedIn: false, status: "guest", role: "guest", staleSession: true };
    }

    const row = normalizeRow(await response.json().catch(() => null));
    if (!response.ok || !row) throw new Error(`Bella account access HTTP ${response.status}`);

    const status = String(row.account_status || "active");
    const role = String(row.staff_role || "user");
    if (status === "suspended") {
      return {
        allowed: false,
        signedIn: true,
        status,
        role,
        reason: String(row.suspended_reason || "")
      };
    }

    return { allowed: true, signedIn: true, status: "active", role };
  } catch (error) {
    console.warn("Bella account access check unavailable:", error?.name || error?.message || "unknown");
    return { allowed: true, signedIn: true, status: "unknown", role: "user", accessAvailable: false };
  } finally {
    clearTimeout(timeout);
  }
}

export function rejectSuspendedAccount(res, access) {
  if (access?.allowed !== false || access?.status !== "suspended") return false;
  return res.status(403).json({
    error: "حسابك موقوف مؤقتًا. إذا تعتقد إن فيه خطأ تواصل مع إدارة بيلا.",
    control: "account_suspended",
    reason: access.reason || undefined
  });
}
