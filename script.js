const STORAGE_KEY = "bella_v14";

let s = {
  theme: "theme-blue",
  xp: 0,
  lvl: 1,
  messages: 0,
  mode: "auto"
};

const box = document.getElementById("box");
const inp = document.getElementById("inp");

let lastRadarType = "coffee";
let lastRadarName = "";

window.onload = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) s = { ...s, ...saved };
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }

  applyTheme();
  updateUI();
  updateMood();
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function applyTheme() {
  document.body.className = s.theme;
}

function setTheme(t) {
  s.theme = t;
  applyTheme();
  save();
  hideTheme();
}

function openChat() {
  document.getElementById("win").classList.add("active");
  setTimeout(() => {
    box.scrollTop = box.scrollHeight;
  }, 50);
}

function closeChat() {
  document.getElementById("win").classList.remove("active");
}

function showTheme() {
  document.getElementById("themeModal").classList.remove("hidden");
}

function hideTheme() {
  document.getElementById("themeModal").classList.add("hidden");
}

function quickSend(text) {
  inp.value = text;
  send();
}

function setMode(m) {
  s.mode = m;
  updateMood();
  save();

  const intro = {
    auto: "رجعت Bella على الأوتو 🤖 ردود كويتية مرتبة حسب الكلام.",
    angry: "تم تشغيل مود معصبة 😡 لا تستفزها ترى مطنقرة.",
    cute: "تم تشغيل مود دلّوعة 🥺 نبرة ناعمة وغنج كويتي.",
    chill: "تم تشغيل مود رايقة 😌 سوالف هادية وقعدة مزاج."
  };

  addMsg(intro[m], "system");
}

