(() => {
  "use strict";

  const BANK = window.BellaGameBankV2;
  if (!BANK) return;

  const STORAGE_KEY = "bella_game_center_v2";
  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const LETTERS = ["أ", "ب", "ج", "د"];

  const defaults = {
    stats: {
      totalAnswers: 0,
      totalCorrect: 0,
      gamesPlayed: 0,
      bestStreak: 0,
      xpEarned: 0,
      byGame: {
        wisdom: { played: 0, correct: 0, answers: 0, best: 0 },
        proverb: { played: 0, correct: 0, answers: 0, best: 0 },
        box: { played: 0, correct: 0, answers: 0, best: 0 },
        kuwait: { played: 0, correct: 0, answers: 0, best: 0 }
      }
    },
    achievements: {},
    favorites: [],
    recentRumors: [],
    settings: { sfx: true, haptics: true, confetti: true },
    dailyWisdom: { day: "", completed: false }
  };

  let state = loadState();
  let activityObserver = null;
  let currentSession = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw || typeof raw !== "object") return clone(defaults);
      return {
        ...clone(defaults),
        ...raw,
        stats: {
          ...clone(defaults.stats),
          ...safeObject(raw.stats),
          byGame: { ...clone(defaults.stats.byGame), ...safeObject(raw.stats?.byGame) }
        },
        achievements: safeObject(raw.achievements),
        favorites: Array.isArray(raw.favorites) ? raw.favorites.map(Number).filter(Number.isFinite).slice(0, 200) : [],
        recentRumors: Array.isArray(raw.recentRumors) ? raw.recentRumors.map(Number).filter(Number.isFinite).slice(-30) : [],
        settings: { ...defaults.settings, ...safeObject(raw.settings) },
        dailyWisdom: { ...defaults.dailyWisdom, ...safeObject(raw.dailyWisdom) }
      };
    } catch { return clone(defaults); }
  }
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]);
  }
  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[؟?!.,،؛:…]/g," ").replace(/\s+/g," ").trim();
  }
  function shuffle(items) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function sampleOthers(items, predicate, count = 3) { return shuffle(items.filter(predicate)).slice(0, count); }
  function dayKey() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Kuwait", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date()); }
    catch { return new Date().toISOString().slice(0,10); }
  }
  function hash(value) {
    let h = 2166136261;
    for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function getDisplayName() {
    try {
      const account = window.BellaAccount?.displayName?.();
      if (account) return String(account).slice(0,40);
      if (typeof s === "object" && s.userName) return String(s.userName).slice(0,40);
    } catch {}
    return "لاعب";
  }
  function clearLegacyGame() { try { activeGame = null; currentChallenge = null; } catch {} }

  const ACHIEVEMENTS = [
    { id:"first_correct", icon:"✅", title:"أول صح", desc:"أول إجابة صحيحة", test:ctx=>ctx.stats.totalCorrect >= 1 },
    { id:"correct_10", icon:"🎯", title:"عشرة على عشرة", desc:"10 إجابات صحيحة بالمجموع", test:ctx=>ctx.stats.totalCorrect >= 10 },
    { id:"correct_50", icon:"🏹", title:"عينك ميزان", desc:"50 إجابة صحيحة", test:ctx=>ctx.stats.totalCorrect >= 50 },
    { id:"streak_5", icon:"🔥", title:"مولّع", desc:"5 صح ورا بعض", test:ctx=>ctx.stats.bestStreak >= 5 },
    { id:"streak_10", icon:"⚡", title:"ما تنصاد", desc:"10 صح ورا بعض", test:ctx=>ctx.stats.bestStreak >= 10 },
    { id:"wisdom_25", icon:"🧿", title:"حكيم بيلا", desc:"25 إجابة صحيحة بالحِكم", test:ctx=>ctx.stats.byGame.wisdom.correct >= 25 },
    { id:"proverb_25", icon:"🧠", title:"راعي الأمثال", desc:"25 إجابة صحيحة بالأمثال", test:ctx=>ctx.stats.byGame.proverb.correct >= 25 },
    { id:"kuwait_25", icon:"🇰🇼", title:"ولد الديرة", desc:"25 إجابة صحيحة بالتحدي الكويتي", test:ctx=>ctx.stats.byGame.kuwait.correct >= 25 },
    { id:"perfect", icon:"🏆", title:"فل مارك", desc:"10/10 بجلسة وحدة", test:ctx=>ctx.lastPerfect === true },
    { id:"games_10", icon:"🎮", title:"لاعب بيلا", desc:"كمل 10 جولات", test:ctx=>ctx.stats.gamesPlayed >= 10 },
    { id:"xp_500", icon:"💎", title:"صياد XP", desc:"اكسب 500 XP من الألعاب", test:ctx=>ctx.stats.xpEarned >= 500 },
    { id:"rumor_favs", icon:"👂", title:"جامع الإشاعات", desc:"احفظ 10 إشاعات بالمفضلة", test:ctx=>ctx.favoriteCount >= 10 }
  ];

  function ensureStyles() {
    if (document.getElementById("bellaGameCenterV2Styles")) return;
    const style = document.createElement("style");
    style.id = "bellaGameCenterV2Styles";
    style.textContent = `
      .bella-game-card{width:min(760px,94vw)!important;max-height:90vh;overflow:auto}
      .bella-game-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.bella-game-top h2{margin:0}.bella-game-top p{margin:5px 0 0;color:var(--muted);line-height:1.65}
      .bella-game-close{border:0;background:transparent;color:inherit;font:inherit;font-size:20px;cursor:pointer}
      .bella-game-statsbar{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.bella-game-stat{padding:9px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.04);text-align:center}.bella-game-stat b{display:block;font-size:16px}.bella-game-stat span{font-size:11px;color:var(--muted)}
      .bella-game-progress{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin:10px 0 16px}.bella-game-progress>i{display:block;height:100%;width:0;background:var(--accent);transition:width .25s ease}
      .bella-game-question{font-size:clamp(19px,4vw,28px);font-weight:900;line-height:1.8;padding:17px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);margin:12px 0}
      .bella-game-options{display:grid;grid-template-columns:1fr 1fr;gap:9px}.bella-game-option{display:flex;align-items:flex-start;gap:10px;text-align:right;min-height:58px;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.045);color:inherit;font:inherit;cursor:pointer;line-height:1.55}.bella-game-option .letter{display:grid;place-items:center;min-width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.08);font-weight:900}.bella-game-option.correct{border-color:rgba(75,211,126,.75);background:rgba(75,211,126,.12)}.bella-game-option.wrong{border-color:rgba(255,105,105,.7);background:rgba(255,105,105,.1);opacity:.78}.bella-game-option:disabled{cursor:default}
      .bella-game-feedback{min-height:44px;margin:12px 0 4px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.035);line-height:1.7}.bella-game-feedback.ok{border:1px solid rgba(75,211,126,.35)}.bella-game-feedback.no{border:1px solid rgba(255,105,105,.3)}
      .bella-game-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.bella-game-actions button{flex:1;min-width:120px}
      .bella-game-result{text-align:center;padding:12px}.bella-game-result .score{font-size:54px;font-weight:950;line-height:1.1;margin:14px 0}.bella-game-badges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.bella-game-badge{padding:11px 8px;border:1px solid rgba(255,255,255,.09);border-radius:15px;text-align:center;background:rgba(255,255,255,.035)}.bella-game-badge.locked{opacity:.35;filter:grayscale(1)}.bella-game-badge span{font-size:24px}.bella-game-badge b{display:block;font-size:12px;margin-top:5px}.bella-game-badge small{display:block;color:var(--muted);font-size:10px;line-height:1.45;margin-top:3px}
      .bella-game-profile-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.bella-game-profile-grid>div{padding:12px 8px;border-radius:15px;background:rgba(255,255,255,.045);text-align:center}.bella-game-profile-grid b{display:block;font-size:20px}.bella-game-profile-grid small{color:var(--muted)}
      .bella-leader-tabs{display:flex;gap:7px;margin:10px 0;flex-wrap:wrap}.bella-leader-tabs button.active{background:var(--accent);color:#fff}.bella-leader-row{display:grid;grid-template-columns:42px 1fr 86px 70px;gap:8px;align-items:center;padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.07)}.bella-leader-row.header{font-size:11px;color:var(--muted)}.bella-leader-name{font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bella-rumor-tools{display:grid;grid-template-columns:1fr 170px auto;gap:8px;margin:12px 0}.bella-rumor-tools input,.bella-rumor-tools select{width:100%;box-sizing:border-box}.bella-rumor-day{padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.05);line-height:1.75;margin-bottom:12px}.bella-rumor-list{display:grid;gap:8px}.bella-rumor-item{padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.035)}.bella-rumor-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}.bella-rumor-chip{font-size:11px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.08)}.bella-rumor-fav{border:0;background:transparent;color:inherit;font-size:20px;cursor:pointer}.bella-rumor-note{font-size:11px;color:var(--muted);line-height:1.6;margin:8px 0}.bella-rumor-more{margin-top:10px;width:100%}
      .bella-game-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08)}.bella-game-toggle input{width:20px;height:20px}
      .bella-difficulty-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:14px 0}.bella-difficulty-grid button{min-height:82px}.bella-difficulty-grid b,.bella-difficulty-grid small{display:block}.bella-difficulty-grid small{color:var(--muted);margin-top:5px}
      .bella-confetti{position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden}.bella-confetti i{position:absolute;top:-20px;width:9px;height:14px;border-radius:3px;background:var(--accent);animation:bellaFall 1.35s ease-in forwards}@keyframes bellaFall{to{transform:translateY(105vh) rotate(520deg);opacity:.2}}
      @media(max-width:620px){.bella-game-options{grid-template-columns:1fr}.bella-game-statsbar,.bella-game-profile-grid{grid-template-columns:repeat(2,1fr)}.bella-game-badges{grid-template-columns:repeat(2,1fr)}.bella-rumor-tools{grid-template-columns:1fr}.bella-leader-row{grid-template-columns:34px 1fr 65px}.bella-leader-row>:last-child{display:none}.bella-difficulty-grid{grid-template-columns:1fr}.bella-game-card{max-height:92vh}}
      @media(prefers-reduced-motion:reduce){.bella-game-progress>i{transition:none}.bella-confetti{display:none}}
    `;
    document.head.appendChild(style);
  }

  function modal(id, html) {
    document.getElementById(id)?.remove();
    const host = document.createElement("div");
    host.id = id;
    host.className = "vnext-modal";
    host.innerHTML = `<div class="vnext-card bella-game-card">${html}</div>`;
    host.addEventListener("click", e => { if (e.target === host) host.remove(); });
    document.body.appendChild(host);
    return host;
  }

  function addXP(points) {
    if (!points) return;
    state.stats.xpEarned += points;
    try {
      if (typeof s === "object") {
        const old = Number(s.lvl || 1);
        s.xp = Number(s.xp || 0) + points;
        s.lvl = Math.floor(s.xp / 100) + 1;
        if (typeof updateUI === "function") updateUI();
        if (typeof save === "function") save();
        if (s.lvl > old && typeof showLevelCard === "function") showLevelCard();
      }
    } catch {}
  }

  function beep(ok) {
    if (!state.settings.sfx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = ok ? 660 : 220;
      osc.type = ok ? "sine" : "triangle";
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.13);
      setTimeout(() => ctx.close().catch(()=>{}), 220);
    } catch {}
  }
  function vibrate(ok) { if (state.settings.haptics && navigator.vibrate) try { navigator.vibrate(ok ? 35 : [40,35,40]); } catch {} }
  function confetti() {
    if (!state.settings.confetti || matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const fx = document.createElement("div"); fx.className = "bella-confetti";
    for (let i=0;i<28;i++) { const p=document.createElement("i"); p.style.left=`${Math.random()*100}%`; p.style.animationDelay=`${Math.random()*.25}s`; p.style.opacity=String(.45+Math.random()*.55); p.style.transform=`rotate(${Math.random()*180}deg)`; fx.appendChild(p); }
    document.body.appendChild(fx); setTimeout(()=>fx.remove(),1750);
  }

  function unlockAchievements(extra = {}) {
    const ctx = { stats:state.stats, favoriteCount:state.favorites.length, ...extra };
    const unlocked = [];
    for (const item of ACHIEVEMENTS) {
      if (state.achievements[item.id] || !item.test(ctx)) continue;
      state.achievements[item.id] = Date.now();
      unlocked.push(item);
    }
    if (unlocked.length) {
      saveState();
      setTimeout(() => {
        try { window.BellaMoments?.showToast?.(`🏆 فتحت إنجاز: ${unlocked[0].title}`); } catch {}
      }, 120);
    }
    return unlocked;
  }

  function sessionToken() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.access_token || ""; } catch { return ""; }
  }
  async function rpc(name, body, auth = false) {
    const token = auth ? sessionToken() : "";
    if (auth && !token) return null;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method:"POST",
      headers:{ apikey:SUPABASE_KEY, "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {}) },
      body:JSON.stringify(body || {})
    });
    if (!response.ok) throw new Error(`RPC ${response.status}`);
    return response.json().catch(()=>null);
  }
  function submitCloud(kind, correct, points, streak, sessionComplete) {
    if (!window.BellaAccount?.isSignedIn?.()) return;
    rpc("bella_submit_game_score", {
      p_display_name:getDisplayName(), p_game:kind, p_correct:Boolean(correct), p_points:Number(points)||0, p_streak:Number(streak)||0, p_session_complete:Boolean(sessionComplete)
    }, true).catch(()=>{});
  }

  function questionFor(kind, item) {
    if (kind === "wisdom") {
      const options = shuffle([item.meaning, ...sampleOthers(BANK.wisdoms, x=>x.id!==item.id,3).map(x=>x.meaning)]);
      return { prompt:`«${item.text}»\nشنو معناها؟`, answer:item.meaning, options, explanation:item.meaning };
    }
    if (kind === "proverb") {
      const options = shuffle([item.answer, ...sampleOthers(BANK.proverbs, x=>x.id!==item.id && normalize(x.answer)!==normalize(item.answer),3).map(x=>x.answer)]);
      return { prompt:`كمّل المثل:\n${item.start}`, answer:item.answer, options, explanation:`${item.start.replace(/\.\.\.$/,"")} ${item.answer}\n${item.meaning}` };
    }
    if (kind === "box") {
      const options = shuffle([item.answer, ...sampleOthers(BANK.boxes, x=>x.id!==item.id,3).map(x=>x.answer)]);
      return { prompt:`🎁 شنو بالصندوق؟\n${item.clue}`, answer:item.answer, options, explanation:`الجواب: ${item.answer}` };
    }
    return { prompt:item.q, answer:item.a, options:shuffle(item.o), explanation:`الجواب: ${item.a}` };
  }

  function gameTitle(kind) { return ({wisdom:"حكمة اليوم 🧿",proverb:"أكمل المثل 🧠",box:"شنو بالصندوق؟ 🎁",kuwait:"تحدي كويتي 🇰🇼"})[kind] || "لعبة بيلا"; }
  function gamePoints(kind) { return ({wisdom:15,proverb:20,box:12,kuwait:10})[kind] || 10; }
  function bankFor(kind, difficulty="all") {
    if (kind === "wisdom") return BANK.wisdoms;
    if (kind === "box") return BANK.boxes;
    if (kind === "kuwait") return BANK.kuwaitQuestions;
    const pool = difficulty === "all" ? BANK.proverbs : BANK.proverbs.filter(x=>x.difficulty===difficulty);
    return pool.length >= 10 ? pool : BANK.proverbs;
  }

  function startGame(kind, options = {}) {
    ensureStyles(); clearLegacyGame();
    const daily = options.daily === true;
    const difficulty = options.difficulty || "all";
    const pool = bankFor(kind, difficulty);
    let picked;
    if (daily && kind === "wisdom") {
      const item = pool[hash(dayKey()) % pool.length]; picked = [item];
    } else {
      picked = shuffle(pool).slice(0, Math.min(10, pool.length));
    }
    currentSession = { kind, daily, difficulty, questions:picked, index:0, correct:0, streak:0, bestStreak:0, answered:false, xp:0 };
    renderSession();
  }

  function renderSession() {
    const ss = currentSession; if (!ss) return;
    const item = ss.questions[ss.index];
    if (!item) return finishSession();
    const q = questionFor(ss.kind, item);
    ss.current = q; ss.answered = false;
    const total = ss.questions.length;
    const host = modal("bellaGameCenterPlay", `
      <div class="bella-game-top"><div><h2>${gameTitle(ss.kind)}</h2><p>${ss.daily ? "سؤال اليوم — ما يدخل الشات." : `جولة ${total} أسئلة — اختار من أربع خيارات.`}</p></div><button class="bella-game-close" data-close aria-label="إغلاق">✕</button></div>
      <div class="bella-game-statsbar">
        <div class="bella-game-stat"><b>${ss.index+1}/${total}</b><span>السؤال</span></div>
        <div class="bella-game-stat"><b>${ss.correct}</b><span>صح</span></div>
        <div class="bella-game-stat"><b>${ss.streak}🔥</b><span>سلسلة</span></div>
        <div class="bella-game-stat"><b>${ss.xp}</b><span>XP</span></div>
      </div>
      <div class="bella-game-progress"><i style="width:${((ss.index)/total)*100}%"></i></div>
      <div class="bella-game-question" data-testid="bella-game-question">${escapeHtml(q.prompt).replace(/\n/g,"<br>")}</div>
      <div class="bella-game-options">${q.options.map((opt,i)=>`<button class="bella-game-option" data-choice="${i}" data-testid="bella-game-choice"><span class="letter">${LETTERS[i]}</span><span>${escapeHtml(opt)}</span></button>`).join("")}</div>
      <div class="bella-game-feedback" id="bellaGameFeedback" aria-live="polite">اختار جواب واحد.</div>
      <div class="bella-game-actions"><button id="bellaGameNext" class="vnext-primary" hidden>${ss.index===total-1?"النتيجة":"السؤال اللي بعده"}</button><button id="bellaGameBack" class="vnext-ghost">رجوع للألعاب</button></div>
    `);
    host.querySelector("[data-close]").onclick=()=>host.remove();
    host.querySelector("#bellaGameBack").onclick=()=>{ host.remove(); window.openBellaActivities?.(); };
    host.querySelectorAll("[data-choice]").forEach(btn=>btn.onclick=()=>answerChoice(btn, q));
    host.querySelector("#bellaGameNext").onclick=()=>{ ss.index++; if (ss.index>=total) finishSession(); else renderSession(); };
  }

  function answerChoice(button, q) {
    const ss=currentSession; if (!ss || ss.answered) return;
    ss.answered=true;
    const selected=q.options[Number(button.dataset.choice)];
    const correct=normalize(selected)===normalize(q.answer);
    const points=correct?gamePoints(ss.kind):0;
    const feedback=document.getElementById("bellaGameFeedback");
    const buttons=[...document.querySelectorAll("#bellaGameCenterPlay [data-choice]")];
    buttons.forEach((btn,i)=>{
      btn.disabled=true;
      if (normalize(q.options[i])===normalize(q.answer)) btn.classList.add("correct");
    });
    if (correct) {
      ss.correct++; ss.streak++; ss.bestStreak=Math.max(ss.bestStreak,ss.streak); ss.xp+=points;
      button.classList.add("correct");
      feedback.className="bella-game-feedback ok";
      feedback.textContent=`صح عليك ✅ +${points} XP — ${q.explanation}`;
      beep(true); vibrate(true); addXP(points);
    } else {
      ss.streak=0; button.classList.add("wrong");
      feedback.className="bella-game-feedback no";
      feedback.textContent=`غلط ❌ — ${q.explanation}`;
      beep(false); vibrate(false);
    }

    const g=state.stats.byGame[ss.kind];
    state.stats.totalAnswers++; g.answers++;
    if (correct) { state.stats.totalCorrect++; g.correct++; }
    state.stats.bestStreak=Math.max(state.stats.bestStreak,ss.bestStreak);
    g.best=Math.max(g.best,ss.bestStreak);
    saveState(); unlockAchievements();

    const finalAnswer=ss.index===ss.questions.length-1;
    submitCloud(ss.kind,correct,points,ss.bestStreak,finalAnswer);
    const next=document.getElementById("bellaGameNext"); if(next) next.hidden=false;
    const progress=document.querySelector("#bellaGameCenterPlay .bella-game-progress>i"); if(progress) progress.style.width=`${((ss.index+1)/ss.questions.length)*100}%`;
  }

  function finishSession() {
    const ss=currentSession; if(!ss) return;
    const total=ss.questions.length;
    state.stats.gamesPlayed++;
    const g=state.stats.byGame[ss.kind]; g.played++;
    if (ss.daily && ss.kind==="wisdom") state.dailyWisdom={day:dayKey(),completed:true};
    saveState();
    const perfect=total>=10 && ss.correct===total;
    const newly=unlockAchievements({lastPerfect:perfect});
    if(perfect){confetti();beep(true);}
    const pct=Math.round((ss.correct/Math.max(1,total))*100);
    const host=modal("bellaGameCenterPlay",`
      <div class="bella-game-top"><div><h2>خلصت الجولة 🎮</h2><p>${gameTitle(ss.kind)}</p></div><button class="bella-game-close" data-close>✕</button></div>
      <div class="bella-game-result"><div class="score">${ss.correct}/${total}</div><p>${pct>=90?"وحش 🔥":pct>=70?"كفو عليك 👏":pct>=50?"زين، قربت 😌":"نبي ريماتش 😏"}</p><p>كسبت <b>${ss.xp} XP</b> · أفضل سلسلة <b>${ss.bestStreak}🔥</b></p>${newly.length?`<p>🏆 إنجاز جديد: <b>${escapeHtml(newly.map(x=>x.title).join("، "))}</b></p>`:""}</div>
      <div class="bella-game-actions"><button id="bellaGameReplay" class="vnext-primary">العب مرة ثانية</button><button id="bellaGameProfile" class="vnext-ghost">ملفي</button><button id="bellaGameHome" class="vnext-ghost">الألعاب</button></div>
    `);
    host.querySelector("[data-close]").onclick=()=>host.remove();
    host.querySelector("#bellaGameReplay").onclick=()=>startGame(ss.kind,{daily:false,difficulty:ss.difficulty});
    host.querySelector("#bellaGameProfile").onclick=openGameProfile;
    host.querySelector("#bellaGameHome").onclick=()=>{host.remove();window.openBellaActivities?.();};
  }

  function openProverbGame() {
    ensureStyles(); clearLegacyGame();
    const host=modal("bellaProverbDifficulty",`
      <div class="bella-game-top"><div><h2>أكمل المثل 🧠</h2><p>اختر الصعوبة. كل سؤال فيه أربع تكملات.</p></div><button class="bella-game-close" data-close>✕</button></div>
      <div class="bella-difficulty-grid">
        <button class="vnext-ghost" data-diff="easy"><b>سهل 😌</b><small>أمثال مشهورة وواضحة</small></button>
        <button class="vnext-ghost" data-diff="medium"><b>متوسط 👀</b><small>يبيلها تركيز شوي</small></button>
        <button class="vnext-ghost" data-diff="hard"><b>صعب 🔥</b><small>للّي حافظ سوالف الأولين</small></button>
      </div><div class="bella-game-actions"><button id="bellaProverbAll" class="vnext-primary">خلط الكل</button><button id="bellaProverbBack" class="vnext-ghost">رجوع</button></div>
    `);
    host.querySelector("[data-close]").onclick=()=>host.remove();
    host.querySelectorAll("[data-diff]").forEach(b=>b.onclick=()=>startGame("proverb",{difficulty:b.dataset.diff}));
    host.querySelector("#bellaProverbAll").onclick=()=>startGame("proverb",{difficulty:"all"});
    host.querySelector("#bellaProverbBack").onclick=()=>{host.remove();window.openBellaActivities?.();};
  }

  function openDailyWisdom() {
    const today=dayKey();
    if(state.dailyWisdom.day!==today) state.dailyWisdom={day:today,completed:false};
    startGame("wisdom",{daily:true});
  }

  function openGameProfile() {
    ensureStyles();
    const accuracy=state.stats.totalAnswers?Math.round(state.stats.totalCorrect/state.stats.totalAnswers*100):0;
    const favoriteGame=Object.entries(state.stats.byGame).sort((a,b)=>b[1].played-a[1].played)[0]?.[0] || "wisdom";
    const unlocked=ACHIEVEMENTS.filter(x=>state.achievements[x.id]).length;
    const host=modal("bellaGameProfile",`
      <div class="bella-game-top"><div><h2>ملف اللاعب 👤</h2><p>${escapeHtml(getDisplayName())} · أكثر لعبة: ${escapeHtml(gameTitle(favoriteGame).replace(/[🧿🧠🎁🇰🇼]/gu,""))}</p></div><button class="bella-game-close" data-close>✕</button></div>
      <div class="bella-game-profile-grid"><div><b>${state.stats.gamesPlayed}</b><small>جولات</small></div><div><b>${state.stats.totalCorrect}</b><small>صح</small></div><div><b>${accuracy}%</b><small>الدقة</small></div><div><b>${state.stats.bestStreak}🔥</b><small>أفضل سلسلة</small></div><div><b>${state.stats.xpEarned}</b><small>XP ألعاب</small></div><div><b>${unlocked}/${ACHIEVEMENTS.length}</b><small>إنجازات</small></div><div><b>${state.favorites.length}</b><small>إشاعات مفضلة</small></div><div><b>${BANK.counts.rumors+ BANK.counts.wisdoms + BANK.counts.proverbs}</b><small>محتوى البنك</small></div></div>
      <h3>الإنجازات 🏆</h3><div class="bella-game-badges">${ACHIEVEMENTS.map(a=>`<div class="bella-game-badge ${state.achievements[a.id]?"":"locked"}"><span>${a.icon}</span><b>${escapeHtml(a.title)}</b><small>${escapeHtml(a.desc)}</small></div>`).join("")}</div>
      <div class="bella-game-actions"><button id="bellaProfileLeader" class="vnext-primary">لوحة الترتيب</button><button id="bellaProfileGames" class="vnext-ghost">الألعاب</button></div>
    `);
    host.querySelector("[data-close]").onclick=()=>host.remove();
    host.querySelector("#bellaProfileLeader").onclick=openLeaderboard;
    host.querySelector("#bellaProfileGames").onclick=()=>{host.remove();window.openBellaActivities?.();};
  }

  async function openLeaderboard(scope="weekly") {
    ensureStyles();
    const host=modal("bellaGameLeaderboard",`
      <div class="bella-game-top"><div><h2>لوحة الترتيب 🏅</h2><p>تعرض اسم اللاعب ونتيجة الألعاب فقط — بدون إيميلات أو محادثات.</p></div><button class="bella-game-close" data-close>✕</button></div>
      <div class="bella-leader-tabs"><button data-scope="daily" class="vnext-ghost">اليوم</button><button data-scope="weekly" class="vnext-ghost">الأسبوع</button><button data-scope="all" class="vnext-ghost">كل الوقت</button></div>
      <div id="bellaLeaderBody"><p style="color:var(--muted)">قاعد أجيب الترتيب...</p></div>
      <div class="bella-game-actions"><button id="bellaLeaderProfile" class="vnext-ghost">ملفي</button><button id="bellaLeaderGames" class="vnext-ghost">الألعاب</button></div>
    `);
    const load=async(nextScope)=>{
      host.querySelectorAll("[data-scope]").forEach(b=>b.classList.toggle("active",b.dataset.scope===nextScope));
      const body=host.querySelector("#bellaLeaderBody"); body.innerHTML=`<p style="color:var(--muted)">قاعد أجيب الترتيب...</p>`;
      try {
        const rows=await rpc("bella_get_game_leaderboard",{p_scope:nextScope,p_limit:20},false);
        const list=Array.isArray(rows)?rows:[];
        body.innerHTML=list.length?`<div class="bella-leader-row header"><span>#</span><span>اللاعب</span><span>النقاط</span><span>أفضل سلسلة</span></div>${list.map(r=>`<div class="bella-leader-row"><b>${Number(r.rank)||"-"}</b><span class="bella-leader-name">${escapeHtml(r.display_name)}</span><b>${Number(r.score)||0}</b><span>${Number(r.best_streak)||0}🔥</span></div>`).join("")}`:`<p style="color:var(--muted);line-height:1.7">ما في نتائج بهالفترة للحين. العب وأنت مسجل دخول عشان تدخل الترتيب.</p>`;
      } catch { body.innerHTML=`<p style="color:var(--muted)">ما قدرت أجيب الترتيب الحين. جرب بعد شوي.</p>`; }
    };
    host.querySelector("[data-close]").onclick=()=>host.remove();
    host.querySelectorAll("[data-scope]").forEach(b=>b.onclick=()=>load(b.dataset.scope));
    host.querySelector("#bellaLeaderProfile").onclick=openGameProfile;
    host.querySelector("#bellaLeaderGames").onclick=()=>{host.remove();window.openBellaActivities?.();};
    load(scope);
  }

  function openGameSettings() {
    ensureStyles();
    const host=modal("bellaGameSettings",`
      <div class="bella-game-top"><div><h2>إعدادات الألعاب ⚙️</h2><p>المؤثرات اختيارية وتشتغل على جهازك بس.</p></div><button class="bella-game-close" data-close>✕</button></div>
      <label class="bella-game-toggle"><span><b>صوت الصح والغلط 🔊</b><br><small>نغمة قصيرة داخل اللعبة</small></span><input type="checkbox" data-setting="sfx" ${state.settings.sfx?"checked":""}></label>
      <label class="bella-game-toggle"><span><b>اهتزاز خفيف 📳</b><br><small>إذا جهازك يدعم الاهتزاز</small></span><input type="checkbox" data-setting="haptics" ${state.settings.haptics?"checked":""}></label>
      <label class="bella-game-toggle"><span><b>احتفال النتيجة 🎉</b><br><small>كونفيتي عند الفل مارك</small></span><input type="checkbox" data-setting="confetti" ${state.settings.confetti?"checked":""}></label>
      <div class="bella-game-actions"><button id="bellaGameSettingsBack" class="vnext-primary">تم</button></div>
    `);
    host.querySelector("[data-close]").onclick=()=>host.remove();
    host.querySelectorAll("[data-setting]").forEach(input=>input.onchange=()=>{state.settings[input.dataset.setting]=input.checked;saveState();});
    host.querySelector("#bellaGameSettingsBack").onclick=()=>{host.remove();window.openBellaActivities?.();};
  }

  function dailyRumor() { return BANK.rumors[hash(`rumor-${dayKey()}`)%BANK.rumors.length]; }
  function randomRumor() {
    let pool=BANK.rumors.filter(x=>!state.recentRumors.includes(x.id));
    if(!pool.length){state.recentRumors=[];pool=[...BANK.rumors];}
    const item=pool[Math.floor(Math.random()*pool.length)];
    state.recentRumors.push(item.id); state.recentRumors=state.recentRumors.slice(-30); saveState(); return item;
  }
  function toggleFavorite(id) {
    const n=Number(id); const at=state.favorites.indexOf(n);
    if(at>=0) state.favorites.splice(at,1); else state.favorites.push(n);
    saveState(); unlockAchievements();
  }

  function openRumors() {
    ensureStyles(); clearLegacyGame();
    const cats=[...new Set(BANK.rumors.map(x=>x.category))];
    const today=dailyRumor();
    const host=modal("bellaRumorCenter",`
      <div class="bella-game-top"><div><h2>قائمة الإشاعات 👂</h2><p>${BANK.rumors.length} إشاعة مختلفة، كلها طقطقة خيالية وليست أخبارًا حقيقية.</p></div><button class="bella-game-close" data-close>✕</button></div>
      <div class="bella-rumor-day"><b>👂 إشاعة اليوم · ${escapeHtml(today.category)}</b><div style="margin-top:6px">${escapeHtml(today.text)}</div></div>
      <div class="bella-rumor-tools"><input id="bellaRumorSearch" class="vnext-input" placeholder="دوّر بكلمة"><select id="bellaRumorCategory" class="vnext-input"><option value="">كل التصنيفات</option>${cats.map(c=>`<option>${escapeHtml(c)}</option>`).join("")}</select><button id="bellaRumorRandom" class="vnext-primary">🎲 عشوائية</button></div>
      <div class="bella-game-actions"><button id="bellaRumorFavOnly" class="vnext-ghost">❤️ مفضلاتي</button><button id="bellaRumorClear" class="vnext-ghost">الكل</button></div>
      <p class="bella-rumor-note">بيلا تتجنب تكرار آخر 30 إشاعة عشوائية. اضغط القلب عشان تحفظ اللي يعجبك.</p>
      <div id="bellaRumorSpot"></div><div class="bella-rumor-list" id="bellaRumorList"></div><button id="bellaRumorMore" class="vnext-ghost bella-rumor-more" hidden>عرض المزيد</button>
    `);
    const search=host.querySelector("#bellaRumorSearch"),category=host.querySelector("#bellaRumorCategory"),list=host.querySelector("#bellaRumorList"),more=host.querySelector("#bellaRumorMore"),spot=host.querySelector("#bellaRumorSpot");
    let favOnly=false,limit=40;
    const render=()=>{
      const q=normalize(search.value),cat=category.value;
      const rows=BANK.rumors.filter(x=>(!cat||x.category===cat)&&(!favOnly||state.favorites.includes(x.id))&&(!q||normalize(`${x.text} ${x.category}`).includes(q)));
      const visible=rows.slice(0,limit);
      list.innerHTML=visible.length?visible.map(x=>`<article class="bella-rumor-item"><div class="bella-rumor-meta"><span><b>#${x.id}</b> <span class="bella-rumor-chip">${escapeHtml(x.category)}</span></span><button class="bella-rumor-fav" data-fav="${x.id}" aria-label="مفضلة">${state.favorites.includes(x.id)?"❤️":"🤍"}</button></div><div>${escapeHtml(x.text)}</div></article>`).join(""):`<p style="color:var(--muted)">ما لقيت إشاعات بهالفلتر.</p>`;
      more.hidden=rows.length<=limit;
      list.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>{toggleFavorite(b.dataset.fav);render();});
    };
    host.querySelector("[data-close]").onclick=()=>host.remove();
    search.oninput=()=>{limit=40;render();}; category.onchange=()=>{limit=40;render();};
    host.querySelector("#bellaRumorFavOnly").onclick=()=>{favOnly=true;limit=40;render();};
    host.querySelector("#bellaRumorClear").onclick=()=>{favOnly=false;search.value="";category.value="";limit=40;render();};
    host.querySelector("#bellaRumorRandom").onclick=()=>{const x=randomRumor();spot.innerHTML=`<div class="bella-rumor-day"><b>🎲 ${escapeHtml(x.category)}</b><div style="margin-top:6px">${escapeHtml(x.text)}</div></div>`;};
    more.onclick=()=>{limit+=40;render();}; render();
  }

  function decorateActivities() {
    const hub=document.getElementById("bellaActivities"); if(!hub) return false;
    const sections=[...hub.querySelectorAll(".bella-activities-section")];
    const games=sections.find(s=>s.querySelector(".bella-activities-label")?.textContent?.includes("الألعاب"));
    const light=sections.find(s=>s.querySelector(".bella-activities-label")?.textContent?.includes("أشياء خفيفة"));
    const grid=games?.querySelector(".bella-activities-grid"); if(!grid) return false;

    const labels={startKuwaitiChallenge:["تحدي كويتي","10 أسئلة · 4 خيارات"],startBoxGame:["شنو بالصندوق؟","10 أسئلة · 4 خيارات"],startProverbGame:["أكمل المثل","سهل / متوسط / صعب"],dailyWisdom:["حكمة اليوم","سؤال يومي + تدريب"]};
    Object.entries(labels).forEach(([action,[name,smallText]])=>{
      let b=hub.querySelector(`[data-action="${action}"]`); if(!b)return;
      b.querySelector("b") && (b.querySelector("b").textContent=name);
      let small=b.querySelector("small"); if(!small){small=document.createElement("small");b.appendChild(small);} small.textContent=smallText;
      if(action==="dailyWisdom" && b.parentElement!==grid) grid.appendChild(b);
    });
    if(light && !light.querySelector("button")) light.remove();

    const add=(key,icon,title,desc,fn)=>{
      let b=grid.querySelector(`[data-game-center="${key}"]`); if(b)return;
      b=document.createElement("button");b.type="button";b.dataset.gameCenter=key;b.innerHTML=`<span>${icon}</span><b>${title}</b><small>${desc}</small>`;b.onclick=()=>{window.closeBellaActivities?.();fn();};grid.appendChild(b);
    };
    const oldRumor=grid.querySelector("[data-bella-dictionary-rumors]"); if(oldRumor) oldRumor.remove();
    add("rumors","👂","قائمة الإشاعات",`${BANK.rumors.length} إشاعة مختلفة`,openRumors);
    add("profile","👤","ملف اللاعب","نتائجك وإنجازاتك",openGameProfile);
    add("leader","🏅","لوحة الترتيب","يومي · أسبوعي · كل الوقت",()=>openLeaderboard("weekly"));
    add("settings","⚙️","إعدادات الألعاب","صوت · اهتزاز · احتفال",openGameSettings);
    return true;
  }

  function installActivityWrapper() {
    const base=window.openBellaActivities;
    if(typeof base!=="function" || base.__bellaGameCenterV2) return;
    const wrapped=function(){const result=base.apply(this,arguments);queueMicrotask(decorateActivities);return result;};
    wrapped.__bellaGameCenterV2=true; window.openBellaActivities=wrapped;
  }

  function install() {
    ensureStyles(); clearLegacyGame();
    window.dailyWisdom=openDailyWisdom;
    window.startProverbGame=openProverbGame;
    window.startBoxGame=()=>startGame("box");
    window.startKuwaitiChallenge=()=>startGame("kuwait");
    window.openBellaRumors=openRumors;
    window.openBellaRumorList=openRumors;
    window.openBellaGameProfile=openGameProfile;
    window.openBellaGameLeaderboard=()=>openLeaderboard("weekly");
    window.openBellaGameSettings=openGameSettings;
    installActivityWrapper(); decorateActivities();
    if(!activityObserver){activityObserver=new MutationObserver(()=>decorateActivities());activityObserver.observe(document.body||document.documentElement,{childList:true,subtree:true});}
  }

  window.BellaUltimateContent=Object.freeze({
    version:2,
    bankCounts:{...BANK.counts},
    startGame,
    openRumors,
    openDailyWisdom,
    openProverbGame,
    openProfile:openGameProfile,
    openLeaderboard,
    settings:()=>({...state.settings}),
    status:()=>({version:2,bankCounts:{...BANK.counts},stats:clone(state.stats),achievements:Object.keys(state.achievements).length,favorites:state.favorites.length,signedIn:Boolean(window.BellaAccount?.isSignedIn?.())})
  });

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
