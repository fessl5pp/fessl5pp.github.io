(() => {
  "use strict";

  const KEY = "bella_personality_v3";
  const MAX_RECENT = 14;
  const base = window.BellaPersonality;
  let recentReplies = load();
  let observer = null;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      return Array.isArray(saved?.recentReplies) ? saved.recentReplies.map(clean).filter(Boolean).slice(-MAX_RECENT) : [];
    } catch { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ recentReplies })); } catch {} }
  function clean(value) { return String(value || "").replace(/\s+/g," ").trim().slice(0,260); }
  function norm(value) { return clean(value).toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim(); }
  function rememberReply(value) {
    const text = clean(value); if (!text || text === "يكتب...") return false;
    const key = norm(text); if (!key) return false;
    recentReplies = recentReplies.filter(item => norm(item) !== key);
    recentReplies.push(text); recentReplies = recentReplies.slice(-MAX_RECENT); save(); return true;
  }
  function nodeText(node) {
    if (!(node instanceof HTMLElement)) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".vnext-time,.source-row,.bella-error-actions,button").forEach(x=>x.remove());
    return clean(copy.innerText || copy.textContent || "");
  }
  function observe() {
    if (observer) return;
    const box = document.getElementById("box"); if (!box) return;
    const take = node => {
      if (!(node instanceof HTMLElement) || !node.classList.contains("m") || !node.classList.contains("bot")) return;
      queueMicrotask(()=>rememberReply(nodeText(node)));
    };
    box.querySelectorAll(".m.bot").forEach(take);
    observer = new MutationObserver(records=>{ for(const record of records) for(const node of record.addedNodes) take(node); });
    observer.observe(box,{childList:true});
  }
  function enrichPayload(payload) {
    let out = base?.enrichPayload ? base.enrichPayload(payload) : { ...(payload || {}) };
    const existing = Array.isArray(out.recentReplies) ? out.recentReplies.map(clean).filter(Boolean) : [];
    const merged = [];
    const seen = new Set();
    for (const text of [...existing, ...recentReplies]) {
      const key = norm(text); if (!key || seen.has(key)) continue; seen.add(key); merged.push(text);
    }
    out = { ...out, recentReplies: merged.slice(-12) };
    const msg = norm(out.message || "");
    const shortDirect = msg && msg.split(" ").length <= 5 && /^(ابي|عطني|سو|سوي|قول|قولي|شلون|شنو|وين)/.test(msg);
    const serious = /(مستشفى|عمليه|سرطان|وفاه|توفي|حادث|خايف|مكتئب|انتحار|تهديد|مصيبه|مشكله كبيره)/.test(msg);
    out.styleProfile = { ...(out.styleProfile || {}) };
    if (shortDirect) out.styleProfile.brevity = "short";
    if (serious) { out.styleProfile.humor = 0; out.styleProfile.warmth = Math.max(2, Number(out.styleProfile.warmth) || 0); }
    return out;
  }
  function repetitionRisk(text) {
    const key = norm(text); if (!key) return 0;
    let hits = 0;
    for (const old of recentReplies) {
      const other = norm(old); if (!other) continue;
      if (other === key) hits += 3;
      else {
        const a = new Set(key.split(" ").filter(x=>x.length>2));
        const b = new Set(other.split(" ").filter(x=>x.length>2));
        const overlap = [...a].filter(x=>b.has(x)).length;
        if (overlap >= Math.min(5, Math.max(3, Math.floor(a.size * .65)))) hits += 1;
      }
    }
    return hits;
  }

  window.BellaPersonality = Object.freeze({
    ...(base || {}),
    enrichPayload,
    rememberReply,
    recentReplies:()=>[...recentReplies],
    repetitionRisk,
    snapshot:()=>({ ...(base?.snapshot?.() || {}), recentReplyCount:recentReplies.length })
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once:true }); else observe();
})();
