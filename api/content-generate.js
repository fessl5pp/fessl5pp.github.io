const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const OPENAI_TIMEOUT_MS = 24000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const KINDS = ["rumor", "wisdom", "proverb", "kuwait", "box"];
const rateStore = globalThis.__bellaContentGenerateRate || (globalThis.__bellaContentGenerateRate = new Map());

function ip(req) { return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim().slice(0,96); }
function limited(req) {
  const key = ip(req), now = Date.now();
  const fresh = (rateStore.get(key) || []).filter(ts => now - ts < WINDOW_MS);
  if (fresh.length >= MAX_REQUESTS) return true;
  fresh.push(now); rateStore.set(key, fresh); return false;
}
function bearer(req) { const raw = String(req.headers.authorization || ""); return raw.startsWith("Bearer ") ? raw.slice(7).trim() : ""; }
function clean(v, max=500) { return String(v || "").replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim().slice(0,max); }
function norm(v) { return clean(v).toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim(); }
function outputText(data) {
  const parts=[]; for (const item of data?.output || []) if (item?.type === "message") for (const part of item.content || []) if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
  return parts.join("\n").trim();
}
async function rpc(name, token, body={}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method:"POST", headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body:JSON.stringify(body) });
  const d = await r.json().catch(()=>null); if (!r.ok) throw new Error(d?.message || `Supabase ${r.status}`); return d;
}
async function rest(path, token) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${token}`, Accept:"application/json" } });
  const d = await r.json().catch(()=>[]); if (!r.ok) throw new Error(`Supabase ${r.status}`); return d;
}
async function ownerAllowed(token) {
  if (!token) return false;
  try { const ok = await rpc("is_bella_owner", token); return ok === true || ok === "true" || ok?.is_bella_owner === true; } catch { return false; }
}
function instructionsFor(kind) {
  if (kind === "rumor") return "ولّد إشاعات طقطقة كويتية خيالية وواضح إنها مزحة اجتماعية خفيفة. لا تنسب ادعاءات حقيقية لأشخاص حقيقيين، ولا أخبار فعلية.";
  if (kind === "wisdom") return "ولّد حكم قصيرة مفهومة تناسب لعبة معنى الحكمة. prompt هو الحكمة، explanation هو معناها الواضح، answer يساوي explanation باختصار.";
  if (kind === "proverb") return "ولّد أمثال عربية/خليجية معروفة فقط. prompt يكون بداية المثل ناقصة، answer التكملة القصيرة، explanation المعنى، difficulty مناسب. لا تخترع أمثال على أنها تراثية.";
  if (kind === "box") return "ولّد تحديات شنو بالصندوق عن أغراض يومية أو تراثية. prompt وصف بدون ذكر الاسم، answer اسم الغرض، explanation سطر يوضح الجواب.";
  return "ولّد أسئلة معرفة كويتية ثابتة وغير سياسية وغير حساسة. prompt سؤال واضح، answer جواب واحد، options أربع اختيارات مختلفة تتضمن answer، explanation توضيح قصير.";
}

export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  if (limited(req)) return res.status(429).json({error:"كثر التوليد بسرعة، جرّب عقب شوي."});
  const token = bearer(req);
  if (!(await ownerAllowed(token))) return res.status(403).json({error:"Owner access required"});
  const kind = KINDS.includes(req.body?.kind) ? req.body.kind : "wisdom";
  const count = Math.max(1, Math.min(10, Math.floor(Number(req.body?.count) || 5)));
  let cfg = {};
  try {
    const rows = await rpc("bella_owner_config", token);
    cfg = Array.isArray(rows) ? rows[0] || {} : rows || {};
    if (cfg.content_ai_enabled === false) return res.status(409).json({error:"توليد محتوى AI موقفه المالك من الصلاحيات المتقدمة."});
  } catch { return res.status(502).json({error:"تعذر التحقق من إعدادات المالك."}); }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({error:"AI is not configured"});
  let existing=[];
  try {
    const rows = await rest(`bella_content_items?select=prompt&kind=eq.${encodeURIComponent(kind)}&order=created_at.desc&limit=250`, token);
    existing = Array.isArray(rows) ? rows.map(x=>norm(x.prompt)).filter(Boolean) : [];
  } catch {}

  const itemSchema = {
    type:"object", additionalProperties:false,
    required:["prompt","answer","explanation","options","category","difficulty"],
    properties:{
      prompt:{type:"string",minLength:2,maxLength:500},
      answer:{type:"string",maxLength:240},
      explanation:{type:"string",maxLength:600},
      options:{type:"array",minItems:0,maxItems:4,items:{type:"string",maxLength:160}},
      category:{type:"string",minLength:1,maxLength:80},
      difficulty:{type:"string",enum:["easy","medium","hard"]}
    }
  };
  const schema={ type:"object", additionalProperties:false, required:["items"], properties:{ items:{type:"array",minItems:1,maxItems:10,items:itemSchema} } };
  const instructions = `أنت محرر محتوى داخل Bella الكويتية. ${instructionsFor(kind)}\nالقواعد: اللهجة طبيعية ومحترمة، المحتوى قصير وقابل للعبة، لا سياسة ولا طب ولا جنس ولا إساءة، ولا معلومات حية تحتاج إنترنت. لا تكرر نفس الفكرة. الناتج JSON فقط حسب المخطط. أي محتوى تولده يبقى اقتراحًا للمراجعة ولا تنشره بنفسك.`;
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),OPENAI_TIMEOUT_MS);
  try {
    const response=await fetch("https://api.openai.com/v1/responses", { method:"POST", headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"}, signal:controller.signal, body:JSON.stringify({ model:"gpt-5-mini", instructions, input:`ولّد ${count} اقتراحات جديدة من نوع ${kind}.`, reasoning:{effort:"low"}, text:{verbosity:"low",format:{type:"json_schema",name:"bella_content_batch",strict:true,schema}}, max_output_tokens:2200, store:false }) });
    if(!response.ok) return res.status(502).json({error:"ما قدرت أطلع اقتراحات الحين."});
    let parsed; try { parsed=JSON.parse(outputText(await response.json())); } catch { return res.status(502).json({error:"اقتراحات AI رجعت بصيغة مو صالحة."}); }
    const seen=new Set(existing); const items=[];
    for(const raw of Array.isArray(parsed?.items)?parsed.items:[]) {
      const prompt=clean(raw.prompt,500), key=norm(prompt); if(!prompt||!key||seen.has(key)) continue; seen.add(key);
      let options=(Array.isArray(raw.options)?raw.options:[]).map(x=>clean(x,160)).filter(Boolean).slice(0,4);
      const answer=clean(raw.answer,240);
      if(kind==="kuwait") {
        if(answer && !options.some(x=>norm(x)===norm(answer))) options.unshift(answer);
        options=[...new Set(options)].slice(0,4);
        if(options.length!==4) continue;
      } else options=[];
      items.push({kind,prompt,answer,explanation:clean(raw.explanation,600),options,category:clean(raw.category,80)||"عام",difficulty:["easy","medium","hard"].includes(raw.difficulty)?raw.difficulty:"medium"});
      if(items.length>=count) break;
    }
    if(!items.length) return res.status(409).json({error:"ما طلع محتوى جديد كفاية بدون تكرار. جرّب نوع ثاني أو مرة ثانية."});
    return res.status(200).json({ok:true,kind,items,model:"gpt-5-mini",reviewRequired:true});
  } catch(error) {
    if(error?.name==="AbortError") return res.status(504).json({error:"التوليد طول شوي، جرّب مرة ثانية."});
    return res.status(502).json({error:"تعذر توليد المحتوى الحين."});
  } finally { clearTimeout(timeout); }
}
