# CookieMgr simulator

*v0.1.1 — versioned apart from the add-on (`sim-v*` tags; `SIM_VERSION` in `sim.mjs`).*

A Cookie Clicker simulator for trying out strategies over long timescales — written in CookieMgr's
own words, so what works here can be pasted into the add-on and run on the real game.

It isn't a re-implementation. The simulator runs **the real game** — Orteil's own `main.js` and
minigame scripts — headless in Node, and loads **CookieMgr itself** into it (the add-on's
`src/core` and `src/features`, straight from this repo). The simulator only owns three things: the
clock, the random seed, and the bookkeeping. Cookies, CpS, upgrades, golden cookies, buffs, the
garden, spells: all the game's code. Actions, values, macros, the Auto-gardener, the event log: all
CookieMgr's code.

```
npm run sim -- list                                  # strategies, scenarios, experiments
npm run sim -- run payback --span 2h --seed 3        # one game, 2 simulated hours
npm run sim -- compare payback cheapest --span 4h --seeds 5   # side by side, in parallel
npm run sim -- run payback --save mysave.txt --span 8h        # from your own game (Export save)
npm run sim -- vocab                                 # CookieMgr's actions / values / conditions
npm run sim -- experiment garden-clover-cohort       # a fast model
```

The game's scripts are downloaded the first time (from the game's CDN, into `sim/.game/`, which
git ignores — they're © Orteil, not ours to commit). The version the simulator is checked against is
pinned in `game/fetch.mjs`.

## How fast

At the game's own 30 logic frames a second, an hour of game takes about 10–20 seconds of computer
time (200–400× real time), depending on what's running. Runs are independent, so `compare` runs
them side by side in separate processes. For questions that need thousands of hours, there are fast
models (`models/`) that reduce the game's rules to what matters for one question — use them to sweep
parameters, then check the winner in the exact simulator.

Lower frame rates (`--fps`) are faster but **not faithful**: the game rolls a golden cookie's
appearance once per frame, so fewer frames mean fewer golden cookies.

## Strategies

A strategy is what CookieMgr does during a simulation:

- **`name.cmgr`** — CookieMgr's algorithmic code, run as an algorithmic macro (from the top every
  `every` ms). Paste it into an algorithmic macro in the add-on and it does the same there. Header
  comments set it up:

  ```
  # Buys whatever has the lowest payback period — and clicks, and pops golden cookies.
  # with: bigCookie, golden          ← built-in macros switched on alongside
  # every: 500                       ← a pass every 500 ms (default 1000)
  # profile: goldenClovers           ← a garden profile loaded (for the Auto-gardener)
  buy.best(all)
  ```

- **`name.mjs`** — `export default { name, desc, setup(sim) }`, for anything `sim` can do.
- a built-in macro's id (`golden`, `bigCookie`, `gardener`, `cmBuildings`…), or several joined with
  `+` (`golden+payback`).

Every `.cmgr` in `strategies/` is checked by the tests to compile with CookieMgr's own compiler.

## Scenarios

Where a simulation starts: `fresh` (a new game), a file in `scenarios/` (`export default { name,
prepare(sim) }` — e.g. `garden6`, a level-6 garden with golden clovers unlocked), or your own game:
`--save file` takes a save string from Options → Export save — and since the game's save carries
its mods' data, CookieMgr's settings, macros and gardeners come along. `--save-out file` writes where
a run ended up, to start the next one from.

## In code

```js
import { createSim } from './sim/sim.mjs';

const sim = await createSim({ seed: 1 });          // { save, mgrSave, fps, cookieMonster, record }
sim.act('click.bigCookie');                         // any CookieMgr action, by id
sim.value('building.payback', 'Grandma');           // any CookieMgr value
sim.code('for s in shimmers():\n  shimmer.pop(s)\n');        // algorithmic code, one pass
sim.macro('golden');                                // a built-in macro, on
sim.macro({ name: 'buyer', source: 'buy.best(all)\n', every: 500 });   // your own
sim.run({ hours: 2 });                              // or sim.until((s) => s.Game.cookiesPs > 1e6)
sim.stats(); sim.samples; sim.actions; sim.events(); sim.exportSave();
sim.Game; sim.CA;                                   // the game and CookieMgr themselves
```

