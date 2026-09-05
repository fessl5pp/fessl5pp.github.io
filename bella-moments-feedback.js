(() => {
  "use strict";

  const KEY = "bella_moment_feedback_v1";
  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const categories = ["normal","cute","angry","chill","morning","evening","night","weekend","coffee","university","gaming","work","travel"];
  let observer = null;
  let lastText = "";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null") || { categories: {}, total: 0 }; }
    catch { return { categories: {}, total: 0 }; }
  }
  function write(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }

  function classify(text) {
    const v = String(text || "").toLowerCase();
    if (/قهو|لاتيه|اسبريسو|كوفي/.test(v)) return "coffee";
    if (/جامع|دكتور|اختبار|امتحان|واجب|ديدلاين|حضور/.test(v)) return "university";
    if (/قيم|لعب|ماين|روبلوكس|فورت|بلايستيشن|اكس بوكس|xbox|gaming|العاب/.test(v)) return "gaming";
    if (/دوام|شغل|مدير|اجتماع|وظيف/.test(v)) return "work";
    if (/سفر|مطار|طيران|جواز|فندق/.test(v)) return "travel";
    if (/ويكند|عطله|عطلة|طلعه/.test(v)) return "weekend";
    if (/ليل|الفجر|سهر|نام|بنوم/.test(v)) return "night";
    if (/الصبح|صباح/.test(v)) return "morning";
    if (/دلع|مدحه|مدحة|كلمه حلوه|كلمة حلوة|🥺|💗/.test(v)) return "cute";
    if (/معصب|هدي|مو عادي|😡/.test(v)) return "angry";
    return "normal";
  }

  function react(category, value) {
    const data = read();
    const current = data.categories?.[category] || { likes: 0, dislikes: 0 };
    if (value > 0) current.likes = Math.min(99, Number(current.likes || 0) + 1);
    else current.dislikes = Math.min(99, Number(current.dislikes || 0) + 1);
    data.categories = { ...(data.categories || {}), [category]: current };
    data.total = Math.min(9999, Number(data.total || 0) + 1);
    data.updatedAt = Date.now();
    write(data);
    boostRemote().catch(() => {});
    return current;
  }

  function score(category) {
    const row = read().categories?.[category] || {};
    return Number(row.likes || 0) - Number(row.dislikes || 0);
  }

  function ensureStyles() {
    if (document.getElementById("bellaMomentFeedbackStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaMomentFeedbackStyles";
    style.textContent = `
      #bellaMomentFeedback{display:flex;gap:4px;justify-content:center;margin-top:5px;pointer-events:auto}
      #bellaMomentFeedback button{border:0;background:rgba(255,255,255,.07);color:inherit;border-radius:999px;padding:3px 8px;font-size:10px;cursor:pointer;opacity:.72}
      #bellaMomentFeedback button:hover,#bellaMomentFeedback button:focus-visible{opacity:1;background:rgba(255,255,255,.13)}
      #bellaMomentFeedback[data-done="1"] button{opacity:.35;pointer-events:none}
    `;
    document.head.appendChild(style);
  }

  function decorate() {
    const bar = document.getElementById("rumor-bar");
    const textNode = document.getElementById("rumor-text");
    if (!bar || !textNode || bar.style.display === "none") return;
    const text = String(textNode.textContent || "").trim();
    if (!text || text === lastText) return;
    lastText = text;
    ensureStyles();
    bar.querySelector("#bellaMomentFeedback")?.remove();
    const category = classify(text);
    const wrap = document.createElement("div");
    wrap.id = "bellaMomentFeedback";
    wrap.dataset.category = category;
    wrap.innerHTML = `<button type="button" data-v="1" aria-label="عجبتني الإشاعة">👍 عجبتني</button><button type="button" data-v="-1" aria-label="الإشاعة مو جوي">👎 مو جوي</button>`;
    wrap.addEventListener("click", event => {
      const btn = event.target.closest?.("button[data-v]");
      if (!btn || wrap.dataset.done === "1") return;
      react(category, Number(btn.dataset.v));
      wrap.dataset.done = "1";
      btn.textContent = Number(btn.dataset.v) > 0 ? "👍 تم" : "👎 تم";
    });
    textNode.insertAdjacentElement("afterend", wrap);
  }

  async function fetchJson(path) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Accept: "application/json" } });
    if (!response.ok) throw new Error(`moments feedback ${response.status}`);
    return response.json();
  }

  async function boostRemote() {
    if (!window.BellaMoments?.setRemoteData) return false;
    const [cfgRows, moments] = await Promise.all([
      fetchJson("bella_moments_config?select=*&id=eq.1"),
      fetchJson("bella_moments?select=id,text,category,tier,source,pinned_until&status=eq.approved&is_enabled=eq.true&order=created_at.desc&limit=120")
    ]);
    const config = Array.isArray(cfgRows) ? cfgRows[0] || {} : {};
    const source = Array.isArray(moments) ? moments : [];
    const weighted = [];
    for (const row of source) {
      weighted.push(row);
      const s = score(row.category);
      const extra = s >= 4 ? 2 : s >= 1 ? 1 : 0;
      for (let i = 0; i < extra; i++) weighted.push({ ...row });
    }
    window.BellaMoments.setRemoteData({ config, moments: weighted.slice(0, 200) });
    return true;
  }

  function seasonalLine() {
    const d = new Date();
    const m = d.getMonth() + 1;
    const day = d.getDay();
    if (day === 5 || day === 6) return Math.random() < .5 ? "الويكند له مود بروحه" : "ها شخطتنا اليوم";
    if (m >= 6 && m <= 8) return Math.random() < .5 ? "الصيف مطولها شوي 😭" : "ابي شي بارد وبس";
    if (m === 12 || m <= 2) return Math.random() < .5 ? "هذا الجو يبي قعده" : "الشتا له سوالف غير";
    if (m === 9) return "سبتمبر حسسني كل شي رجع مره وحده 😭";
    return "";
  }

  function maybeSeasonal() {
    const line = seasonalLine();
    if (!line || document.hidden || window.BellaMoments?.isEnabled?.() === false) return false;
    if (Math.random() > .22) return false;
    return window.BellaMoments?.showToast?.(line) || false;
  }

  function install() {
    ensureStyles();
    if (observer) return true;
    const root = document.body || document.documentElement;
    observer = new MutationObserver(() => queueMicrotask(decorate));
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    setTimeout(() => boostRemote().catch(() => {}), 2400);
    setInterval(() => maybeSeasonal(), 12 * 60 * 1000);
    return true;
  }

  window.BellaMomentFeedback = Object.freeze({ install, react, score, boostRemote, snapshot: read, classify });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
