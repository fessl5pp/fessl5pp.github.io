/* Bella Kuwait Mega Upgrade v6 - chatty slang + compact mood picker */
(function(){
  const KUWAIT_PACK = {
    greetings:["هلا والله 👋", "يا مرحبا ومسهلا", "حياك الله", "هلا بالذيب", "يا هلا فيك"],
    apologies:["مسموح يا بعد جبدي، لا تشيل هم 😌", "خلاص سامحتك، بس لا تعيدها ها؟", "ولا يهمك، الاعتذار من الذرابة."],
    angryWords:["چب","جب","مالت","يا معود","استريح","ويهك","من صجك؟","لا تذلف","أرف","طاع هذا","شفيك تخور وتجبص؟","أهو بس!","إي هين","لا تشغلني","شلوحي","مالي خلقك","وبعدين وياك؟","شتبيني أسوي لك؟","يا معود طير"],
    cuteWords:["أبيه","حده","مشكول","استصحيت","واي","تشققت","هبّة","بليز","إمبييييه","حياتووو","شالسالفة؟","عزيمة تايم","قهوة تايم","أوفر","يهبل","صدمني","كيووت","نايس","يونس","فديتك"],
    angryRefuse:["أقول استريح، مو كل أمر أنفذه 😡","مالي خلقك الحين، رتب طلبك وتعال.","من صجك؟ تبي كل شي جاهز؟","شتبيني أسوي لك بعد؟ خف علينا.","لا تشغلني، طلبك مرفوض مؤقتًا.","طاع هذا.. يأمر بعد! إي هين.","أهو بس! خلصنا من الأوامر."],
    angrySoft:["أفهمك بس عطِ الزبدة.","شفيك تخور وتجبص؟ وضّح كلامك.","بجاوبك بس لا تسوي فيها مدير.","مالت على هالسؤال، بس يلا بجاوب.","الجو أرف والزحمة أرف، شتتوقع يعني؟"],
    angryLove:["حبك برص وعشرة خرص! فاضي أنت؟ روح شوف شغلك.","أقول استريح، لا تتلزق الحين مالي خلق رومانسية.","إي هين تحبني؟ روح ادرس/اشتغل أحسن لك."],
    cuteLove:["وااااي فديت قلبك! حدي استصحيت 🌸✨","إمبييييه مشكول حياتي، كلامك حده يجنن 🥺💕","ياي فديتك، كلك ذوق وتهبل ✨"],
    chatter:{
      "سنع":["إي هذا الكلام السنع، مو سوالف عشوائية وخلاص.","السنع حلو بكل شي: كلامك، لبسك، وحتى طلعتك لازم تكون مرتبة.","إذا بتسوي شي، سوّه بسنع ولا خله."],
      "ذرب":["الذرب يبين من أسلوبه قبل شكله.","الكلام الذرب يفتح النفس، مو كل واحد يعرف له."],
      "قز":["القز يبيله مزاج: قهوة، مكان مرتب، وناس خفيفة.","قز بدون سالفة حلوة ماله طعم."],
      "كشخة":["الكشخة مو بس لبس، حتى التصرف له كشخة.","كشخة الكويت غير، بسيطة بس تبين."],
      "تحلطم":["التحلطم عندنا مو هواية، أسلوب حياة وقت الزحمة.","تحلطم شوي بس لا تعيش الدور كله."],
      "مطنقر":["واضح فيك مطنقر، خذ نفس وخلها على الله.","المطنقر يحتاج قهوة وهدوء مو نقاش طويل."],
      "دقوس":["الدقوس إذا مو حار شوي لا تحسبه دقوس.","الدقوس مع المجبوس يضبط المزاج."],
      "غبقة":["الغبقة يبيلها ناس سنعة وقعدة ما تنمل.","غبقة بدون سوالف وضحك ناقصة."],
      "نقز":["نقز يعني طلعة سريعة، بس بالكويت السريعة تصير ساعتين من الزحمة.","نقز قهوة ولا نقز مباركية؟"],
      "صمل":["الصامل يكمل حتى لو الطريق كله تحويلات.","صملتك حلوة بس لا تعاند على الفاضي."],
      "أوفر":["إي أوفر شوي، خفف الدراما.","مو كل شي يستاهل أوفر رياكشن."],
      "إمبييه":["إمبييه هذي حق الصدمات الخفيفة، مو كل دقيقة تقولها.","إمبييه؟ شكلك دلوعة اليوم."],
      "مالت":["مالت تنقال لما الوضع يسد النفس، بس لا تكثرها.","مالت على الزحمة إذا خربت الطلعة."],
      "من صجك":["من صجك؟ هذي تنقال إذا السؤال داخل عرض.","أحيانًا الرد الوحيد المناسب: من صجك؟"]
    },
    jokes:["واحد راح المباركية يبي يشتري هيبة.. قالوا له خلصت.","كويتي قال بحط رجيم.. طلب دايت كولا مع مجبوس كامل.","قال بزور الأفنيوز نص ساعة.. رجع وولده دش الجامعة.","زحمة الغزالي مو شارع.. اختبار صبر."],
    proverbs:["اللي ما يعرف الصقر يشويه.","على قد لحافك مد ريولك.","من طق الباب سمع الجواب.","الصبر مفتاح الفرج، بس مو بزحمة الرابع.","اللي بالجدر يطلعه الملاس.","مد رجولك على قد لحافك."],
    compliments:["ذرب والله ✨","أسلوبك كويتي قح","كلامك يونس","عليك قبول مو طبيعي"],
    restaurants:["مباركية: كباب وخبز إيراني وشاي مخدر.","الواجهة البحرية: عشا خفيف ومشي.","الشويخ: كافيهات مختصة وتصوير.","الأفنيوز: قز ومطاعم، بس جهز للزحمة."],
    excuses:["عندي مراجعة ضرورية وبتأخر شوي.","الطريق واقف من الزحمة وأنا بالطريج.","صار ظرف عائلي بسيط وبعوضك اليوم.","عندي مشوار مستعجل وبرد عليك أول ما أخلص."],
    advice:["اهدأ وخذها خطوة خطوة.","لا ترد وأنت معصب، خلها تبرد.","رتب أولوياتك: المهم أول."],
    slang:{"چب":"اسكت/وقف كلام، وتجي بنبرة حادة.","جب":"نفس چب؛ اسكت.","مالت":"كلمة تحلطم على شي مو عاجبك.","يا معود":"نداء للتعجب أو التنبيه.","استريح":"وقف فلسفة أو لا تكمل.","ويهك":"وجهك، وتستخدم بالمزح أو الاستهزاء.","من صجك":"هل أنت جاد؟","لا تذلف":"امش/ابتعد بنبرة طرد.","أرف":"شي يضيق الخلق.","طاع هذا":"شوف هذا شنو يقول.","تخور وتجبص":"تتكلم كلام ملخبط.","إي هين":"سخرية بمعنى مو مصدقك.","شلوحي":"شكله مو مرتب.","أبيه":"تعجب بدلع.","حده":"جداً/وايد.","مشكول":"مشكور بدلع.","استصحيت":"استحيت بدلع.","واي":"تعجب أو انفعال.","تشققت":"مستانسة وايد.","هبّة":"موضة/ترند.","بليز":"رجاء بدلع.","إمبييييه":"تعجب قوي.","حياتووو":"نداء دلع.","أوفر":"مبالغ فيه.","يهبل":"جميل جداً.","صدمني":"فاجأني.","شكو":"ما العلاقة؟","اشدعوه":"مو مستاهل.","ذرب":"مرتب ومحترم.","قز":"تمشية ومشاهدة الأماكن.","مطنقر":"متضايق أو معصب.","دقوس":"صلصة طماط/حارة.","سنع":"ترتيب وذوق.","قرقة":"سوالف كثيرة.","غبقة":"قعدة رمضانية ليلية.","كشخة":"أنيق.","حزة":"وقت.","توهق":"انحط بموقف صعب.","نقز":"اطلع بسرعة.","صمل":"ثبت وكمل.","تحلطم":"تذمر وتشكي."},
    rumors:["يقولون بيلا بتفتح ديوانية رقمية وتوزع قهوة افتراضية.","يقولون اللي يكتب بدلية كثيرة بيلا تسويله قاموس خاص.","يقولون زحمة الغزالي تقدر تعرف أسرارك من طول الانتظار.","يقولون بيلا المعصبة رفضت ترد على السيرفر نفسه.","يقولون إذا ضغطت غير وايد، بيلا تقولك غير أنت أول.","يقولون بيلا الدلوعة تطلب ماتشا قبل لا ترد."],
    games:{
      proverb:[{q:"كمّل: اللي ما يعرف الصقر...",a:"يشويه"},{q:"كمّل: على قد لحافك...",a:"مد ريولك"},{q:"كمّل: من طق الباب...",a:"سمع الجواب"},{q:"كمّل: اللي بالجدر...",a:"يطلعه الملاس"}],
      word:[{q:"شنو معنى ذرب؟",a:"مرتب"},{q:"شنو معنى قز؟",a:"تمشية"},{q:"شنو معنى مطنقر؟",a:"معصب"},{q:"شنو معنى دقوس؟",a:"صلصة"},{q:"شنو معنى أوفر؟",a:"مبالغ"},{q:"شنو معنى شلوحي؟",a:"مو مرتب"}],
      wisdom:[{q:"كمّل الحكمة: لا ترد وأنت...",a:"معصب"},{q:"كمّل الحكمة: الزين ما يكمل إلا...",a:"بالسنع"},{q:"كمّل الحكمة: القعدة الحلوة تبي...",a:"ناس حلوة"}]
    }
  };

  let bellaGame=null;
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function includesAny(t, arr){return arr.some(x=>t.includes(normalize(x)))}
  function normalize(t){return (t||"").trim().toLowerCase().replace(/[إأآ]/g,"ا").replace(/ة/g,"ه");}
  function say(text){ if(typeof addMsg==="function") addMsg(text,"bot"); else alert(text); }
  function reward(n=12){ if(window.s){ s.xp=(s.xp||0)+n; s.messages=(s.messages||0)+1; if(typeof updateUI==="function") updateUI(); if(typeof save==="function") save(); } }
  function mode(){return window.s&&s.mode?s.mode:"auto"}
  function withName(text){ const name=window.s&&s.userName?s.userName:""; if(!name||Math.random()>0.22)return text; return pick([`${name}، `,`اسمع يا ${name}، `,`شوف ${name}، `])+text; }
  window.addNameFlavor=function(reply){return withName(reply)};
  window.showBellaRumor=function(){ say("📢 إشاعة بيلا:\n"+pick(KUWAIT_PACK.rumors)); reward(6); };
  window.quickSendRumor=function(){ window.showBellaRumor(); };

  function installCompactMoodPicker(){
    const panel=document.querySelector(".mode-panel"); if(!panel||panel.dataset.compactMood==="yes")return;
    panel.dataset.compactMood="yes";
    const grid=panel.querySelector(".mode-grid"); const head=panel.querySelector(".mode-head");
    if(head && !head.querySelector(".mood-toggle")){
      const btn=document.createElement("button"); btn.className="mood-toggle"; btn.type="button"; btn.textContent="المودات 🎭";
      btn.onclick=()=>panel.classList.toggle("open"); head.appendChild(btn);
    }
    if(grid) grid.classList.add("mood-hidden-grid");
    document.querySelectorAll(".mode-card").forEach(b=>b.addEventListener("click",()=>setTimeout(()=>panel.classList.remove("open"),120)));
  }

  function installSuggestionPatch(){
    const oldRender=window.renderSuggestions;
    window.renderSuggestions=function(list){
      const el=document.getElementById("quickSuggestions");
      if(!el){ if(typeof oldRender==="function") return oldRender(list); return; }
      let extras=[];
      if(mode()==="angry") extras=["طاع هذا","من صجك؟","مالي خلقك"];
      if(mode()==="cute") extras=["إمبييييه","حياتووو","حده كيوت"];
      const finalList=["إشاعة 📢", ...extras, ...list.filter(x=>x!=="إشاعة 📢")];
      if(!finalList.includes("غير")) finalList.push("غير");
      el.innerHTML=finalList.map(t=>{
        if(t==="غير") return `<button onclick="refreshSuggestions()">غير 🔄</button>`;
        if(t==="إشاعة 📢") return `<button class="rumor-chip" onclick="quickSendRumor()">إشاعة 📢</button>`;
        const safe=String(t).replace(/'/g,"\\'");
        return `<button onclick="quickSend('${safe}')">${t}</button>`;
      }).join("");
    };
    window.initRumorBar=function(){ const old=document.getElementById("rumor-bar"); if(old) old.remove(); if(window.rumorTimer) clearInterval(window.rumorTimer); return null; };
    const oldUpdate=window.updateSuggestions;
    window.updateSuggestions=function(context=""){ if(typeof oldUpdate==="function") oldUpdate(context); const bar=document.getElementById("rumor-bar"); if(bar) bar.remove(); installCompactMoodPicker(); };
    setTimeout(()=>{ if(typeof updateSuggestions==="function") updateSuggestions(); const bar=document.getElementById("rumor-bar"); if(bar) bar.remove(); installCompactMoodPicker(); },500);
  }

  function installNameModal(){ setTimeout(()=>{ if(!window.s) return; if(s.userName||localStorage.getItem("bella_name_asked_v2")==="yes") return; const overlay=document.createElement("div"); overlay.className="name-setup"; overlay.innerHTML=`<div class="name-setup-card"><div class="name-flag">🇰🇼</div><h2>هلا فيك مع بيلا</h2><p>اكتب اسمك عشان بيلا تناديك فيه أحيانًا بجملة مفيدة، مو كل رد.</p><input id="bellaNameInput" maxlength="18" placeholder="مثال: فيصل"><button id="bellaNameSave">دخول</button><button id="bellaNameSkip" class="skip">تخطي</button></div>`; document.body.appendChild(overlay); const input=overlay.querySelector("#bellaNameInput"); setTimeout(()=>input.focus(),150); function close(){ overlay.remove(); localStorage.setItem("bella_name_asked_v2","yes"); } overlay.querySelector("#bellaNameSave").onclick=()=>{ const name=input.value.trim().replace(/[؟?!.,،]/g,"").split(" ")[0].slice(0,18); if(name){ s.userName=name; if(typeof save==="function") save(); say(`تشرفنا يا ${name} 😌 نورت بيلا الكويتية.`); } close(); }; overlay.querySelector("#bellaNameSkip").onclick=close; input.addEventListener("keydown",e=>{ if(e.key==="Enter") overlay.querySelector("#bellaNameSave").click(); }); },700); }
  window.detectName=function(msg){ const raw=(msg||"").trim(); const t=normalize(raw); if(includesAny(t,["انا اسف","انا اعتذر","اسف","آسف"]))return null; const patterns=[/^اسمي\s+(.{2,18})$/i,/^اسمي هو\s+(.{2,18})$/i,/^ناديني\s+(.{2,18})$/i,/^نادوني\s+(.{2,18})$/i,/^يدلعوني\s+(.{2,18})$/i]; for(const p of patterns){ const m=raw.match(p); if(m&&m[1]){ const name=m[1].trim().replace(/[؟?!.,،]/g,"").split(" ")[0].slice(0,18); if(name){ s.userName=name; if(typeof save==="function") save(); return `تشرفنا يا ${name} 😌 من الحين بناديك باسمك، بس بميزان.`; } } } return null; };
  function startGame(kind){ const bank=KUWAIT_PACK.games[kind]||KUWAIT_PACK.games.proverb; bellaGame=pick(bank); return `🎮 لعبة كويتية\n${bellaGame.q}\nجاوبني بكلمة أو جملة قصيرة.`; }
  function checkGame(t){ if(!bellaGame)return null; const ok=normalize(t).includes(normalize(bellaGame.a)); const ans= ok?`صح عليك ✅ الجواب: ${bellaGame.a}`:`قريبة/غلط 😅 الجواب: ${bellaGame.a}`; bellaGame=null; if(ok) reward(25); return ans; }
  function dictionaryByMode(){ if(mode()==="angry") return "😡 قاموس المعصبة:\n"+KUWAIT_PACK.angryWords.map(w=>`• ${w}`).join("\n"); if(mode()==="cute") return "🌸 قاموس الدلوعة:\n"+KUWAIT_PACK.cuteWords.map(w=>`• ${w}`).join("\n"); return "📚 قاموس بيلا الكويتي:\n"+Object.entries(KUWAIT_PACK.slang).map(([k,v])=>`• ${k}: ${v}`).join("\n"); }
  function wantsDefinition(t){return includesAny(t,["معنى","شنو معنى","اشرح","قاموس","مصطلحات","مفردات","يعني شنو"])}
  function chattySlang(t){ const key=Object.keys(KUWAIT_PACK.chatter).find(k=>t.includes(normalize(k))); return key?pick(KUWAIT_PACK.chatter[key]):null; }

  function kuwaitAnswer(msg){
    const t=normalize(msg); const gameAns=checkGame(t); if(gameAns)return gameAns;
    const m=mode(); const angry=m==="angry"; const cute=m==="cute"; const isCommand=includesAny(t,["عطني","سوي","ابي","ابيك","اكتب","نفذ","قول","طلع","افتح","اختار","بدل","غير"]);
    if(angry&&includesAny(t,["احبج","احبچ","احبك","فديتج","فديتچ"]))return pick(KUWAIT_PACK.angryLove);
    if(cute&&includesAny(t,["احبج","احبچ","احبك","فديتج","فديتچ"]))return pick(KUWAIT_PACK.cuteLove);
    if(angry&&isCommand&&Math.random()<0.74)return pick(KUWAIT_PACK.angryRefuse);
    if(angry&&Math.random()<0.22)return pick(KUWAIT_PACK.angrySoft);
    if(includesAny(t,["اكمل الحكمه","اكمل حكمة"]))return startGame("wisdom");
    if(includesAny(t,["اكمل المثل","كمل المثل","مثل لعبه"]))return startGame("proverb");
    if(includesAny(t,["لعبه كلمات","قاموس لعبه","خمن الكلمه","معنى كلمه"]))return startGame("word");
    if(includesAny(t,["اشاعه","إشاعة"]))return "📢 إشاعة بيلا:\n"+pick(KUWAIT_PACK.rumors);
    if(includesAny(t,["انا اسف","اسف","اعتذر","سامحيني"]))return angry?"إي هين.. سامحتك بس لا تعيدها.":pick(KUWAIT_PACK.apologies);
    if(includesAny(t,["قاموس","كلمات كويتيه","مصطلحات","مفردات"]))return dictionaryByMode();
    const slangKey=Object.keys(KUWAIT_PACK.slang).find(k=>t.includes(normalize(k)));
    if(slangKey && wantsDefinition(t))return `كلمة «${slangKey}» بالكويتي:\n${KUWAIT_PACK.slang[slangKey]}`;
    const chat=chattySlang(t); if(chat)return cute?`واي ${chat} 🌸`:angry?`إي نعم، ${chat}`:chat;
    if(includesAny(t,["شلونك","شلونج","شلونچ"]))return angry?"شتبي بشلوني؟ اخلص قول اللي عندك.":cute?"هايووو حياتي! حدي تمام ومستانسة 🌸":"تمام، شخبارك أنت؟";
    if(includesAny(t,["الجو","طقس"]))return angry?"نار وقار! شنو تتوقع بلكويت؟":cute?"أبيه الجو حده رطوبة بس يونس حق طلعة خفيفة 🍦":"الجو بالكويت يبيله قهوة ومكان بارد.";
    if(includesAny(t,["كويتي","الكويت","لهجه","كويتيه"]))return pick(KUWAIT_PACK.greetings)+"\nأنا بيلا الكويتية 🇰🇼 أرد عليك حسب المود وبلهجة أهل الديرة.";
    if(includesAny(t,["نكت","ضحك","نكته"]))return pick(KUWAIT_PACK.jokes);
    if(includesAny(t,["مثل","حكمه","مقوله"]))return pick(KUWAIT_PACK.proverbs);
    if(includesAny(t,["مطعم","عشا","غدا","غداء","اكل","يوعان"]))return cute?"أبيه نبي شي حده كيوت.. "+pick(KUWAIT_PACK.restaurants):"اقتراحي لك: "+pick(KUWAIT_PACK.restaurants);
    if(includesAny(t,["عذر","تصريفه","اصرف","دوام","تاخير"]))return "فزعة بيلا 🚨\nقول: "+pick(KUWAIT_PACK.excuses);
    if(includesAny(t,["انصحيني","نصيحه","شنسوي","وش اسوي"]))return pick(KUWAIT_PACK.advice);
    if(includesAny(t,["مدح","امدحيني","امدحني"]))return cute?"واي أنت حده ذوق وكلامك يجنن 🌸":pick(KUWAIT_PACK.compliments);
    if(includesAny(t,["زعلان","ضايق","مالي خلق","متضايق"]))return cute?"حياتووو تعال فضفض لي، لا تضايق 🥺":"تعال، فضفض لي. لا تكتم بقلبك 😌🇰🇼";
    if(t.length>25&&(t.includes("؟")||t.includes("?")))return angry?"سؤالك طويل، عطِ الزبدة.":cute?"أبيه سؤالك طويل شوي بس يلا فهمني أهم نقطة 🌸":"سؤالك واضح. عطِني أهم نقطة، وأنا أجاوبك خطوة خطوة.";
    return null;
  }

  const oldSend=window.send;
  window.send=function(){ const el=document.getElementById("inp"); const text=el?el.value.trim():""; if(!text){ if(typeof oldSend==="function")return oldSend(); return; } const ans=kuwaitAnswer(text); if(ans){ if(el)el.value=""; if(typeof addMsg==="function")addMsg(text,"user"); reward(); setTimeout(()=>say(withName(ans)),220); if(typeof updateSuggestions==="function")updateSuggestions(text); return; } if(typeof oldSend==="function")return oldSend.apply(this,arguments); };

  const css=document.createElement("style"); css.textContent=`#rumor-bar{display:none!important}.rumor-chip{background:linear-gradient(135deg,rgba(255,214,10,.28),rgba(255,159,10,.18))!important;border-color:rgba(255,214,10,.42)!important}.mode-panel{padding:10px!important}.mood-toggle{padding:8px 12px;border-radius:999px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-weight:900}.mode-panel .mood-hidden-grid{display:none!important}.mode-panel.open .mood-hidden-grid{display:grid!important}.mode-panel:not(.open){margin-bottom:6px!important}.mode-panel:not(.open) .mode-head{margin-bottom:0!important}body:has(#mode-angry.active) .chat-win{box-shadow:inset 0 0 90px rgba(255,59,48,.08)}body:has(#mode-cute.active) .chat-win{box-shadow:inset 0 0 90px rgba(255,77,141,.10)}.name-setup{position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(16px)}.name-setup-card{width:min(390px,100%);border-radius:30px;padding:24px 18px;text-align:center;color:#fff;background:linear-gradient(135deg,rgba(0,122,61,.20),rgba(206,17,38,.15)),rgba(18,22,31,.98);border:1px solid rgba(255,255,255,.16);box-shadow:0 30px 90px rgba(0,0,0,.48)}.name-flag{font-size:48px}.name-setup-card h2{margin:8px 0}.name-setup-card p{color:#cbd3df;line-height:1.8;font-size:14px}.name-setup-card input{width:100%;margin:12px 0;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:#07090f;color:#fff;font-size:17px;text-align:center;outline:none}.name-setup-card button{width:100%;margin-top:8px;padding:13px;border-radius:16px;background:linear-gradient(135deg,#0a84ff,#675bff);font-weight:900}.name-setup-card .skip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}`; document.head.appendChild(css);
  window.addEventListener("load",()=>{installSuggestionPatch(); installCompactMoodPicker(); installNameModal();});
})();
