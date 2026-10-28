# Developing cookieMgr

How the add-on is built, tested and shipped. To *use* cookieMgr, see the [README](../README.md).
## Hosting

The repo is [nunorgcarvalho/cookieMgr](https://github.com/nunorgcarvalho/cookieMgr), served by GitHub Pages from `main` / `(root)`
(**Settings → Pages → Deploy from a branch**). The live build is
`https://nunorgcarvalho.github.io/cookieMgr/dist/CookieMgr.js`.

To ship an update: edit `src/`, run `npm run build`, commit (including `dist/`), push. Players get it the next time they
load the game and click the bookmarklet.

## Building and testing

The bundle has no dependencies; the tests and the linter need `npm install` once (dev only). Node 18+.

```sh
npm run build   # src/ -> dist/CookieMgr.js
npm run check   # fail if dist/ is out of date (CI runs this)
npm test        # build, then every test suite (CI runs this too) — npm test -- garden: only those
npm run lint    # ESLint (CI runs this too)
npm run watch   # rebuild on every change
npm run serve   # watch + serve dist/ at http://localhost:8080 for testing
```

The tests boot the built bundle inside a fake Cookie Clicker (jsdom) and use it like a player would. **Contract
tests** check everything registered — every page, widget type, action, condition, value, library entry, option and
built-in macro — so a new one is covered as soon as it exists; **unit** tests cover the algorithmic language; and
each release has an **end-to-end** suite (`tests/e2e/vX.Y.Z.test.mjs`). See [tests/README.md](../tests/README.md).

With `npm run serve` running, use this dev bookmarklet to test local changes (Chrome may ask to allow access to local
network devices the first time):

```text
javascript:(function(){Game.LoadMod('http://localhost:8080/CookieMgr.js?'+Date.now());}());
```

Reload the game page between loads — the mod refuses to register twice.

### Project structure

```text
src/
  core/
    util.js          helpers: notifications, sounds, CSS injection, function wrapping, the game's minigames / upgrades
    format.js        numbers and times as cookieMgr writes them (beautify, span, clock…) — features and pages alike
    events.js        tiny pub/sub bus ('macros', 'settings', 'hotkeys', 'ascend', 'history', …)
    actions.js       registry of actions (single things cookieMgr can do in the game)
    conditions.js    registry of conditions "when" macros wait for
    settings.js      options, hotkey bindings and the save: sections features register, guarded loading, the local mirror
    store.js         IndexedDB storage for everything recorded, per save (never localStorage)
    states.js        registry of states: id, name, unit, kind (gauge / counter / flow), getter
    recorder.js      samples every state each second into frames; tiers, compaction, export/import
    eventLog.js      the central event log (golden cookies, trades, ascensions, …)
    hotkeys.js       hotkey bindables (macros, panel commands), keydown listener, capture mode
    ascension.js     detects ascending (wraps Game.Ascend + watchdog)
    update.js        polls GitHub for a newer build, notifies with a one-click reload
  features/
    gameActions.js   the game-facing actions and conditions
    macros.js        macros: built-ins, your own, running them, save/load
    stocks.js        trend badges/tints, per-stock price states, and portfolio cost-basis tracking
    gameStates.js    the built-in states (CpS, cookies, earnings by source, prestige, portfolio, magic)
    stockTrader.js   the "buy fast/slow rise, sell the rest" trading logic behind the autobuyer macro
    stockLog.js      wraps buyGood/sellGood to log every trade (auto or manual) as an event
    history.js       buff intervals and golden-cookie pop events for the CpS graph
    cookieMonster.js loads Cookie Monster on request or at start-up (optional — nothing needs it)
    gameEvents.js    logs wrinkler pops, sugar lumps and achievements as events
    grimoire.js      spells as actions/macros, magic conditions, spell events, the auto-cast macro
    gardenLayers.js  the Auto-gardener's layers (gardeners, soil rules, templates, seeds) and profiles
    garden.js        the garden's building blocks, the Current garden, the Auto-gardener macro
    pantheon.js      the Pantheon's building blocks: which spirit is where, slotting them
    gardenHistory.js snapshots of the garden (seed × stage counts) for the Growth chart; seed unlock events
    shop.js          the building store: its sort (best buy, next achievement), rounding bulk buys up
    payback.js       what buying is worth: bonus income asked of the game, payback periods and colors
    goldenMath.js    what golden cookies, spells and plants pay at their most, and the bank each needs
    wrinklers.js     what popping wrinklers gives back (the game's formula), the wrinkler bank
    prestige.js      levels if you ascended now, the next one, the rate, the CpS they'd add
    timers.js        golden cookie / reindeer odds (exact), buffs, sugar lump, autosave, magic
    collection.js    what's left to collect: upgrades, achievements, season and plant drops
    upgradeInfo.js   how the game unlocks an upgrade, the next one a building unlocks, what one would add
    whatIf.js        the CpS a Pantheon spirit or a dragon aura would bring, asked of the game
    alerts.js        alerts: flash / sound / notify actions, fortune & lump conditions, the built-in alerts, the tab
    autoBuy.js       buying macros (research, cheap upgrades), pp.best and petting the dragon
    autoBuyer.js     the Auto buyer: profiles, rules, the queue, Buy all upgrades
    seasons.js       season drops and completion, the Grandmapocalypse, SeasonCompletion's code
    script.js        the language of algorithmic macros: parsing, values, explaining conditions
    notifyTips.js    tooltips on the game's notifications about upgrades and achievements
  ui/
    components.js    HTML snippets: switch, hotkey chip, icon, button
    dom.js           DOM helpers: morph (patch in place), replay (restart an animation), armed (two-click buttons)
    upgradeTip.js    the upgrade info card shown on hover wherever an upgrade appears
    icons.js         the inline-SVG icon set used everywhere
    pages.js         page registry — the sidebar and the panel both read it; scope(): a page's mounted state
    chart.js         shared chart core: canvas sizing, axis padding, nice scales, scroll/live view
    tab.js           the sidebar of page icons on the left beam
    plot.js          the plotting engine every chart uses: bucketing, scales, overlays, tooltips, chips
    graphs.js        the Stats page: Cookies / Prestige / Golden cookies / What if / Misc tabs, the plot specs
    eventsPage.js    the Events page (the filterable event log) and the income-outside-CpS card on Stats → Cookies
    macrosPage.js    the Macros page: built-in cards with settings, the running strip, your macros, the editor
    widgets.js       widgets on the left panel (dragging, sizing, settings, saving) and the Widgets page
    widgetTypes.js   what each widget shows (macro buttons, status bar, stats, events, minigames)
    wizardPage.js    the Grimoire page and the toolbar inside the game's Grimoire
    pantheonPage.js  the Pantheon page
    codeEditor.js    the code editor (colouring, line numbers, problems, live lines) and its library
    gardenPage.js    the Garden page: the plot against the active profile, the auto-gardener: profiles, its four layers and their editors
    storeBar.js      the store toolbar (building sort, rounding to multiples)
    storeInsight.js  the store with payback colors, and a cookieMgr block under the game's tooltips
    paybackPage.js   the Payback page: every building ×1/×10/×100, upgrades, options (under the Auto buyer)
    autoBuyerCard.js the Payback page's top: the Auto buyer, its queue, the profile editor
    tooltipsPage.js  the Statistics page: the statistics catalog, the Values (and the tooltip's layout card, on Settings)
                     list; the Statistic widget
    statEditor.js    the statistic editor (on the Statistics page): fields, code, library, knobs, result, trace
    statsPage.js     the Stats page's cards: bank meters, golden cookie odds, prestige, wrinklers, what if, collection
    stockGraph.js    the Stock market page charts: portfolio value / per-stock prices, rolling performance
    stockLog.js      the trade ticker + transaction history table, also on the Stock market page
    bankToolbar.js   Sell all / autobuyer / cookieMgr buttons inside the Bank minigame
    menu.js          the panel; registers the built-in pages (hooks Game.ShowMenu / Game.UpdateMenu)
    styles.css       all styling, scoped to #CookieMgrTab / #CookieMgrMenu / #cm-bank-toolbar
  main.js            waits for the game, registers the mod (init/save/load)
build.mjs            concatenates src/ in order into one IIFE in dist/
legacy/              the original v0.1 bookmarklet, for reference
docs/                screenshots
.github/workflows/   CI: checks dist/ is current and parses
```

Modules are plain scripts that attach to a shared `CA` namespace (exposed as `window.CookieMgr` for debugging).
If you add a file, add it to `MODULES` in `build.mjs` in the right order.

### Adding things

- **A new part of the save:** `CA.Settings.registerSection(key, { serialize, load(data, whole), event })` in the feature's
  `init()` — it's saved with the game, mirrored locally whenever `event` fires, and loaded on its own (a section that
  can't be read keeps a copy and doesn't stop the others).
