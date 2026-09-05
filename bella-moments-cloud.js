(() => {
  "use strict";
  const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
  const REFRESH_MS = 5 * 60 * 1000;
  let loading = false;
  let lastLoadedAt = 0;
  let snapshot = { config: null, moments: [] };

  async function json(path) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`moments cloud HTTP ${response.status}`);
    return response.json();
  }

  async function refresh(force = false) {
    if (loading) return snapshot;
    if (!force && Date.now() - lastLoadedAt < 15000) return snapshot;
    loading = true;
    try {
      const [configs, moments] = await Promise.all([
        json("bella_moments_config?select=remote_enabled,enabled_categories,rare_chance,legendary_chance,global_intensity&id=eq.1"),
        json("bella_moments?select=id,text,category,tier,source,pinned_until,created_at&order=created_at.desc&limit=200")
      ]);
      snapshot = { config: Array.isArray(configs) ? configs[0] || null : null, moments: Array.isArray(moments) ? moments : [] };
      lastLoadedAt = Date.now();
      window.BellaMoments?.setRemoteData?.(snapshot);
      window.dispatchEvent(new CustomEvent("bella:moments-cloud", { detail: { count: snapshot.moments.length, loadedAt: lastLoadedAt } }));
    } catch (error) {
      console.warn("Bella remote moments unavailable:", error?.message || error);
    } finally { loading = false; }
    return snapshot;
  }

  window.BellaMomentsCloud = Object.freeze({ refresh, snapshot: () => ({ config: snapshot.config ? { ...snapshot.config } : null, moments: snapshot.moments.map(x => ({ ...x })) }) });
  const start = () => { refresh(true); setInterval(() => refresh(false), REFRESH_MS); document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(false); }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
