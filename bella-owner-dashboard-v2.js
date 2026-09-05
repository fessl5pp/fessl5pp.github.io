(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  let loading = false;

  function readJson(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } }
  function token() { return readJson(SESSION_KEY, null)?.access_token || ""; }
  function headers() { const t=token(); return { apikey: SUPABASE_KEY, Authorization:`Bearer ${t}`, "Content-Type":"application/json", Accept:"application/json" }; }
  async function rest(path) { const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:headers()}); const d=await r.json().catch(()=>[]); if(!r.ok) throw new Error(`HTTP ${r.status}`); return d; }
  async function rpc(name,payload={}) { const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:headers(),body:JSON.stringify(payload)}); const d=await r.json().catch(()=>null); if(!r.ok) throw new Error(`HTTP ${r.status}`); return d; }
  function pill(label,ok=true,detail="") { return `<div class="bella-v15-health ${ok?"ok":"warn"}"><b>${ok?"✅":"⚠️"} ${label}</b>${detail?`<small>${detail}</small>`:""}</div>`; }
  function injectStyles(){ if(document.getElementById("bellaOwnerDashV2Styles"))return; const s=document.createElement("style"); s.id="bellaOwnerDashV2Styles"; s.textContent=`.bella-owner-dash-v2{margin:14px 0;padding:12px;border-radius:16px;border:1px solid rgba(122,252,255,.14);background:rgba(122,252,255,.035);display:grid;gap:9px}.bella-owner-dash-v2 h3{margin:0;font-size:14px}.bella-v15-health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.bella-v15-health{padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);display:grid;gap:2px}.bella-v15-health b{font-size:10px}.bella-v15-health small{font-size:9px;color:var(--muted)}.bella-v15-health.warn{border-color:rgba(255,188,80,.22)}.bella-v15-owner-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.bella-v15-owner-stat{padding:8px;border-radius:11px;background:rgba(255,255,255,.04)}.bella-v15-owner-stat small{display:block;color:var(--muted);font-size:9px}.bella-v15-owner-stat b{font-size:14px}@media(max-width:520px){.bella-v15-health-grid,.bella-v15-owner-row{grid-template-columns:1fr 1fr}}`; document.head.appendChild(s); }
  function stat(label,value){ return `<div class="bella-v15-owner-stat"><small>${label}</small><b>${Number(value||0).toLocaleString("en-US")}</b></div>`; }

  async function load(section){
    if(loading||!window.BellaOwnerCenter?.isOwner?.()) return false;
    loading=true;
    const status=section.querySelector("[data-v15-health]"); const numbers=section.querySelector("[data-v15-numbers]");
    try{
      const [cfgRows,moments,batches]=await Promise.all([rpc("bella_owner_config"),rest("bella_moments?select=id,status,is_enabled,source,tier&limit=500"),rest(`bella_moment_batches?select=id,created_at&created_at=gte.${encodeURIComponent(new Date(Date.now()-24*60*60*1000).toISOString())}&limit=50`)]);
      const cfg=Array.isArray(cfgRows)?cfgRows[0]||{}:cfgRows||{};
      const approved=(Array.isArray(moments)?moments:[]).filter(x=>x.status==="approved"&&x.is_enabled!==false).length;
      const pending=(Array.isArray(moments)?moments:[]).filter(x=>x.status!=="approved").length;
      status.innerHTML=[
        pill("Brain v2",!!window.BellaBrainV2,window.BellaBrainV2?.relationshipSnapshot?.()?.label||""),
        pill("Memory v3",!!window.BellaMemoryV3,`${window.BellaMemoryV3?.snapshot?.()?.transient?.length||0} مؤقت`),
        pill("Bella Alive",!!window.BellaAlive,"حضور بين الجلسات"),
        pill("Moments Learning",!!window.BellaMomentFeedback,`${window.BellaMomentFeedback?.snapshot?.()?.total||0} تقييم`),
        pill("Voice v2",!!window.BellaVoice,"يوقف عند الكتابة"),
        pill("AI Activities",!!window.BellaAIActivities,"تحديات متجددة")
      ].join("");
      numbers.innerHTML=stat("AI اليوم",cfg.today_ai_used)+stat("Moments معتمدة",approved)+stat("قيد المراجعة",pending)+stat("دفعات Fresh 24س",Array.isArray(batches)?batches.length:0)+stat("Chat AI اليوم",cfg.today_chat_used)+stat("بحث حي اليوم",cfg.today_live_web_used);
      return true;
    }catch{ status.innerHTML=pill("تعذر تحديث حالة v15",false,"جرّب تحديث اللوحة"); return false; }
    finally{loading=false;}
  }

  function decorate(modal){
    if(!(modal instanceof HTMLElement)||modal.id!=="bellaOwnerCenter"||modal.querySelector("[data-bella-owner-dash-v2]"))return false;
    injectStyles(); const card=modal.querySelector(".bella-owner-card"); if(!card)return false;
    const section=document.createElement("section"); section.className="bella-owner-dash-v2"; section.dataset.bellaOwnerDashV2="1"; section.innerHTML=`<h3>🧠 Bella v15 System</h3><small style="color:var(--muted)">حالة العقل والذاكرة واللقطات والـAI — بدون نص المحادثات</small><div class="bella-v15-health-grid" data-v15-health></div><div class="bella-v15-owner-row" data-v15-numbers></div><button type="button" class="vnext-ghost" data-v15-refresh>تحديث الحالة</button>`;
    card.prepend(section); section.querySelector("[data-v15-refresh]").onclick=()=>load(section); load(section); return true;
  }
  function install(){ document.querySelectorAll("#bellaOwnerCenter").forEach(decorate); const o=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes){if(!(n instanceof HTMLElement))continue;if(n.id==="bellaOwnerCenter")queueMicrotask(()=>decorate(n));n.querySelectorAll?.("#bellaOwnerCenter").forEach(x=>queueMicrotask(()=>decorate(x)));}}); if(document.body)o.observe(document.body,{childList:true,subtree:false}); return true; }
  window.BellaOwnerDashboardV2=Object.freeze({install,decorate,load,status:()=>({loading})});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
