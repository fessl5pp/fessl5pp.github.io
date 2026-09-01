const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 12;
const OPENAI_TIMEOUT_MS = 20000;
const rateStore = globalThis.__bellaDiraRateStore || (globalThis.__bellaDiraRateStore = new Map());

function getIp(req) {
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
}

function rateLimited(req) {
  const now = Date.now();
  const ip = getIp(req);
  const previous = rateStore.get(ip) || [];
  const fresh = previous.filter(ts => now - ts < WINDOW_MS);
  if (fresh.length >= MAX_REQUESTS) return true;
  fresh.push(now);
  rateStore.set(ip, fresh);

  if (rateStore.size > 2500) {
    for (const [key, list] of rateStore) {
      if (!list.some(ts => now - ts < WINDOW_MS)) rateStore.delete(key);
    }
  }
  return false;
}

function outputText(data) {
  const parts = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
    }
  }
  return parts.join("\n").trim();
}

function cleanVisibleReply(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/gi, "$1")
    .replace(/https?:\/\/[^\s)\]}]+/gi, "")
    .replace(/\(?\s*utm_source\s*=\s*openai\s*\)?/gi, "")
    .replace(/\[[a-z0-9.-]+\.(?:com|net|org|io|co|kw|ae|app|me)\]/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (rateLimited(req)) return res.status(429).json({ error: "هدي شوي 😅 رادار الديرة عليه حد مؤقت، جرب عقب شوي." });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI is not configured" });

  const topic = String(req.body?.topic || "سوالف الديرة").slice(0, 300);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-5-mini",
        tools: [{ type: "web_search_preview" }],
        tool_choice: "auto",
        input: `أعطني تحديثاً خفيفاً ومفيداً للكويت عن: ${topic}. ركز على فعاليات، أماكن، مطاعم/قهوة، رياضة أو ترندات اجتماعية خفيفة مناسبة. تجنب السياسة والإشاعات والحوادث. استخدم معلومات حديثة من الويب للتحقق فقط. اكتب باللهجة الكويتية الطبيعية وبحد أقصى 5 نقاط قصيرة، ولا تختلق معلومة. مهم جداً: الناتج الظاهر للمستخدم يكون كلام فقط؛ لا تكتب روابط، ولا أسماء نطاقات، ولا Markdown links، ولا أقواس مصادر، ولا utm_source، ولا قائمة مصادر.`,
        reasoning: { effort: "low" },
        text: { verbosity: "low", format: { type: "text" } },
        max_output_tokens: 650,
        store: false
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Dira search error:", data?.error?.code || data?.error?.message || response.status);
      return res.status(502).json({ error: "ما قدرت أجيب سوالف الديرة الحين." });
    }

    const reply = cleanVisibleReply(outputText(data));
    return res.status(200).json({
      reply: reply || "ما لقيت شي يستاهل ينقال الحين."
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      console.error("Dira search timed out");
      return res.status(504).json({ error: "بحث الديرة طول أكثر من اللازم، جرب مرة ثانية." });
    }
    console.error("Dira request failed:", error);
    return res.status(500).json({ error: "تعذر تحديث سوالف الديرة." });
  } finally {
    clearTimeout(timeout);
  }
}
