# BHOP: STRAFE RUN — Retention & Monetization Design

## Core loop
Start run -> build speed -> hit checkpoints -> finish / fail -> improve time -> unlock next level -> repeat.

The game should monetize repetition without interrupting active real-time movement.

## 30-level launch structure

### 01-05 — Tutorial
Wide platforms, forgiving gaps, clear checkpoint rhythm. Goal: teach bhop without frustration.

### 06-10 — Speed
Longer chains, faster optimal routes, fewer safe landing zones.

### 11-15 — Strafe
Side offsets, curves, direction changes, stronger air-strafe mastery.

### 16-20 — Precision
Narrow landings, height changes, controlled momentum.

### 21-25 — Flow
Long uninterrupted sequences, alternate routes, risk/reward shortcuts.

### 26-30 — Expert
Technical maps combining speed, strafe and precision.

The catalog is data-driven so more worlds/levels can be appended without rebuilding the menu.

## Retention systems planned
- Three time medals per level: Bronze / Silver / Gold.
- Unlock the next level by finishing the current level.
- Personal best per level.
- Total medal count on the level screen.
- Ghost of the player's best run.
- Global leaderboards where appropriate.
- Daily/weekly challenge after the base 30-level campaign is stable.
- Additional level packs can be appended after launch.

## Advertising model

### Sticky banner
Show only on non-game screens:
- main menu;
- level selector;
- settings;
- pause;
- fail screen;
- finish screen.

Hide immediately when active gameplay starts/resumes.

### Fullscreen interstitial
Request only at natural transitions:
- "Run again" after a completed run;
- "Restart" after a failed run;
- later: "Next level" when moving to another level.

Do not show on:
- active gameplay;
- ordinary checkpoint;
- pause -> continue;
- pause -> restart (kept ad-free to reduce frustration).

Yandex Games controls the actual fullscreen ad frequency.

### Rewarded video
Primary rewarded placement:
- after a fall, voluntarily continue from the latest checkpoint.

Rules:
- the button clearly states that an ad is involved;
- the reward is granted only after onRewarded;
- the player always has a free restart option;
- no rewarded prompt during active movement.

Future rewarded placements should add optional convenience/cosmetic value, not block normal progression.

## Metrics to watch after launch
- runs per session;
- level completion rate;
- level-to-level continuation rate;
- average session length;
- rewarded opt-in rate;
- quits immediately after an ad;
- retries after a fail;
- D1/D7 retention once enough traffic exists.

Optimize ad opportunities around session depth. If an ad placement causes players to stop starting the next run, reduce friction before increasing ad frequency.
