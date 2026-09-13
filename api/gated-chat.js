import chatHandler from "./chat.js";
import { checkBellaAccountAccess, rejectSuspendedAccount } from "../lib/bella-account-access.js";
import { requireBellaOwner } from "../lib/bella-owner-access.js";
import { handleBellaOwnerPersonaPreview } from "../lib/bella-owner-persona-preview.js";
import { primeBellaResilienceRuntimeV22 } from "../lib/bella-control.js";
import { runBellaRequestContextV22 } from "../lib/bella-request-context-v22.js";
import { enrichBellaSemanticMemoryV30 } from "../lib/bella-semantic-memory-v30.js";
import { routeBellaMetacognitionV27, bellaMetacognitionInstructionV27, reviewBellaAnswerV27 } from "../lib/bella-metacognition-v27.js";
import {
  createBellaBrainTelemetryStateV29,
  markBellaBrainCriticV29,
  markBellaBrainResponseV29,
  recordBellaBrainQualityV29
} from "../lib/bella-brain-telemetry-v29.js";

function ownerPreviewRequested(req) {
  if (req.method !== "POST") return false;
  if (req.body?.ownerPreview === true) return true;
  if (String(req?.query?.ownerPreview || "") === "1") return true;
  try { return new URL(req.url || "/", "https://bella.local").searchParams.get("ownerPreview") === "1"; }
  catch { return false; }
}

function exposeMetacognitionDiagnostics(req, res, plan, telemetryState) {
  if (!res || !plan) return;
  try {
    res.setHeader("X-Bella-Cognitive-Brain", "v27");
    res.setHeader("X-Bella-Base-Cognition", "v26");
    res.setHeader("X-Bella-Brain-Telemetry", "v29");
    res.setHeader("X-Bella-Memory-Intelligence", "v30");
    res.setHeader("X-Bella-Model-Tier", String(plan.model?.tier || "unknown"));
    res.setHeader("X-Bella-Verification", String(plan.verification?.mode || "light"));
    res.setHeader("X-Bella-Confidence", String(plan.confidence?.tier || "unknown"));
    res.setHeader("X-Bella-Critic", plan.critic?.enabled ? "selected" : "skipped");
  } catch {}

  if (plan.critic?.enabled) {
    if (req.body && typeof req.body === "object") req.body = { ...req.body, stream: false };
    if (req.headers && typeof req.headers === "object") req.headers.accept = "application/json";
  }

  if (typeof res.json !== "function") return;
  const originalJson = res.json.bind(res);
  res.json = async payload => {
    let next = payload;
    markBellaBrainResponseV29(telemetryState, payload);
    const successfulReply = res.statusCode >= 200 && res.statusCode < 300 && payload && typeof payload.reply === "string";
    let review = { reply: successfulReply ? payload.reply : "", applied: false, reason: plan.critic?.enabled ? "not-run" : "not-selected", tier: plan.critic?.tier || "none" };

    if (successfulReply && plan.critic?.enabled) {
      const criticStartedAt = Date.now();
      review = await reviewBellaAnswerV27({
        apiKey: process.env.OPENAI_API_KEY,
        message: req.body?.message,
        history: Array.isArray(req.body?.history) ? req.body.history : [],
        draft: payload.reply,
        plan
      });
      markBellaBrainCriticV29(telemetryState, review, Date.now() - criticStartedAt);
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
          brainTelemetry: "v29",
          memoryIntelligence: "v30",
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

  const requestStartedAt = Date.now();
  const access = await checkBellaAccountAccess(req);
  if (rejectSuspendedAccount(res, access)) return;

  const metacognitivePlan = routeBellaMetacognitionV27({
    message: req.body?.message,
    history: Array.isArray(req.body?.history) ? req.body.history : []
  });
  const brainTelemetryV29 = createBellaBrainTelemetryStateV29(metacognitivePlan);
  brainTelemetryV29.startedAt = requestStartedAt;
  exposeMetacognitionDiagnostics(req, res, metacognitivePlan, brainTelemetryV29);

  const cognitivePlan = {
    ...metacognitivePlan.cognition,
    metacognitiveInstruction: bellaMetacognitionInstructionV27(metacognitivePlan)
  };

  // v30 only retrieves explicit durable memories. It ranks them by semantic/keyword
  // relevance plus importance, confidence, confirmation recency and bounded recall use.
  // Failure is non-blocking so the core chat never depends on memory availability.
  try {
    req.bellaSemanticMemoryV30 = await enrichBellaSemanticMemoryV30(req);
  } catch {
    req.bellaSemanticMemoryV30 = { active: false, reason: "degraded", version: "v30" };
  }
  // Compatibility for diagnostics/code that still looks for the v24 slot.
  req.bellaSemanticMemoryV24 = req.bellaSemanticMemoryV30;

  const rolloutSubject = String(req.body?.rolloutSubject || "server-control").replace(/\u0000/g, "").trim().slice(0, 120) || "server-control";
  const resiliencePromise = primeBellaResilienceRuntimeV22(rolloutSubject, false).catch(() => null);
  try {
    return await runBellaRequestContextV22({
      rolloutSubject,
      resiliencePromise,
      cognitivePlan,
      metacognitivePlan,
      brainTelemetryV29
    }, () => chatHandler(req, res));
  } finally {
    await recordBellaBrainQualityV29({
      req,
      access,
      plan: metacognitivePlan,
      state: brainTelemetryV29,
      statusCode: res.statusCode
    }).catch(() => null);
  }
}
