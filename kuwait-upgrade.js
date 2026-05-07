/* Bella Kuwait Mega Upgrade - drop-in add-on */
(function(){
  const KUWAIT_PACK = {
    greetings:["هلا والله 👋", "يا مرحبا ومسهلا", "حياك الله", "هلا بالذيب", "يا هلا فيك"],
    jokes:[
      "واحد راح المباركية يبي يشتري هيبة.. قالوا له خلصت من أيام جده.",
      "كويتي قال بحط رجيم.. طلب دايت كولا مع مجبوس دياي كامل.",
      "مرة واحد قال بزور الأفنيوز نص ساعة.. رجع وولده دش الجامعة.",
      "زحمة الغزالي مو شارع.. اختبار صبر وقيادة أعصاب."
    ],
    proverbs:[
      "اللي ما يعرف الصقر يشويه.",
      "على قد لحافك مد ريولك.",
      "مد رجولك على قد لحافك، لا تمدها لين الدائري الخامس.",
      "من طق الباب سمع الجواب."
    ],
    compliments:[
      "ذرب والله ✨", "أسلوبك كويتي قح", "يا بعد جبدي كلامك يونس", "عليك قبول مو طبيعي"],
    restaurants:[
      "مجبوس دياي من مطعم شعبي مضبوط، ومعاه دقوس عدل.",
      "مشاوي بحرية على الواجهة، جو وكشخة بدون فلسفة.",
      "مباركية: كباب وخبز إيراني وشاي مخدر، خلها قعدة كويتية.",
      "مطعم كشخة في مدينة الكويت إذا تبي طلعة مرتبة وتصوير."
    ],
    excuses:[
      "قول: عندي مراجعة ضرورية وبتأخر شوي، لا تكبرها.",
      "قول: الطريق واقف من الزحمة، وأنا بالطريج الحين.",
      "قول: صار ظرف عائلي بسيط وبعوضك اليوم.",
      "قول: عندي مشوار مستعجل وبرد عليك أول ما أخلص."
    ],
    slang:{
      "شكو":"يعني: ما العلاقة؟ أو شنو دخله؟",
      "اشدعوه":"تقال لما الشي مبالغ فيه أو مو مستاهل.",
      "ذرب":"مرتب، محترم، وكلامه حلو.",
      "قز":"تمشية ومشاهدة الناس والأماكن.",
      "مطنقر":"متضايق أو معصب شوي.",
      "دقوس":"صلصة حارة/طماط كويتية تنفع مع العيش."
    }
  };

  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function includesAny(t, arr){return arr.some(x=>t.includes(x))}
  function say(text){
    if(typeof addMsg === "function") addMsg(text,"bot");
    else alert(text);
  }
  function reward(){
    if(window.s){
      s.xp=(s.xp||0)+12; s.messages=(s.messages||0)+1;
      if(typeof updateUI==="function") updateUI();
      if(typeof save==="function") save();
    }
  }
  function kuwaitAnswer(msg){
    const t=(msg||"").trim().toLowerCase();
    if(includesAny(t,["كويتي", "الكويت", "لهجة", "كويتية"])) return pick(KUWAIT_PACK.greetings)+"\nأنا بيلا الكويتية 🇰🇼 قول اللي تبيه وبرد عليك بذوق وسوالف أهل الديرة.";
    if(includesAny(t,["نكت", "ضحك", "نكتة"])) return pick(KUWAIT_PACK.jokes);
    if(includesAny(t,["مثل", "حكمة", "مقولة"])) return pick(KUWAIT_PACK.proverbs);
    if(includesAny(t,["مطعم", "عشا", "غدا", "غداء", "اكل", "أكل"])) return "اقتراحي لك: "+pick(KUWAIT_PACK.restaurants)+"\nتبيني أختار لك ستايل شعبي ولا كشخة؟";
    if(includesAny(t,["عذر", "تصريفة", "اصرف", "دوام", "تأخير"])) return "فزعة بيلا 🚨\n"+pick(KUWAIT_PACK.excuses);
    if(includesAny(t,["مدح", "امدحيني", "امدحني"])) return pick(KUWAIT_PACK.compliments)+" يا بعد حيي.";
    const slangKey = Object.keys(KUWAIT_PACK.slang).find(k=>t.includes(k));
    if(slangKey) return `كلمة «${slangKey}» بالكويتي:\n${KUWAIT_PACK.slang[slangKey]}`;
    if(includesAny(t,["احبج", "احبچ", "احبك", "فديتج", "فديتچ"])) return "يا بعد جبدي 🥺 بس لا تكثر حچي حلو ترى أستحي.";
    if(includesAny(t,["زعلان", "ضايق", "مالي خلق", "متضايق"])) return "تعال، فضفض لي. لا تكتم بقلبك، ترى بيلا تسمعك بدون حكم 😌🇰🇼";
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
      setTimeout(()=>say(ans),260);
      if(typeof updateSuggestions==="function") updateSuggestions(text);
      return;
    }
    if(typeof oldSend==="function") return oldSend.apply(this,arguments);
  };

  window.bellaKuwaitBoost = function(){
    say("تم تشغيل ترقية بيلا الكويتية 🇰🇼\nموجود عندك الآن: نكت كويتية، أمثال، قاموس مصطلحات، فزعة أعذار، اقتراح مطاعم، ومدح كويتي.");
  };
})();