- `sim.actions` — every action that did something: `{ t, id, params, n }` (simulated time, the
  CookieMgr action id, its parameters, how many things it did). `logAll: true` logs the ones that did
  nothing too.
- `sim.events()` — CookieMgr's own event log (golden cookies and their effects, purchases,
  achievements, garden unlocks, spells…), exactly as the add-on's Events page has it.
- `sim.samples` — `stats()` every simulated minute (`sampleEvery`).

## Staging: new words for the add-on

Some strategies need words the add-on doesn't have yet. Those live in `mgr/staging/` — CookieMgr
feature modules written in the add-on's style (a `CA.*` module with `init()`, registering actions
and values in CookieMgr's registries, headless). The simulator loads them after the add-on's own;
`vocab` marks them `[staging]`. **Promoting one** to the add-on: move the file to `src/features/`,
add it to `MODULES` in `build.mjs` and to the init list in `src/main.js`.

| Staging module | Words |
| --- | --- |
| `payback.js` | `building.buy(building, n)`, `building.sell(building, n)`, `buy.best(kind)`; values `building.price / gain / payback(building)`, `upgrade.gain / payback(upgrade)`, `best(kind)`, `clickRate()` — payback periods asked of the game itself (`Game.CalculateGains` with the change, then undone), so buying by payback works without Cookie Monster |

Cookie Monster can be loaded too (`createSim({ cookieMonster: true })`, for the add-on's Best
building / Best upgrade macros), but it recomputes everything every frame — the simulation runs at
a few times real time with it.

## Layout

```
sim/
  cli.mjs            the command line (npm run sim -- …)
  sim.mjs            createSim(): the game + CookieMgr + the clock, in one object
  runner.mjs         runOne / runMany (parallel) / reports
  strategy.mjs       loading strategies (.cmgr, .mjs, built-in ids)
  game/
    fetch.mjs        downloads the game's scripts (pinned version) into sim/.game/
    boot.mjs         the real game, headless: a vm context with a do-nothing page
    dom.mjs          the do-nothing page (and the <script> loading the game uses for minigames)
    clock.mjs        virtual time: Date, setTimeout, setInterval
    rng.mjs          the seeded Math.random
  mgr/
    host.mjs         CookieMgr (src/core + src/features) loaded into the game, the action log
    staging/         add-on modules written for the simulator first
  strategies/        .cmgr / .mjs strategies
  scenarios/         starting states
  models/            fast models (the garden), numbers taken from the game
  experiments/       questions answered with the models and the simulator
tests/sim/           the simulator's tests (part of npm test)
```

## What it found so far

- **The add-on's `shimmer.pop` over-counts.** A clicked golden cookie stays on screen while it
  fades, and the action counts every call as a pop: an hour of the Golden cookies macro logged 103
  pops for 8 golden cookies. (`if (!s || s.popped) return 0`)
- **The garden models hold up.** `experiment garden-exact` runs CookieMgr's Auto-gardener with the
  Golden clover field profile in the real game (level 6, the built-in soil rule) and compares it to
  `models/garden.mjs`: over 28 simulated hours the real game averaged **+48.9%** golden cookie
  frequency, the model **+48.4%** (planting 12.5 vs 11.7 an hour — the difference is the first 20).
  30 hours of game took 400 s.

## Not yet

- Ascension, prestige and heavenly upgrades (the game's code is there; nothing drives it yet).
- The minigames beyond the garden as strategy targets (spells, stocks and the pantheon run, and
  CookieMgr's words for them work, but no strategies or scenarios use them yet).
- A search loop — strategies with knobs, tuned automatically over many seeds.