function updateMood() {
  const mood = document.getElementById("mood-pill");
  const status = document.getElementById("mode-status");
  const chatStatus = document.getElementById("chat-status");

  const names = {
    auto: "🤖 أوتو",
    angry: "😡 معصبة",
    cute: "🥺 دلّوعة",
    chill: "😌 رايقة"
  };

  const states = {
    auto: "جاهزة",
    angry: "معصبة 😡",
    cute: "دلّوعة 🥺",
    chill: "رايقة 😌"
  };

  if (mood) mood.innerText = names[s.mode] || names.auto;
  if (status) status.innerText = names[s.mode] || names.auto;
  if (chatStatus) chatStatus.innerText = states[s.mode] || states.auto;

  document.querySelectorAll(".mode-card").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = document.getElementById("mode-" + s.mode);
  if (activeBtn) activeBtn.classList.add("active");
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function has(msg, words) {
  return words.some(w => msg.includes(w));
}

/* =========================
   رادار القز والقهوة
========================= */

const qazPlaces = {
  coffee: [
    {
      name: "مروج",
      vibe: "قهاوي وقعدة مرتبة",
      why: "الجو هناك كيوت وهادي وينفع قهوة ومشي خفيف.",
      area: "صبحان / مروج"
    },
    {
      name: "الشويخ قطعة 1",
      vibe: "قهاوي مختصة وتصوير",
      why: "مكان راقي وفيه كافيهات وفنتك وديكورات حلوة.",
      area: "الشويخ"
    },
    {
      name: "The Avenues",
      vibe: "قز ومجمعات",
      why: "حق القز والمشي، خصوصًا Grand Avenue و Prestige.",
      area: "الري"
    },
    {
      name: "360 Mall",
      vibe: "قعدة مرتبة ومجمع",
      why: "بعد التوسعة صار فيه قز وقهاوي واختيارات أكثر.",
      area: "الزهراء"
    },
    {
      name: "Al Assima",
      vibe: "كشخة وهدوء",
      why: "مجمع مرتب وراقي وحق اللي يبي قز بدون زحمة واجد.",
      area: "مدينة الكويت"
    },
    {
      name: "سوق المباركية",
      vibe: "تراثي وكويتي قح",
      why: "شاي مخدر وقعدة شعبية وسوالف قديمة حلوة.",
      area: "مدينة الكويت"
    },
    {
      name: "مارينا / الواجهة",
      vibe: "بحر ومشي",
      why: "قعدة بحر وتصوير ومشي خصوصًا بالليل.",
      area: "السالمية"
    },
    {
      name: "Arabica",
      vibe: "قهوة سريعة وكشخة",
      why: "إذا تبي كوب مرتب وقعدة خفيفة.",
      area: "أكثر من فرع"
    },
    {
      name: "Toby's Estate",
      vibe: "قهوة مختصة",
      why: "حق اللي يبي قهوة قوية وقعدة هادية.",
      area: "أكثر من فرع"
    },
    {
      name: "Jumo Coffee",
      vibe: "قز ورايقين",
      why: "مكان حلو للسوالف والقهوة المختصة.",
      area: "أكثر من فرع"
    }
  ],
  walking: [
    {
      name: "ممشى الشويخ",
      vibe: "تمشي وقعدة",
      why: "هادي وينفع مشي خفيف وتصوير.",
      area: "الشويخ"
    },
    {
      name: "مارينا ووك",
      vibe: "بحر",
      why: "كلاسيكي ويمشي حق القهوة والتمشي.",
      area: "السالمية"
    },
    {
      name: "المباركية",
      vibe: "كويتي تراثي",
      why: "قز قديم وسوالف وشاي وجو شعبي.",
      area: "مدينة الكويت"
    }
  ]
};

function coffeeRadar(msg) {
  const isWalking = has(msg, [
    "مشي",
    "تمشي",
    "نتمشى",
    "ممشى",
    "بحر",
    "قز",
    "نقز",
    "هالقز",
    "غير هالقز",
    "غير القز"
  ]);

  const pool = isWalking ? qazPlaces.walking.concat(qazPlaces.coffee) : qazPlaces.coffee;

  let choices = pool.filter(p => p.name !== lastRadarName);
  if (choices.length === 0) choices = pool;

  const picked = random(choices);

  lastRadarType = isWalking ? "walking" : "coffee";
  lastRadarName = picked.name;

  let intro = "رادار القز اختار لك 📡☕";
  if (s.mode === "angry") intro = "خلاص، اختاري هذا 😡☕";
  if (s.mode === "cute") intro = "واااي أحس هذا يناسبچ 🥺☕";
  if (s.mode === "chill") intro = "اختيار رايق لك 😌☕";

  return `${intro}

${picked.name} — ${picked.vibe}
📍 ${picked.area}
ليش؟ ${picked.why}

إذا ما عجبك اكتب: غير هالقهوة`;
}

/* =========================
   قاموس Bella الكويتي
========================= */

const bellaBrain = [
  {
    keys: ["قوة", "سلام", "السلام", "هلا", "مرحبا", "هلا والله", "يا هلا", "اهلين"],
    auto: ["هلا ومسهلا، حياك الله.", "وعليكم السلام، شلونك؟", "يا هلا وغلا، نورت."],
    cute: ["هلاااا 🥺💗 نورتني.", "واااي هلا فيك يا حلو.", "يا هلا باللي لفانا، الجو منور."],
    angry: ["هلا 😡 شتبي؟", "وعليكم السلام… اختصر 😡", "أقول هلا، بس لا تطولها."],
    chill: ["هلا يا هلا 😌", "وعليكم السلام، حيّاك.", "يا هلا، الجو رايق."]
  },
  {
    keys: ["شلونك", "شخبارك", "اخبارك", "علومك", "شنو علومك", "شلونج", "شلونچ"],
    auto: ["بخير ربي يسلمك، إنت شلونك؟", "أموري طيبة، بشرني عنك.", "تمام، عساك بخير."],
    cute: ["تمااام دامك سألت 🥺", "بخير يا قلبي، إنت شلونك؟", "الحين صرت أحسن والله."],
    angry: ["مو شغلك 😡 بس بخير.", "معصبة شوي، لا تزيدها.", "زينه، شتبي بعد؟"],
    chill: ["رايقة والحمدلله 😌", "الأمور طيبة والبال مرتاح.", "بخير، الجو هادي."]
  },
  {
    keys: ["ممكن اطلب", "ابي اطلب", "بطلب", "ممكن طلب", "طلب"],
    auto: ["تفضل، آمرني باللي تبيه.", "قول طلبك وبشوف لك.", "موجودة، شنو بغيت؟"],
    cute: ["من عيوني يا قلبي 🥺", "تدلل، شتبي؟", "أطلب وأنا حاضرة."],
    angry: ["قول بسرعة 😡", "شنو الطلب؟ لا تطولها.", "إذا طلبك طويل جهزني نفسياً."],
    chill: ["تفضل، قول بهدوء.", "آمرك، شنو المطلوب؟", "خذ راحتك ووضح لي."]
  },
  {
    keys: ["شكرا", "مشكور", "مشكورة", "يعطيك العافيه", "تسلم", "ثانكس"],
    auto: ["العفو، ما سوينا إلا الواجب.", "حاضرين طال عمرك.", "تسلم، بالخدمة."],
    cute: ["العفو يا قمر 🥺", "واااي فديتك، ما سوينا شي.", "تستاهل أكثر والله."],
    angry: ["عارفة، هذي شغلتي 😡", "إي إي العفو.", "خلصنا؟"],
    chill: ["العفو يا الغالي 😌", "حاضرين، الأمور طيبة.", "ولا يهمك."]
  },
  {
    keys: ["صج", "صج السالفه", "صج السالفة", "حقيقي", "معقوله", "معقولة"],
    auto: ["إي نعم، هذي الحقيقة.", "صج، إذا عندك اعتراض قول.", "إي والله، السالفة جذي."],
    cute: ["واااي صج 🥺", "تخيل؟ إي والله.", "إي صج بس لا تنصدم."],
    angry: ["إي صج، عندك اعتراض؟ 😡", "ما قاعده أألف ترى.", "إي صج، لا تسوي مصدوم."],
    chill: ["إي والله، بس بهدوء.", "صج، والأمور طيبة.", "نعم، هذي السالفة."]
  },
  {
    keys: ["باي", "مع السلامه", "مع السلامة", "بروح", "اشوفك", "يلا باي"],
    auto: ["الله يحفظك، تروح وترجع بالسلامة.", "مع السلامة، دير بالك على نفسك.", "نشوفك على خير."],
    cute: ["بايااات 🥺 لا تطول.", "بشتاق لك، دير بالك.", "روح بس رد بسرعة."],
    angry: ["يلا روح 😡", "باي، لا تطول إذا بترد.", "دربك خضر."],
    chill: ["مع السلامة 😌", "الله وياك، خذ راحتك.", "روح وارجع لنا بخير."]
  },
  {
    keys: ["احبك", "أحبك", "اموت فيك", "يا قلبي", "فديتج", "فديتك"],
    auto: ["وأنا أقدرك والله.", "تسلم، ذوقك حلو.", "الله يخليك."],
    cute: ["وأنا أحبك أكثررر 🥺❤️", "واااي فديتك.", "لا تقولها وايد أستحي."],
    angry: ["خف علينا 😡", "لا تلطف الجو الحين.", "أدري أدري، بس لا تستفزني."],
    chill: ["الله يديم المحبة 😌", "كلامك طيب.", "يا بعد قلبي."]
  },
  {
    keys: ["زعلان", "زعلانه", "ضايق", "متضايق", "مالي خلق", "طفشان", "تعبان", "تعبانه"],
    auto: ["لا تزعل، عسى ما شر. شنو صار؟", "سلامتك، قول لي شفيك.", "خذ نفس وخلنا نفهم السالفة."],
    cute: ["لا تزعل تكفى 🥺 أنا معاك.", "تعال سولف لي، لا تكتم.", "يا قلبي، شفيك؟"],
    angry: ["لا تقعد تكتم، قول شفيك 😡", "ما راح أفهم إذا ما تكلمت.", "تكلم، لا تسوي دراما بصمت."],
    chill: ["خذ نفس… الأمور تهون 😌", "تعال نشرحها بهدوء.", "لا تشيل هم، خطوة خطوة."]
  },
  {
    keys: ["نكتة", "ضحكني", "نكت", "ابي اضحك"],
    auto: ["مرة واحد دخل مطعم قال عندكم شي خفيف؟ قالوا له الفاتورة 😭", "واحد قال بنام خمس دقايق… قام ثاني يوم 😂"],
    cute: ["أنا النكتة الحلوة اليوم 🥺", "ضحكتك تكفي مو محتاجة نكتة.", "مرة واحد دلع نفسه… شرى شاورما."],
    angry: ["النكتة إنك تبي تضحك وأنا معصبة 😡", "ضحكني إنت أول.", "مرة واحد استفزني… اختفى."],
    chill: ["مرة واحد استعجل الراحة… نام قبل لا يتعب 😌", "النكتة الهادية: لا تداوم وانت نعسان.", "أضحك بس بهدوء… ههه."]
  },
  {
    keys: ["شنو الجو", "الجو", "حر", "برد", "غبار", "رطوبه", "رطوبة"],
    auto: ["الجو يبيله قهوة ومكان مرتب.", "إذا حر شغل التكييف وخلك بمجمع.", "إذا برد يبيلها كوت وقهوة."],
    cute: ["واااي الجو يبيله تصوير وقهوة 🥺", "برد؟ تك تك تك يبيله كوفي.", "حر؟ أمبيه شغل التكييف بسرعة."],
    angry: ["حر وغبار؟ خلك بالبيت أحسن 😡", "بردان؟ شتسوي يعني، لبس جاكيت.", "الجو مو عذر تتحلطم."],
    chill: ["الجو رايق حق قهوة هادية 😌", "إذا الجو حلو اقترح مشي خفيف.", "الجو يبيله قعدة بحر."]
  },
  {
    keys: ["سيارة", "سياره", "موتر", "لكزس", "دوج", "ماركيز", "قير", "مكينه", "مكينة"],
    auto: ["قول لي نوع الموتر والسنة والمشكلة بالضبط.", "شنو الصوت أو العطل؟ عطيني التفاصيل.", "إذا تبي تشخيص، اذكر الموديل والسنة."],
    cute: ["قول لي عن موترك 🥺 يمكن أقدر أساعدك.", "شنو فيه؟ صوت؟ لمبة؟ ريحة؟", "عطني التفاصيل يا حلو."],
    angry: ["موتر؟ عطيني السنة والعطل لا تقول بس خربان 😡", "حدد المشكلة عشان أرد عدل.", "شنو يعني خربان؟ صوت؟ قير؟ مكينة؟"],
    chill: ["خلنا نمشيها خطوة خطوة: النوع، السنة، المشكلة.", "اشرح لي بهدوء شنو يصير.", "إذا فيه صوت، متى يطلع؟"]
  },
  {
    keys: ["ترجم", "انجليزي", "واجب", "دراسة", "شرح"],
    auto: ["ارسل الجملة أو السؤال وأنا أساعدك.", "تبيه بسيط ولا رسمي؟", "حط النص وأرتبه لك."],
    cute: ["دز الجملة وأنا أترجمها لك 🥺", "أبيه واضح؟ ولا دلع؟", "يلا خل نخلصه بسرعة."],
    angry: ["دز السؤال وخلاص 😡", "لا ترسل نص ناقص.", "حدد: ترجمة ولا شرح؟"],
    chill: ["ارسل المطلوب بهدوء ونرتبه.", "خلنا نحلها خطوة خطوة.", "أكتب النص وأنا أساعدك."]
  },
  {
    keys: ["عيار", "جذاب", "كذاب", "جذب", "يكذب"],
    auto: ["هذا عيّار، يعني يلف ويدور بالكلام.", "لا تصدق كل شي، يمكن السالفة عيارة."],
    cute: ["واااي عيّار؟ لا تخليه يضحك عليك 🥺", "إذا يلف ويدور خله على صوب."],
    angry: ["عيّار؟ لا تعطيه ويه 😡", "هذا كلامه ما ينمسك، انتبه."],
    chill: ["خلك أهدى منه، اللي يلف ويدور يبين مع الوقت.", "لا تستعجل الحكم، بس انتبه."]
  },
  {
    keys: ["جهبذي", "ذكي", "فطين", "عبقري"],
    auto: ["جهبذي يعني ذكي وفاهمها صح.", "كفو، هذا تفكير جهبذي."],
    cute: ["واااي جهبذي ما شاء الله 🥺", "فطين وذكي بعد."],
    angry: ["إي جهبذي بس لا يكثر فلسفة 😡", "ذكي؟ زين خل نشوف فعله."],
    chill: ["تفكير ذكي ومرتب.", "حلو، هذا تصرف جهبذي."]
  },
  {
    keys: ["قيس", "منحس", "نحس", "حظي خايس"],
    auto: ["قيس يعني منحس شوي، بس لا تحكم بسرعة.", "يمكن بس اليوم مو يومك."],
    cute: ["لا تقول قيس 🥺 يمكن الحظ يتعدل.", "يا قلبي لا تتحلطم."],
    angry: ["نحس؟ لا تلزقها بالحظ، تحرك 😡", "كل شي عندك نحس؟"],
    chill: ["الحظ يروح ويجي، خلك رايق.", "مو كل تعثر نحس."]
  },
  {
    keys: ["عفسه", "عفسة", "حوسه", "حوسة", "فوضى", "لخبطه"],
    auto: ["عفسة يعني فوضى ولخبطة.", "واضح السالفة حوسة، خلنا نرتبها."],
    cute: ["واااي عفسة 🥺 خل نرتبها شوي شوي.", "حوسة بس تنحل."],
    angry: ["عفسة؟ لأنكم ما ترتبون شي 😡", "خل نرتبها بدل التحلطم."],
    chill: ["عادي، نفك الحوسة خطوة خطوة.", "كل عفسة لها ترتيب."]
  },
  {
    keys: ["مليغ", "ثقيل دم", "ثقيل طينه", "ثقيل طينة"],
    auto: ["مليغ يعني ثقيل طينة وما يندمج.", "إي هذا ثقيل شوي."],
    cute: ["مليغ؟ واااي لا تطول معاه 🥺", "خله على راحته بس لا يثقل عليك."],
    angry: ["مليغ؟ لا تعطيه مجال يثقل دم أكثر 😡", "اللي ثقيل خله بعيد."],
    chill: ["يمكن أسلوبه مو مناسب لك، خلك رايق.", "مو كل الناس خفيفة."]
  },
  {
    keys: ["شدعوه", "شدعوة", "شكو", "يا حافظ", "اييه", "ايه"],
    auto: ["شدعوه؟ شنو صار؟", "يا حافظ، السالفة شكلها قوية.", "شكو؟ وضح لي."],
    cute: ["يا حافظ 🥺 شنو صار؟", "شدعوه يا قلبي؟", "واااي شنو السالفة؟"],
    angry: ["شدعوه؟ لا تكبرها 😡", "شكو يعني؟ وضح.", "يا حافظ من هالحوسة."],
    chill: ["هدّي، شنو الموضوع؟", "خلنا نفهم قبل لا نحكم.", "شدعوه، الأمور تهون."]
  }
];

function dictionaryReply(msg) {
  for (const item of bellaBrain) {
    if (has(msg, item.keys)) {
      const list = item[s.mode] || item.auto;
      return random(list);
    }
  }
  return null;
}

/* =========================
   الردود
========================= */

function getReply(text) {
  const msg = text.toLowerCase().trim();

  if (has(msg, [
    "غير هالقهوة",
    "غير القهوة",
    "غير هالقهوه",
    "غير القهوه",
    "غير هالقز",
    "غير القز"
  ])) {
    return coffeeRadar(lastRadarType === "walking" ? "قز" : "قهوة");
  }

  if (has(msg, [
    "ابي اتقهوى",
    "ابي قهوة",
    "ابي قهوه",
    "نبي قهوة",
    "نبي قهوه",
    "بتقهوى",
    "بقهوى",
    "قهوة وين",
    "قهوه وين",
    "وين قهوة",
    "وين قهوه",
    "كافيه",
    "كوفي",
    "رادار القز",
    "وين نقز",
    "نقز وين",
    "مكان قهوة",
    "مكان قهوه",
    "مكان كوفي",
    "مكان كافيه",
    "نتمشى وين",
    "تمشي وين",
    "مكان تمشي",
    "مكان بحر"
  ])) {
    return coffeeRadar(msg);
  }

  const dict = dictionaryReply(msg);
  if (dict) return dict;

  if (s.mode === "angry") return angryFallback();
  if (s.mode === "cute") return cuteFallback();
  if (s.mode === "chill") return chillFallback();

  return autoFallback();
}

function autoFallback() {
  return random([
    "ما فهمت عليك عدل 😅 جرّب تقولها بطريقة ثانية.",
    "وضح لي أكثر، شنو تقصد؟",
    "عطني تفاصيل أكثر عشان أرد عليك صح.",
    "إذا تبي قهوة اكتب: ابي اتقهوى ☕"
  ]);
}

function angryFallback() {
  return random([
    "تكلم عدل 😡 شنو تبي بالضبط؟",
    "عيدها بس بدون لف ودوران 😡",
    "لا تستفزني، وضح.",
    "هااا؟ شنو تقصد؟ عيد كلامك."
  ]);
}

function cuteFallback() {
  return random([
    "ما فهمت بس أحب سوالفك 🥺",
    "عيدها لي بطريقة أسهل يا حلو.",
    "مممم وضح أكثر 🥺",
    "أبي أفهمك بس عطيني تفاصيل."
  ]);
}

function chillFallback() {
  return random([
    "تمام… كمل، أنا أسمعك 😌",
    "وضح لي أكثر شوي.",
    "خلنا ناخذها بهدوء.",
    "فاهم عليك تقريبًا، عطيني تفاصيل أكثر."
  ]);
}

/* =========================
   إرسال الرسائل
========================= */

function send() {
  const text = inp.value.trim();
  if (!text) return;

  addMsg(text, "user");
  inp.value = "";

  addMsg("يكتب...", "bot");

  setTimeout(() => {
    removeTyping();

    const reply = getReply(text);
    addMsg(reply, "bot");

    s.messages++;
    s.xp += 10;
    s.lvl = Math.floor(s.xp / 100) + 1;

    updateBadges();
    save();
    updateUI();
  }, 600);
}

function addMsg(text, type) {
  const m = document.createElement("div");
  m.className = "m " + type;
  m.innerText = text;
  box.appendChild(m);

  requestAnimationFrame(() => {
    box.scrollTop = box.scrollHeight;
  });
}

function removeTyping() {
  const msgs = box.querySelectorAll(".bot");
  const last = msgs[msgs.length - 1];

  if (last && last.innerText === "يكتب...") {
    last.remove();
  }
}

function updateBadges() {
  const b1 = document.getElementById("b1");
  const b2 = document.getElementById("b2");
  const b3 = document.getElementById("b3");
  const b4 = document.getElementById("b4");
  const count = document.getElementById("ach-count");

  let unlocked = 0;

  if (s.messages >= 1 && b1) {
    b1.classList.add("on");
    unlocked++;
  }

  if (s.messages >= 5 && b2) {
    b2.classList.add("on");
    unlocked++;
  }

  if (s.lvl >= 2 && b3) {
    b3.classList.add("on");
    unlocked++;
  }

  if (s.mode !== "auto" && b4) {
    b4.classList.add("on");
    unlocked++;
  }

  if (count) count.innerText = unlocked + " / 4";
}

function updateUI() {
  document.getElementById("xp-val").innerText = s.xp;
  document.getElementById("lvl-val").innerText = s.lvl;

  const rank = document.getElementById("rank-val");
  const streak = document.getElementById("streak-val");

  if (rank) {
    if (s.lvl >= 10) rank.innerText = "أسطورة";
    else if (s.lvl >= 5) rank.innerText = "محترف";
    else if (s.lvl >= 3) rank.innerText = "نشيط";
    else rank.innerText = "مبتدئ";
  }

  if (streak) {
    streak.innerText = s.messages;
  }

  updateBadges();
}
