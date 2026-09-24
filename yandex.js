(() => {
  let ysdk = null;
  let player = null;
  let sdkReady = false;
  let gameplayActive = false;
  let initPromise = null;

  const LOCAL_PROGRESS = 'bhop_progress_v2';

  function getLocalProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_PROGRESS) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function setLocalProgress(patch) {
    const next = { ...getLocalProgress(), ...patch, updatedAt: Date.now() };
    try { localStorage.setItem(LOCAL_PROGRESS, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      if (typeof window.YaGames === 'undefined') {
        console.info('[Yandex] SDK unavailable: standalone mode');
        return false;
      }
      try {
        ysdk = await window.YaGames.init();
        sdkReady = true;
        try { player = await ysdk.getPlayer(); } catch (_) { player = null; }
        return true;
      } catch (err) {
        console.warn('[Yandex] init failed; standalone mode enabled', err);
        ysdk = null;
        player = null;
        sdkReady = false;
        return false;
      }
    })();
    return initPromise;
  }

  async function gameReady() {
    if (!sdkReady) return;
    try { await ysdk.features?.LoadingAPI?.ready(); } catch (e) { console.warn('[Yandex] LoadingAPI.ready failed', e); }
  }

  function gameplayStart() {
    if (!sdkReady || gameplayActive) return;
    try {
      ysdk.features?.GameplayAPI?.start();
      gameplayActive = true;
    } catch (_) {}
  }

  function gameplayStop() {
    if (!sdkReady || !gameplayActive) return;
    try { ysdk.features?.GameplayAPI?.stop(); } catch (_) {}
    gameplayActive = false;
  }

  async function loadProgress() {
    const local = getLocalProgress();
    let cloud = {};
    if (player) {
      try { cloud = await player.getData(['bestTimeMs', 'completedRuns', 'unlockedLevel']); } catch (_) {}
    }

    const localBest = Number(local.bestTimeMs);
    const cloudBest = Number(cloud.bestTimeMs);
    const valid = n => Number.isFinite(n) && n > 0;
    const bestTimeMs = valid(localBest) && valid(cloudBest)
      ? Math.min(localBest, cloudBest)
      : (valid(localBest) ? localBest : (valid(cloudBest) ? cloudBest : null));

    const merged = {
      bestTimeMs,
      completedRuns: Math.max(0, Number(local.completedRuns) || 0, Number(cloud.completedRuns) || 0),
      unlockedLevel: Math.max(1, Number(local.unlockedLevel) || 1, Number(cloud.unlockedLevel) || 1)
    };
    setLocalProgress(merged);
    return merged;
  }

  async function saveProgress(patch) {
    const next = setLocalProgress(patch);
    if (player) {
      try {
        await player.setData({
          bestTimeMs: next.bestTimeMs || 0,
          completedRuns: next.completedRuns || 0,
          unlockedLevel: next.unlockedLevel || 1
        }, true);
      } catch (e) {
        console.warn('[Yandex] cloud save failed', e);
      }
    }
    return next;
  }

  async function loadBest() {
    return (await loadProgress()).bestTimeMs;
  }

  async function saveBest(ms) {
    const current = await loadProgress();
    const bestTimeMs = current.bestTimeMs ? Math.min(current.bestTimeMs, ms) : ms;
    return saveProgress({ bestTimeMs });
  }

  async function showFullscreen() {
    if (!sdkReady || !ysdk?.adv?.showFullscreenAdv) return false;
    gameplayStop();
    return new Promise(resolve => {
      let settled = false;
      const done = value => { if (!settled) { settled = true; resolve(value); } };
      try {
        ysdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => gameplayStop(),
            onClose: wasShown => done(!!wasShown),
            onError: err => {
              console.warn('[Yandex] fullscreen ad error', err);
              done(false);
            }
          }
        });
      } catch (_) {
        done(false);
      }
    });
  }

  async function showRewarded() {
    if (!sdkReady || !ysdk?.adv?.showRewardedVideo) return false;
    gameplayStop();
    return new Promise(resolve => {
      let rewarded = false;
      let settled = false;
      const done = () => { if (!settled) { settled = true; resolve(rewarded); } };
      try {
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => gameplayStop(),
            onRewarded: () => { rewarded = true; },
            onClose: () => done(),
            onError: err => {
              console.warn('[Yandex] rewarded ad error', err);
              done();
            }
          }
        });
      } catch (_) {
        done();
      }
    });
  }

  async function showSticky() {
    if (!sdkReady || !ysdk?.adv?.showBannerAdv) return false;
    try {
      const result = await ysdk.adv.showBannerAdv();
      return !!result?.stickyAdvIsShowing;
    } catch (_) {
      return false;
    }
  }

  async function hideSticky() {
    if (!sdkReady || !ysdk?.adv?.hideBannerAdv) return false;
    try {
      const result = await ysdk.adv.hideBannerAdv();
      return !result?.stickyAdvIsShowing;
    } catch (_) {
      return false;
    }
  }

  function getPlatformLanguage() {
    if (sdkReady) return ysdk?.environment?.i18n?.lang || 'en';
    return navigator.language || navigator.userLanguage || 'en';
  }

  function isYandex() { return sdkReady; }

  window.YandexBridge = {
    init, gameReady, gameplayStart, gameplayStop,
    loadProgress, saveProgress, loadBest, saveBest,
    showFullscreen, showRewarded, showSticky, hideSticky, getPlatformLanguage, isYandex
  };
})();