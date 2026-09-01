(() => {
  let deferredPrompt = null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  function toast(text) {
    if (typeof showPopupCustom === 'function') return showPopupCustom(text);
    alert(text);
  }

  function showInstallButton() {
    if (standalone) return;
    const host = document.querySelector('.hero-actions');
    if (!host || document.getElementById('installBellaBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'installBellaBtn';
    btn.className = 'ghost';
    btn.textContent = 'ثبت بيلا 📲';
    btn.onclick = installBella;
    host.appendChild(btn);
  }

  async function installBella() {
    if (standalone) return toast('بيلا مثبتة عندك أصلًا 😌');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
      return;
    }
    if (isIOS) {
      toast('بالآيفون: اضغط زر المشاركة ⬆️ وبعدين Add to Home Screen / إضافة إلى الشاشة الرئيسية.');
      return;
    }
    toast('من قائمة المتصفح اختار Install app أو Add to Home Screen.');
  }

  window.installBella = installBella;

  window.addEventListener('load', () => {
    if (isIOS && !standalone) showInstallButton();
    const q = new URLSearchParams(location.search);
    if (q.get('chat') === '1') setTimeout(() => window.openChat?.(), 250);
    if (q.get('radar') === '1') setTimeout(() => { window.openChat?.(); window.openRadarPlus?.(); }, 350);
  });
})();
