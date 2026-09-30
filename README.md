# CookieMgr

_(Previously called Cookie Agent.)_

A [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) add-on for automating tasks and visualizing data.
It loads like [Cookie Monster](https://github.com/CookieMonsterTeam/CookieMonster): a one-line bookmarklet pulls the
latest build from GitHub Pages, so pushing to this repo updates everyone's add-on.

## Features (v0.3)

The **CookieMgr** tab sits on the left beam between the cookie panel and the middle panel. It opens the CookieMgr panel
in the game's menu area, with three tabs along the top: **Autoclickers**, **Graphs** and **Settings**.

![Graphs tab](docs/graph.png)

### Graphs

A live cookies-per-second chart, redrawn every second.

- **Window:** 1 min, 5 min, 15 min, 1 h or 3 h (default 5 min). **Smoothing:** raw, 5 s or 15 s (default 5 s). Linear or
  log scale (default log). Your choices are remembered across reloads.
- **Lines:** production (what the game shows as CpS), production without effects (dashed), and production plus clicking.
  Clicking is measured from your actual click income, so it is only counted when you really clicked (or an autoclicker did).
  By default the unbuffed and with-clicking lines show and production is hidden.
- **Effect shading:** every active golden-cookie effect (Frenzy, Click frenzy, Elder frenzy, Dragonflight, Clot, and so on)
  is a coloured band behind the chart. Overlapping effects stack in separate lanes. Hover a band for its description,
  multipliers, duration and remaining time; effects that do not change CpS are shown too.
- **Event markers:** golden cookie, wrath cookie and reindeer pops (with what they did) and ascensions.
- **Crosshair tooltip** with the values at that moment and the effects active then, plus Now / Average / Peak / Clicking tiles.
- Pause, clear, and per-series toggles. History is kept in memory for the session (rolling 4 hours) and can be turned off.

### Autoclickers

![Autoclickers tab](docs/autoclickers.png)

Each one has an on/off switch and a rebindable hotkey:

| Autoclicker    | Default key | What it does                                   |
| -------------- | ----------- | ---------------------------------------------- |
| Big cookie     | `C`         | Clicks the big cookie 20×/second               |
| Golden cookies | `G`         | Pops golden cookies (not wrath)                |
| Wrath cookies  | `W`         | Pops wrath cookies                             |
| Reindeer       | `R`         | Pops reindeer                                  |
| Fortune news   | `F`         | Clicks fortunes in the news ticker             |
| Wrinklers      | `K`         | Pops wrinklers as soon as they attach          |
| Toggle all     | `A`         | All on, or all off if everything is running   |

Plus **All on / All off** buttons. Hotkeys support modifiers (e.g. `Shift + G`): click a key chip and press the new key
(`Esc` cancels, `Backspace` clears). Binding a key that is already in use moves it.

### Settings

Turn everything off when ascending (default on), notifications, remember autoclicker states across reloads, record
history, an optional hotkey to open the panel, reset hotkeys, and stock market indicators. Everything is stored in the
normal Cookie Clicker save through the official mod API (`Game.registerMod`), so it survives exports and imports.

### Stock market

In the Bank minigame, every stock box shows its trend (stable / slow or fast rise / slow or fast fall / chaotic) as a
coloured symbol strip and tint, brighter while you hold the stock — no more hovering each box for the tooltip. Both the
badge and the tint can be switched off separately in Settings.

A small chart also sits right under the stock list in the Bank minigame itself, toggled between your CpS and your
portfolio value; turn it off in Settings if you'd rather not have it there.

The stock chart on the Graphs tab defaults to your **portfolio value** over time (a value line plus a cost-basis line,
so the gap between them is your unrealized gain) with stat tiles for Value, Unrealized, Realized and Total gain —
switch to "Per stock" for the individual price lines instead. Cost basis is tracked from whenever the mod is loaded, so
it only knows about trades made since then.

## Using it

### Bookmarklet (recommended)

Create a bookmark with this as the URL, then click it with the game open:

```text
javascript:(function(){Game.LoadMod('https://nunorgcarvalho.github.io/CookieMgr/dist/CookieMgr.js');}());
```

### Userscript

Install `CookieMgr.user.js` in Tampermonkey/Violentmonkey to load it automatically.

### Console (no hosting needed)

Open DevTools on the game page, paste the contents of `dist/CookieMgr.js` into the console, press Enter.

## Hosting

The repo is [nunorgcarvalho/CookieMgr](https://github.com/nunorgcarvalho/CookieMgr), served by GitHub Pages from `main` / `(root)`
(**Settings → Pages → Deploy from a branch**). The live build is
`https://nunorgcarvalho.github.io/CookieMgr/dist/CookieMgr.js`.

To ship an update: edit `src/`, run `npm run build`, commit (including `dist/`), push. Players get it the next time they
load the game and click the bookmarklet.

## Development

No dependencies — just Node 18+.

```sh
npm run build   # src/ -> dist/CookieMgr.js
npm run check   # fail if dist/ is out of date (CI runs this)
npm run watch   # rebuild on every change
npm run serve   # watch + serve dist/ at http://localhost:8080 for testing
```

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
    util.js          helpers: notifications, sounds, CSS injection, function wrapping
    events.js        tiny pub/sub bus ('clickers', 'settings', 'hotkeys', 'ascend', 'history')
    actions.js       registry of hotkey-able actions
    settings.js      options + hotkey bindings, save/load (JSON inside the game save)
    hotkeys.js       global keydown listener + "press a key" capture mode
    ascension.js     detects ascending (wraps Game.Ascend + watchdog)
  features/
    autoclickers.js  clicker definitions and timers — add new ones to DEFS
    stocks.js        trend badges/tints, price history, and portfolio cost-basis tracking
    history.js       samples CpS every second, tracks buffs and golden/reindeer/ascend events
  ui/
    components.js    HTML snippets: switch, hotkey chip, icon, button
    tab.js           the side tab on the left beam
    graph.js         the CpS chart (canvas), toolbar, tooltips
    stockGraph.js    the Graphs-tab stock chart: portfolio value/gains or per-stock prices
    bankGraph.js     small CpS/portfolio chart embedded in the Bank minigame itself
    menu.js          the panel and its tabs (hooks Game.ShowMenu / Game.UpdateMenu)
    styles.css       all styling, scoped to #CookieMgrTab / #CookieMgrMenu
  main.js            waits for the game, registers the mod (init/save/load)
build.mjs            concatenates src/ in order into one IIFE in dist/
legacy/              the original v0.1 bookmarklet, for reference
docs/                screenshots
.github/workflows/   CI: checks dist/ is current and parses
```

Modules are plain scripts that attach to a shared `CA` namespace (exposed as `window.CookieMgr` for debugging).
If you add a file, add it to `MODULES` in `build.mjs` in the right order.

### Adding things

- **A new autoclicker:** append an entry to `DEFS` in `src/features/autoclickers.js`. The panel row, hotkey, and save data
  come for free.
- **A new setting:** call `CA.Settings.defineOption({ key, group, name, desc, default })` in a feature's `init()`, and read
  it with `CA.Settings.get(key)`. Options in the `general` group appear on the Settings tab, `autoclickers` ones on the Autoclickers tab.
- **A new hotkey action:** `CA.Actions.register({ id, name, group, defaultKey, run })`.

CI (`.github/workflows/ci.yml`) fails a push if `dist/CookieMgr.js` does not match `src/`, so remember to build before committing.

## License

[MIT](LICENSE)
