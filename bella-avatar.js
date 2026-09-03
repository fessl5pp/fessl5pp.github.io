(() => {
  "use strict";

  const AVATAR_IDS = ["heroAvatar", "chatAvatar"];
  const STYLE_ID = "bellaAvatarIdentityStyles";
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
        position:relative;
        overflow:hidden;
        isolation:isolate;
        flex:0 0 auto;
        background:linear-gradient(145deg,#171322 0%,#2b1835 45%,#0f2630 100%)!important;
        border:1px solid rgba(255,255,255,.18);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 8px 24px rgba(0,0,0,.24);
        transition:box-shadow .28s ease,border-color .28s ease,filter .28s ease;
      }
      .bella-identity-avatar::before{
        content:"";
        position:absolute;
        inset:-28%;
        z-index:-1;
        background:conic-gradient(from 20deg,rgba(255,104,171,.72),rgba(126,113,255,.55),rgba(90,231,255,.62),rgba(255,104,171,.72));
        filter:blur(10px);
        opacity:.66;
        animation:bellaAuraSpin 15s linear infinite;
      }
      .bella-face{
        position:absolute;
        inset:10%;
        border-radius:48% 48% 46% 46%;
        background:
          radial-gradient(circle at 34% 28%,rgba(255,255,255,.72) 0 4%,transparent 5%),
          linear-gradient(150deg,#ffd6e8 0%,#f2a9cb 43%,#d989b4 100%);
        box-shadow:inset 0 -7px 14px rgba(108,41,86,.16),inset 0 2px 5px rgba(255,255,255,.55),0 5px 14px rgba(0,0,0,.2);
        transform-origin:50% 70%;
        transition:background .28s ease,transform .28s ease,box-shadow .28s ease;
      }
      .bella-hair{
        position:absolute;
        left:13%;right:13%;top:-2%;height:31%;
        border-radius:55% 55% 44% 44%;
        background:linear-gradient(150deg,#2d1730,#171522 68%);
        transform:rotate(-3deg);
        box-shadow:inset 0 2px 4px rgba(255,255,255,.12);
      }
      .bella-hair::after{
        content:"";
        position:absolute;
        width:38%;height:70%;right:3%;top:38%;
        border-radius:70% 20% 65% 30%;
        background:#201522;
        transform:rotate(18deg);
      }
      .bella-eye{
        position:absolute;
        top:46%;
        width:13%;height:16%;
        border-radius:50%;
        background:#281a27;
        box-shadow:inset 0 0 0 1px rgba(0,0,0,.22);
        transform-origin:center;
        animation:bellaBlink 6.2s ease-in-out infinite;
        transition:all .22s ease;
      }
      .bella-eye::after{
        content:"";
        position:absolute;
        width:35%;height:35%;
        top:16%;left:18%;
        border-radius:50%;
        background:rgba(255,255,255,.92);
      }
      .bella-eye-l{left:24%}
      .bella-eye-r{right:24%;animation-delay:.035s}
      .bella-brow{
        position:absolute;
        top:37%;
        width:16%;height:4%;
        border-radius:999px;
        background:rgba(72,34,61,.76);
        transition:transform .22s ease,top .22s ease;
      }
      .bella-brow-l{left:22%;transform:rotate(-4deg)}
      .bella-brow-r{right:22%;transform:rotate(4deg)}
      .bella-blush{
        position:absolute;
        top:63%;
        width:16%;height:8%;
        border-radius:50%;
        background:rgba(242,77,130,.25);
        filter:blur(.3px);
        opacity:.55;
        transition:opacity .22s ease,transform .22s ease;
      }
      .bella-blush-l{left:13%}.bella-blush-r{right:13%}
      .bella-mouth{
        position:absolute;
        left:50%;top:68%;
        width:25%;height:12%;
        transform:translateX(-50%);
        border-bottom:3px solid #7f375e;
        border-radius:0 0 50% 50%;
        transition:all .22s ease;
      }
      .bella-kuwait-mark{
        position:absolute;
        right:3%;bottom:3%;
        width:28%;height:22%;
        border-radius:999px;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.7);
        background:linear-gradient(to bottom,#138a53 0 33%,#f7f7f7 33% 66%,#d93a3a 66% 100%);
        box-shadow:0 2px 5px rgba(0,0,0,.22);
      }
      .bella-kuwait-mark::before{
        content:"";
        position:absolute;
        left:0;top:0;width:42%;height:100%;
        background:#161616;
        clip-path:polygon(0 0,100% 25%,100% 75%,0 100%);
      }
      .logo.bella-identity-avatar .bella-kuwait-mark{width:25%;height:19%}

      .bella-identity-avatar.mood-happy{
        border-color:rgba(126,239,255,.42);
        box-shadow:0 0 0 3px rgba(90,231,255,.08),0 10px 28px rgba(83,199,255,.22),inset 0 1px 0 rgba(255,255,255,.16);
      }
      .bella-identity-avatar.mood-happy .bella-face{transform:translateY(-1px) scale(1.02)}
      .bella-identity-avatar.mood-happy .bella-eye{height:12%;top:47%;border-radius:50% 50% 42% 42%}
      .bella-identity-avatar.mood-happy .bella-mouth{width:30%;height:16%;top:66%;border-bottom-width:4px}
      .bella-identity-avatar.mood-happy .bella-blush{opacity:.72}

      .bella-identity-avatar.mood-cute{
        border-color:rgba(255,126,184,.48);
        box-shadow:0 0 0 3px rgba(255,103,174,.08),0 10px 28px rgba(255,88,163,.24),inset 0 1px 0 rgba(255,255,255,.16);
      }
      .bella-identity-avatar.mood-cute .bella-face{background:linear-gradient(150deg,#ffe1ed 0%,#f7b2d1 48%,#dc91ba 100%);transform:scale(1.025)}
      .bella-identity-avatar.mood-cute .bella-eye{width:15%;height:19%;top:44%}
      .bella-identity-avatar.mood-cute .bella-brow{top:35%}
      .bella-identity-avatar.mood-cute .bella-mouth{width:16%;height:9%;top:70%;border-bottom-width:3px}
      .bella-identity-avatar.mood-cute .bella-blush{opacity:1;transform:scale(1.12)}

      .bella-identity-avatar.mood-angry{
        border-color:rgba(255,101,101,.5);
        filter:saturate(1.08);
        box-shadow:0 0 0 3px rgba(255,69,69,.08),0 10px 28px rgba(255,59,48,.22),inset 0 1px 0 rgba(255,255,255,.12);
      }
      .bella-identity-avatar.mood-angry .bella-face{background:linear-gradient(150deg,#ffd1dc 0%,#ec9fb7 48%,#c87896 100%);transform:translateY(1px)}
      .bella-identity-avatar.mood-angry .bella-brow-l{top:39%;transform:rotate(17deg)}
      .bella-identity-avatar.mood-angry .bella-brow-r{top:39%;transform:rotate(-17deg)}
      .bella-identity-avatar.mood-angry .bella-eye{top:48%;height:13%}
      .bella-identity-avatar.mood-angry .bella-mouth{top:73%;height:0;width:22%;border-bottom:0;border-top:3px solid #77304f;border-radius:50% 50% 0 0}
      .bella-identity-avatar.mood-angry .bella-blush{opacity:.28}

      .bella-identity-avatar.mood-chill .bella-mouth{width:21%;height:8%;top:69%}
      .bella-identity-avatar.laugh .bella-face{animation:bellaFaceLaugh .55s ease 3}
      .bella-identity-avatar.wink .bella-eye-r{transform:scaleY(.12)!important;animation:none}
      .bella-identity-avatar.facepalm .bella-face{filter:saturate(.82)}

      @keyframes bellaBlink{
        0%,46%,49%,100%{transform:scaleY(1)}
        47.2%,48.2%{transform:scaleY(.08)}
      }
      @keyframes bellaAuraSpin{to{transform:rotate(360deg)}}
      @keyframes bellaFaceLaugh{
        0%,100%{transform:translateY(0) rotate(0)}
        35%{transform:translateY(-2px) rotate(-3deg)}
        70%{transform:translateY(-2px) rotate(3deg)}
      }
      @media (prefers-reduced-motion:reduce){
        .bella-identity-avatar::before,.bella-eye,.bella-identity-avatar.laugh .bella-face{animation:none!important}
        .bella-face,.bella-eye,.bella-brow,.bella-mouth,.bella-blush{transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function makeFace() {
    const face = document.createElement("span");
    face.className = "bella-face";
    face.setAttribute("aria-hidden", "true");
    face.innerHTML = `
      <span class="bella-hair"></span>
      <span class="bella-brow bella-brow-l"></span>
      <span class="bella-brow bella-brow-r"></span>
      <span class="bella-eye bella-eye-l"></span>
      <span class="bella-eye bella-eye-r"></span>
      <span class="bella-blush bella-blush-l"></span>
      <span class="bella-blush bella-blush-r"></span>
      <span class="bella-mouth"></span>
      <span class="bella-kuwait-mark"></span>
    `;
    return face;
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
    if (!el.classList.contains("bella-identity-avatar")) {
      el.classList.add("bella-identity-avatar");
      el.replaceChildren(makeFace());
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
    version: 8,
    sync,
    moodOf
  });
})();