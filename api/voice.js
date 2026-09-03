import { claimBellaAi } from "../lib/bella-control.js";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 12;
const MAX_TEXT_CHARS = 700;
const OPENAI_TIMEOUT_MS = 18000;
const buckets = new Map();

function clientIp(req) {
  const raw = req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "unknown";
  return String(raw).split(",")[0].trim().slice(0, 96) || "unknown";
}

function rateAllowed(req) {
  const now = Date.now();
  const key = clientIp(req);
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

function cleanText(value) {
  return String(value || "")
    .replace(/مصادر التحقق:[\s\S]*$/u, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

function moodInstruction(value) {
  const mood = String(value || "chill");
  if (mood === "happy") return "Sound upbeat and smiling, but not exaggerated.";
  if (mood === "cute") return "Sound warm, playful, and slightly softer.";
  if (mood === "angry") return "Sound mildly annoyed and dry, never aggressive or shouting.";
  return "Sound relaxed, friendly, and conversational.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const contentType = String(req.headers?.["content-type"] || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return res.status(415).json({ error: "JSON required" });
  }

  const declaredLength = Number(req.headers?.["content-length"] || 0);
  if (declaredLength > 12000) return res.status(413).json({ error: "Request too large" });
  if (!rateAllowed(req)) return res.status(429).json({ error: "Voice rate limit reached" });

  const text = cleanText(req.body?.text);
  if (!text) return res.status(400).json({ error: "Voice text required" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Voice service unavailable" });

  const control = await claimBellaAi("chat");
  if (!control.allowed) {
    const status = control.reason === "maintenance" ? 503 : 429;
    return res.status(status).json({ error: control.reason === "maintenance" ? "Bella is under maintenance" : "Daily AI limit reached" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "coral",
        input: text,
        instructions: `Speak exactly the supplied Arabic text in a natural young Kuwaiti conversational style. Use feminine delivery, clear Gulf Arabic pronunciation, and no added words. ${moodInstruction(req.body?.mood)}`,
        response_format: "mp3"
      })
    });

    if (!upstream.ok) {
      console.warn("Bella voice upstream error:", upstream.status);
      return res.status(502).json({ error: "Voice generation failed" });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    if (!audio.length) return res.status(502).json({ error: "Empty voice response" });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", String(audio.length));
    return res.status(200).send(audio);
  } catch (error) {
    if (error?.name === "AbortError") return res.status(504).json({ error: "Voice generation timed out" });
    console.error("Bella voice failed:", error?.message || "unknown");
    return res.status(502).json({ error: "Voice service failed" });
  } finally {
    clearTimeout(timeout);
  }
}