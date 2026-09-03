(() => {
  "use strict";

  const SOURCE_HEADING = "مصادر التحقق:";
  const URL_RE = /^〔(\d+)〕\s+(https?:\/\/\S+)\s*$/;

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
    } catch { return ""; }
  }

  function parseReply(text) {
    const value = String(text || "");
    const marker = `\n\n${SOURCE_HEADING}\n`;
    const index = value.lastIndexOf(marker);
    if (index < 0) return null;
    const main = value.slice(0, index).trimEnd();
    const lines = value.slice(index + marker.length).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const sources = [];
    for (const line of lines) {
      const match = line.match(URL_RE);
      if (!match) continue;
      const url = safeUrl(match[2]);
      if (!url) continue;
      sources.push({ index: Number(match[1]), url });
    }
    if (!sources.length) return null;
    return { main, sources };
  }

  function appendTextWithInlineCitations(parent, text, sourceMap) {
    const pattern = /〔(\d+)〕/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text))) {
      if (match.index > cursor) parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      const source = sourceMap.get(Number(match[1]));
      if (source) {
        const link = document.createElement("a");
        link.className = "bella-cite-inline";
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = match[0];
        link.setAttribute("aria-label", `افتح المصدر ${source.index}`);
        parent.appendChild(link);
      } else {
        parent.appendChild(document.createTextNode(match[0]));
      }
      cursor = pattern.lastIndex;
    }
    if (cursor < text.length) parent.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function decorate(node) {
    if (!(node instanceof HTMLElement) || !node.classList.contains("bot") || node.dataset.liveWebDecorated === "1") return false;
    const textNode = [...node.childNodes].find(child => child.nodeType === Node.TEXT_NODE && String(child.textContent || "").includes(SOURCE_HEADING));
    if (!textNode) return false;
    const parsed = parseReply(textNode.textContent);
    if (!parsed) return false;

    const sourceMap = new Map(parsed.sources.map(source => [source.index, source]));
    const fragment = document.createDocumentFragment();
    appendTextWithInlineCitations(fragment, parsed.main, sourceMap);
    node.replaceChild(fragment, textNode);

    const row = document.createElement("div");
    row.className = "source-row bella-live-sources";
    row.setAttribute("aria-label", "مصادر التحقق من الويب");

    const badge = document.createElement("span");
    badge.className = "bella-live-badge";
    badge.textContent = "🔎 تحقق حي";
    row.appendChild(badge);

    for (const source of parsed.sources.slice(0, 6)) {
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `مصدر ${source.index}`;
      link.setAttribute("aria-label", `افتح مصدر التحقق ${source.index}`);
      row.appendChild(link);
    }
    node.appendChild(row);
    node.dataset.liveWebDecorated = "1";
    return true;
  }

  function install() {
    const box = document.getElementById("box");
    if (!box || box.dataset.liveWebObserved === "1") return false;
    box.dataset.liveWebObserved = "1";
    box.querySelectorAll(".m.bot").forEach(decorate);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const added of record.addedNodes) {
          if (!(added instanceof HTMLElement)) continue;
          if (added.classList.contains("m")) queueMicrotask(() => decorate(added));
          added.querySelectorAll?.(".m.bot").forEach(node => queueMicrotask(() => decorate(node)));
        }
      }
    });
    observer.observe(box, { childList: true, subtree: false });
    return true;
  }

  function injectStyles() {
    if (document.getElementById("bellaLiveWebStyles")) return;
    const style = document.createElement("style");
    style.id = "bellaLiveWebStyles";
    style.textContent = `
      .bella-cite-inline{display:inline-flex;align-items:center;margin:0 2px;color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;font-size:.92em;font-weight:800}
      .bella-live-sources{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:9px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08);font-size:11px}
      .bella-live-sources a{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:inherit;text-decoration:none;font-weight:800}
      .bella-live-badge{opacity:.78;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  window.BellaLiveWeb = Object.freeze({ install, decorate, parseReply });

  const start = () => { injectStyles(); install(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
