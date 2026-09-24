# Yandex Games release checklist

## Monetization
- Enable Yandex Games monetization in Developer Console.
- Fullscreen interstitial: requested only after a non-game user action (retry/restart), never during the active real-time run.
- Rewarded video: optional "continue from checkpoint" after a fall. Reward is granted only after the SDK confirms onRewarded.
- Sticky banner: show on menu/pause/result screens, hide during active gameplay.
- If sticky banners are controlled from code, enable "Use API to show sticky banner" in the Yandex Games advertising settings.

## SDK lifecycle
- /sdk.js is included in index.html.
- LoadingAPI.ready() is called after the custom loading screen is gone and the menu is interactive.
- GameplayAPI.start() is called only when the run starts/resumes.
- GameplayAPI.stop() is called for pause, result screens, menu, focus loss and ads.

## Mobile
- Gameplay requests fullscreen from the user's Play action where supported.
- Landscape orientation is requested where supported.
- Portrait mode shows a rotate-device overlay and pauses active gameplay.

## Progress
- Guest/local progress works without requiring authorization.
- Best time and completed runs are stored locally.
- When Yandex Player data is available, progress is synchronized through Player.setData().

## Before moderation
- Test ads in Yandex draft/prod environment, not only on GitHub Pages.
- Verify mobile + desktop layouts.
- Verify return from interstitial and rewarded ads keeps the expected game state.
- Verify no ad can appear during an active short real-time run.
