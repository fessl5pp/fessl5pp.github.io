(() => {
  "use strict";

  const SUPABASE_URL="https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY="sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY="bella_account_session_v1";
  const KINDS=["rumor","wisdom","proverb","kuwait","box"];
  const LABELS={rumor:"إشاعة 👂",wisdom:"حكمة 🧿",proverb:"مثل 🧠",kuwait:"سؤال كويتي 🇰🇼",box:"شنو بالصندوق 🎁"};
  const STATUS={draft:"مسودة",pending:"ينتظر مراجعة",approved:"منشور",rejected:"مرفوض"};
  let rows=[],busy=false,filters={kind:"all",status:"all",q:""};

  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null");}catch{return null;}}
  function token(){return String(session()?.access_token||"");}
  function headers(extra={}){return{apikey:SUPABASE_KEY,Authorization:`Bearer ${token()}`,"Content-Type":"application/json",Accept:"application/json",...extra};}
  async function rest(path,options={}){
    if(!token())throw new Error("owner session unavailable");
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{...headers(),...(options.headers||{})}});const d=await r.json().catch(()=>null);
    if(!r.ok){const e=new Error(d?.message||d?.error||`HTTP ${r.status}`);e.status=r.status;throw e;}return d;
  }
  function toast(text){try{window.showToast?.(text);}catch{}}
  function clean(v,max=600){return String(v||"").replace(/\s+/g," ").trim().slice(0,max);}
  function norm(v){return clean(v).toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي");}
  async function owner(){if(window.BellaOwnerCenter?.isOwner?.())return true;try{return await window.BellaOwnerCenter?.refresh?.();}catch{return false;}}

  function styles(){
    if(document.getElementById("bellaOwnerContentStudioStyles"))return;
    const s=document.createElement("style");s.id="bellaOwnerContentStudioStyles";s.textContent=`
      .bella-content-entry{margin:12px 0;padding:13px;border:1px solid rgba(166,130,255,.22);border-radius:16px;background:rgba(166,130,255,.055);text-align:right}.bella-content-entry h3{margin:0 0 4px}.bella-content-entry p{margin:0 0 10px;color:var(--muted);font-size:10px;line-height:1.7}.bella-content-entry button{border:0;border-radius:12px;padding:10px 13px;background:var(--accent);color:#fff;font:inherit;font-weight:900;cursor:pointer}
      .bella-content-card{width:min(940px,96vw)!important;max-height:91dvh;overflow:auto;text-align:right}.bella-content-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.bella-content-head h2{margin:0}.bella-content-head p{margin:5px 0 0;color:var(--muted);font-size:10px;line-height:1.7}.bella-content-actions{display:flex;gap:7px;flex-wrap:wrap}.bella-content-actions button{border:1px solid rgba(255,255,255,.11);border-radius:11px;padding:9px 11px;background:rgba(255,255,255,.055);color:inherit;font:inherit;font-size:10px;font-weight:850;cursor:pointer}.bella-content-actions button.primary{background:var(--accent);color:#fff;border-color:transparent}.bella-content-actions button.danger{color:#ff9992}.bella-content-actions button:disabled{opacity:.45}
      .bella-content-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0}.bella-content-stat{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.035)}.bella-content-stat small,.bella-content-stat b{display:block}.bella-content-stat small{font-size:9px;color:var(--muted)}.bella-content-stat b{font-size:17px;margin-top:2px}
      .bella-content-section{margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.025)}.bella-content-section h3{margin:0 0 8px;font-size:13px}.bella-content-toolbar{display:grid;grid-template-columns:150px 150px 1fr auto;gap:7px}.bella-content-toolbar select,.bella-content-toolbar input,.bella-content-field input,.bella-content-field select,.bella-content-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.055);color:inherit;padding:9px;font:inherit;outline:none}.bella-content-field{display:grid;gap:5px}.bella-content-field label{font-size:9px;color:var(--muted);font-weight:850}.bella-content-field textarea{min-height:78px;resize:vertical;line-height:1.6}.bella-content-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.bella-content-editor .wide{grid-column:1/-1}
      .bella-content-ai{display:grid;grid-template-columns:160px 100px 1fr;gap:8px;align-items:end}.bella-content-ai-note{font-size:9px;color:var(--muted);line-height:1.65}.bella-content-state{font-size:10px;color:var(--muted);margin-top:7px}
      .bella-content-list{display:grid;gap:8px;margin-top:10px}.bella-content-row{padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.03)}.bella-content-row[data-off="1"]{opacity:.58}.bella-content-row-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.bella-content-row-title{font-size:11px;font-weight:850;line-height:1.65}.bella-content-chip{white-space:nowrap;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.06);font-size:8px}.bella-content-meta{margin-top:4px;color:var(--muted);font-size:8px;line-height:1.6}.bella-content-answer{margin-top:6px;font-size:10px;line-height:1.6}.bella-content-empty{padding:20px;text-align:center;color:var(--muted);border:1px dashed rgba(255,255,255,.11);border-radius:13px}
      @media(max-width:680px){.bella-content-stats{grid-template-columns:repeat(2,1fr)}.bella-content-toolbar,.bella-content-ai{grid-template-columns:1fr}.bella-content-editor{grid-template-columns:1fr}.bella-content-editor .wide{grid-column:auto}.bella-content-head{flex-direction:column}}
    `;document.head.appendChild(s);
  }

  function shell(id="bellaOwnerContentStudio"){
    document.getElementById(id)?.remove();const m=document.createElement("div");m.id=id;m.className="vnext-modal";m.innerHTML=`<div class="vnext-card bella-content-card"></div>`;m.addEventListener("click",e=>{if(e.target===m)m.remove();});document.body.appendChild(m);return m.querySelector(".bella-content-card");
  }
  function option(value,label){const o=document.createElement("option");o.value=value;o.textContent=label;return o;}
  function kindSelect(all=true){const s=document.createElement("select");if(all)s.append(option("all","كل الأنواع"));for(const k of KINDS)s.append(option(k,LABELS[k]));return s;}
  function statusSelect(){const s=document.createElement("select");s.append(option("all","كل الحالات"));for(const k of ["pending","draft","approved","rejected"])s.append(option(k,STATUS[k]));return s;}
  function stat(label,value){const d=document.createElement("div");d.className="bella-content-stat";const a=document.createElement("small");a.textContent=label;const b=document.createElement("b");b.textContent=String(value);d.append(a,b);return d;}

  async function loadRows(){
    const data=await rest("bella_content_items?select=*&order=updated_at.desc&limit=400");rows=Array.isArray(data)?data:[];return rows;
  }
  function filtered(){return rows.filter(r=>(filters.kind==="all"||r.kind===filters.kind)&&(filters.status==="all"||r.status===filters.status)&&(!filters.q||norm(`${r.prompt} ${r.answer} ${r.category}`).includes(norm(filters.q))));}
  function renderStats(host){const pending=rows.filter(x=>x.status==="pending").length,live=rows.filter(x=>x.status==="approved"&&x.enabled).length,ai=rows.filter(x=>x.source==="ai").length;host.replaceChildren(stat("كل المحتوى",rows.length),stat("منشور",live),stat("ينتظر مراجعة",pending),stat("اقتراحات AI",ai));}
  function renderList(host,reload){
    host.replaceChildren();const data=filtered();if(!data.length){const e=document.createElement("div");e.className="bella-content-empty";e.textContent="ما فيه محتوى يطابق الفلتر.";host.append(e);return;}
    for(const row of data){
      const item=document.createElement("article");item.className="bella-content-row";item.dataset.off=row.enabled?"0":"1";
      const head=document.createElement("div");head.className="bella-content-row-head";const title=document.createElement("div");title.className="bella-content-row-title";title.textContent=row.prompt;const chip=document.createElement("span");chip.className="bella-content-chip";chip.textContent=`${LABELS[row.kind]||row.kind} · ${STATUS[row.status]||row.status}`;head.append(title,chip);item.append(head);
      const meta=document.createElement("div");meta.className="bella-content-meta";meta.textContent=`${row.source==="ai"?"🤖 AI":"✍️ يدوي"} · ${row.category||"عام"} · ${row.difficulty||"medium"} · ${row.enabled?"شغال":"موقوف"}`;item.append(meta);
      if(row.answer||row.explanation){const ans=document.createElement("div");ans.className="bella-content-answer";ans.textContent=[row.answer?`الجواب: ${row.answer}`:"",row.explanation?`المعنى/الشرح: ${row.explanation}`:""].filter(Boolean).join(" — ");item.append(ans);}
      const actions=document.createElement("div");actions.className="bella-content-actions";const button=(text,fn,cls="")=>{const b=document.createElement("button");b.textContent=text;if(cls)b.className=cls;b.onclick=fn;actions.append(b);return b;};
      button("تعديل",()=>openEditor(row,reload));
      if(row.status!=="approved")button("اعتماد ونشر",async()=>{await patch(row.id,{status:"approved",enabled:true});toast("تم اعتماد المحتوى ونشره ✅");reload(true);},"primary");
      else button(row.enabled?"إيقاف":"تشغيل",async()=>{await patch(row.id,{enabled:!row.enabled});reload(true);});
      if(row.status!=="rejected")button("رفض",async()=>{await patch(row.id,{status:"rejected",enabled:false});reload(true);});
      button("حذف",async()=>{if(!confirm("تحذف هالمحتوى نهائيًا؟"))return;await rest(`bella_content_items?id=eq.${encodeURIComponent(row.id)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});reload(true);},"danger");
      item.append(actions);host.append(item);
    }
  }
  async function patch(id,body){return rest(`bella_content_items?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify(body)});}

  function parseOptions(text){const seen=new Set(),out=[];for(const part of String(text||"").split(/\n|،|,/)){const v=clean(part,160),k=norm(v);if(v&&k&&!seen.has(k)){seen.add(k);out.push(v);}}return out.slice(0,4);}
  function editorValues(card,row={}){
    const kind=card.querySelector("[data-kind]").value,prompt=clean(card.querySelector("[data-prompt]").value,500),answer=clean(card.querySelector("[data-answer]").value,240),explanation=clean(card.querySelector("[data-explanation]").value,600),category=clean(card.querySelector("[data-category]").value,80)||"عام",difficulty=card.querySelector("[data-difficulty]").value,options=parseOptions(card.querySelector("[data-options]").value);
    if(prompt.length<2)throw new Error("اكتب المحتوى أول.");
    if(["wisdom","proverb","kuwait","box"].includes(kind)&&!answer)throw new Error("هالنوع يحتاج جواب.");
    if(kind==="kuwait"){if(options.length!==4)throw new Error("السؤال الكويتي يحتاج 4 خيارات.");if(!options.some(x=>norm(x)===norm(answer)))throw new Error("لازم الجواب الصحيح يكون ضمن الأربع خيارات.");}
    return{kind,prompt,answer,explanation,category,difficulty,options:kind==="kuwait"?options:[],source:row.source||"manual"};
  }
  async function openEditor(row=null,onDone=null){
    styles();const card=shell("bellaContentEditor");card.innerHTML=`<div class="bella-content-head"><div><h2>${row?"تعديل المحتوى":"إضافة محتوى"} ✍️</h2><p>تقدر تحفظه مسودة أو تنشره مباشرة. اقتراحات AI ما تننشر إلا بعد اعتمادك.</p></div><div class="bella-content-actions"><button data-close>إغلاق</button></div></div><div class="bella-content-section"><div class="bella-content-editor"><div class="bella-content-field"><label>النوع</label><select data-kind></select></div><div class="bella-content-field"><label>الصعوبة</label><select data-difficulty><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div><div class="bella-content-field wide"><label>النص / السؤال / بداية المثل</label><textarea data-prompt maxlength="500"></textarea></div><div class="bella-content-field"><label>الجواب / التكملة</label><input data-answer maxlength="240"></div><div class="bella-content-field"><label>التصنيف</label><input data-category maxlength="80" placeholder="مثال: جامعة"></div><div class="bella-content-field wide"><label>المعنى / الشرح</label><textarea data-explanation maxlength="600"></textarea></div><div class="bella-content-field wide"><label>خيارات السؤال الكويتي فقط — 4 أسطر</label><textarea data-options placeholder="الخيار 1\nالخيار 2\nالخيار 3\nالخيار 4"></textarea></div></div><div class="bella-content-actions" style="margin-top:10px"><button data-draft>حفظ مسودة</button><button data-publish class="primary">حفظ ونشر</button></div><div class="bella-content-state" data-state></div></div>`;
    const ks=card.querySelector("[data-kind]");for(const k of KINDS)ks.append(option(k,LABELS[k]));ks.value=row?.kind||"wisdom";card.querySelector("[data-difficulty]").value=row?.difficulty||"medium";card.querySelector("[data-prompt]").value=row?.prompt||"";card.querySelector("[data-answer]").value=row?.answer||"";card.querySelector("[data-category]").value=row?.category||"عام";card.querySelector("[data-explanation]").value=row?.explanation||"";card.querySelector("[data-options]").value=Array.isArray(row?.options)?row.options.join("\n"):"";card.querySelector("[data-close]").onclick=()=>card.closest(".vnext-modal")?.remove();
    const save=async publish=>{const stateEl=card.querySelector("[data-state]");try{stateEl.textContent="جاري الحفظ…";const body={...editorValues(card,row||{}),status:publish?"approved":"draft",enabled:publish};if(row?.id)await patch(row.id,body);else await rest("bella_content_items",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(body)});stateEl.textContent=publish?"تم الحفظ والنشر ✅":"تم حفظ المسودة ✅";await window.BellaContentCloud?.refresh?.(true);toast(publish?"المحتوى صار مباشر ✅":"انحفظت المسودة");setTimeout(()=>{card.closest(".vnext-modal")?.remove();onDone?.(true);},250);}catch(e){stateEl.textContent=e?.message||"تعذر الحفظ";}};
    card.querySelector("[data-draft]").onclick=()=>save(false);card.querySelector("[data-publish]").onclick=()=>save(true);return true;
  }

  async function generateAI(kind,count,stateEl,reload){
    if(busy)return;busy=true;try{stateEl.textContent="بيلا تقترح محتوى… 🤖";const r=await fetch("/api/content-generate",{method:"POST",headers:{Authorization:`Bearer ${token()}`,"Content-Type":"application/json"},body:JSON.stringify({kind,count})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||`HTTP ${r.status}`);const batch=crypto.randomUUID();const inserts=(d.items||[]).map(x=>({...x,source:"ai",status:"pending",enabled:false,generation_meta:{model:d.model||"gpt-5-mini",batch_id:batch,review_required:true}}));if(!inserts.length)throw new Error("ما وصل اقتراح صالح.");const saved=await rest("bella_content_items",{method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=representation"},body:JSON.stringify(inserts)});stateEl.textContent=`وصلت ${Array.isArray(saved)?saved.length:inserts.length} اقتراحات للمراجعة — ما اننشر منها شي ✅`;toast("اقتراحات AI وصلت للمراجعة 🤖");reload(true);}catch(e){stateEl.textContent=e?.message||"تعذر التوليد";}finally{busy=false;}}

  async function openStudio(){
    if(!(await owner())){toast("استوديو المحتوى للمالك بس 🛡️");return false;}styles();document.getElementById("bellaOwnerCenter")?.remove();const card=shell();card.innerHTML=`<div class="bella-content-head"><div><h2>استوديو المحتوى 🛠️</h2><p>أضف وعدّل ووقف محتوى الألعاب. اقتراحات AI تدخل طابور مراجعة وما تننشر إلا إذا اعتمدتها أنت.</p></div><div class="bella-content-actions"><button data-add class="primary">+ إضافة يدوي</button><button data-back>مركز المالك</button><button data-close>إغلاق</button></div></div><div class="bella-content-stats" data-stats></div><section class="bella-content-section"><h3>🤖 اقتراحات AI</h3><div class="bella-content-ai"><div class="bella-content-field"><label>النوع</label><select data-ai-kind></select></div><div class="bella-content-field"><label>العدد</label><input data-ai-count type="number" min="1" max="10" value="5"></div><div><div class="bella-content-actions"><button class="primary" data-generate>ولّد اقتراحات للمراجعة</button></div><div class="bella-content-ai-note">الاقتراحات تنحفظ Pending وموقوفة. أنت تختار اعتماد ونشر أو رفض.</div></div></div><div class="bella-content-state" data-ai-state></div></section><section class="bella-content-section"><h3>المحتوى</h3><div class="bella-content-toolbar"><select data-filter-kind></select><select data-filter-status></select><input data-search placeholder="ابحث بالنص أو التصنيف"><button class="vnext-ghost" data-refresh>تحديث</button></div><div class="bella-content-list" data-list><div class="bella-content-state">جاري التحميل…</div></div></section>`;
    const aiKind=card.querySelector("[data-ai-kind]");for(const k of KINDS)aiKind.append(option(k,LABELS[k]));const fk=kindSelect(true),fs=statusSelect();card.querySelector("[data-filter-kind]").replaceWith(fk);fk.dataset.filterKind="1";card.querySelector("[data-filter-status]").replaceWith(fs);fs.dataset.filterStatus="1";
    card.querySelector("[data-close]").onclick=()=>card.closest(".vnext-modal")?.remove();card.querySelector("[data-back]").onclick=()=>{card.closest(".vnext-modal")?.remove();window.BellaOwnerCenter?.open?.();};card.querySelector("[data-add]").onclick=()=>openEditor(null,()=>reload(true));
    const reload=async(force=false)=>{const list=card.querySelector("[data-list]");try{if(force)list.innerHTML=`<div class="bella-content-state">جاري التحديث…</div>`;await loadRows();renderStats(card.querySelector("[data-stats]"));renderList(list,reload);}catch(e){list.innerHTML=`<div class="bella-content-empty">تعذر تحميل المحتوى.</div>`;}};
    const apply=()=>{filters={kind:fk.value,status:fs.value,q:card.querySelector("[data-search]").value.trim()};renderList(card.querySelector("[data-list]"),reload);};fk.onchange=apply;fs.onchange=apply;card.querySelector("[data-search]").oninput=apply;card.querySelector("[data-refresh]").onclick=()=>reload(true);card.querySelector("[data-generate]").onclick=()=>generateAI(aiKind.value,Math.max(1,Math.min(10,Number(card.querySelector("[data-ai-count]").value)||5)),card.querySelector("[data-ai-state]"),reload);await reload(true);return true;
  }

  function installEntry(modal){
    if(!(modal instanceof HTMLElement)||modal.id!=="bellaOwnerCenter")return;const card=modal.querySelector(".bella-owner-card");if(!card||card.querySelector("[data-bella-content-entry]"))return;const section=document.createElement("section");section.className="bella-content-entry";section.dataset.bellaContentEntry="1";const h=document.createElement("h3");h.textContent="استوديو المحتوى 🛠️🤖";const p=document.createElement("p");p.textContent="حكم، أمثال، إشاعات وأسئلة: إضافة وتعديل وإيقاف + اقتراحات AI بموافقتك قبل النشر.";const b=document.createElement("button");b.textContent="فتح استوديو المحتوى";b.onclick=openStudio;section.append(h,p,b);const users=card.querySelector("[data-owner-users]");if(users)card.insertBefore(section,users);else card.append(section);
  }
  function observe(){document.querySelectorAll("#bellaOwnerCenter").forEach(installEntry);const o=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n instanceof HTMLElement){if(n.id==="bellaOwnerCenter")queueMicrotask(()=>installEntry(n));n.querySelectorAll?.("#bellaOwnerCenter").forEach(x=>queueMicrotask(()=>installEntry(x)));}});if(document.body)o.observe(document.body,{childList:true,subtree:false});}
  window.BellaOwnerContentStudio=Object.freeze({open:openStudio,refresh:()=>window.BellaContentCloud?.refresh?.(true),status:()=>({rows:rows.length,pending:rows.filter(x=>x.status==="pending").length)});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();
