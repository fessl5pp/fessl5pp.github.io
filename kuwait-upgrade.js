/* Bella Kuwait Mega Upgrade v4 - rumors in suggestions + Kuwaiti dictionary/games */
(function(){
  const KUWAIT_PACK = {
    greetings:["هلا والله 👋", "يا مرحبا ومسهلا", "حياك الله", "هلا بالذيب", "يا هلا فيك"],
    apologies:["مسموح يا بعد جبدي، لا تشيل هم 😌", "خلاص سامحتك، بس لا تعيدها ها؟", "ولا يهمك، الاعتذار من الذرابة."],
    angryRefuse:["لا. مو كل أمر أنفذه 😡 رتب طلبك عدل.","ما راح أنفذ الحين، مزاجي مطفي.","شفيك تأمر؟ هات كلام سنع أول.","طلبك مرفوض مؤقتًا لين تتكلم عدل.","بسك أوامر، تراني معصبة وما أمشي على كيفك."],
    angrySoft:["أفهمك بس لا تكثر فلسفة، عطِ الزبدة.","إي واضح، بس أسلوبك يبيله ترتيب.","سمعتك، لا تعيدها ثلاث مرات فوق راسي.","بجاوبك بس لا تسوي فيها مدير."],
    jokes:["واحد راح المباركية يبي يشتري هيبة.. قالوا له خلصت.","كويتي قال بحط رجيم.. طلب دايت كولا مع مجبوس كامل.","قال بزور الأفنيوز نص ساعة.. رجع وولده دش الجامعة.","زحمة الغزالي مو شارع.. اختبار صبر."],
    proverbs:["اللي ما يعرف الصقر يشويه.","على قد لحافك مد ريولك.","من طق الباب سمع الجواب.","الصبر مفتاح الفرج، بس مو بزحمة الرابع."],
    compliments:["ذرب والله ✨","أسلوبك كويتي قح","كلامك يونس","عليك قبول مو طبيعي"],
    restaurants:["مباركية: كباب وخبز إيراني وشاي مخدر.","الواجهة البحرية: عشا خفيف ومشي.","الشويخ: كافيهات مختصة وتصوير.","الأفنيوز: قز ومطاعم، بس جهز للزحمة."],
    excuses:["عندي مراجعة ضرورية وبتأخر شوي.","الطريق واقف من الزحمة وأنا بالطريج.","صار ظرف عائلي بسيط وبعوضك اليوم.","عندي مشوار مستعجل وبرد عليك أول ما أخلص."],
    advice:["اهدأ وخذها خطوة خطوة.","لا ترد وأنت معصب، خلها تبرد.","رتب أولوياتك: المهم أول."],
    slang:{"شكو":"ما العلاقة؟ أو شنو دخله؟","اشدعوه":"الشي مو مستاهل أو مبالغ فيه.","ذرب":"مرتب ومحترم وكلامه حلو.","قز":"تمشية ومشاهدة الناس والأماكن.","مطنقر":"متضايق أو معصب شوي.","دقوس":"صلصة طماط/حارة مع العيش.","سنع":"ترتيب وذوق وتصرف مضبوط.","قرقة":"سوالف كثيرة.","غبقة":"قعدة رمضانية ليلية.","كشخة":"أنيق ومرتب.","حزة":"وقت.","توهق":"انحط بموقف صعب.","نقز":"اطلع بسرعة لمكان.","يمعود":"نداء كويتي للتنبيه أو الاستغراب.","يا بعد جبدي":"تعبير محبة ودلع.","صمل":"ثبت على رأيه أو كمل للآخر.","تحلطم":"تذمر وتشكي."},
    rumors:["يقولون بيلا بتفتح ديوانية رقمية وتوزع قهوة افتراضية.","يقولون اللي يكتب بدلية كثيرة بيلا تسويله قاموس خاص.","يقولون زحمة الغزالي تقدر تعرف أسرارك من طول الانتظار.","يقولون بيلا المعصبة رفضت ترد على السيرفر نفسه.","يقولون إذا ضغطت غير وايد، بيلا تقولك غير أنت أول."],
    games:{
      proverb:[{q:"كمّل: اللي ما يعرف الصقر...",a:"يشويه"},{q:"كمّل: على قد لحافك...",a:"مد ريولك"},{q:"كمّل: من طق الباب...",a:"سمع الجواب"},{q:"كمّل: الصبر مفتاح...",a:"الفرج"}],
      word:[{q:"شنو معنى ذرب؟",a:"مرتب"},{q:"شنو معنى قز؟",a:"تمشية"},{q:"شنو معنى مطنقر؟",a:"معصب"},{q:"شنو معنى دقوس؟",a:"صلصة"}],
      wisdom:[{q:"كمّل الحكمة: لا ترد وأنت...",a:"معصب"},{q:"كمّل الحكمة: الزين ما يكمل إلا...",a:"بالسنع"},{q:"كمّل الحكمة: القعدة الحلوة تبي...",a:"ناس حلوة"}]
    }
  };

  let bellaGame=null;
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function includesAny(t, arr){return arr.some(x=>t.includes(x))}
  function normalize(t){return (t||"").trim().toLowerCase().replace(/[إأآ]/g,"ا").replace(/ة/g,"ه");}
  function say(text){ if(typeof addMsg==="function") addMsg(text,"bot"); else alert(text); }
  function reward(n=12){ if(window.s){ s.xp=(s.xp||0)+n; s.messages=(s.messages||0)+1; if(typeof updateUI==="function") updateUI(); if(typeof save==="function") save(); } }
  function withName(text){ const name=window.s&&s.userName?s.userName:""; if(!name||Math.random()>0.25)return text; return pick([`${name}، `,`اسمع يا ${name}، `,`شوف ${name}، `])+text; }
  window.addNameFlavor=function(reply){return withName(reply)};

  window.showBellaRumor=function(){ say("📢 إشاعة بيلا:\n"+pick(KUWAIT_PACK.rumors)); reward(6); };
  window.quickSendRumor=function(){ window.showBellaRumor(); };

  function installSuggestionPatch(){
    const oldRender=window.renderSuggestions;
    window.renderSuggestions=function(list){
      const el=document.getElementById("quickSuggestions");
      if(!el){ if(typeof oldRender==="function") return oldRender(list); return; }
      const finalList=["إشاعة 📢", ...list.filter(x=>x!=="إشاعة 📢")];
      if(!finalList.includes("غير")) finalList.push("غير");
      el.innerHTML=finalList.map(t=>{
        if(t==="غير") return `<button onclick="refreshSuggestions()">غير 🔄</button>`;
        if(t==="إشاعة 📢") return `<button class="rumor-chip" onclick="quickSendRumor()">إشاعة 📢</button>`;
        const safe=String(t).replace(/'/g,"\\'");
        return `<button onclick="quickSend('${safe}')">${t}</button>`;
      }).join("");
    };
    const oldInit=window.initRumorBar;
    window.initRumorBar=function(){
      const old=document.getElementById("rumor-bar");
      if(old) old.remove();
      if(window.rumorTimer) clearInterval(window.rumorTimer);
      return null;
    };
    const oldUpdate=window.updateSuggestions;
    window.updateSuggestions=function(context=""){
      if(typeof oldUpdate==="function") oldUpdate(context);
      const bar=document.getElementById("rumor-bar");
      if(bar) bar.remove();
    };
    setTimeout(()=>{ if(typeof updateSuggestions==="function") updateSuggestions(); const bar=document.getElementById("rumor-bar"); if(bar) bar.remove(); },500);
  }

  function installNameModal(){ setTimeout(()=>{ if(!window.s) return; if(s.userName||localStorage.getItem("bella_name_asked_v2")==="yes") return; const overlay=document.createElement("div"); overlay.className="name-setup"; overlay.innerHTML=`<div class="name-setup-card"><div class="name-flag">🇰🇼</div><h2>هلا فيك مع بيلا</h2><p>اكتب اسمك عشان بيلا تناديك فيه أحيانًا بجملة مفيدة، مو كل رد.</p><input id="bellaNameInput" maxlength="18" placeholder="مثال: فيصل"><button id="bellaNameSave">دخول</button><button id="bellaNameSkip" class="skip">تخطي</button></div>`; document.body.appendChild(overlay); const input=overlay.querySelector("#bellaNameInput"); setTimeout(()=>input.focus(),150); function close(){ overlay.remove(); localStorage.setItem("bella_name_asked_v2","yes"); } overlay.querySelector("#bellaNameSave").onclick=()=>{ const name=input.value.trim().replace(/[؟?!.,،]/g,"").split(" ")[0].slice(0,18); if(name){ s.userName=name; if(typeof save==="function") save(); say(`تشرفنا يا ${name} 😌 نورت بيلا الكويتية.`); } close(); }; overlay.querySelector("#bellaNameSkip").onclick=close; input.addEventListener("keydown",e=>{ if(e.key==="Enter") overlay.querySelector("#bellaNameSave").click(); }); },700); }

  window.detectName=function(msg){ const raw=(msg||"").trim(); const t=normalize(raw); if(includesAny(t,["انا اسف","انا اعتذر","اسف","آسف"]))return null; const patterns=[/^اسمي\s+(.{2,18})$/i,/^اسمي هو\s+(.{2,18})$/i,/^ناديني\s+(.{2,18})$/i,/^نادوني\s+(.{2,18})$/i,/^يدلعوني\s+(.{2,18})$/i]; for(const p of patterns){ const m=raw.match(p); if(m&&m[1]){ const name=m[1].trim().replace(/[؟?!.,،]/g,"").split(" ")[0].slice(0,18); if(name){ s.userName=name; if(typeof save==="function") save(); return `تشرفنا يا ${name} 😌 من الحين بناديك باسمك، بس بميزان.`; } } } return null; };

  function startGame(kind){ const bank=KUWAIT_PACK.games[kind]||KUWAIT_PACK.games.proverb; bellaGame=pick(bank); return `🎮 لعبة كويتية\n${bellaGame.q}\nجاوبني بكلمة أو جملة قصيرة.`; }
  function checkGame(t){ if(!bellaGame)return null; const ok=normalize(t).includes(normalize(bellaGame.a)); const ans= ok?`صح عليك ✅ الجواب: ${bellaGame.a}`:`قريبة/غلط 😅 الجواب: ${bellaGame.a}`; bellaGame=null; if(ok) reward(25); return ans; }

  function kuwaitAnswer(msg){
    const t=normalize(msg); const gameAns=checkGame(t); if(gameAns)return gameAns;
    const angry=window.s&&s.mode==="angry"; const isCommand=includesAny(t,["عطني","سوي","ابي","ابيك","اكتب","نفذ","قول","طلع","افتح","اختار","بدل","غير"]);
    if(angry&&isCommand&&Math.random()<0.72)return pick(KUWAIT_PACK.angryRefuse);
    if(angry&&Math.random()<0.25)return pick(KUWAIT_PACK.angrySoft);
    if(includesAny(t,["اكمل الحكمه","اكمل حكمة"]))return startGame("wisdom");
    if(includesAny(t,["اكمل المثل","كمل المثل","مثل لعبه"]))return startGame("proverb");
    if(includesAny(t,["لعبه كلمات","قاموس لعبه","خمن الكلمه","معنى كلمه"]))return startGame("word");
    if(includesAny(t,["اشاعه","إشاعة"]))return "📢 إشاعة بيلا:\n"+pick(KUWAIT_PACK.rumors);
    if(includesAny(t,["انا اسف","اسف","اعتذر","سامحيني"]))return pick(KUWAIT_PACK.apologies);
    if(includesAny(t,["قاموس","كلمات كويتيه","مصطلحات"]))return "📚 قاموس بيلا الكويتي:\n"+Object.entries(KUWAIT_PACK.slang).map(([k,v])=>`• ${k}: ${v}`).join("\n");
    const slangKey=Object.keys(KUWAIT_PACK.slang).find(k=>t.includes(normalize(k))); if(slangKey)return `كلمة «${slangKey}» بالكويتي:\n${KUWAIT_PACK.slang[slangKey]}`;
    if(includesAny(t,["كويتي","الكويت","لهجه","كويتيه"]))return pick(KUWAIT_PACK.greetings)+"\nأنا بيلا الكويتية 🇰🇼 أرد عليك بذوق وسوالف أهل الديرة.";
    if(includesAny(t,["نكت","ضحك","نكته"]))return pick(KUWAIT_PACK.jokes);
    if(includesAny(t,["مثل","حكمه","مقوله"]))return pick(KUWAIT_PACK.proverbs);
    if(includesAny(t,["مطعم","عشا","غدا","غداء","اكل","يوعان"]))return "اقتراحي لك: "+pick(KUWAIT_PACK.restaurants)+"\nتبيني شعبي ولا كشخة؟";
    if(includesAny(t,["عذر","تصريفه","اصرف","دوام","تاخير"]))return "فزعة بيلا 🚨\nقول: "+pick(KUWAIT_PACK.excuses);
    if(includesAny(t,["انصحيني","نصيحه","شنسوي","وش اسوي"]))return pick(KUWAIT_PACK.advice);
    if(includesAny(t,["مدح","امدحيني","امدحني"]))return pick(KUWAIT_PACK.compliments);
    if(includesAny(t,["احبج","احبچ","احبك","فديتج","فديتچ"]))return "يا بعد جبدي 🥺 بس لا تكثر حچي حلو ترى أستحي.";
    if(includesAny(t,["زعلان","ضايق","مالي خلق","متضايق"]))return "تعال، فضفض لي. لا تكتم بقلبك، ترى بيلا تسمعك بدون حكم 😌🇰🇼";
    if(t.length>25&&(t.includes("؟")||t.includes("?")))return "سؤالك واضح. خلني أرتبه لك: عطِني أهم نقطة تبيها، وأنا أجاوبك خطوة خطوة.";
    return null;
  }

  const oldSend=window.send;
  window.send=function(){ const el=document.getElementById("inp"); const text=el?el.value.trim():""; if(!text){ if(typeof oldSend==="function")return oldSend(); return; } const ans=kuwaitAnswer(text); if(ans){ if(el)el.value=""; if(typeof addMsg==="function")addMsg(text,"user"); reward(); setTimeout(()=>say(withName(ans)),220); if(typeof updateSuggestions==="function")updateSuggestions(text); return; } if(typeof oldSend==="function")return oldSend.apply(this,arguments); };

  const css=document.createElement("style"); css.textContent=`#rumor-bar{display:none!important}.rumor-chip{background:linear-gradient(135deg,rgba(255,214,10,.28),rgba(255,159,10,.18))!important;border-color:rgba(255,214,10,.42)!important}.name-setup{position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(16px)}.name-setup-card{width:min(390px,100%);border-radius:30px;padding:24px 18px;text-align:center;color:#fff;background:linear-gradient(135deg,rgba(0,122,61,.20),rgba(206,17,38,.15)),rgba(18,22,31,.98);border:1px solid rgba(255,255,255,.16);box-shadow:0 30px 90px rgba(0,0,0,.48)}.name-flag{font-size:48px}.name-setup-card h2{margin:8px 0}.name-setup-card p{color:#cbd3df;line-height:1.8;font-size:14px}.name-setup-card input{width:100%;margin:12px 0;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:#07090f;color:#fff;font-size:17px;text-align:center;outline:none}.name-setup-card button{width:100%;margin-top:8px;padding:13px;border-radius:16px;background:linear-gradient(135deg,#0a84ff,#675bff);font-weight:900}.name-setup-card .skip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}`; document.head.appendChild(css);
  window.addEventListener("load",()=>{installSuggestionPatch(); installNameModal();});
})();
