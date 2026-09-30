# CookieMgr

_(Previously called Cookie Agent.)_

A [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) add-on for automating tasks and visualizing data.
It loads like [Cookie Monster](https://github.com/CookieMonsterTeam/CookieMonster): a one-line bookmarklet pulls the
latest build from GitHub Pages, so pushing to this repo updates everyone's add-on.

## Features (v1.1)

The **CookieMgr** tab sits on the left beam between the cookie panel and the middle panel. It opens the CookieMgr panel
in the game's menu area, with four tabs along the top: **Autoclickers**, **CPS**, **Stock market** and **Settings**.

![CPS tab](docs/graph.png)

### CPS

A live cookies-per-second chart, redrawn every second.

- **Window:** 1 min, 5 min, 15 min, 1 h or 3 h (default 5 min). **Smoothing:** raw, 5 s or 15 s (default 5 s). Linear or
  log scale (default log). Your choices are remembered across reloads.
- **Stacked bars:** each bar is Production (what the game shows as CpS) with Clicking stacked on top, so the bar's full
  height is your combined income. Clicking is measured from your actual click income, so it is only counted when you
  really clicked (or an autoclicker did). A dashed **Unbuffed CpS** line (production with every temporary effect
  removed) is always drawn over the bars, along with a dashed **average** line for whatever period is shown.
- **Scrollable:** drag the chart (or scroll it sideways) to look further back in time — this and the Stock market
  chart share the same underlying framework. A "Jump to live" control (also reachable via Pause) snaps back to now.
- **Effect shading:** every active golden-cookie effect (Frenzy, Click frenzy, Elder frenzy, Dragonflight, Clot, and so on)
  is a coloured band behind the chart. Overlapping effects stack in separate lanes. Hover a band for its description,
  multipliers, duration and remaining time; effects that do not change CpS are shown too.
- **Event markers:** golden cookie, wrath cookie and reindeer pops (with what they did) and ascensions. A golden/wrath
  pop that already shows as a shaded band doesn't also get a marker — only pops without a visible effect do.
- **Crosshair tooltip** with the values at that moment and the effects active then, plus Now / Average / Peak / Clicking tiles.
- Pause, clear, and per-series toggles. History (rolling 4 hours) survives a page refresh (mirrored to localStorage
  every 20s, separate from your Cookie Clicker save) and can be turned off in Settings. Stock price and portfolio
  history do the same, including cost basis and realized profit — a refresh won't reset your unrealized gain to zero.

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

The **stock market buy** autoclicker (see below) lives on its own Stock market tab and is deliberately left out of
"All on/off" and the toggle-all hotkey — it's switched independently.

### Settings

Turn everything off when ascending (default on), notifications, golden cookie notifications (a quick popup the moment
one is popped), remember autoclicker states across reloads, record history, an optional hotkey to open the panel,
reset hotkeys, checking for updates, and stock market indicators. Everything is stored in the normal Cookie Clicker
save through the official mod API (`Game.registerMod`), so it survives exports and imports.

Every golden/wrath cookie and reindeer pop is also recorded with which buff(s) it granted (name, duration,
multipliers) as structured data, not just a text summary — for future use.

### Staying up to date

CookieMgr checks GitHub every 15 minutes for a newer build and, if there is one, shows a notification with a one-click
reload — it never updates itself silently. It can't hot-swap itself in place without a page reload (see the note at
the top of `src/core/update.js` for why), so a click (or just refreshing normally) is always how an update actually
applies. Turn this off in Settings if you'd rather check manually.

### Stock market

In the Bank minigame, every stock box shows its trend (stable / slow or fast rise / slow or fast fall / chaotic) as a
coloured symbol strip and tint, brighter while you hold the stock — no more hovering each box for the tooltip. Both the
badge and the tint can be switched off separately in Settings.

A small chart also sits right under the stock list in the Bank minigame itself, toggled between portfolio value and
per-stock prices — the same "Sync to owned stocks" setting as below applies here too, so buying a stock adds it to
both views automatically. Turn the Bank graph off in Settings if you'd rather not have it there.

The **Stock market** tab in the CookieMgr panel has:

- **Buy fast/slow rise, sell the rest** — an autoclicker (own on/off switch and hotkey, not affected by "All on/off" or
  the toggle-all hotkey) that, once a second, buys the max it can afford of fast-rising stocks, then slow-rising ones,
  and sells anything it holds that isn't currently rising. That's the entire strategy.
- The stock chart, defaulting to your **portfolio value** over time (a value line plus a cost-basis line, so the gap
  between them is your unrealized gain) with stat tiles for Value, Unrealized, Realized and Total gain — switch to
  "Per stock" for the individual price lines instead. Cost basis is tracked from whenever the mod is loaded, so it
  only knows about trades made since then. Drag the chart (or scroll it sideways) to look further back; "Jump to
  live" (also reachable via Pause) snaps back to now.
- A **transaction history** table (time, buy/sell, stock, shares, price, total) of every trade this session, led by
  session stat tiles (Bought, Sold, Spent, Earned, Net); a row of compact bar tiles for the **last 5 one-second
  ticks** that had a trade (bought vs. sold, and net cookies, for each); and a **scrolling ticker** at the bottom
  showing every trade as it happens — from the autoclicker above or from clicking the Bank's own buy/sell buttons
  yourself, both show up the same way.

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
    update.js        polls GitHub for a newer build, notifies with a one-click reload
  features/
    autoclickers.js  clicker definitions and timers — add new ones to DEFS
    stocks.js        trend badges/tints, price history, and portfolio cost-basis tracking
    stockTrader.js   the "buy fast/slow rise, sell the rest" autoclicker (own tab, no DEFS entry)
    stockLog.js      wraps buyGood/sellGood to record every trade (auto or manual) for the log/ticker
    history.js       samples CpS every second, tracks buffs/events, persists to localStorage
  ui/
    components.js    HTML snippets: switch, hotkey chip, icon, button
    chart.js         shared chart core: canvas sizing, axis padding, time bucketing, scroll/live view
    tab.js           the side tab on the left beam
    graph.js         the CpS chart (canvas), toolbar, tooltips
    stockGraph.js    the Stock-market-tab chart: portfolio value/gains or per-stock prices
    stockLog.js      the trade ticker + transaction history table, also on the Stock market tab
    bankGraph.js     small portfolio/per-stock chart embedded in the Bank minigame itself
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
