(() => {
  "use strict";

  let current = null;
  let loading = false;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[ch]);
  }

  function modal(html) {
    document.getElementById("bellaAIActivityModal")?.remove();
    const el = document.createElement("div");
    el.id = "bellaAIActivityModal";
    el.className = "vnext-modal";
    el.innerHTML = `<div class="vnext-card">${html}</div>`;
    el.addEventListener("click", e => { if (e.target === el) el.remove(); });
    document.body.appendChild(el);
    return el;
  }

  function toast(text) {
    try { if (typeof window.showToast === "function") return window.showToast(text); } catch {}
    window.BellaMoments?.showToast?.(text);
  }

  async function generate(kind = "quick") {
    if (loading) return false;
    loading = true;
    const host = modal(`<h2>✨ تحدي بيلا AI</h2><p>قاعد أطلع لك شي جديد...</p><div class="vnext-actions"><button class="vnext-ghost" onclick="this.closest('.vnext-modal').remove()">سكر</button></div>`);
    try {
      const response = await fetch("/api/activity-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.activity) throw new Error(data?.error || "تعذر التوليد");
      current = data.activity;
      host.querySelector(".vnext-card").innerHTML = `
        <h2>${escapeHtml(current.title || "✨ تحدي بيلا")}</h2>
        <p style="font-size:15px;line-height:1.8">${escapeHtml(current.question)}</p>
        <input id="bellaAIActivityAnswer" class="vnext-input" maxlength="90" placeholder="جوابك">
        <small id="bellaAIActivityHint" style="display:block;margin-top:8px;color:var(--muted)"></small>
        <div class="vnext-actions"><button id="bellaAIActivityCheck" class="vnext-primary">شيكي جوابي</button><button id="bellaAIActivityHintBtn" class="vnext-ghost">تلميح</button><button id="bellaAIActivityNew" class="vnext-ghost">غيريه</button></div>`;
      host.querySelector("#bellaAIActivityHintBtn").onclick = () => { host.querySelector("#bellaAIActivityHint").textContent = `💡 ${current.hint}`; };
      host.querySelector("#bellaAIActivityNew").onclick = () => { host.remove(); generate(kind); };
      host.querySelector("#bellaAIActivityCheck").onclick = () => {
        const answer = host.querySelector("#bellaAIActivityAnswer").value.trim().toLowerCase().replace(/\s+/g," ");
        const right = String(current.answer || "").trim().toLowerCase().replace(/\s+/g," ");
        if (!answer) return;
        if (answer === right || (right.length >= 4 && (answer.includes(right) || right.includes(answer)))) {
          toast("صح عليك 🔥 +8 XP");
          try { if (typeof s === "object") { s.xp = Number(s.xp || 0) + 8; if (typeof updateUI === "function") updateUI(); if (typeof save === "function") save(); } } catch {}
          host.querySelector("#bellaAIActivityCheck").disabled = true;
        } else {
          host.querySelector("#bellaAIActivityHint").textContent = "مو هي 👀 جرب مرة ثانية أو خذ تلميح";
        }
      };
      return true;
    } catch (error) {
      host.querySelector(".vnext-card").innerHTML = `<h2>✨ تحدي بيلا AI</h2><p>${escapeHtml(error?.message || "ما ضبط الحين.")}</p><div class="vnext-actions"><button class="vnext-ghost" onclick="this.closest('.vnext-modal').remove()">سكر</button></div>`;
      return false;
    } finally { loading = false; }
  }

  function decorateActivities() {
    const hub = document.getElementById("bellaActivities");
    if (!hub || hub.querySelector("[data-bella-ai-activity]")) return false;
    const actions = hub.querySelector(".vnext-actions") || hub.querySelector(".bella-activities-grid") || hub.querySelector(".vnext-card");
    if (!actions) return false;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.bellaAiActivity = "1";
    button.className = "vnext-primary";
    button.textContent = "✨ تحدي جديد بالذكاء";
    button.onclick = () => generate(["quick","box","proverb"][Math.floor(Math.random()*3)]);
    actions.appendChild(button);
    return true;
  }

  function install() {
    decorateActivities();
    const observer = new MutationObserver(() => decorateActivities());
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    return true;
  }

  window.BellaAIActivities = Object.freeze({ generate, decorateActivities, install, status: () => ({ loading, currentKind: current?.kind || null }) });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true }); else install();
})();
