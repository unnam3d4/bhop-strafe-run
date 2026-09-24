(() => {
  const KEY = 'bhop_settings_v2';
  const defaults = { sensitivity: 1, invertY: false, sound: true, language: null };

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('bhop_settings_v1') || '{}');
      return {
        sensitivity: Math.min(1.75, Math.max(0.55, Number(raw.sensitivity) || defaults.sensitivity)),
        invertY: !!raw.invertY,
        sound: raw.sound !== false,
        language: raw.language === 'ru' || raw.language === 'en' ? raw.language : null
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
    state.sound = state.sound !== false;
    state.language = state.language === 'ru' || state.language === 'en' ? state.language : null;
    save();
  }

  function get() { return { ...state }; }

  window.GameSettings = { get, set };
})();