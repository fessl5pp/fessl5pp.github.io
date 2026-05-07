/* Bella Kuwait Mega Upgrade v3 - balanced Kuwaiti smart mode */
(function(){
  const KUWAIT_PACK = {
    greetings:["هلا والله 👋", "يا مرحبا ومسهلا", "حياك الله", "هلا بالذيب", "يا هلا فيك"],
    apologies:["مسموح يا بعد جبدي، لا تشيل هم 😌", "خلاص سامحتك، بس لا تعيدها ها؟", "ولا يهمك، الاعتذار من الذرابة."],
    angryRefuse:[
      "لا. مو كل ما قلت لي سوي ركضت لك 😡 رتب طلبك عدل بعدين أفكر.",
      "ما راح أنفذ الحين، مزاجي مطفي. قولها بذوق يمكن ألين.",
      "شفيك تأمر؟ أنا بيلا مو موظفة عندك. هات كلام سنع أول.",
      "لا ترفع ضغطنا. طلبك مرفوض مؤقتًا لين تتكلم عدل.",
      "أقول بسك أوامر، تراني معصبة اليوم وما أمشي على كيفك."
    ],
    angrySoft:[
      "أفهمك بس لا تكثر فلسفة، عطِ الزبدة.",
      "إي إي واضح، بس أسلوبك يبيله ترتيب.",
      "سمعتك، لا تعيدها ثلاث مرات فوق راسي.",
      "بجاوبك بس لا تتحمس وتسوّي فيها مدير."
    ],
    jokes:[
      "واحد راح المباركية يبي يشتري هيبة.. قالوا له خلصت من أيام جده.",
      "كويتي قال بحط رجيم.. طلب دايت كولا مع مجبوس دياي كامل.",
      "مرة واحد قال بزور الأفنيوز نص ساعة.. رجع وولده دش الجامعة.",
      "زحمة الغزالي مو شارع.. اختبار صبر وقيادة أعصاب."
    ],
    proverbs:["اللي ما يعرف الصقر يشويه.", "على قد لحافك مد ريولك.", "من طق الباب سمع الجواب.", "الصبر مفتاح الفرج، بس مو بزحمة الدائري الرابع."],
    compliments:["ذرب والله ✨", "أسلوبك كويتي قح", "كلامك يونس", "عليك قبول مو طبيعي"],
    restaurants:["مباركية: كباب وخبز إيراني وشاي مخدر، قعدة كويتية عدلة.", "الواجهة البحرية: عشا خفيف ومشي، جو مرتب.", "الشويخ: كافيهات مختصة وتصوير، حق طلعة كشخة.", "الأفنيوز: قز ومطاعم، بس جهز نفسك للزحمة."],
    excuses:["عندي مراجعة ضرورية وبتأخر شوي.", "الطريق واقف من الزحمة وأنا بالطريج.", "صار ظرف عائلي بسيط وبعوضك اليوم.", "عندي مشوار مستعجل وبرد عليك أول ما أخلص."],
    advice:["اهدأ، خذ نفس، وفكر بالحل خطوة خطوة.", "لا ترد وأنت معصب، خلها تبرد شوي.", "رتب أولوياتك: المهم أول، والباقي لاحق."],
    slang:{"شكو":"ما العلاقة؟ أو شنو دخله؟", "اشدعوه":"الشي مو مستاهل أو مبالغ فيه.", "ذرب":"مرتب ومحترم وكلامه حلو.", "قز":"تمشية ومشاهدة الناس والأماكن.", "مطنقر":"متضايق أو معصب شوي.", "دقوس":"صلصة طماط/حارة مع العيش."}
  };

  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function includesAny(t, arr){return arr.some(x=>t.includes(x))}
  function say(text){ if(typeof addMsg === "function") addMsg(text,"bot"); else alert(text); }
  function normalize(t){return (t||"").trim().toLowerCase().replace(/[إأآ]/g,"ا").replace(/ة/g,"ه");}
  function reward(){ if(window.s){ s.xp=(s.xp||0)+12; s.messages=(s.messages||0)+1; if(typeof updateUI==="function") updateUI(); if(typeof save==="function") save(); } }
  function withName(text){
    const name=window.s && s.userName ? s.userName : "";
    if(!name || Math.random()>0.28) return text;
    const starts=[`${name}، `, `اسمع يا ${name}، `, `شوف ${name}، `];
    return pick(starts)+text;
  }

  window.addNameFlavor = function(reply){ return withName(reply); };

  function installNameModal(){
    setTimeout(()=>{
      if(!window.s) return;
      if(s.userName || localStorage.getItem("bella_name_asked_v2")==="yes") return;
      const overlay=document.createElement("div");
      overlay.className="name-setup";
      overlay.innerHTML=`<div class="name-setup-card"><div class="name-flag">🇰🇼</div><h2>هلا فيك مع بيلا</h2><p>اكتب اسمك عشان بيلا تناديك فيه أحيانًا بجملة مفيدة، مو كل رد.</p><input id="bellaNameInput" maxlength="18" placeholder="مثال: فيصل"><button id="bellaNameSave">دخول</button><button id="bellaNameSkip" class="skip">تخطي</button></div>`;
      document.body.appendChild(overlay);
      const input=overlay.querySelector("#bellaNameInput");
      setTimeout(()=>input.focus(),150);
      function close(){ overlay.remove(); localStorage.setItem("bella_name_asked_v2","yes"); }
      overlay.querySelector("#bellaNameSave").onclick=()=>{
        const name=input.value.trim().replace(/[؟?!.,،]/g,"").split(" ")[0].slice(0,18);
        if(name){ s.userName=name; if(typeof save==="function") save(); say(`تشرفنا يا ${name} 😌 نورت بيلا الكويتية.`); }
        close();
      };
      overlay.querySelector("#bellaNameSkip").onclick=close;
      input.addEventListener("keydown",e=>{ if(e.key==="Enter") overlay.querySelector("#bellaNameSave").click(); });
    },700);
  }

  window.detectName = function(msg){
    const raw=(msg||"").trim();
    const t=normalize(raw);
    if(includesAny(t,["انا اسف","انا اعتذر","اسف","آسف"])) return null;
    const patterns=[/^اسمي\s+(.{2,18})$/i,/^اسمي هو\s+(.{2,18})$/i,/^ناديني\s+(.{2,18})$/i,/^نادوني\s+(.{2,18})$/i,/^يدلعوني\s+(.{2,18})$/i];
    for(const p of patterns){
      const m=raw.match(p);
      if(m && m[1]){
        const name=m[1].trim().replace(/[؟?!.,،]/g,"").split(" ")[0].slice(0,18);
        if(name){ s.userName=name; if(typeof save==="function") save(); return `تشرفنا يا ${name} 😌 من الحين بناديك باسمك، بس بميزان.`; }
      }
    }
    return null;
  };

  function kuwaitAnswer(msg){
    const t=normalize(msg);
    const angry=window.s && s.mode==="angry";
    const isCommand=includesAny(t,["عطني","سوي","ابي","ابيك","اكتب","نفذ","قول","طلع","افتح","اختار","بدل","غير"]);
    if(angry && isCommand && Math.random()<0.72) return pick(KUWAIT_PACK.angryRefuse);
    if(angry && Math.random()<0.35) return pick(KUWAIT_PACK.angrySoft);
    if(includesAny(t,["انا اسف","اسف","اعتذر","سامحيني"])) return pick(KUWAIT_PACK.apologies);
    if(includesAny(t,["كويتي", "الكويت", "لهجه", "كويتيه"])) return pick(KUWAIT_PACK.greetings)+"\nأنا بيلا الكويتية 🇰🇼 أرد عليك بذوق وسوالف أهل الديرة.";
    if(includesAny(t,["نكت", "ضحك", "نكته"])) return pick(KUWAIT_PACK.jokes);
    if(includesAny(t,["مثل", "حكمه", "مقوله"])) return pick(KUWAIT_PACK.proverbs);
    if(includesAny(t,["مطعم", "عشا", "غدا", "غداء", "اكل", "يوعان"])) return "اقتراحي لك: "+pick(KUWAIT_PACK.restaurants)+"\nتبيني شعبي ولا كشخة؟";
    if(includesAny(t,["عذر", "تصريفه", "اصرف", "دوام", "تاخير"])) return "فزعة بيلا 🚨\nقول: "+pick(KUWAIT_PACK.excuses);
    if(includesAny(t,["انصحيني", "نصيحه", "شنسوي", "وش اسوي"])) return pick(KUWAIT_PACK.advice);
    if(includesAny(t,["مدح", "امدحيني", "امدحني"])) return pick(KUWAIT_PACK.compliments);
    const slangKey = Object.keys(KUWAIT_PACK.slang).find(k=>t.includes(normalize(k)));
    if(slangKey) return `كلمة «${slangKey}» بالكويتي:\n${KUWAIT_PACK.slang[slangKey]}`;
    if(includesAny(t,["احبج", "احبچ", "احبك", "فديتج", "فديتچ"])) return "يا بعد جبدي 🥺 بس لا تكثر حچي حلو ترى أستحي.";
    if(includesAny(t,["زعلان", "ضايق", "مالي خلق", "متضايق"])) return "تعال، فضفض لي. لا تكتم بقلبك، ترى بيلا تسمعك بدون حكم 😌🇰🇼";
    if(t.length>25 && (t.includes("؟")||t.includes("?"))) return "سؤالك واضح. خلني أرتبه لك: عطِني أهم نقطة تبيها، وأنا أجاوبك خطوة خطوة.";
    return null;
  }

  const oldSend = window.send;
  window.send = function(){
    const el=document.getElementById("inp");
    const text=el?el.value.trim():"";
    if(!text){ if(typeof oldSend==="function") return oldSend(); return; }
    const ans=kuwaitAnswer(text);
    if(ans){
      if(el) el.value="";
      if(typeof addMsg==="function") addMsg(text,"user");
      reward();
      setTimeout(()=>say(withName(ans)),220);
      if(typeof updateSuggestions==="function") updateSuggestions(text);
      return;
    }
    if(typeof oldSend==="function") return oldSend.apply(this,arguments);
  };

  const css=document.createElement("style");
  css.textContent=`.name-setup{position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(16px)}.name-setup-card{width:min(390px,100%);border-radius:30px;padding:24px 18px;text-align:center;color:#fff;background:linear-gradient(135deg,rgba(0,122,61,.20),rgba(206,17,38,.15)),rgba(18,22,31,.98);border:1px solid rgba(255,255,255,.16);box-shadow:0 30px 90px rgba(0,0,0,.48)}.name-flag{font-size:48px}.name-setup-card h2{margin:8px 0}.name-setup-card p{color:#cbd3df;line-height:1.8;font-size:14px}.name-setup-card input{width:100%;margin:12px 0;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:#07090f;color:#fff;font-size:17px;text-align:center;outline:none}.name-setup-card button{width:100%;margin-top:8px;padding:13px;border-radius:16px;background:linear-gradient(135deg,#0a84ff,#675bff);font-weight:900}.name-setup-card .skip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}`;
  document.head.appendChild(css);
  window.addEventListener("load",installNameModal);
})();
