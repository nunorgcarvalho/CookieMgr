# Simulator changelog

The simulator is versioned apart from the add-on (`SIM_VERSION` in `sim.mjs`, `sim-v*` tags). Each entry
says which add-on version it was brought in step with.

## 0.5.0 — 2026-10-27 (add-on v3.34.0)

- **CookieSimMgr's Garden page: golden cookie frequency over game time, gardener by gardener.** For a
  Farm level (8 by default: the 6×5 plot), each gardener's histogram of the time by its golden cookie
  frequency bonus (5-point bars), a line at its mean, and — hovering any of them — the share of the
  time at that bonus or more, on every chart at once (they share their scales, so they compare side by
  side). The gardeners: the Golden clover field, Golden clover combos, and nursetulips with clover
  combos (left to grow at their own pace, fertilizer for the clovers only), the same with fertilizer for
  the nursetulips too, and the nursetulips replanted together; 2, 4, 6 or 8 nursetulips, placed where
  they boost the most clovers. With nursetulips, the golden zone: how much of the time every one of
  them is fully grown, for how long at a stretch, and how much of it has every clover mature as well.
  A summary table above. `/api/garden/frequency` serves it.
- A fast model for it, `models/gardenFrequency.mjs` (the game's garden rules as `models/garden.mjs`
  has them, the built-in gardeners' policies, a time-weighted histogram), and the experiment
  `garden-frequency` that prints the same.
- **CookieSimMgr looks like Cookie Clicker**: the game's framed panels for cards, its section
  headings for page titles, its wooden beams along the top and down the menu, store tiles for the menu
  and its option buttons for chips and buttons — all with the game's own pictures.

## 0.4.0 — 2026-10-27 (add-on v3.34.0)

- **CookieMgr starts in the simulator as it does in the game.** Which modules start is read from the
  add-on's init list in `src/main.js` (all but the UI's, the update check and the Cookie Monster
  loader), instead of a copy of it in `mgr/host.mjs` that had fallen behind: **the dragon** (`dragon.*`,
  Auto dragon, aura profiles) and **the statistics' words** (`stat.*`) were missing, so SeasonCompletion's
  dragon steps did nothing here. `sim.failed` lists any module whose start threw.
- CookieSimMgr's macro lists: Auto dragon, Pet the dragon and SeasonCompletion are in them; the
  Force the Hand of Fate combo macro is listed by its id (`fthofOnClickFrenzy`; `fthof` had been gone
  since add-on v3.13.0).
- **Tests that can't run say so.** Without the game's scripts (offline, a blocked CDN) the simulator's
  tests used to print "ALL CHECKS PASSED" with 0 checks. Now they say SKIPPED and why, the test runner
  lists them as skipped, and in CI a skip is a failure. A new `tests/sim/host.test.mjs` (no game
  needed) checks the init list against `src/main.js`.
- README: what it loads, staging (empty — `payback.js` is in the add-on), what's not yet driven.

## 0.3.2 — 2026-10-16

- Measured Force the Hand of Fate's forecast mode (the experiment was removed with the forecast in add-on
  v3.13.0).

## 0.3.1 — 2026-10-16

- `run()` carries part frames; the Full-garden replanter's two modes measured (`garden-replant-modes`).

## 0.3.0 — 2026-10-16

- CookieSimMgr shows the add-on's own Graphs and Events pages.
