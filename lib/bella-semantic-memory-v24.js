const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512;
const MAX_MEMORY_ROWS = 64;
const MAX_INDEX_PER_REQUEST = 8;
const MAX_RETRIEVED = 6;
const EMBEDDING_TIMEOUT_MS = 7000;

function clean(value, max = 1000) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, max);
}

function bearerToken(req) {
  const header = clean(req?.headers?.authorization, 12000);
  return /^Bearer\s+\S+/i.test(header) ? header.replace(/^Bearer\s+/i, "").trim() : "";
}

function jwtSubjectHint(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return "";
    const decoded = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return clean(JSON.parse(decoded)?.sub, 80);
  } catch {
    return "";
  }
}

function shouldRetrieve(message) {
  const text = clean(message, 4000).toLowerCase().replace(/\s+/g, " ");
  if (!text) return false;
  if (/^(هلا|هلو|هاي|سلام|السلام عليكم|شلونج|شلونك|صباح الخير|مساء الخير|هاي بيلا)[؟?! .]*$/i.test(text)) return false;
  return text.length >= 4;
}

function importanceFor(row) {
  const text = clean(row?.memory_text, 500).toLowerCase();
  const category = clean(row?.category, 40).toLowerCase();
  let score = Number(row?.importance || 60);
  if (/preference|تفضيل|favorite|identity|هوية/.test(category)) score += 10;
  if (/احب|أحب|ما احب|ما أحب|افضل|أفضل|دائما|دايم|اسمي|عمري|عملي|دراستي|تخصصي/.test(text)) score += 8;
  if (/اليوم|الحين|الان|باجر|هالاسبوع|هالأسبوع/.test(text)) score -= 20;
  return Math.max(25, Math.min(95, Math.round(score)));
}

async function supabaseRequest(path, token, { method = "GET", body, prefer = "" } = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`supabase_${response.status}`);
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

async function fetchMemoryRows(token) {
  const subject = jwtSubjectHint(token);
  const query = new URLSearchParams({
    select: "id,memory_text,category,source,updated_at,embedding_model,embedded_at,importance",
    deleted_at: "is.null",
    order: "updated_at.desc",
    limit: String(MAX_MEMORY_ROWS)
  });
  // Performance hint only. RLS remains the authorization boundary.
  if (subject) query.set("user_id", `eq.${subject}`);
  const data = await supabaseRequest(`/rest/v1/bella_memories?${query.toString()}`, token);
  return Array.isArray(data) ? data : [];
}

function needsEmbedding(row) {
  if (clean(row?.embedding_model, 80) !== EMBEDDING_MODEL) return true;
  const embeddedAt = Date.parse(row?.embedded_at || "");
  const updatedAt = Date.parse(row?.updated_at || "");
  if (!Number.isFinite(embeddedAt)) return true;
  return Number.isFinite(updatedAt) && embeddedAt + 1000 < updatedAt;
}

async function createEmbeddings(inputs, apiKey) {
  if (!Array.isArray(inputs) || !inputs.length || !apiKey) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: inputs.map(value => clean(value, 1000)),
        dimensions: EMBEDDING_DIMENSIONS,
        encoding_format: "float"
      })
    });
    if (!response.ok) throw new Error(`embedding_${response.status}`);
    const data = await response.json();
    return Array.isArray(data?.data) ? data.data.sort((a, b) => Number(a.index) - Number(b.index)).map(item => item.embedding) : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function persistEmbedding(token, row, embedding) {
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS || !row?.id) return false;
  await supabaseRequest(`/rest/v1/bella_memories?id=eq.${encodeURIComponent(row.id)}`, token, {
    method: "PATCH",
    prefer: "return=minimal",
    body: {
      embedding,
      embedding_model: EMBEDDING_MODEL,
      embedded_at: new Date().toISOString(),
      importance: importanceFor(row)
    }
  });
  return true;
}

async function hybridSearch(token, queryText, queryEmbedding) {
  const data = await supabaseRequest("/rest/v1/rpc/bella_memory_hybrid_search_v24", token, {
    method: "POST",
    body: {
      p_query_text: clean(queryText, 500),
      p_query_embedding: Array.isArray(queryEmbedding) && queryEmbedding.length === EMBEDDING_DIMENSIONS ? queryEmbedding : null,
      p_match_count: MAX_RETRIEVED
    }
  });
  return Array.isArray(data) ? data : [];
}

function mergeRetrievedMemory(body, rows) {
  const existing = Array.isArray(body?.memory) ? body.memory.map(x => clean(x, 220)).filter(Boolean) : [];
  const seen = new Set(existing.map(x => x.toLowerCase()));
  const semantic = [];
  for (const row of rows || []) {
    const text = clean(row?.memory_text, 220);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    semantic.push(text);
  }
  body.memory = [...existing.slice(-8), ...semantic.slice(0, MAX_RETRIEVED)].slice(-12);
  body.memoryContextV24 = {
    retrieved: semantic.length,
    semantic: rows.some(row => Number(row?.semantic_similarity || 0) >= 0.22),
    temporalDecay: true
  };
  return semantic.length;
}

export async function enrichBellaSemanticMemoryV24(req) {
  const body = req?.body;
  if (!body || typeof body !== "object" || !shouldRetrieve(body.message)) return { active: false, reason: "skip" };
  const token = bearerToken(req);
  if (!token) return { active: false, reason: "guest" };

  let rows;
  try {
    rows = await fetchMemoryRows(token);
  } catch {
    return { active: false, reason: "memory_unavailable" };
  }
  if (!rows.length) return { active: true, indexed: 0, retrieved: 0 };

  const stale = rows.filter(needsEmbedding).slice(0, MAX_INDEX_PER_REQUEST);
  let queryEmbedding = null;
  let indexed = 0;
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const vectors = await createEmbeddings([body.message, ...stale.map(row => row.memory_text)], apiKey);
      queryEmbedding = vectors[0] || null;
      const updates = stale.map((row, index) => persistEmbedding(token, row, vectors[index + 1]).then(ok => { if (ok) indexed += 1; }).catch(() => null));
      await Promise.all(updates);
    } catch {
      queryEmbedding = null;
    }
  }

  let matches = [];
  try {
    matches = await hybridSearch(token, body.message, queryEmbedding);
  } catch {
    return { active: true, indexed, retrieved: 0, reason: "search_unavailable" };
  }
  const retrieved = mergeRetrievedMemory(body, matches);
  return { active: true, indexed, retrieved, semantic: Boolean(queryEmbedding), model: queryEmbedding ? EMBEDDING_MODEL : null };
}

export const BELLA_SEMANTIC_MEMORY_V24 = Object.freeze({
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
  maxIndexPerRequest: MAX_INDEX_PER_REQUEST,
  maxRetrieved: MAX_RETRIEVED
});
