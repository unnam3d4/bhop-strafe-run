(() => {
  const DICT = {
    ru: {
      "boot.loading":"ЗАГРУЗКА ИГРЫ","boot.init":"ИНИЦИАЛИЗАЦИЯ","boot.progress":"ЗАГРУЗКА ПРОГРЕССА","boot.level":"ПОДГОТОВКА УРОВНЯ","boot.ready":"ГОТОВО",
      "rotate.title":"ПОВЕРНИ УСТРОЙСТВО","rotate.desc":"Для игры нужен альбомный режим",
      "hud.time":"ВРЕМЯ","hud.best":"РЕКОРД","hud.start":"СТАРТ","hud.finish":"ФИНИШ","hud.checkpoint":"ЧЕКПОИНТ {n}/{total}","hud.hint":"SPACE + A/D · держи ритм",
      "menu.eyebrow":"СКОРОСТНАЯ ТРАССА · УРОВЕНЬ 01","menu.title1":"ДЕРЖИ","menu.title2":"СКОРОСТЬ",
      "menu.lead":"Разгоняйся прыжками, управляй траекторией в воздухе и доберись до финиша быстрее своего рекорда.",
      "menu.map":"КАРТА","menu.training":"ТРЕНИРОВКА 01","menu.tutorial":"обучение","menu.record":"РЕКОРД","menu.besttime":"лучшее время","menu.runs":"ЗАБЕГИ","menu.completed":"завершено",
      "menu.play":"НАЧАТЬ ЗАБЕГ","menu.levels":"УРОВНИ","menu.settings":"НАСТРОЙКИ","menu.save.local":"Прогресс сохраняется на этом устройстве","menu.save.cloud":"Прогресс сохраняется через Яндекс Игры",
      "menu.current":"ТЕКУЩИЙ УРОВЕНЬ","menu.trainingrun":"ТРЕНИРОВКА","menu.leveldesc":"Широкая трасса для освоения bunny hop и air-strafe.",
      "menu.controls":"УПРАВЛЕНИЕ","control.move":"движение","control.jump":"прыжок / bhop","control.camera":"камера / strafe","control.restart":"рестарт",
      "menu.tip":"СОВЕТ","menu.tiptext":"Не отпускай SPACE. В воздухе мягко веди мышь в сторону нажатой A или D.",
      "settings.title":"НАСТРОЙКИ","settings.controls":"Управление","settings.sensitivity":"Чувствительность мыши","settings.sensitivityDesc":"Скорость поворота камеры",
      "settings.invert":"Инверсия Y","settings.invertDesc":"Вертикальное движение камеры","settings.sound":"Звук","settings.soundDesc":"Эффекты интерфейса и геймплея",
      "settings.language":"Язык","settings.languageDesc":"Язык интерфейса игры","settings.done":"ГОТОВО",
      "pause.title":"ПАУЗА","pause.desc":"Забег остановлен","pause.resume":"ПРОДОЛЖИТЬ","pause.restart":"НАЧАТЬ ЗАНОВО","pause.menu":"В ГЛАВНОЕ МЕНЮ",
      "death.title":"СРЫВ","death.heading":"Трасса не прощает ошибок","death.copy":"Начни забег заново или продолжи с последней контрольной точки после добровольного просмотра рекламы.",
      "death.reward":"ПРОДОЛЖИТЬ С ЧЕКПОИНТА","death.ad":"РЕКЛАМА","death.note":"Продолжение выдаётся только после успешного просмотра рекламы.",
      "finish.title":"ФИНИШ","finish.heading":"Трасса пройдена","finish.record":"НОВЫЙ РЕКОРД","finish.again":"ЕЩЁ РАЗ",
      "levels.title":"УРОВНИ","levels.subtitle":"КАРЬЕРА BHOP","levels.progress":"Открыто {open} из {total}","levels.back":"НАЗАД","levels.locked":"ЗАКРЫТО","levels.soon":"СКОРО",
      "level.tutorial":"Обучение","level.speed":"Скорость","level.strafe":"Стрейф","level.precision":"Точность","level.flow":"Поток","level.hard":"Эксперт"
    },
    en: {
      "boot.loading":"LOADING GAME","boot.init":"INITIALIZING","boot.progress":"LOADING PROGRESS","boot.level":"PREPARING LEVEL","boot.ready":"READY",
      "rotate.title":"ROTATE YOUR DEVICE","rotate.desc":"Landscape mode is required to play",
      "hud.time":"TIME","hud.best":"BEST","hud.start":"START","hud.finish":"FINISH","hud.checkpoint":"CHECKPOINT {n}/{total}","hud.hint":"SPACE + A/D · keep the rhythm",
      "menu.eyebrow":"SPEED COURSE · LEVEL 01","menu.title1":"KEEP","menu.title2":"SPEED",
      "menu.lead":"Build speed with jumps, control your trajectory in the air, and reach the finish faster than your best time.",
      "menu.map":"MAP","menu.training":"TRAINING 01","menu.tutorial":"tutorial","menu.record":"BEST","menu.besttime":"best time","menu.runs":"RUNS","menu.completed":"completed",
      "menu.play":"START RUN","menu.levels":"LEVELS","menu.settings":"SETTINGS","menu.save.local":"Progress is saved on this device","menu.save.cloud":"Progress is saved with Yandex Games",
      "menu.current":"CURRENT LEVEL","menu.trainingrun":"TRAINING","menu.leveldesc":"A wide course built to learn bunny hop and air-strafe.",
      "menu.controls":"CONTROLS","control.move":"move","control.jump":"jump / bhop","control.camera":"camera / strafe","control.restart":"restart",
      "menu.tip":"TIP","menu.tiptext":"Keep holding SPACE. In the air, gently move the mouse toward the A or D key you are pressing.",
      "settings.title":"SETTINGS","settings.controls":"Controls","settings.sensitivity":"Mouse sensitivity","settings.sensitivityDesc":"Camera turn speed",
      "settings.invert":"Invert Y","settings.invertDesc":"Vertical camera movement","settings.sound":"Sound","settings.soundDesc":"UI and gameplay effects",
      "settings.language":"Language","settings.languageDesc":"Game interface language","settings.done":"DONE",
      "pause.title":"PAUSED","pause.desc":"Run paused","pause.resume":"CONTINUE","pause.restart":"RESTART RUN","pause.menu":"MAIN MENU",
      "death.title":"FAILED","death.heading":"The course punishes mistakes","death.copy":"Restart the run or continue from your latest checkpoint after an optional rewarded ad.",
      "death.reward":"CONTINUE FROM CHECKPOINT","death.ad":"AD","death.note":"The continue is granted only after the rewarded ad is successfully watched.",
      "finish.title":"FINISH","finish.heading":"Course complete","finish.record":"NEW RECORD","finish.again":"RUN AGAIN",
      "levels.title":"LEVELS","levels.subtitle":"BHOP CAREER","levels.progress":"Unlocked {open} of {total}","levels.back":"BACK","levels.locked":"LOCKED","levels.soon":"COMING SOON",
      "level.tutorial":"Tutorial","level.speed":"Speed","level.strafe":"Strafe","level.precision":"Precision","level.flow":"Flow","level.hard":"Expert"
    }
  };

  let lang = 'en';

  function format(text, params={}) {
    return String(text).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
  }

  function t(key, params={}) {
    return format(DICT[lang]?.[key] ?? DICT.en[key] ?? key, params);
  }

  function apply(root=document) {
    root.documentElement?.setAttribute('lang', lang);
    root.querySelectorAll?.('[data-i18n]').forEach(el => {
      const value = t(el.dataset.i18n);
      if (el.dataset.i18nHtml === 'true') el.innerHTML = value;
      else el.textContent = value;
    });
    root.querySelectorAll?.('[data-i18n-title]').forEach(el => el.title = t(el.dataset.i18nTitle));
    window.dispatchEvent(new CustomEvent('bhop-language-applied', { detail:{ lang } }));
  }

  function normalize(code) {
    code = String(code || '').toLowerCase().slice(0,2);
    return code === 'ru' ? 'ru' : 'en';
  }

  function init(platformLanguage) {
    const saved = GameSettings.get().language;
    lang = saved === 'ru' || saved === 'en' ? saved : normalize(platformLanguage);
    apply();
    return lang;
  }

  function set(next, persist=true) {
    lang = normalize(next);
    if (persist) GameSettings.set({ language: lang });
    apply();
    return lang;
  }

  function get() { return lang; }

  window.I18n = { init, set, get, t, apply };
})();