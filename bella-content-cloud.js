(() => {
  "use strict";

  const base = window.BellaGameBankV2;
  if (!base) return;
  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const CACHE_KEY = "bella_content_cloud_v1";
  const REFRESH_MS = 4 * 60 * 1000;
  let remote = loadCache();
  let combined = build(remote);
  let loading = false;
  let lastLoadedAt = 0;

  function clean(value,max=600){ return String(value || "").replace(/\s+/g," ").trim().slice(0,max); }
  function norm(value){ return clean(value).toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim(); }
  function stableId(value){ let h=2166136261; for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);} return 1000000+(h>>>0)%900000000; }
  function loadCache(){ try{ const x=JSON.parse(localStorage.getItem(CACHE_KEY)||"[]"); return Array.isArray(x)?x:[]; }catch{return [];} }
  function saveCache(rows){ try{ localStorage.setItem(CACHE_KEY,JSON.stringify(rows.slice(0,500))); }catch{} }
  function unique(items,keyFn){ const seen=new Set(),out=[]; for(const item of items){ const key=norm(keyFn(item)); if(!key||seen.has(key))continue; seen.add(key); out.push(item); } return Object.freeze(out); }
  function fourOptions(answer, supplied, pool){
    const out=[]; const seen=new Set(); const push=v=>{const text=clean(v,160),key=norm(text); if(text&&key&&!seen.has(key)){seen.add(key);out.push(text);}};
    (Array.isArray(supplied)?supplied:[]).forEach(push); push(answer);
    for(const candidate of pool){ if(out.length>=4) break; push(candidate); }
    return out.slice(0,4);
  }
  function mapRows(rows){
    const mapped={rumors:[],wisdoms:[],proverbs:[],boxes:[],kuwaitQuestions:[]};
    const answerPool=[...base.kuwaitQuestions.map(x=>x.a)];
    for(const row of Array.isArray(rows)?rows:[]){
      if(row?.status && row.status!=="approved") continue;
      if(row?.enabled===false) continue;
      const id=stableId(row.id||`${row.kind}:${row.prompt}`), prompt=clean(row.prompt,500), answer=clean(row.answer,240), explanation=clean(row.explanation,600), difficulty=["easy","medium","hard"].includes(row.difficulty)?row.difficulty:"medium";
      if(!prompt) continue;
      if(row.kind==="rumor") mapped.rumors.push({id,category:clean(row.category,80)||"عام",text:prompt,remote:true});
      if(row.kind==="wisdom" && (explanation||answer)) mapped.wisdoms.push({id,text:prompt,meaning:explanation||answer,remote:true});
      if(row.kind==="proverb" && answer) mapped.proverbs.push({id,start:prompt,answer,meaning:explanation||`التكملة: ${answer}`,difficulty,remote:true});
      if(row.kind==="box" && answer) mapped.boxes.push({id,answer,clue:prompt,remote:true});
      if(row.kind==="kuwait" && answer){ const o=fourOptions(answer,row.options,answerPool); if(o.length===4) mapped.kuwaitQuestions.push({id,q:prompt,a:answer,o,remote:true}); }
    }
    return mapped;
  }
  function build(rows){
    const m=mapRows(rows);
    const rumors=unique([...m.rumors,...base.rumors],x=>x.text);
    const wisdoms=unique([...m.wisdoms,...base.wisdoms],x=>x.text);
    const proverbs=unique([...m.proverbs,...base.proverbs],x=>x.start);
    const boxes=unique([...m.boxes,...base.boxes],x=>x.clue||x.answer);
    const kuwaitQuestions=unique([...m.kuwaitQuestions,...base.kuwaitQuestions],x=>x.q);
    return {rumors,wisdoms,proverbs,boxes,kuwaitQuestions,counts:Object.freeze({rumors:rumors.length,wisdoms:wisdoms.length,proverbs:proverbs.length,boxes:boxes.length,kuwaitQuestions:kuwaitQuestions.length})};
  }

  const live={};
  for(const [key,value] of Object.entries(base)) if(!["version","rumors","wisdoms","proverbs","boxes","kuwaitQuestions","counts"].includes(key)) Object.defineProperty(live,key,{enumerable:true,get:()=>value});
  Object.defineProperty(live,"version",{enumerable:true,get:()=>17});
  for(const key of ["rumors","wisdoms","proverbs","boxes","kuwaitQuestions","counts"]) Object.defineProperty(live,key,{enumerable:true,get:()=>combined[key]});
  window.BellaGameBankV2=Object.freeze(live);

  async function refresh(force=false){
    if(loading) return combined;
    if(!force && Date.now()-lastLoadedAt<15000) return combined;
    loading=true;
    try{
      const response=await fetch(`${SUPABASE_URL}/rest/v1/bella_content_items?select=id,kind,prompt,answer,explanation,options,category,difficulty,status,enabled,updated_at&status=eq.approved&enabled=eq.true&order=updated_at.desc&limit=500`,{headers:{apikey:SUPABASE_KEY,Accept:"application/json"}});
      if(!response.ok) throw new Error(`content HTTP ${response.status}`);
      const rows=await response.json().catch(()=>[]);
      remote=Array.isArray(rows)?rows:[]; saveCache(remote); combined=build(remote); lastLoadedAt=Date.now();
      window.dispatchEvent(new CustomEvent("bella:content-cloud",{detail:{counts:{...combined.counts}}}));
    }catch(error){ console.warn("Bella content cloud unavailable:",error?.message||error); }
    finally{loading=false;}
    return combined;
  }

  window.BellaContentCloud=Object.freeze({refresh,status:()=>({loading,lastLoadedAt,remote:remote.length,counts:{...combined.counts}})});
  refresh(true);
  setInterval(()=>refresh(false),REFRESH_MS);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh(false);});
})();