- **A new setting:** call `CA.Settings.defineOption({ key, group, icon, name, desc, default })` in a feature's `init()`, and read
  it with `CA.Settings.get(key)`. Options in the `general` group appear on the Settings page, `macros` ones on the Macros page too.
  `icon` is a name from `ui/icons.js`, shown at the start of the row.
- **A new chart:** `CA.UI.Plot.create({ id, title, icon, windows, coarse, log, choices, toggles, build(v), stats, tip })`
  — `build` gets the view (`v.bucketize([stateIds])` returns bars aggregated by each state's kind) and returns
  `{ series, bars, lines, hlines, intervals, markers }`. Put `p.html()` in a page and call `mount`/`tick`/`unmount`.
- **A new action:** `CA.Actions.register({ id, name, icon, group, unit, params, available, run(params) })` in
  `features/gameActions.js` — it shows up in the macro editor's step picker. `run` returns how many things it did.
- **A new condition:** `CA.Conditions.register({ id, name, params, test(params), describe(params) })`.
- **A new value** for algorithmic code (`if garden.youngShare() > 0.67:`): `CA.Script.defineValue({ id, desc, params, get(...args) })`
  — `list: true` for a list a `for` can loop over, `bool: true` for a yes / no that can stand alone as a condition.
  Actions, conditions and values all show up in the code editor's library; a select option's choices show up in its
  Lookup (`CA.Script.defineLookup({ name, uses, items() })` for other lists of names).
- **A building block** is a value or an action like those: game mechanics stay in JavaScript, verified against the
  game's own source; decisions go in code.
- **A code editor** on a page: `CA.UI.CodeEditor.html(key, source)` + `libraryHtml(key)`, then `bind(root, { onChange })`
  in `mount` (it returns the unbind for `unmount`); `setLive(root, key, { lines, html })` lights up running lines.
- **A new built-in macro:** `CA.Macros.addBuiltin({ id, name, desc, icon, mode, every, … })` from the feature's `init()`
  (or `BUILTINS` in `features/macros.js`). One with a decision is `mode: 'flow'` with `defaultSource` (its code), and
  `inputs: [{ key, label, type: 'bool' | 'number' | 'select', default, options }]` (its card's choices — variables in
  its code), `shift: { input, on, off }` (what shift-clicking its button flips), `readiness(inputs)` (its button's
  "next: …"). `pass: true` runs it from the top every pass (rules); `sourceFrom`, `ready`, `afterPass` and `editAt` let
  a feature own its code (the Auto-gardener's is the active gardener's). When it replaces JavaScript, add a
  side-by-side test: the old code and the new on random states, the same outcome (`tests/e2e/v3.0.0-builtins.test.mjs`).
- **A new recorded state:** `CA.States.define({ id, name, unit, group, kind, get })` before `CA.Recorder.init()`;
  `kind` is `gauge` (a level, like CpS), `counter` (a running total) or `flow` (an amount per frame, from `ctx.dt`).
  Read it back with `CA.Recorder.series(id)`.
- **A new event type:** `CA.EventLog.defineType(type, { name, icon, color, income })`, then `CA.EventLog.add({ type, title, text, cookies, data })`.
- **A new widget:** `CA.UI.Widgets.defineType({ id, name, icon, desc, width, single, bare, resize, bg, settings, html(instance) })`
  in `ui/widgetTypes.js` — it appears on the Widgets page; `html` is re-rendered twice a second and patched in place.
  A ☆ for it anywhere on a page: `CA.UI.C.widgetStar({ type, ...its settings }, name)` (adds or removes the widget with
  those settings; the star is full while one matches). A chart on the left panel: give its `CA.UI.Plot.create` spec
  `widget: true` (and a `widgetName`) — its card gets a ☆ for the Chart widget; its `numbers`
  (`[{ v, stat, value(), page, on }]`, named by `CA.StatInfo`) are the statistics that widget can show over it.
  `settings` (`{ key, label, type: 'number' | 'multi', … }`) appear in its settings editor and are saved on the instance.
- **A new page:** `CA.UI.Pages.register({ id, label, icon, order, html, mount, unmount, tick })` (or `parts: [a, b]` for a
  page made of components with their own mount/unmount/tick) from the page's own
  module. It gets a sidebar icon and a panel slot automatically; `icon` is a name from `ui/icons.js`. In `mount(el)`,
  set things up through `CA.UI.Pages.scope(el)` (`.on(type, fn)`, `.every(ms, fn)`, `.child(chart)`, `.add(unbind)`) and
  call its `close()` in `unmount` — the contract tests check that leaving a page leaves nothing running.
- **Layers:** `core/` and `features/` never use `CA.UI` (formatting is `CA.Format`); `core/` doesn't use features. The
  source contract test checks it, along with no `title=` tooltips, no `scrollIntoView`, and no unused CSS.

CI (`.github/workflows/ci.yml`) fails a push if `dist/CookieMgr.js` does not match `src/` or a test fails, so build and `npm test` before committing.

## Simulator

[`sim/`](../sim/README.md) is a Cookie Clicker simulator for trying strategies over long timescales: the real game's
own scripts running headless in Node, with cookieMgr's core and features loaded into it, on a virtual clock.
Strategies are written in cookieMgr's algorithmic code (`.cmgr` files you can paste into an algorithmic macro), and
everything that happens is logged with cookieMgr's action ids and its event log. `npm run sim:gui` opens
CookieSimMgr, the simulator in your browser with the add-on's own look; `npm run sim -- list` for the command line.
See [sim/README.md](../sim/README.md). It is versioned on its own (`sim-v*` tags, [sim/CHANGELOG.md](../sim/CHANGELOG.md)).
