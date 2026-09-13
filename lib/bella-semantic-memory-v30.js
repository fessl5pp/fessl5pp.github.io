const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512;
const MAX_MEMORY_ROWS = 96;
const MAX_INDEX_PER_REQUEST = 8;
const MAX_RETRIEVED = 8;
const EMBEDDING_TIMEOUT_MS = 7000;
const RECALL_TIMEOUT_MS = 900;

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
  } catch { return ""; }
}

function shouldRetrieve(message) {
  const text = clean(message, 4000).toLowerCase().replace(/\s+/g, " ");
  if (!text) return false;
  if (/^(هلا|هلو|هاي|سلام|السلام عليكم|شلونج|شلونك|صباح الخير|مساء الخير|هاي بيلا)[؟?! .]*$/i.test(text)) return false;
  return text.length >= 4;
}

async function supabaseRequest(path, token, { method = "GET", body, prefer = "", timeoutMs = 0 } = {}) {
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (prefer) headers.Prefer = prefer;
  const controller = timeoutMs > 0 ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers,
      signal: controller?.signal,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`supabase_${response.status}`);
    if (response.status === 204) return null;
    return response.json().catch(() => null);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function fetchMemoryRows(token) {
  const subject = jwtSubjectHint(token);
  const query = new URLSearchParams({
    select: "id,memory_text,category,source,updated_at,embedding_model,embedded_at,importance,confidence,topic_key,polarity,last_confirmed_at,last_recalled_at,recall_count,memory_version",
    deleted_at: "is.null",
    superseded_at: "is.null",
    order: "last_confirmed_at.desc",
    limit: String(MAX_MEMORY_ROWS)
  });
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
    return Array.isArray(data?.data)
      ? data.data.sort((a, b) => Number(a.index) - Number(b.index)).map(item => item.embedding)
      : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function persistEmbedding(token, row, embedding) {
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS || !row?.id) return false;
  const body = {
    embedding,
    embedding_model: EMBEDDING_MODEL,
    embedded_at: new Date().toISOString()
  };
  // Legacy rows get a conservative confidence baseline when first upgraded to v30.
  if (Number(row?.memory_version || 0) < 5) body.confidence = Math.max(70, Number(row?.confidence) || 80);
  await supabaseRequest(`/rest/v1/bella_memories?id=eq.${encodeURIComponent(row.id)}`, token, {
    method: "PATCH",
    prefer: "return=minimal",
    body
  });
  return true;
}

async function hybridSearch(token, queryText, queryEmbedding) {
  const data = await supabaseRequest("/rest/v1/rpc/bella_memory_hybrid_search_v30", token, {
    method: "POST",
    body: {
      p_query_text: clean(queryText, 500),
      p_query_embedding: Array.isArray(queryEmbedding) && queryEmbedding.length === EMBEDDING_DIMENSIONS ? queryEmbedding : null,
      p_match_count: MAX_RETRIEVED
    }
  });
  return Array.isArray(data) ? data : [];
}

function diversifyRows(rows) {
  const selected = [];
  const topics = new Set();
  const exact = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    const text = clean(row?.memory_text, 220);
    if (!text) continue;
    const key = text.toLowerCase();
    if (exact.has(key)) continue;
    const topic = clean(row?.topic_key, 120);
    if (topic && topics.has(topic)) continue;
    if (Number(row?.confidence || 0) < 50) continue;
    exact.add(key);
    if (topic) topics.add(topic);
    selected.push(row);
    if (selected.length >= MAX_RETRIEVED) break;
  }
  return selected;
}

async function markRecalled(token, ids) {
  const safe = (Array.isArray(ids) ? ids : []).map(x => clean(x, 80)).filter(Boolean).slice(0, 12);
  if (!safe.length) return 0;
  const data = await supabaseRequest("/rest/v1/rpc/bella_memory_mark_recalled_v30", token, {
    method: "POST",
    timeoutMs: RECALL_TIMEOUT_MS,
    body: { p_ids: safe }
  });
  return Number(data) || 0;
}

function mergeRetrievedMemory(body, rows) {
  const existing = Array.isArray(body?.memory) ? body.memory.map(x => clean(x, 220)).filter(Boolean) : [];
  const seen = new Set(existing.map(x => x.toLowerCase()));
  const semantic = [];
  for (const row of diversifyRows(rows)) {
    const text = clean(row?.memory_text, 220);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    semantic.push(text);
  }
  body.memory = [...existing.slice(-6), ...semantic].slice(-12);
  body.memoryContextV30 = {
    retrieved: semantic.length,
    semantic: rows.some(row => Number(row?.semantic_similarity || 0) >= 0.20),
    confidenceAware: true,
    importanceAware: true,
    recallReinforcement: true,
    contradictionAware: true,
    temporalDecay: true
  };
  return semantic.length;
}

export async function enrichBellaSemanticMemoryV30(req) {
  const body = req?.body;
  if (!body || typeof body !== "object" || !shouldRetrieve(body.message)) return { active: false, reason: "skip" };
  const token = bearerToken(req);
  if (!token) return { active: false, reason: "guest" };

  let rows;
  try { rows = await fetchMemoryRows(token); }
  catch { return { active: false, reason: "memory_unavailable" }; }
  if (!rows.length) return { active: true, indexed: 0, retrieved: 0, version: "v30" };

  const stale = rows.filter(needsEmbedding).slice(0, MAX_INDEX_PER_REQUEST);
  let queryEmbedding = null;
  let indexed = 0;
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const vectors = await createEmbeddings([body.message, ...stale.map(row => row.memory_text)], apiKey);
      queryEmbedding = vectors[0] || null;
      await Promise.all(stale.map((row, index) => persistEmbedding(token, row, vectors[index + 1])
        .then(ok => { if (ok) indexed += 1; }).catch(() => null)));
    } catch { queryEmbedding = null; }
  }

  let matches = [];
  try { matches = await hybridSearch(token, body.message, queryEmbedding); }
  catch { return { active: true, indexed, retrieved: 0, reason: "search_unavailable", version: "v30" }; }

  const diverse = diversifyRows(matches);
  const retrieved = mergeRetrievedMemory(body, diverse);
  try { await markRecalled(token, diverse.slice(0, retrieved).map(row => row.id)); } catch {}

  return {
    active: true,
    indexed,
    retrieved,
    semantic: Boolean(queryEmbedding),
    model: queryEmbedding ? EMBEDDING_MODEL : null,
    confidenceAware: true,
    contradictionAware: true,
    version: "v30"
  };
}

export const BELLA_SEMANTIC_MEMORY_V30 = Object.freeze({
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
  maxIndexPerRequest: MAX_INDEX_PER_REQUEST,
  maxRetrieved: MAX_RETRIEVED,
  maxMemoryRows: MAX_MEMORY_ROWS
});
