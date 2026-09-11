import chatHandler from "./chat.js";
import { checkBellaAccountAccess, rejectSuspendedAccount } from "../lib/bella-account-access.js";
import { requireBellaOwner } from "../lib/bella-owner-access.js";
import { handleBellaOwnerPersonaPreview } from "../lib/bella-owner-persona-preview.js";
import { primeBellaResilienceRuntimeV22 } from "../lib/bella-control.js";
import { runBellaRequestContextV22 } from "../lib/bella-request-context-v22.js";
import { enrichBellaSemanticMemoryV24 } from "../lib/bella-semantic-memory-v24.js";

function ownerPreviewRequested(req) {
  if (req.method !== "POST") return false;
  if (req.body?.ownerPreview === true) return true;
  if (String(req?.query?.ownerPreview || "") === "1") return true;
  try { return new URL(req.url || "/", "https://bella.local").searchParams.get("ownerPreview") === "1"; }
  catch { return false; }
}

export default async function handler(req, res) {
  if (ownerPreviewRequested(req)) {
    const owner = await requireBellaOwner(req, res);
    if (!owner) return;
    return handleBellaOwnerPersonaPreview(req, res);
  }

  const access = await checkBellaAccountAccess(req);
  if (rejectSuspendedAccount(res, access)) return;

  // v24 only enriches explicitly saved durable memories. Failure is non-blocking:
  // core chat remains available even if embeddings or Supabase retrieval are degraded.
  try {
    req.bellaSemanticMemoryV24 = await enrichBellaSemanticMemoryV24(req);
  } catch {
    req.bellaSemanticMemoryV24 = { active: false, reason: "degraded" };
  }

  const rolloutSubject = String(req.body?.rolloutSubject || "server-control").replace(/\u0000/g, "").trim().slice(0, 120) || "server-control";
  const resiliencePromise = primeBellaResilienceRuntimeV22(rolloutSubject, false).catch(() => null);
  return runBellaRequestContextV22({ rolloutSubject, resiliencePromise }, () => chatHandler(req, res));
}
