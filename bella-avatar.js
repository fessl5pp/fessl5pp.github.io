(() => {
  "use strict";

  const AVATAR_IDS = ["heroAvatar", "chatAvatar"];
  const STYLE_ID = "bellaAvatarIdentityStyles";
  const ASSET = "/bella-avatar-v10.webp";
  const MOODS = {
    angry: "معصبة",
    cute: "دلّوعة",
    happy: "سعيدة",
    chill: "النفسية وسط"
  };

  function moodOf(el) {
    if (!el) return "chill";
    if (el.classList.contains("mood-angry")) return "angry";
    if (el.classList.contains("mood-cute")) return "cute";
    if (el.classList.contains("mood-happy")) return "happy";
    return "chill";
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .bella-identity-avatar{
        --bella-photo-scale:1.06;
        position:relative;
        overflow:hidden;
        isolation:isolate;
        flex:0 0 auto;
        background:linear-gradient(145deg,#171522,#201928 55%,#0f1f25)!important;
        border:1px solid rgba(255,255,255,.14)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 10px 30px rgba(0,0,0,.26)!important;
        transition:box-shadow .22s ease,border-color .22s ease,filter .22s ease;
      }
      .bella-identity-avatar::before{
        content:"";
        position:absolute;
        inset:-18%;
        z-index:0;
        background:radial-gradient(circle at 50% 45%,rgba(139,124,255,.24),rgba(255,121,184,.10) 40%,transparent 68%);
        pointer-events:none;
      }
      .bella-avatar-photo{
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        object-fit:cover;
        object-position:50% 22%;
        display:block;
        z-index:1;
        transform:scale(var(--bella-photo-scale));
        transform-origin:50% 35%;
        transition:filter .22s ease,opacity .22s ease;
        user-select:none;
        -webkit-user-drag:none;
        pointer-events:none;
      }
      .logo.bella-identity-avatar{--bella-photo-scale:1.02}
      .logo.bella-identity-avatar .bella-avatar-photo{object-position:50% 18%}
      .avatar.bella-identity-avatar{--bella-photo-scale:1.12}
      .avatar.bella-identity-avatar .bella-avatar-photo{object-position:50% 18%}
      .bella-identity-avatar::after{
        content:"";
        position:absolute;
        inset:0;
        z-index:2;
        border-radius:inherit;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),inset 0 -10px 22px rgba(0,0,0,.10);
        pointer-events:none;
      }
      .bella-identity-avatar.mood-happy{
        border-color:rgba(101,226,255,.38)!important;
        box-shadow:0 0 0 3px rgba(90,220,255,.05),0 12px 32px rgba(83,199,255,.16),inset 0 1px 0 rgba(255,255,255,.12)!important;
      }
      .bella-identity-avatar.mood-happy .bella-avatar-photo{filter:saturate(1.05) brightness(1.035)}
      .bella-identity-avatar.mood-cute{
        border-color:rgba(255,126,184,.42)!important;
        box-shadow:0 0 0 3px rgba(255,103,174,.05),0 12px 32px rgba(255,88,163,.16),inset 0 1px 0 rgba(255,255,255,.12)!important;
      }
      .bella-identity-avatar.mood-cute .bella-avatar-photo{filter:saturate(1.08) brightness(1.025) sepia(.035)}
      .bella-identity-avatar.mood-angry{
        border-color:rgba(255,104,112,.42)!important;
        box-shadow:0 0 0 3px rgba(255,69,69,.05),0 12px 32px rgba(255,59,48,.14),inset 0 1px 0 rgba(255,255,255,.10)!important;
      }
      .bella-identity-avatar.mood-angry .bella-avatar-photo{filter:saturate(1.07) contrast(1.025) brightness(.97)}
      .bella-identity-avatar.mood-chill .bella-avatar-photo{filter:saturate(1.01)}
      .bella-identity-avatar.laugh .bella-avatar-photo{filter:saturate(1.07) brightness(1.04)}
      .bella-identity-avatar.wink .bella-avatar-photo{filter:saturate(1.04) brightness(1.02)}
      .bella-identity-avatar.facepalm .bella-avatar-photo{filter:saturate(.82) brightness(.94)}
      .bella-identity-avatar[data-bella-avatar-error="1"]{
        display:grid;
        place-items:center;
        color:#fff;
        font-weight:1000;
        font-size:clamp(18px,36%,34px);
      }
      @media (pointer:coarse){
        .bella-identity-avatar,.bella-avatar-photo{transition:none!important}
      }
      @media (prefers-reduced-motion:reduce){
        .bella-avatar-photo{transition:none!important;animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function makePhoto(el) {
    const img = document.createElement("img");
    img.className = "bella-avatar-photo";
    img.src = ASSET;
    img.alt = "";
    img.width = 256;
    img.height = 256;
    img.decoding = "async";
    const isHero = el?.id === "heroAvatar";
    img.loading = isHero ? "eager" : "lazy";
    try { img.fetchPriority = isHero ? "high" : "low"; } catch {}
    img.setAttribute("aria-hidden", "true");
    img.addEventListener("error", () => {
      if (!el) return;
      el.dataset.bellaAvatarError = "1";
      img.remove();
      if (!el.textContent) el.textContent = "B";
    }, { once: true });
    img.addEventListener("load", () => {
      if (el) delete el.dataset.bellaAvatarError;
    }, { once: true });
    return img;
  }

  function syncLabel(el) {
    const mood = moodOf(el);
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", `بيلا — ${MOODS[mood]}`);
    el.title = `بيلا · ${MOODS[mood]}`;
    el.dataset.bellaMood = mood;
  }

  function mountOne(el) {
    if (!el) return;
    if (!el.classList.contains("bella-identity-avatar") || !el.querySelector(".bella-avatar-photo")) {
      el.classList.add("bella-identity-avatar");
      delete el.dataset.bellaAvatarError;
      el.replaceChildren(makePhoto(el));
    }
    syncLabel(el);
  }

  function sync() {
    for (const id of AVATAR_IDS) mountOne(document.getElementById(id));
  }

  installStyles();
  sync();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type !== "attributes" || mutation.attributeName !== "class") continue;
      const el = mutation.target;
      if (el?.id && AVATAR_IDS.includes(el.id)) syncLabel(el);
    }
  });

  for (const id of AVATAR_IDS) {
    const el = document.getElementById(id);
    if (el) observer.observe(el, { attributes: true, attributeFilter: ["class"] });
  }

  window.BellaAvatar = Object.freeze({
    version: 10,
    asset: ASSET,
    sync,
    moodOf
  });
})();