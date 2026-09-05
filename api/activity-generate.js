import { claimBellaAi } from "../lib/bella-control.js";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const OPENAI_TIMEOUT_MS = 18000;
const store = globalThis.__bellaActivityRate || (globalThis.__bellaActivityRate = new Map());

function ip(req) { return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim().slice(0,96); }
function rateLimited(req) {
  const key = ip(req), now = Date.now();
  const fresh = (store.get(key) || []).filter(ts => now - ts < WINDOW_MS);
  if (fresh.length >= MAX_REQUESTS) return true;
  fresh.push(now); store.set(key, fresh); return false;
}
function outputText(data) {
  const out=[];
  for (const item of data?.output || []) if (item?.type === "message") for (const part of item.content || []) if (part?.type === "output_text" && typeof part.text === "string") out.push(part.text);
  return out.join("\n").trim();
}
function clean(v,max=220){return String(v||"").replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim().slice(0,max);}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store, max-age=0");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  if(rateLimited(req)) return res.status(429).json({error:"كثرنا تحديات بسرعة 😭 جرب عقب شوي."});
  const kind=["box","proverb","quick"].includes(req.body?.kind)?req.body.kind:"quick";
  const control=await claimBellaAi("chat");
  if(!control.allowed) return res.status(control.reason==="maintenance"?503:429).json({error:control.reason==="maintenance"?"بيلا تحت الصيانة شوي.":"وصلنا حد الذكاء اليوم."});
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey) return res.status(503).json({error:"AI is not configured"});

  const schema={type:"object",additionalProperties:false,required:["title","question","answer","hint"],properties:{title:{type:"string",minLength:2,maxLength:50},question:{type:"string",minLength:5,maxLength:180},answer:{type:"string",minLength:1,maxLength:80},hint:{type:"string",minLength:2,maxLength:100}}};
  const kindHint=kind==="box"?"سو تحدي شنو بالصندوق: وصف غرض يومي أو كويتي بشكل ذكي بدون ذكر اسمه، والجواب اسم الغرض.":kind==="proverb"?"سو تحدي مثل كويتي/خليجي معروف وآمن: السؤال يكون المثل ناقص آخر كلمة أو جزء قصير، والجواب الجزء الناقص. لا تخترع مثل غريب.":"سو تحدي سريع خفيف باللهجة الكويتية: لغز أو سؤال ملاحظة/منطق بسيط، له جواب واضح واحد.";
  const instructions=`أنت مولد فعاليات قصيرة داخل Bella، شخصية كويتية رقمية. ${kindHint}\nالقواعد: خلي اللغة سهلة وطبيعية، لا أسئلة سياسية أو طبية أو جنسية أو مهينة، لا معلومات حية تحتاج إنترنت، ولا تخلي السؤال مستحيل. لا تضف شرح خارج JSON.`;
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),OPENAI_TIMEOUT_MS);
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({model:"gpt-5-mini",instructions,input:"ولّد تحدي واحد جديد الآن.",reasoning:{effort:"low"},text:{verbosity:"low",format:{type:"json_schema",name:"bella_activity",strict:true,schema}},max_output_tokens:500,store:false})});
    if(!response.ok) return res.status(502).json({error:"ما قدرت أطلع تحدي جديد الحين."});
    let parsed; try{parsed=JSON.parse(outputText(await response.json()));}catch{return res.status(502).json({error:"التحدي رجع بصيغة مو صالحة."});}
    const activity={kind,title:clean(parsed?.title,50),question:clean(parsed?.question,180),answer:clean(parsed?.answer,80),hint:clean(parsed?.hint,100)};
    if(!activity.question||!activity.answer) return res.status(502).json({error:"التحدي ناقص، جرب مرة ثانية."});
    return res.status(200).json({ok:true,activity,model:"gpt-5-mini"});
  }catch(error){
    if(error?.name==="AbortError") return res.status(504).json({error:"التحدي طول شوي، جرب مرة ثانية."});
    return res.status(502).json({error:"ما قدرت أطلع تحدي جديد الحين."});
  }finally{clearTimeout(timeout);}
}
