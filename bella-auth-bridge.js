(() => {
  "use strict";

  const SESSION_KEY = "bella_account_session_v1";
  const upstreamFetch = window.fetch.bind(window);

  function activeToken() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      const token = String(session?.access_token || "");
      const expiresAt = Number(session?.expires_at || 0);
      if (!token) return "";
      if (expiresAt && expiresAt <= Date.now() + 30000) return "";
      return token;
    } catch {
      return "";
    }
  }

  function requestPath(input) {
    try {
      const raw = typeof input === "string" ? input : input?.url || "";
      return new URL(raw, location.href).pathname;
    } catch {
      return "";
    }
  }

  function shouldAttach(input) {
    const path = requestPath(input);
    return path === "/api/chat" || path === "/api/dira" || path === "/api/voice";
  }

  function bridgedFetch(input, init = {}) {
    if (!shouldAttach(input)) return upstreamFetch(input, init);
    const token = activeToken();
    if (!token) return upstreamFetch(input, init);
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined) || {});
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    return upstreamFetch(input, { ...init, headers });
  }

  window.fetch = bridgedFetch;
  window.BellaAuthBridge = Object.freeze({
    hasSession: () => Boolean(activeToken())
  });
})();