import chatHandler from "./chat.js";
import { checkBellaAccountAccess, rejectSuspendedAccount } from "../lib/bella-account-access.js";
import { requireBellaOwner } from "../lib/bella-owner-access.js";
import { handleBellaOwnerPersonaPreview } from "../lib/bella-owner-persona-preview.js";
import { primeBellaResilienceRuntimeV22 } from "../lib/bella-control.js";
import { runBellaRequestContextV22 } from "../lib/bella-request-context-v22.js";
import { enrichBellaSemanticMemoryV24 } from "../lib/bella-semantic-memory-v24.js";
import { routeBellaMetacognitionV27, reviewBellaAnswerV27 } from "../lib/bella-metacognition-v27.js";

function ownerPreviewRequested(req) {
  if (req.method !== "POST") return false;
  if (req.body?.ownerPreview === true) return true;
  if (String(req?.query?.ownerPreview || "") === "1") return true;
  try { return new URL(req.url || "/", "https://bella.local").searchParams.get("ownerPreview") === "1"; }
  catch { return false; }
}

function exposeMetacognitionDiagnostics(req, res, plan) {
  if (!res || !plan) return;
  try {
    res.setHeader("X-Bella-Cognitive-Brain", "v27");
    res.setHeader("X-Bella-Base-Cognition", "v26");
    res.setHeader("X-Bella-Model-Tier", String(plan.model?.tier || "unknown"));
    res.setHeader("X-Bella-Verification", String(plan.verification?.mode || "light"));
    res.setHeader("X-Bella-Confidence", String(plan.confidence?.tier || "unknown"));
    res.setHeader("X-Bella-Critic", plan.critic?.enabled ? "selected" : "skipped");
  } catch {}

  // Critic-selected turns must be buffered so the internal reviewer can inspect the
  // complete draft before anything is sent to the browser. Normal chat still streams.
  if (plan.critic?.enabled) {
    if (req.body && typeof req.body === "object") req.body = { ...req.body, stream: false };
    if (req.headers && typeof req.headers === "object") req.headers.accept = "application/json";
  }

  if (typeof res.json !== "function") return;
  const originalJson = res.json.bind(res);
  res.json = async payload => {
    let next = payload;
    const successfulReply = res.statusCode >= 200 && res.statusCode < 300 && payload && typeof payload.reply === "string";
    let review = { reply: successfulReply ? payload.reply : "", applied: false, reason: plan.critic?.enabled ? "not-run" : "not-selected", tier: plan.critic?.tier || "none" };

    if (successfulReply && plan.critic?.enabled) {
      review = await reviewBellaAnswerV27({
        apiKey: process.env.OPENAI_API_KEY,
        message: req.body?.message,
        history: Array.isArray(req.body?.history) ? req.body.history : [],
        draft: payload.reply,
        plan
      });
    }

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const intelligence = payload.intelligence && typeof payload.intelligence === "object" ? payload.intelligence : {};
      next = {
        ...payload,
        ...(successfulReply ? { reply: review.reply || payload.reply } : {}),
        intelligence: {
          ...intelligence,
          cognitiveBrain: "v27",
          baseCognition: "v26",
          taskKind: plan.task?.kind || "knowledge",
          modelTier: plan.model?.tier || "unknown",
          verification: plan.verification?.mode || "light",
          ambiguity: plan.ambiguity?.tier || "low",
          confidence: plan.confidence?.tier || "unknown",
          critic: plan.critic?.enabled ? review.reason : "not-selected",
          criticApplied: review.applied === true
        }
      };
    }
    return originalJson(next);
  };
}

export default async function handler(req, res) {
  if (ownerPreviewRequested(req)) {
    const owner = await requireBellaOwner(req, res);
    if (!owner) return;
    return handleBellaOwnerPersonaPreview(req, res);
  }

  const access = await checkBellaAccountAccess(req);
  if (rejectSuspendedAccount(res, access)) return;

  // v27 metacognition is derived server-side only. The browser cannot select model,
  // critic mode, confidence tier, verification mode or trusted cognitive instructions.
  const metacognitivePlan = routeBellaMetacognitionV27({
    message: req.body?.message,
    history: Array.isArray(req.body?.history) ? req.body.history : []
  });
  exposeMetacognitionDiagnostics(req, res, metacognitivePlan);

  // v24 only enriches explicitly saved durable memories. Failure is non-blocking:
  // core chat remains available even if embeddings or Supabase retrieval are degraded.
  try {
    req.bellaSemanticMemoryV24 = await enrichBellaSemanticMemoryV24(req);
  } catch {
    req.bellaSemanticMemoryV24 = { active: false, reason: "degraded" };
  }

  const rolloutSubject = String(req.body?.rolloutSubject || "server-control").replace(/\u0000/g, "").trim().slice(0, 120) || "server-control";
  const resiliencePromise = primeBellaResilienceRuntimeV22(rolloutSubject, false).catch(() => null);
  return runBellaRequestContextV22({
    rolloutSubject,
    resiliencePromise,
    cognitivePlan: metacognitivePlan.cognition,
    metacognitivePlan
  }, () => chatHandler(req, res));
}
