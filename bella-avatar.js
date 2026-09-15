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
        background:
          radial-gradient(circle at 50% 12%,rgba(255,255,255,.12),transparent 28%),
          linear-gradient(145deg,#171522 0%,#241b32 48%,#10242b 100%)!important;
        border:1px solid rgba(255,255,255,.14);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 10px 30px rgba(0,0,0,.28);
        transition:box-shadow .28s ease,border-color .28s ease,filter .28s ease,transform .2s ease;
      }
      .bella-identity-avatar::before{
        content:"";
        position:absolute;
        inset:-32%;
        z-index:-2;
        background:conic-gradient(from 10deg,rgba(255,104,171,.54),rgba(129,113,255,.48),rgba(90,222,255,.46),rgba(255,104,171,.54));
        filter:blur(14px);
        opacity:.52;
        animation:bellaAuraSpin 18s linear infinite;
      }
      .bella-identity-avatar::after{
        content:"";
        position:absolute;
        inset:0;
        z-index:-1;
        border-radius:inherit;
        background:radial-gradient(circle at 48% 38%,rgba(255,255,255,.08),transparent 46%);
        pointer-events:none;
      }
      .bella-portrait{
        position:absolute;
        inset:0;
        overflow:hidden;
        border-radius:inherit;
      }
      .bella-shoulders{
        position:absolute;
        left:12%;right:12%;bottom:-18%;height:43%;
        border-radius:50% 50% 18% 18%;
        background:linear-gradient(160deg,#1c1a28,#29223a 55%,#111b21);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.08);
      }
      .bella-neck{
        position:absolute;
        left:42%;right:42%;bottom:17%;height:18%;
        border-radius:0 0 45% 45%;
        background:linear-gradient(180deg,#d995b0,#cf86a5);
      }
      .bella-hair-back{
        position:absolute;
        left:15%;right:15%;top:5%;bottom:10%;
        border-radius:48% 48% 38% 38%;
        background:linear-gradient(155deg,#211825,#15131c 48%,#0f1118 100%);
        box-shadow:0 5px 16px rgba(0,0,0,.32),inset 3px 2px 6px rgba(255,255,255,.05);
      }
      .bella-face{
        position:absolute;
        left:22%;right:22%;top:17%;bottom:23%;
        border-radius:46% 46% 44% 44% / 43% 43% 55% 55%;
        background:
          radial-gradient(circle at 32% 23%,rgba(255,255,255,.58) 0 3%,transparent 4%),
          linear-gradient(155deg,#f6c0d4 0%,#e8a8c1 47%,#d88baa 100%);
        box-shadow:inset 0 -7px 15px rgba(104,45,76,.12),inset 0 2px 5px rgba(255,255,255,.38),0 5px 16px rgba(0,0,0,.16);
        transform-origin:50% 72%;
        transition:background .28s ease,transform .28s ease,box-shadow .28s ease,filter .28s ease;
      }
      .bella-hair-front{
        position:absolute;
        left:16%;right:16%;top:5%;height:34%;
        pointer-events:none;
      }
      .bella-hair-front::before,
      .bella-hair-front::after{
        content:"";
        position:absolute;
        top:0;
        width:58%;height:100%;
        background:linear-gradient(155deg,#2b1d31,#17141d 70%);
        box-shadow:inset 0 2px 3px rgba(255,255,255,.055);
      }
      .bella-hair-front::before{
        left:0;
        border-radius:62% 18% 58% 22%;
        transform:rotate(-7deg);
      }
      .bella-hair-front::after{
        right:0;
        border-radius:18% 62% 22% 58%;
        transform:rotate(8deg);
      }
      .bella-part{
        position:absolute;
        left:48%;top:5%;width:4%;height:22%;
        border-radius:999px;
        background:linear-gradient(180deg,rgba(255,255,255,.10),transparent);
        opacity:.42;
        z-index:4;
      }
      .bella-eye{
        position:absolute;
        top:45%;
        width:16%;height:13%;
        border-radius:54% 54% 48% 48%;
        background:#f6eff4;
        box-shadow:inset 0 -1px 0 rgba(80,42,65,.12);
        overflow:hidden;
        transform-origin:center;
        animation:bellaBlink 6.4s ease-in-out infinite;
        transition:all .22s ease;
      }
      .bella-eye-l{left:23%}
      .bella-eye-r{right:23%;animation-delay:.04s}
      .bella-iris{
        position:absolute;
        width:65%;height:92%;
        left:18%;top:5%;
        border-radius:50%;
        background:radial-gradient(circle at 35% 30%,#d7b57b 0 9%,#7a5b3e 28%,#342a2a 70%,#171417 100%);
        box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);
      }
      .bella-iris::after{
        content:"";
        position:absolute;
        left:24%;top:18%;width:23%;height:23%;
        border-radius:50%;
        background:rgba(255,255,255,.92);
      }
      .bella-lash{
        position:absolute;
        top:43%;width:17%;height:5%;
        border-top:2px solid rgba(55,29,46,.78);
        border-radius:60% 60% 0 0;
      }
      .bella-lash-l{left:22%;transform:rotate(-2deg)}
      .bella-lash-r{right:22%;transform:rotate(2deg)}
      .bella-brow{
        position:absolute;
        top:35%;
        width:18%;height:4%;
        border-radius:999px;
        background:rgba(69,39,57,.68);
        transition:transform .22s ease,top .22s ease;
      }
      .bella-brow-l{left:22%;transform:rotate(-5deg)}
      .bella-brow-r{right:22%;transform:rotate(5deg)}
      .bella-nose{
        position:absolute;
        left:50%;top:57%;
        width:5%;height:8%;
        transform:translateX(-50%);
        border-right:1px solid rgba(133,67,96,.22);
        border-bottom:1px solid rgba(133,67,96,.16);
        border-radius:0 0 70% 0;
      }
      .bella-blush{
        position:absolute;
        top:62%;
        width:17%;height:8%;
        border-radius:50%;
        background:rgba(232,77,128,.20);
        filter:blur(.4px);
        opacity:.58;
        transition:opacity .22s ease,transform .22s ease;
      }
      .bella-blush-l{left:12%}.bella-blush-r{right:12%}
      .bella-mouth{
        position:absolute;
        left:50%;top:70%;
        width:22%;height:10%;
        transform:translateX(-50%);
        border-bottom:2px solid #82415f;
        border-radius:0 0 55% 55%;
        transition:all .22s ease;
      }
      .bella-earring{
        position:absolute;
        top:56%;
        width:5%;height:5%;
        border-radius:50%;
        background:radial-gradient(circle at 35% 30%,#fff3c9,#dfb85c 55%,#8a6325);
        box-shadow:0 1px 3px rgba(0,0,0,.28);
      }
      .bella-earring-l{left:18%}.bella-earring-r{right:18%}
      .bella-kuwait-mark{
        position:absolute;
        right:7%;bottom:7%;
        width:25%;height:17%;
        border-radius:999px;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.65);
        background:linear-gradient(to bottom,#128654 0 33%,#f7f7f7 33% 66%,#cf3d45 66% 100%);
        box-shadow:0 3px 9px rgba(0,0,0,.25);
        z-index:9;
      }
      .bella-kuwait-mark::before{
        content:"";
        position:absolute;
        left:0;top:0;width:42%;height:100%;
        background:#171717;
        clip-path:polygon(0 0,100% 25%,100% 75%,0 100%);
      }
      .avatar.bella-identity-avatar .bella-earring{display:none}
      .avatar.bella-identity-avatar .bella-kuwait-mark{right:5%;bottom:5%;width:27%;height:19%}

      .bella-identity-avatar.mood-happy{
        border-color:rgba(101,226,255,.38);
        box-shadow:0 0 0 3px rgba(90,220,255,.06),0 12px 34px rgba(83,199,255,.18),inset 0 1px 0 rgba(255,255,255,.14);
      }
      .bella-identity-avatar.mood-happy .bella-face{transform:translateY(-1px) scale(1.015)}
      .bella-identity-avatar.mood-happy .bella-eye{height:10%;top:47%}
      .bella-identity-avatar.mood-happy .bella-mouth{width:29%;height:15%;top:67%;border-bottom-width:3px}
      .bella-identity-avatar.mood-happy .bella-blush{opacity:.75}

      .bella-identity-avatar.mood-cute{
        border-color:rgba(255,126,184,.42);
        box-shadow:0 0 0 3px rgba(255,103,174,.06),0 12px 34px rgba(255,88,163,.18),inset 0 1px 0 rgba(255,255,255,.14);
      }
      .bella-identity-avatar.mood-cute .bella-face{background:linear-gradient(155deg,#f9c8da 0%,#efb0c8 48%,#db91ad 100%);transform:scale(1.018)}
      .bella-identity-avatar.mood-cute .bella-eye{width:17%;height:15%;top:44%}
      .bella-identity-avatar.mood-cute .bella-brow{top:34%}
      .bella-identity-avatar.mood-cute .bella-mouth{width:15%;height:8%;top:71%}
      .bella-identity-avatar.mood-cute .bella-blush{opacity:.92;transform:scale(1.1)}

      .bella-identity-avatar.mood-angry{
        border-color:rgba(255,104,112,.44);
        filter:saturate(1.04);
        box-shadow:0 0 0 3px rgba(255,69,69,.055),0 12px 34px rgba(255,59,48,.16),inset 0 1px 0 rgba(255,255,255,.10);
      }
      .bella-identity-avatar.mood-angry .bella-face{background:linear-gradient(155deg,#f4bdcf 0%,#e7a2ba 48%,#cf829f 100%);transform:translateY(1px)}
      .bella-identity-avatar.mood-angry .bella-brow-l{top:38%;transform:rotate(17deg)}
      .bella-identity-avatar.mood-angry .bella-brow-r{top:38%;transform:rotate(-17deg)}
      .bella-identity-avatar.mood-angry .bella-eye{top:48%;height:11%}
      .bella-identity-avatar.mood-angry .bella-mouth{top:74%;height:0;width:22%;border-bottom:0;border-top:2px solid #77384f;border-radius:50% 50% 0 0}
      .bella-identity-avatar.mood-angry .bella-blush{opacity:.24}

      .bella-identity-avatar.mood-chill .bella-mouth{width:20%;height:7%;top:70%}
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
        35%{transform:translateY(-2px) rotate(-2deg)}
        70%{transform:translateY(-2px) rotate(2deg)}
      }
      @media (prefers-reduced-motion:reduce){
        .bella-identity-avatar::before,.bella-eye,.bella-identity-avatar.laugh .bella-face{animation:none!important}
        .bella-face,.bella-eye,.bella-brow,.bella-mouth,.bella-blush{transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function makePortrait() {
    const portrait = document.createElement("span");
    portrait.className = "bella-portrait";
    portrait.setAttribute("aria-hidden", "true");
    portrait.innerHTML = `
      <span class="bella-shoulders"></span>
      <span class="bella-neck"></span>
      <span class="bella-hair-back"></span>
      <span class="bella-face">
        <span class="bella-brow bella-brow-l"></span>
        <span class="bella-brow bella-brow-r"></span>
        <span class="bella-lash bella-lash-l"></span>
        <span class="bella-lash bella-lash-r"></span>
        <span class="bella-eye bella-eye-l"><span class="bella-iris"></span></span>
        <span class="bella-eye bella-eye-r"><span class="bella-iris"></span></span>
        <span class="bella-nose"></span>
        <span class="bella-blush bella-blush-l"></span>
        <span class="bella-blush bella-blush-r"></span>
        <span class="bella-mouth"></span>
      </span>
      <span class="bella-earring bella-earring-l"></span>
      <span class="bella-earring bella-earring-r"></span>
      <span class="bella-hair-front"></span>
      <span class="bella-part"></span>
      <span class="bella-kuwait-mark"></span>
    `;
    return portrait;
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
    if (!el.classList.contains("bella-identity-avatar") || !el.querySelector(".bella-portrait")) {
      el.classList.add("bella-identity-avatar");
      el.replaceChildren(makePortrait());
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
    version: 9,
    sync,
    moodOf
  });
})();