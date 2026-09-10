(() => {
  "use strict";
  const SUPABASE_URL="https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY="sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const defaults={
    leaderboard_enabled:true,content_ai_enabled:true,wisdom_game_enabled:true,proverb_game_enabled:true,
    rumor_list_enabled:true,box_game_enabled:true,kuwait_quiz_enabled:true,
    chat_ai_enabled:true,voice_enabled:true,ai_activities_enabled:true,moments_enabled:true
  };
  let state={...defaults}, loading=false, last=0;
  const wrapped=new Map();
  function toast(text){try{window.showToast?.(text);}catch{}}
  function allowed(key){return state[key]!==false;}
  function message(key){return ({
    leaderboard_enabled:"لوحة الترتيب موقفها المالك مؤقتًا 🏅",
    wisdom_game_enabled:"حكمة اليوم موقفها المالك مؤقتًا 🧿",
    proverb_game_enabled:"أكمل المثل موقفها المالك مؤقتًا 🧠",
    rumor_list_enabled:"قائمة الإشاعات موقفها المالك مؤقتًا 👂",
    box_game_enabled:"شنو بالصندوق موقفها المالك مؤقتًا 🎁",
    kuwait_quiz_enabled:"التحدي الكويتي موقفه المالك مؤقتًا 🇰🇼",
    chat_ai_enabled:"شات AI موقفه المالك مؤقتًا 💬",
    voice_enabled:"صوت بيلا موقفه المالك مؤقتًا 🔇",
    ai_activities_enabled:"تحديات AI موقفها المالك مؤقتًا ✨",
    moments_enabled:"لقطات بيلا موقفها المالك مؤقتًا 👂"
  })[key]||"الميزة موقوفة مؤقتًا.";}
  function wrap(name,key){
    const fn=window[name];
    if(typeof fn!=="function"||wrapped.get(name)===fn?.__bellaFeatureOriginal)return false;
    const guarded=function(...args){if(!allowed(key)){toast(message(key));return false;}return fn.apply(this,args);};
    guarded.__bellaFeatureOriginal=fn; window[name]=guarded; wrapped.set(name,fn); return true;
  }
  function installGuards(){
    wrap("dailyWisdom","wisdom_game_enabled");
    wrap("startProverbGame","proverb_game_enabled");
    wrap("openBellaRumors","rumor_list_enabled");
    wrap("openBellaRumorList","rumor_list_enabled");
    wrap("startBoxGame","box_game_enabled");
    wrap("startKuwaitiChallenge","kuwait_quiz_enabled");
    wrap("openBellaGameLeaderboard","leaderboard_enabled");
  }
  function applyGlobalControls(){
    try { window.BellaMoments?.setEnabled?.(allowed("moments_enabled")); } catch {}
    const voice=document.getElementById("bellaVoiceToggle");
    if(voice){voice.disabled=!allowed("voice_enabled");voice.title=!allowed("voice_enabled")?message("voice_enabled"):voice.title;}
    if(!allowed("voice_enabled")){try{window.BellaVoice?.stop?.();}catch{}}
    document.querySelectorAll("[data-bella-ai-activity]").forEach(btn=>{btn.disabled=!allowed("ai_activities_enabled");btn.title=!allowed("ai_activities_enabled")?message("ai_activities_enabled"):"";});
  }
  function decorateActivities(){
    const root=document.getElementById("bellaActivities"); if(!root){applyGlobalControls();return;}
    const map={rumors:"rumor_list_enabled",leader:"leaderboard_enabled"};
    root.querySelectorAll("[data-game-center]").forEach(btn=>{const key=map[btn.dataset.gameCenter];if(key){btn.disabled=!allowed(key);btn.title=!allowed(key)?message(key):"";}});
    const textMap=[["حكمة اليوم","wisdom_game_enabled"],["أكمل المثل","proverb_game_enabled"],["كمّل المثل","proverb_game_enabled"],["شنو بالصندوق","box_game_enabled"],["تحدي كويتي","kuwait_quiz_enabled"]];
    root.querySelectorAll("button").forEach(btn=>{const text=(btn.textContent||"").trim();for(const [needle,key] of textMap)if(text.includes(needle)){btn.disabled=!allowed(key);btn.title=!allowed(key)?message(key):"";}});
    applyGlobalControls();
  }
  async function fetchConfig(){
    const tryRpc=async name=>{
      const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:"{}"});
      if(!r.ok)throw new Error(`${name} ${r.status}`);return r.json().catch(()=>null);
    };
    try{return await tryRpc("bella_public_config_v3");}catch{return tryRpc("bella_public_config");}
  }
  async function refresh(force=false){
    if(loading)return state;if(!force&&Date.now()-last<15000)return state;loading=true;
    try{
      const data=await fetchConfig();const row=Array.isArray(data)?data[0]||{}:data||{};
      state={...defaults,...Object.fromEntries(Object.keys(defaults).map(k=>[k,row[k]!==false]))};last=Date.now();installGuards();decorateActivities();
      window.dispatchEvent(new CustomEvent("bella:feature-controls",{detail:{...state}}));
    }catch(error){console.warn("Bella feature controls unavailable:",error?.message||error);installGuards();decorateActivities();}
    finally{loading=false;}
    return state;
  }
  function observe(){installGuards();decorateActivities();const o=new MutationObserver(()=>{installGuards();decorateActivities();});if(document.body)o.observe(document.body,{childList:true,subtree:true});refresh(true);setInterval(()=>refresh(false),60*1000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh(false);});}
  window.BellaFeatureControlsV2=Object.freeze({refresh,enabled:key=>allowed(key),snapshot:()=>({...state}),message});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();
