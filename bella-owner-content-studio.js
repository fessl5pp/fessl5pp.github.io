(() => {
  "use strict";

  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const SESSION_KEY = "bella_account_session_v1";
  const KINDS = ["rumor", "wisdom", "proverb", "kuwait", "box"];
  const LABELS = {
    rumor: "إشاعة 👂",
    wisdom: "حكمة 🧿",
    proverb: "مثل 🧠",
    kuwait: "سؤال كويتي 🇰🇼",
    box: "شنو بالصندوق 🎁"
  };
  const STATUS = {
    draft: "مسودة",
    pending: "ينتظر مراجعة",
    approved: "منشور",
    rejected: "مرفوض"
  };

  let rows = [];
  let generating = false;
  let filters = { kind: "all", status: "all", q: "" };

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  function token() {
    return String(readSession()?.access_token || "");
  }

  function headers(extra = {}) {
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extra
    };
  }

  async function rest(path, options = {}) {
    if (!token()) throw new Error("owner session unavailable");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers(), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function clean(value, max = 600) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function norm(value) {
    return clean(value)
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  }

  function toast(text) {
    try { window.showToast?.(text); } catch {}
  }

  async function verifyOwner() {
    if (window.BellaOwnerCenter?.isOwner?.()) return true;
    try { return Boolean(await window.BellaOwnerCenter?.refresh?.()); }
    catch { return false; }
  }

  function ensureStyles() {
    if (document.getElementById("bellaOwnerContentStudioStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaOwnerContentStudioStyles";
    style.textContent = `
      .bella-content-entry{margin:12px 0;padding:13px;border:1px solid rgba(166,130,255,.22);border-radius:16px;background:rgba(166,130,255,.055);text-align:right}
      .bella-content-entry h3{margin:0 0 4px}.bella-content-entry p{margin:0 0 10px;color:var(--muted);font-size:10px;line-height:1.7}
      .bella-content-entry button,.bella-content-actions button{border:1px solid rgba(255,255,255,.11);border-radius:11px;padding:9px 11px;background:rgba(255,255,255,.055);color:inherit;font:inherit;font-size:10px;font-weight:850;cursor:pointer}
      .bella-content-entry button,.bella-content-actions button.primary{background:var(--accent);color:#fff;border-color:transparent}.bella-content-actions button.danger{color:#ff9992}.bella-content-actions button:disabled{opacity:.45}
      .bella-content-card{width:min(940px,96vw)!important;max-height:91dvh;overflow:auto;text-align:right}
      .bella-content-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.bella-content-head h2{margin:0}.bella-content-head p{margin:5px 0 0;color:var(--muted);font-size:10px;line-height:1.7}
      .bella-content-actions{display:flex;gap:7px;flex-wrap:wrap}.bella-content-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0}
      .bella-content-stat{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.035)}.bella-content-stat small,.bella-content-stat b{display:block}.bella-content-stat small{font-size:9px;color:var(--muted)}.bella-content-stat b{font-size:17px;margin-top:2px}
      .bella-content-section{margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.025)}.bella-content-section h3{margin:0 0 8px;font-size:13px}
      .bella-content-toolbar{display:grid;grid-template-columns:150px 150px 1fr auto;gap:7px}.bella-content-ai{display:grid;grid-template-columns:160px 100px 1fr;gap:8px;align-items:end}.bella-content-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.bella-content-editor .wide{grid-column:1/-1}
      .bella-content-field{display:grid;gap:5px}.bella-content-field label{font-size:9px;color:var(--muted);font-weight:850}
      .bella-content-toolbar select,.bella-content-toolbar input,.bella-content-field input,.bella-content-field select,.bella-content-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.055);color:inherit;padding:9px;font:inherit;outline:none}
      .bella-content-field textarea{min-height:78px;resize:vertical;line-height:1.6}.bella-content-ai-note,.bella-content-state{font-size:9px;color:var(--muted);line-height:1.65}.bella-content-state{margin-top:7px}
      .bella-content-list{display:grid;gap:8px;margin-top:10px}.bella-content-row{padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.03)}.bella-content-row[data-off="1"]{opacity:.58}
      .bella-content-row-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.bella-content-row-title{font-size:11px;font-weight:850;line-height:1.65}.bella-content-chip{white-space:nowrap;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.06);font-size:8px}
      .bella-content-meta{margin-top:4px;color:var(--muted);font-size:8px;line-height:1.6}.bella-content-answer{margin-top:6px;font-size:10px;line-height:1.6}.bella-content-empty{padding:20px;text-align:center;color:var(--muted);border:1px dashed rgba(255,255,255,.11);border-radius:13px}
      @media(max-width:680px){.bella-content-stats{grid-template-columns:repeat(2,1fr)}.bella-content-toolbar,.bella-content-ai,.bella-content-editor{grid-template-columns:1fr}.bella-content-editor .wide{grid-column:auto}.bella-content-head{flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function shell(id = "bellaOwnerContentStudio") {
    document.getElementById(id)?.remove();
    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "vnext-modal";
    modal.innerHTML = `<div class="vnext-card bella-content-card"></div>`;
    modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    return modal.querySelector(".bella-content-card");
  }

  function addOption(select, value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function fillKindSelect(select, includeAll = false) {
    if (includeAll) addOption(select, "all", "كل الأنواع");
    for (const kind of KINDS) addOption(select, kind, LABELS[kind]);
  }

  function stat(label, value) {
    const box = document.createElement("div");
    box.className = "bella-content-stat";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("b");
    strong.textContent = String(value);
    box.append(small, strong);
    return box;
  }

  async function loadRows() {
    const data = await rest("bella_content_items?select=*&order=updated_at.desc&limit=400");
    rows = Array.isArray(data) ? data : [];
    return rows;
  }

  function visibleRows() {
    const q = norm(filters.q);
    return rows.filter(row => {
      if (filters.kind !== "all" && row.kind !== filters.kind) return false;
      if (filters.status !== "all" && row.status !== filters.status) return false;
      if (!q) return true;
      return norm(`${row.prompt || ""} ${row.answer || ""} ${row.category || ""}`).includes(q);
    });
  }

  function renderStats(host) {
    const live = rows.filter(row => row.status === "approved" && row.enabled).length;
    const pending = rows.filter(row => row.status === "pending").length;
    const ai = rows.filter(row => row.source === "ai").length;
    host.replaceChildren(
      stat("كل المحتوى", rows.length),
      stat("منشور", live),
      stat("ينتظر مراجعة", pending),
      stat("اقتراحات AI", ai)
    );
  }

  async function patchItem(id, body) {
    return rest(`bella_content_items?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(body)
    });
  }

  async function deleteItem(id) {
    return rest(`bella_content_items?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
  }

  function renderList(host, reload) {
    host.replaceChildren();
    const data = visibleRows();
    if (!data.length) {
      const empty = document.createElement("div");
      empty.className = "bella-content-empty";
      empty.textContent = "ما فيه محتوى يطابق الفلتر.";
      host.appendChild(empty);
      return;
    }

    for (const row of data) {
      const item = document.createElement("article");
      item.className = "bella-content-row";
      item.dataset.off = row.enabled ? "0" : "1";

      const head = document.createElement("div");
      head.className = "bella-content-row-head";
      const title = document.createElement("div");
      title.className = "bella-content-row-title";
      title.textContent = row.prompt || "—";
      const chip = document.createElement("span");
      chip.className = "bella-content-chip";
      chip.textContent = `${LABELS[row.kind] || row.kind} · ${STATUS[row.status] || row.status}`;
      head.append(title, chip);
      item.appendChild(head);

      const meta = document.createElement("div");
      meta.className = "bella-content-meta";
      meta.textContent = `${row.source === "ai" ? "🤖 AI" : "✍️ يدوي"} · ${row.category || "عام"} · ${row.difficulty || "medium"} · ${row.enabled ? "شغال" : "موقوف"}`;
      item.appendChild(meta);

      if (row.answer || row.explanation) {
        const answer = document.createElement("div");
        answer.className = "bella-content-answer";
        const pieces = [];
        if (row.answer) pieces.push(`الجواب: ${row.answer}`);
        if (row.explanation) pieces.push(`المعنى/الشرح: ${row.explanation}`);
        answer.textContent = pieces.join(" — ");
        item.appendChild(answer);
      }

      const actions = document.createElement("div");
      actions.className = "bella-content-actions";
      const action = (text, handler, className = "") => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        if (className) button.className = className;
        button.onclick = handler;
        actions.appendChild(button);
        return button;
      };

      action("تعديل", () => openEditor(row, () => reload(true)));
      if (row.status !== "approved") {
        action("اعتماد ونشر", async () => {
          await patchItem(row.id, { status: "approved", enabled: true });
          await window.BellaContentCloud?.refresh?.(true);
          toast("تم اعتماد المحتوى ونشره ✅");
          reload(true);
        }, "primary");
      } else {
        action(row.enabled ? "إيقاف" : "تشغيل", async () => {
          await patchItem(row.id, { enabled: !row.enabled });
          await window.BellaContentCloud?.refresh?.(true);
          reload(true);
        });
      }
      if (row.status !== "rejected") {
        action("رفض", async () => {
          await patchItem(row.id, { status: "rejected", enabled: false });
          await window.BellaContentCloud?.refresh?.(true);
          reload(true);
        });
      }
      action("حذف", async () => {
        if (!window.confirm("تحذف هالمحتوى نهائيًا؟")) return;
        await deleteItem(row.id);
        await window.BellaContentCloud?.refresh?.(true);
        reload(true);
      }, "danger");

      item.appendChild(actions);
      host.appendChild(item);
    }
  }

  function parseOptions(text) {
    const seen = new Set();
    const out = [];
    for (const part of String(text || "").split(/\n|،|,/)) {
      const value = clean(part, 160);
      const key = norm(value);
      if (!value || !key || seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
    return out.slice(0, 4);
  }

  function readEditor(card, oldRow = {}) {
    const kind = card.querySelector("[data-kind]").value;
    const prompt = clean(card.querySelector("[data-prompt]").value, 500);
    const answer = clean(card.querySelector("[data-answer]").value, 240);
    const explanation = clean(card.querySelector("[data-explanation]").value, 600);
    const category = clean(card.querySelector("[data-category]").value, 80) || "عام";
    const difficulty = card.querySelector("[data-difficulty]").value;
    const options = parseOptions(card.querySelector("[data-options]").value);

    if (prompt.length < 2) throw new Error("اكتب المحتوى أول.");
    if (["wisdom", "proverb", "kuwait", "box"].includes(kind) && !answer) throw new Error("هالنوع يحتاج جواب.");
    if (kind === "kuwait") {
      if (options.length !== 4) throw new Error("السؤال الكويتي يحتاج 4 خيارات.");
      if (!options.some(value => norm(value) === norm(answer))) throw new Error("لازم الجواب الصحيح يكون ضمن الأربع خيارات.");
    }

    return {
      kind,
      prompt,
      answer,
      explanation,
      category,
      difficulty: ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium",
      options: kind === "kuwait" ? options : [],
      source: oldRow.source || "manual"
    };
  }

  async function openEditor(row = null, onDone = null) {
    ensureStyles();
    const card = shell("bellaContentEditor");
    card.innerHTML = `
      <div class="bella-content-head">
        <div><h2>${row ? "تعديل المحتوى" : "إضافة محتوى"} ✍️</h2><p>تقدر تحفظه مسودة أو تنشره مباشرة. اقتراحات AI ما تننشر إلا بعد اعتمادك.</p></div>
        <div class="bella-content-actions"><button data-close>إغلاق</button></div>
      </div>
      <section class="bella-content-section">
        <div class="bella-content-editor">
          <div class="bella-content-field"><label>النوع</label><select data-kind></select></div>
          <div class="bella-content-field"><label>الصعوبة</label><select data-difficulty><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div>
          <div class="bella-content-field wide"><label>النص / السؤال / بداية المثل</label><textarea data-prompt maxlength="500"></textarea></div>
          <div class="bella-content-field"><label>الجواب / التكملة</label><input data-answer maxlength="240"></div>
          <div class="bella-content-field"><label>التصنيف</label><input data-category maxlength="80" placeholder="مثال: جامعة"></div>
          <div class="bella-content-field wide"><label>المعنى / الشرح</label><textarea data-explanation maxlength="600"></textarea></div>
          <div class="bella-content-field wide"><label>خيارات السؤال الكويتي فقط — 4 أسطر</label><textarea data-options placeholder="الخيار 1\nالخيار 2\nالخيار 3\nالخيار 4"></textarea></div>
        </div>
        <div class="bella-content-actions" style="margin-top:10px"><button data-draft>حفظ مسودة</button><button data-publish class="primary">حفظ ونشر</button></div>
        <div class="bella-content-state" data-state></div>
      </section>`;

    const kind = card.querySelector("[data-kind]");
    fillKindSelect(kind, false);
    kind.value = row?.kind || "wisdom";
    card.querySelector("[data-difficulty]").value = row?.difficulty || "medium";
    card.querySelector("[data-prompt]").value = row?.prompt || "";
    card.querySelector("[data-answer]").value = row?.answer || "";
    card.querySelector("[data-category]").value = row?.category || "عام";
    card.querySelector("[data-explanation]").value = row?.explanation || "";
    card.querySelector("[data-options]").value = Array.isArray(row?.options) ? row.options.join("\n") : "";
    card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();

    const save = async publish => {
      const state = card.querySelector("[data-state]");
      try {
        state.textContent = "جاري الحفظ…";
        const body = {
          ...readEditor(card, row || {}),
          status: publish ? "approved" : "draft",
          enabled: publish
        };
        if (row?.id) {
          await patchItem(row.id, body);
        } else {
          await rest("bella_content_items", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(body)
          });
        }
        await window.BellaContentCloud?.refresh?.(true);
        state.textContent = publish ? "تم الحفظ والنشر ✅" : "تم حفظ المسودة ✅";
        toast(publish ? "المحتوى صار مباشر ✅" : "انحفظت المسودة");
        setTimeout(() => {
          card.closest(".vnext-modal")?.remove();
          onDone?.(true);
        }, 220);
      } catch (error) {
        state.textContent = error?.message || "تعذر الحفظ";
      }
    };

    card.querySelector("[data-draft]").onclick = () => save(false);
    card.querySelector("[data-publish]").onclick = () => save(true);
    return true;
  }

  async function generateAI(kind, count, state, reload) {
    if (generating) return false;
    generating = true;
    try {
      state.textContent = "بيلا تقترح محتوى… 🤖";
      const response = await fetch("/api/content-generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ kind, count })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

      const batchId = crypto.randomUUID();
      const inserts = (Array.isArray(data.items) ? data.items : []).map(item => ({
        ...item,
        source: "ai",
        status: "pending",
        enabled: false,
        generation_meta: { model: data.model || "gpt-5-mini", batch_id: batchId, review_required: true }
      }));
      if (!inserts.length) throw new Error("ما وصل اقتراح صالح.");

      const saved = await rest("bella_content_items", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify(inserts)
      });
      const savedCount = Array.isArray(saved) ? saved.length : inserts.length;
      state.textContent = `وصلت ${savedCount} اقتراحات للمراجعة — ما اننشر منها شي ✅`;
      toast("اقتراحات AI وصلت للمراجعة 🤖");
      await reload(true);
      return true;
    } catch (error) {
      state.textContent = error?.message || "تعذر التوليد";
      return false;
    } finally {
      generating = false;
    }
  }

  async function openStudio() {
    if (!(await verifyOwner())) {
      toast("استوديو المحتوى للمالك بس 🛡️");
      return false;
    }
    ensureStyles();
    document.getElementById("bellaOwnerCenter")?.remove();
    const card = shell();
    card.innerHTML = `
      <div class="bella-content-head">
        <div><h2>استوديو المحتوى 🛠️</h2><p>أضف وعدّل ووقف محتوى الألعاب. اقتراحات AI تدخل طابور مراجعة وما تننشر إلا إذا اعتمدتها أنت.</p></div>
        <div class="bella-content-actions"><button data-add class="primary">+ إضافة يدوي</button><button data-back>مركز المالك</button><button data-close>إغلاق</button></div>
      </div>
      <div class="bella-content-stats" data-stats></div>
      <section class="bella-content-section">
        <h3>🤖 اقتراحات AI</h3>
        <div class="bella-content-ai">
          <div class="bella-content-field"><label>النوع</label><select data-ai-kind></select></div>
          <div class="bella-content-field"><label>العدد</label><input data-ai-count type="number" min="1" max="10" value="5"></div>
          <div><div class="bella-content-actions"><button class="primary" data-generate>ولّد اقتراحات للمراجعة</button></div><div class="bella-content-ai-note">الاقتراحات تنحفظ Pending وموقوفة. أنت تختار اعتماد ونشر أو رفض.</div></div>
        </div>
        <div class="bella-content-state" data-ai-state></div>
      </section>
      <section class="bella-content-section">
        <h3>المحتوى</h3>
        <div class="bella-content-toolbar"><select data-filter-kind></select><select data-filter-status></select><input data-search placeholder="ابحث بالنص أو التصنيف"><button class="vnext-ghost" data-refresh>تحديث</button></div>
        <div class="bella-content-list" data-list><div class="bella-content-state">جاري التحميل…</div></div>
      </section>`;

    const aiKind = card.querySelector("[data-ai-kind]");
    fillKindSelect(aiKind, false);
    const filterKind = card.querySelector("[data-filter-kind]");
    fillKindSelect(filterKind, true);
    const filterStatus = card.querySelector("[data-filter-status]");
    addOption(filterStatus, "all", "كل الحالات");
    for (const status of ["pending", "draft", "approved", "rejected"]) addOption(filterStatus, status, STATUS[status]);

    const reload = async (showLoading = false) => {
      const list = card.querySelector("[data-list]");
      try {
        if (showLoading) list.innerHTML = `<div class="bella-content-state">جاري التحديث…</div>`;
        await loadRows();
        renderStats(card.querySelector("[data-stats]"));
        renderList(list, reload);
      } catch {
        list.innerHTML = `<div class="bella-content-empty">تعذر تحميل المحتوى.</div>`;
      }
    };

    const applyFilters = () => {
      filters = {
        kind: filterKind.value,
        status: filterStatus.value,
        q: card.querySelector("[data-search]").value.trim()
      };
      renderList(card.querySelector("[data-list]"), reload);
    };

    card.querySelector("[data-close]").onclick = () => card.closest(".vnext-modal")?.remove();
    card.querySelector("[data-back]").onclick = () => {
      card.closest(".vnext-modal")?.remove();
      window.BellaOwnerCenter?.open?.();
    };
    card.querySelector("[data-add]").onclick = () => openEditor(null, () => reload(true));
    card.querySelector("[data-refresh]").onclick = () => reload(true);
    card.querySelector("[data-search]").oninput = applyFilters;
    filterKind.onchange = applyFilters;
    filterStatus.onchange = applyFilters;
    card.querySelector("[data-generate]").onclick = () => {
      const count = Math.max(1, Math.min(10, Number(card.querySelector("[data-ai-count]").value) || 5));
      generateAI(aiKind.value, count, card.querySelector("[data-ai-state]"), reload);
    };

    await reload(true);
    return true;
  }

  function installEntry(modal) {
    if (!(modal instanceof HTMLElement) || modal.id !== "bellaOwnerCenter") return false;
    const card = modal.querySelector(".bella-owner-card");
    if (!card || card.querySelector("[data-bella-content-entry]")) return false;
    ensureStyles();

    const section = document.createElement("section");
    section.className = "bella-content-entry";
    section.dataset.bellaContentEntry = "1";
    const title = document.createElement("h3");
    title.textContent = "استوديو المحتوى 🛠️🤖";
    const note = document.createElement("p");
    note.textContent = "حكم، أمثال، إشاعات وأسئلة: إضافة وتعديل وإيقاف + اقتراحات AI بموافقتك قبل النشر.";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "فتح استوديو المحتوى";
    button.onclick = openStudio;
    section.append(title, note, button);

    const users = card.querySelector("[data-owner-users]");
    if (users) card.insertBefore(section, users);
    else card.appendChild(section);
    return true;
  }

  function observe() {
    document.querySelectorAll("#bellaOwnerCenter").forEach(installEntry);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.id === "bellaOwnerCenter") queueMicrotask(() => installEntry(node));
          node.querySelectorAll?.("#bellaOwnerCenter").forEach(found => queueMicrotask(() => installEntry(found)));
        }
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
  }

  window.BellaOwnerContentStudio = Object.freeze({
    open: openStudio,
    refresh: () => window.BellaContentCloud?.refresh?.(true),
    status: () => ({ rows: rows.length, pending: rows.filter(row => row.status === "pending").length })
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
})();
