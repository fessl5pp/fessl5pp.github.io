(() => {
  "use strict";
  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const CATEGORIES = ["normal","cute","angry","chill","morning","evening","night","weekend","coffee","university","gaming","work","travel"];
  const LABELS = { normal:"عام", cute:"دلع", angry:"معصبة", chill:"رايقة", morning:"صبح", evening:"مساء", night:"آخر الليل", weekend:"ويكند", coffee:"قهوة", university:"جامعة", gaming:"ألعاب", work:"دوام", travel:"سفر" };
  let busy = false;
  let autoChecked = false;

  function session() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } }
  function token() { return session()?.access_token || ""; }
  function userId() { return session()?.user?.id || session()?.user_id || ""; }
  async function rest(path, options = {}) {
    const t = token(); if (!t) throw new Error("owner session unavailable");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${t}`, "Content-Type":"application/json", Accept:"application/json", ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) { const e = new Error(data?.message || `HTTP ${response.status}`); e.status = response.status; throw e; }
    return data;
  }
  function toast(text) { try { window.BellaMoments?.showToast?.(text); } catch {} }
  function esc(text) { return String(text || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
  function pct(value) { return Math.round((Number(value) || 0) * 1000) / 10; }
  function isoAfter(hours) { return new Date(Date.now() + Math.max(1, Number(hours)||24) * 3600000).toISOString(); }

  function styles() {
    if (document.getElementById("bellaMomentsStudioStyles")) return;
    const s = document.createElement("style"); s.id = "bellaMomentsStudioStyles"; s.textContent = `
      .bella-moments-owner-entry{margin:10px 0;padding:13px;border:1px solid rgba(143,124,255,.25);border-radius:16px;background:linear-gradient(135deg,rgba(143,124,255,.09),rgba(100,210,255,.05));text-align:right}
      .bella-moments-owner-entry h3{margin:0 0 4px}.bella-moments-owner-entry p{margin:0 0 9px;color:var(--muted);font-size:10px;line-height:1.7}.bella-moments-owner-entry button{padding:10px 13px;border:0;border-radius:12px;background:var(--accent);color:#fff;font:inherit;font-weight:900}
      .bella-studio-card{width:min(860px,96vw)!important;max-height:90dvh;overflow:auto;text-align:right}.bella-studio-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.bella-studio-head h2{margin:0}.bella-studio-head p{margin:4px 0 0;color:var(--muted);font-size:10px}.bella-studio-close{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:inherit;border-radius:11px;padding:8px 11px}
      .bella-studio-section{margin-top:13px;padding:13px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.03)}.bella-studio-section h3{margin:0 0 8px;font-size:13px}.bella-studio-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.bella-studio-field{display:grid;gap:5px}.bella-studio-field label{font-size:9px;color:var(--muted);font-weight:800}.bella-studio-field input,.bella-studio-field select,.bella-studio-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.055);color:inherit;padding:9px;font:inherit}.bella-studio-field textarea{min-height:70px;resize:vertical}
      .bella-studio-cats{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.bella-studio-cats label{display:flex;gap:5px;align-items:center;padding:6px 8px;border-radius:999px;background:rgba(255,255,255,.05);font-size:9px}.bella-studio-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}.bella-studio-actions button{border:0;border-radius:11px;padding:9px 11px;background:var(--accent);color:#fff;font:inherit;font-size:10px;font-weight:900}.bella-studio-actions button.ghost{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}.bella-studio-actions button:disabled{opacity:.5}.bella-studio-state{font-size:9px;color:var(--muted)}
      .bella-studio-list{display:grid;gap:7px;margin-top:9px}.bella-studio-row{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.03)}.bella-studio-row[data-disabled="1"]{opacity:.55}.bella-studio-row-head{display:flex;justify-content:space-between;gap:8px}.bella-studio-row-text{font-size:11px;line-height:1.7}.bella-studio-meta{font-size:8px;color:var(--muted);margin-top:4px}.bella-studio-row-actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.bella-studio-row-actions button{padding:6px 8px;border-radius:9px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:8px}.bella-studio-row-actions button.danger{color:#ff8b83}.bella-tier-rare{color:#ffd60a}.bella-tier-legendary{color:#b69cff}.bella-studio-summary{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.bella-studio-summary span{font-size:8px;padding:5px 7px;border-radius:999px;background:rgba(255,255,255,.05)}
      @media(max-width:650px){.bella-studio-grid{grid-template-columns:1fr 1fr}.bella-studio-head{flex-direction:column}.bella-studio-close{align-self:flex-start}}@media(max-width:430px){.bella-studio-grid{grid-template-columns:1fr}}
    `; document.head.appendChild(s);
  }

  async function loadConfig() { const rows = await rest("bella_moments_config?select=*&id=eq.1"); return Array.isArray(rows) ? rows[0] || {} : {}; }
  async function loadMoments() { const rows = await rest("bella_moments?select=*&order=pinned_until.desc.nullslast,created_at.desc&limit=120"); return Array.isArray(rows) ? rows : []; }
  async function patchConfig(body) { return rest("bella_moments_config?id=eq.1", { method:"PATCH", headers:{ Prefer:"return=representation" }, body:JSON.stringify({ ...body, updated_by:userId() || null, updated_at:new Date().toISOString() }) }); }
  async function patchMoment(id, body) { return rest(`bella_moments?id=eq.${encodeURIComponent(id)}`, { method:"PATCH", headers:{ Prefer:"return=representation" }, body:JSON.stringify({ ...body, updated_at:new Date().toISOString() }) }); }

  function configFromUI(card) {
    const enabled_categories = [...card.querySelectorAll("[data-studio-cat]:checked")].map(x => x.value).filter(x => CATEGORIES.includes(x));
    return {
      remote_enabled: card.querySelector("#studioRemote")?.checked === true,
      enabled_categories: enabled_categories.length ? enabled_categories : ["normal"],
      rare_chance: Math.max(0, Math.min(.35, Number(card.querySelector("#studioRare")?.value || 9.5) / 100)),
      legendary_chance: Math.max(0, Math.min(.10, Number(card.querySelector("#studioLegendary")?.value || 1.8) / 100)),
      global_intensity: ["low","normal","high"].includes(card.querySelector("#studioIntensity")?.value) ? card.querySelector("#studioIntensity").value : "high",
      ai_fresh_enabled: card.querySelector("#studioAiFresh")?.checked === true,
      ai_auto_approve: card.querySelector("#studioAutoApprove")?.checked === true,
      ai_batch_size: Math.max(4, Math.min(12, Number(card.querySelector("#studioBatch")?.value)||8)),
      ai_refresh_hours: Math.max(6, Math.min(168, Number(card.querySelector("#studioHours")?.value)||24)),
      ai_max_daily_batches: Math.max(1, Math.min(6, Number(card.querySelector("#studioDaily")?.value)||2))
    };
  }

  async function generateAndStore(config, mode = "manual", card = null) {
    if (busy) return false; busy = true;
    const state = card?.querySelector("[data-studio-state]"); const btn = card?.querySelector("[data-studio-generate]"); if (btn) btn.disabled = true; if (state) state.textContent = "AI Fresh قاعد يولّد…";
    try {
      const response = await fetch("/api/moments-generate", { method:"POST", headers:{ Authorization:`Bearer ${token()}`, "Content-Type":"application/json" }, body:JSON.stringify({ count:config.ai_batch_size || 8, mode }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      const batchId = crypto.randomUUID(); const uid = userId();
      const rows = (data.moments || []).map(x => ({ text:x.text, category:x.category, tier:x.tier, source:"ai", enabled:true, approved:config.ai_auto_approve === true, batch_id:batchId, created_by:uid || null, generation_meta:{ model:data.model, prompt_version:data.promptVersion || 1, mode } }));
      const inserted = await rest("bella_moments", { method:"POST", headers:{ Prefer:"resolution=ignore-duplicates,return=representation" }, body:JSON.stringify(rows) });
      await rest("bella_moment_batches", { method:"POST", headers:{ Prefer:"return=minimal" }, body:JSON.stringify({ id:batchId, model:data.model || "gpt-5-mini", requested_count:data.requested || rows.length, accepted_count:Array.isArray(inserted)?inserted.length:rows.length, created_by:uid }) });
      await patchConfig({ ai_last_generated_at:new Date().toISOString() });
      await window.BellaMomentsCloud?.refresh?.(true);
      if (state) state.textContent = config.ai_auto_approve ? `تم توليد واعتماد ${rows.length} إشاعات ✅` : `وصلت ${rows.length} إشاعات للمراجعة ✨`;
      toast(config.ai_auto_approve ? "AI Fresh زاد بنك بيلا ✨" : "دفعة AI Fresh جاهزة للمراجعة 👀");
      return true;
    } catch (error) { if (state) state.textContent = error?.message || "تعذر التوليد"; return false; }
    finally { busy = false; if (btn) btn.disabled = false; }
  }

  function renderRows(host, rows, reload) {
    host.innerHTML = "";
    if (!rows.length) { host.innerHTML = `<div class="bella-studio-state">ما فيه إشاعات Remote للحين.</div>`; return; }
    for (const row of rows) {
      const el = document.createElement("article"); el.className="bella-studio-row"; el.dataset.disabled = row.enabled ? "0" : "1";
      const pinned = row.pinned_until && Date.parse(row.pinned_until) > Date.now(); const tierClass = row.tier === "legendary" ? "bella-tier-legendary" : row.tier === "rare" ? "bella-tier-rare" : "";
      el.innerHTML = `<div class="bella-studio-row-head"><div class="bella-studio-row-text">${esc(row.text)}</div><b class="${tierClass}">${esc(row.tier)}</b></div><div class="bella-studio-meta">${esc(LABELS[row.category]||row.category)} · ${row.source === "ai" ? "AI Fresh" : "يدوي"} · ${row.approved ? "معتمدة" : "تنتظر مراجعة"}${pinned ? " · 📌 مثبتة" : ""}</div><div class="bella-studio-row-actions"><button data-a="approve">${row.approved?"إلغاء اعتماد":"اعتماد"}</button><button data-a="enable">${row.enabled?"إيقاف":"تشغيل"}</button><button data-a="pin">${pinned?"فك التثبيت":"📌 تثبيت 24س"}</button><button data-a="delete" class="danger">حذف</button></div>`;
      el.querySelector('[data-a="approve"]').onclick = async()=>{ await patchMoment(row.id,{approved:!row.approved}); reload(); };
      el.querySelector('[data-a="enable"]').onclick = async()=>{ await patchMoment(row.id,{enabled:!row.enabled}); reload(); };
      el.querySelector('[data-a="pin"]').onclick = async()=>{ await patchMoment(row.id,{pinned_until:pinned?null:isoAfter(24)}); reload(); };
      el.querySelector('[data-a="delete"]').onclick = async()=>{ if (!confirm("تحذف هالإشاعة؟")) return; await rest(`bella_moments?id=eq.${encodeURIComponent(row.id)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}}); reload(); };
      host.appendChild(el);
    }
  }

  async function openStudio() {
    if (!(await window.BellaOwnerCenter?.refresh?.())) { toast("Moments Studio للمالك بس 🛡️"); return false; }
    styles(); document.getElementById("bellaMomentsStudio")?.remove();
    const modal=document.createElement("div"); modal.id="bellaMomentsStudio"; modal.className="vnext-modal"; modal.innerHTML=`<div class="vnext-card bella-studio-card"><div class="bella-studio-head"><div><h2>Moments Studio 👂✨</h2><p>تحكم عالمي بإشاعات بيلا + AI Fresh Moments. الشات نفسه يظل AI-first ومنفصل.</p></div><button class="bella-studio-close">✕</button></div><div data-studio-body><div class="bella-studio-state">جاري التحميل…</div></div></div>`;
    document.body.appendChild(modal); modal.querySelector(".bella-studio-close").onclick=()=>modal.remove(); modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
    const body=modal.querySelector("[data-studio-body]");
    const reload=async()=>{
      const [cfg,rows]=await Promise.all([loadConfig(),loadMoments()]);
      body.innerHTML=`<section class="bella-studio-section"><h3>التحكم العالمي 🎛️</h3><div class="bella-studio-grid"><div class="bella-studio-field"><label>الكثافة القصوى للجميع</label><select id="studioIntensity"><option value="low">هادي</option><option value="normal">عادي</option><option value="high">حيل 🔥</option></select></div><div class="bella-studio-field"><label>نسبة Rare %</label><input id="studioRare" type="number" min="0" max="35" step="0.1" value="${pct(cfg.rare_chance)}"></div><div class="bella-studio-field"><label>نسبة Legendary %</label><input id="studioLegendary" type="number" min="0" max="10" step="0.1" value="${pct(cfg.legendary_chance)}"></div></div><div class="bella-studio-cats">${CATEGORIES.map(c=>`<label><input data-studio-cat type="checkbox" value="${c}" ${(cfg.enabled_categories||[]).includes(c)?"checked":""}>${LABELS[c]}</label>`).join("")}</div><div class="bella-studio-actions"><label><input id="studioRemote" type="checkbox" ${cfg.remote_enabled!==false?"checked":""}> بنك Remote شغال</label><button data-studio-save>حفظ التحكم</button><span class="bella-studio-state" data-studio-state>—</span></div></section>
      <section class="bella-studio-section"><h3>AI Fresh Moments 🤖✨</h3><div class="bella-studio-grid"><div class="bella-studio-field"><label>حجم الدفعة</label><input id="studioBatch" type="number" min="4" max="12" value="${cfg.ai_batch_size||8}"></div><div class="bella-studio-field"><label>يتجدد كل كم ساعة</label><input id="studioHours" type="number" min="6" max="168" value="${cfg.ai_refresh_hours||24}"></div><div class="bella-studio-field"><label>أقصى دفعات باليوم</label><input id="studioDaily" type="number" min="1" max="6" value="${cfg.ai_max_daily_batches||2}"></div></div><div class="bella-studio-actions"><label><input id="studioAiFresh" type="checkbox" ${cfg.ai_fresh_enabled?"checked":""}> Auto Fresh</label><label><input id="studioAutoApprove" type="checkbox" ${cfg.ai_auto_approve?"checked":""}> اعتماد تلقائي</label><button data-studio-generate>ولّد دفعة الحين ✨</button></div><p class="bella-studio-state">إذا Auto Fresh شغال، حساب المالك يولّد دفعة عند زيارة بيلا لما يحين موعد التجديد. التوليد محدود يوميًا.</p></section>
      <section class="bella-studio-section"><h3>أضف إشاعة بنفسك ✍️</h3><div class="bella-studio-grid"><div class="bella-studio-field" style="grid-column:span 2"><label>الإشاعة</label><textarea id="studioManualText" maxlength="240" placeholder="يقولون..."></textarea></div><div class="bella-studio-field"><label>الفئة</label><select id="studioManualCat">${CATEGORIES.map(c=>`<option value="${c}">${LABELS[c]}</option>`).join("")}</select><label>Tier</label><select id="studioManualTier"><option value="common">common</option><option value="rare">rare</option><option value="legendary">legendary</option></select></div></div><div class="bella-studio-actions"><button data-studio-add>إضافة واعتماد</button></div></section>
      <section class="bella-studio-section"><h3>بنك Remote <span>(${rows.length})</span></h3><div class="bella-studio-summary"><span>✅ ${rows.filter(x=>x.approved).length} معتمدة</span><span>🤖 ${rows.filter(x=>x.source==='ai').length} AI</span><span>📌 ${rows.filter(x=>x.pinned_until&&Date.parse(x.pinned_until)>Date.now()).length} مثبتة</span></div><div class="bella-studio-list" data-studio-list></div></section>`;
      body.querySelector("#studioIntensity").value=cfg.global_intensity||"high";
      const state=body.querySelector("[data-studio-state]");
      body.querySelector("[data-studio-save]").onclick=async()=>{ try{ state.textContent="جاري الحفظ…"; const next=configFromUI(body); await patchConfig(next); await window.BellaMomentsCloud?.refresh?.(true); state.textContent="تم الحفظ ✅"; toast("تم تحديث Moments Studio ✅"); }catch{state.textContent="تعذر الحفظ";} };
      body.querySelector("[data-studio-generate]").onclick=async()=>{ const next=configFromUI(body); await patchConfig(next); if(await generateAndStore(next,"manual",body)) reload(); };
      body.querySelector("[data-studio-add]").onclick=async()=>{ const text=String(body.querySelector("#studioManualText").value||"").trim(); if(text.length<4)return; await rest("bella_moments",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({text,category:body.querySelector("#studioManualCat").value,tier:body.querySelector("#studioManualTier").value,source:"manual",enabled:true,approved:true,created_by:userId()||null})}); await window.BellaMomentsCloud?.refresh?.(true); reload(); };
      renderRows(body.querySelector("[data-studio-list]"),rows,reload);
    };
    try{await reload();}catch{body.innerHTML=`<div class="bella-owner-error">تعذر تحميل Moments Studio.</div>`;} return true;
  }

  async function maybeAutoFresh() {
    if (autoChecked) return; autoChecked=true;
    try {
      if (!(await window.BellaOwnerCenter?.refresh?.())) return;
      const cfg=await loadConfig(); if(!cfg.ai_fresh_enabled)return;
      const last=Date.parse(cfg.ai_last_generated_at||0)||0; const due=Date.now()-last >= Math.max(6,Number(cfg.ai_refresh_hours)||24)*3600000; if(!due)return;
      await generateAndStore(cfg,"auto",null);
    } catch {}
  }

  async function install(card) {
    if(!card||card.querySelector("[data-bella-moments-studio-entry]")||!window.BellaOwnerCenter?.isOwner?.())return false;
    styles(); const section=document.createElement("section"); section.className="bella-moments-owner-entry"; section.dataset.bellaMomentsStudioEntry="1"; section.innerHTML=`<h3>Moments Studio 👂✨</h3><p>إدارة الإشاعات، الفئات، النادر والأسطوري، التثبيت، وAI Fresh Moments.</p><button type="button">فتح الاستوديو</button>`; section.querySelector("button").onclick=openStudio;
    const controls=card.querySelector("[data-bella-owner-controls]"); if(controls)controls.insertAdjacentElement("afterend",section); else card.appendChild(section); return true;
  }
  function observe(){ const tryInstall=node=>{const modal=node?.id==="bellaOwnerCenter"?node:node?.querySelector?.("#bellaOwnerCenter");const card=modal?.querySelector?.(".bella-owner-card");if(card)queueMicrotask(()=>install(card));}; document.querySelectorAll("#bellaOwnerCenter .bella-owner-card").forEach(install); const o=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n instanceof HTMLElement)tryInstall(n);}); if(document.body)o.observe(document.body,{childList:true,subtree:false}); setTimeout(maybeAutoFresh,3500); }
  window.BellaMomentsStudio=Object.freeze({open:openStudio,install,maybeAutoFresh});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();
