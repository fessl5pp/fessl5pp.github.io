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
    // Keep useful anchor text but never show the underlying URL.
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/gi, "$1")
    // Remove bare links and common tracking leftovers.
    .replace(/https?:\/\/[^\s)\]}]+/gi, "")
    .replace(/\(?\s*utm_source\s*=\s*openai\s*\)?/gi, "")
    // Remove citation-looking domain labels such as [example.com].
    .replace(/\[[a-z0-9.-]+\.(?:com|net|org|io|co|kw|ae|app|me)\]/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI is not configured" });

  const topic = String(req.body?.topic || "سوالف الديرة").slice(0, 300);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
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
    console.error("Dira request failed:", error);
    return res.status(500).json({ error: "تعذر تحديث سوالف الديرة." });
  }
}
