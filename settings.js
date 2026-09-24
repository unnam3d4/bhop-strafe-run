(() => {
  const KEY = 'bhop_settings_v1';
  const defaults = { sensitivity: 1, invertY: false };

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        sensitivity: Math.min(1.75, Math.max(0.55, Number(raw.sensitivity) || defaults.sensitivity)),
        invertY: !!raw.invertY
      };
    } catch (_) {
      return { ...defaults };
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
    window.dispatchEvent(new CustomEvent('bhop-settings-changed', { detail: { ...state } }));
  }

  function set(next) {
    state = { ...state, ...next };
    state.sensitivity = Math.min(1.75, Math.max(0.55, Number(state.sensitivity) || 1));
    state.invertY = !!state.invertY;
    save();
  }

  function get() { return { ...state }; }

  window.GameSettings = { get, set };
})();