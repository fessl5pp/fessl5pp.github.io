(() => {
  "use strict";

  const KEY="bella_game_mind_v1";
  const GAME_KEY="bella_game_center_v2";
  const base=window.BellaPersonality;
  const gameNames={wisdom:"حكمة اليوم",proverb:"أكمل المثل",box:"شنو بالصندوق",kuwait:"التحدي الكويتي"};
  let state=load();
  let observer=null;

  function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||"null");return v&&typeof v==="object"?{lastEvent:null,lastCapturedKey:"",turns:0,lastInjectedTurn:-99,...v}:{lastEvent:null,lastCapturedKey:"",turns:0,lastInjectedTurn:-99};}catch{return{lastEvent:null,lastCapturedKey:"",turns:0,lastInjectedTurn:-99};}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
  function clean(v,max=240){return String(v||"").replace(/\s+/g," ").trim().slice(0,max);}
  function gameState(){try{return JSON.parse(localStorage.getItem(GAME_KEY)||"{}");}catch{return{};}}
  function favoriteGame(){
    const by=gameState()?.stats?.byGame||{};
    return Object.entries(by).sort((a,b)=>(Number(b[1]?.played)||0)-(Number(a[1]?.played)||0))[0]?.[0]||"";
  }
  function recordEvent(kind,score,total){
    if(!kind||!Number.isFinite(score)||!Number.isFinite(total)||total<1)return false;
    const key=`${kind}:${score}:${total}:${Math.floor(Date.now()/5000)}`;
    if(state.lastCapturedKey===key)return false;
    state.lastCapturedKey=key;state.lastEvent={kind,score,total,perfect:score===total,at:Date.now()};state.turns=0;state.lastInjectedTurn=-99;save();
    return true;
  }
  function detectResult(root){
    if(!(root instanceof HTMLElement))return;
    const result=root.matches?.(".bella-game-result")?root:root.querySelector?.(".bella-game-result");if(!result)return;
    const scoreText=clean(result.querySelector?.(".score")?.textContent||"");const m=scoreText.match(/(\d+)\s*\/\s*(\d+)/);if(!m)return;
    const card=result.closest(".bella-game-card");const title=clean(card?.querySelector?.(".bella-game-top p")?.textContent||card?.querySelector?.(".bella-game-top h2")?.textContent||"");
    const kind=title.includes("حكمة")?"wisdom":title.includes("المثل")?"proverb":title.includes("الصندوق")?"box":title.includes("كويتي")?"kuwait":"";
    if(kind)recordEvent(kind,Number(m[1]),Number(m[2]));
  }
  function contextLine(){
    const fav=favoriteGame();const parts=[];const ev=state.lastEvent;const age=ev?Date.now()-Number(ev.at||0):Infinity;
    if(ev&&age<12*60*60*1000){parts.push(`آخر جولة له كانت ${gameNames[ev.kind]||ev.kind}: ${ev.score}/${ev.total}${ev.perfect?" (فل مارك)":""}.`);}
    if(fav&&gameNames[fav])parts.push(`أكثر لعبة يلعبها حاليًا: ${gameNames[fav]}.`);
    if(!parts.length)return"";
    return `سياق لعب اختياري: ${parts.join(" ")} لا تذكر هالمعلومة إلا إذا ركبت طبيعي على السالفة، ولا تحول كل محادثة للألعاب، ولا تكرر نفس التعليق.`;
  }
  function enrichPayload(payload){
    let out=base?.enrichPayload?base.enrichPayload(payload):{...(payload||{})};
    state.turns=(Number(state.turns)||0)+1;
    const line=contextLine();const eligible=line&&state.turns-state.lastInjectedTurn>=8;
    if(eligible){
      const memory=Array.isArray(out.memory)?[...out.memory]:[];
      if(!memory.some(x=>String(x).includes("سياق لعب اختياري:")))memory.push(line);
      out={...out,memory:memory.slice(-12)};state.lastInjectedTurn=state.turns;
    }
    save();return out;
  }
  function observe(){
    if(observer)return;
    document.querySelectorAll(".bella-game-result").forEach(detectResult);
    observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof HTMLElement)queueMicrotask(()=>detectResult(node));});
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  }
  window.BellaPersonality=Object.freeze({...(base||{}),enrichPayload});
  window.BellaGameMind=Object.freeze({recordEvent,context:contextLine,status:()=>({lastEvent:state.lastEvent,favorite:favoriteGame(),turns:state.turns})});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();
