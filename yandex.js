(() => {
  let ysdk = null;
  let player = null;
  let sdkReady = false;

  const safeLocalGet = () => {
    const n = Number(localStorage.getItem('bhop_best_ms'));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const safeLocalSet = (ms) => {
    try { localStorage.setItem('bhop_best_ms', String(ms)); } catch (_) {}
  };

  async function init() {
    if (typeof window.YaGames === 'undefined') {
      console.info('[Yandex] SDK unavailable: local mode');
      return false;
    }
    try {
      ysdk = await window.YaGames.init();
      sdkReady = true;
      try { player = await ysdk.getPlayer(); } catch (_) { player = null; }
      return true;
    } catch (err) {
      console.warn('[Yandex] init failed; continuing in local mode', err);
      return false;
    }
  }

  async function gameReady() {
    if (!sdkReady) return;
    try { await ysdk.features?.LoadingAPI?.ready(); } catch (e) { console.warn(e); }
  }

  function gameplayStart() {
    if (!sdkReady) return;
    try { ysdk.features?.GameplayAPI?.start(); } catch (_) {}
  }

  function gameplayStop() {
    if (!sdkReady) return;
    try { ysdk.features?.GameplayAPI?.stop(); } catch (_) {}
  }

  async function loadBest() {
    let best = safeLocalGet();
    if (player) {
      try {
        const data = await player.getData(['bestTimeMs']);
        const cloud = Number(data?.bestTimeMs);
        if (Number.isFinite(cloud) && cloud > 0) best = best ? Math.min(best, cloud) : cloud;
      } catch (_) {}
    }
    return best;
  }

  async function saveBest(ms) {
    safeLocalSet(ms);
    if (!player) return;
    try { await player.setData({ bestTimeMs: Math.round(ms) }, true); } catch (_) {}
  }

  async function showFullscreen() {
    if (!sdkReady || !ysdk.adv?.showFullscreenAdv) return false;
    gameplayStop();
    return new Promise((resolve) => {
      try {
        ysdk.adv.showFullscreenAdv({
          callbacks: {
            onClose: () => { gameplayStart(); resolve(true); },
            onError: () => { gameplayStart(); resolve(false); }
          }
        });
      } catch (_) { gameplayStart(); resolve(false); }
    });
  }

  window.YandexBridge = { init, gameReady, gameplayStart, gameplayStop, loadBest, saveBest, showFullscreen };
})();
