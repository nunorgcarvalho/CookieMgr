# CookieMgr

_(Previously called Cookie Agent.)_

A [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) add-on for automating tasks and visualizing data.
It loads like [Cookie Monster](https://github.com/CookieMonsterTeam/CookieMonster): a one-line bookmarklet pulls the
latest build from GitHub Pages, so pushing to this repo updates everyone's add-on.

## Terminology

The same words mean the same things everywhere in the add-on and this README:

| Term       | Meaning                                                                                 |
| ---------- | --------------------------------------------------------------------------------------- |
| **Page**   | A top-level section of CookieMgr, one per icon in the sidebar (e.g. Graphs).            |
| **Tab**    | A sub-section inside a page.                                                            |
| **Action** | One thing CookieMgr can do in the game (click the big cookie, pop golden cookies, …).   |
| **Macro**  | A toggleable automation made of one or more actions. (Autoclickers today.)              |
| **Hotkey** | A key combination bound to a macro or action.                                           |
| **Event**  | Something that happened in the game (a golden cookie popped, a stock was sold, …).      |
| **State**  | A value that can be measured over time (cookies in the bank, CpS, …).                   |
| **Frame**  | One recorded sample of every state at a moment (or, for older history, a merged span).   |

## Features (v1.5)

A column of small icons sticks out of the left beam between the cookie panel and the middle panel, one per page:
**Autoclickers**, **Graphs**, **Stock market** and **Settings**. Hovering an icon slides its name out to the left.
Clicking one opens the CookieMgr panel straight to that page (switching pages directly if it's already open on a
different one); clicking the page that's already showing closes the panel.

![Graphs page](docs/graph.png)

### Graphs

The Graphs page has three tabs — **Cookies**, **Bank** and **Prestige** — of charts drawn from the recorded history
(see below), so they survive refreshes and browser restarts. Every chart works the same way:

- **Window:** 1m, 5m, 15m, 1h, 3h, 12h, 1d, 7d or All. Older history is coarser (see Recorded history), and bars simply
  get wider where it is.
- **Active time:** leaves out time the game wasn't running (tab closed, computer asleep, background throttling) — a 1h
  window then covers an hour of actual play. A faint dotted line marks each cut-out stretch (hover it for how long);
  axis labels still show the wall-clock time. One toggle for all charts, also in Settings.
- **Bars** (where it makes sense): Auto, or a fixed width from 1 s to 1 h — how coarse the derivative is.
- **Scrollable:** drag (or scroll sideways) to look back; **Pause** / **Jump to live**. Every choice is remembered.
- **Effect shading** behind the chart for every golden-cookie effect (Frenzy, Click frenzy, Elder frenzy, Dragonflight,
  Clot, …), stacked in lanes when they overlap, and **event markers** for golden/wrath cookies, reindeer, stock trades
  and ascensions. Hover anything for details.

**Cookies tab**

- **Cookies per second** — stacked bars of Production (the game's CpS) with Clicking on top, a dashed Unbuffed CpS
  line, and an average line. Below it, an **averages table**: production (raw CpS), clicking, production + clicking,
  the with ÷ without clicking ratio, unbuffed CpS and what was actually baked — now and averaged over the last 1, 5,
  15 minutes, 1 and 3 hours of active play.
- **Actual CpS** — what really got baked each second (the derivative of cookies baked), stacked by source:
  production, clicking, golden cookies & reindeer, other. A dashed line shows the CpS the game displays, for
  comparison; tiles show how far apart they are.
- **Cookies baked** — a running total, stacked by the same sources, from the start of this session (since CookieMgr
  loaded) or from the left edge of the chart.

**Bank tab** — cookies in the bank over time; **bank change per second**, with income above the line (by source,
plus stock sales and other income) and spending and wrinkler withering below it, and a net line; and the same as a
running total.

**Prestige tab** — prestige level if you ascended now against your current level, with how many cookies the next
level needs and when you'll reach it at your recent actual CpS; and **prestige gained per hour**.

### Recorded history

CookieMgr records a set of **states** every second while you play: CpS (total, unbuffed, clicking), cookies in the
bank, cookies baked (this ascension and all time), where each second's cookies came from (production, clicking,
golden cookies & reindeer, other), what left the bank (spending, wrinklers), prestige, every stock price and your
portfolio's value / cost basis / realized profit, and Grimoire magic. Alongside it, an **event log** keeps golden and
wrath cookies, reindeer, ascensions and stock trades.

- **Kept out of the game save.** All of it lives in the browser's IndexedDB, per save (two bakeries in one browser
  don't mix), never in localStorage — the game's own save lives there and the game silently ignores running out of
  room (the 1.2.2 bug). Nothing CookieMgr records can stop the game from saving.
- **Active play time only.** Time only counts while the game is actually running; a closed tab or sleeping computer
  doesn't leave hours of empty space or get lumped into one second.
- **Progressively coarser with age:** every second for the last 3 hours of active play, every 15 s up to 24 hours,
  every 2 minutes up to a week, then every 15 minutes, kept indefinitely. Older data is merged sensibly — averages for
  rates, last value for totals, sums for "cookies earned this frame" — so totals stay exact.
- **Settings → History data:** see how much is recorded, **Export** it to a file, **Import** a file (replacing this
  save's history — handy for moving browsers), or **Clear** it. Import and Clear ask for a second click.

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
reset hotkeys, checking for updates, stock market indicators, and the History data card (export / import / clear). Under **Integrations**, a **Load now** button loads
the latest [Cookie Monster](https://github.com/CookieMonsterTeam/CookieMonster) release, and a toggle loads it
automatically whenever CookieMgr starts (skipped if Cookie Monster is already running). Everything is stored in the normal Cookie Clicker
save through the official mod API (`Game.registerMod`), so it survives exports and imports. Settings are also
mirrored to localStorage the instant anything changes, since Cookie Clicker itself only autosaves once a minute and
won't force a save on a quick refresh — without the mirror, a change made right before reloading could be lost.

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

A small toolbar sits right under the Bank minigame's own header, styled like the game's buttons: **Sell all stocks**
(hover for the cookie payout), the **Autobuyer** switch (the same one as on the CookieMgr page), and a **CookieMgr**
button that opens the Stock market page. It can be turned off in Settings.

The **Stock market** tab in the CookieMgr panel has:

- **Sell all** — its own standalone card at the top of the tab: sells every stock you currently hold and turns the
  autoclicker off first, so it doesn't just buy it all straight back. Hovering it shows the actual number of cookies
  selling everything right now would pay out.
- **Buy fast/slow rise, sell the rest** — an autoclicker (own on/off switch and hotkey, not affected by "All on/off" or
  the toggle-all hotkey) that, once a second, buys the max it can afford of fast-rising stocks, then slow-rising ones,
  and sells anything it holds that isn't currently rising. That's the entire strategy.
- The stock chart, defaulting to your **portfolio value** over time (a value line plus a cost-basis line, so the gap
  between them is your unrealized gain) with stat tiles for Value, Unrealized, Realized and Total gain — switch to
  "Per stock" for the individual price lines instead. Cost basis is tracked from whenever the mod is loaded, so it
  only knows about trades made since then. Same controls as the Graphs page (window, active time, drag, pause).
- **Portfolio performance** — the portfolio's return as a percentage of the cookies invested, over a rolling window
  (1m, 5m, 15m or 1h): green bars above zero while your holdings gain, red below while they lose. Standardized by the
  money at stake, so it reads the same for a tiny and a huge portfolio. Tiles: now, best, worst, and the share of time
  spent gaining.
- A **transaction history** table (time, buy/sell, stock, shares, price, total — amounts shown in $, the Bank
  minigame's own stock-price units, not raw cookies) of every trade this session, led by session stat tiles (Bought,
  Sold, Spent, Earned, Net); a row of compact bar tiles (time shown as HH:MM) for the **last 5 one-second ticks**
  that had a trade (bought vs. sold, and net $, for each); and a **scrolling ticker** at the bottom showing every
  trade as it happens — from the autoclicker above or from clicking the Bank's own buy/sell buttons yourself, both
  show up the same way.

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
    store.js         IndexedDB storage for everything recorded, per save (never localStorage)
    states.js        registry of states: id, name, unit, kind (gauge / counter / flow), getter
    recorder.js      samples every state each second into frames; tiers, compaction, export/import
    eventLog.js      the central event log (golden cookies, trades, ascensions, …)
    hotkeys.js       global keydown listener + "press a key" capture mode
    ascension.js     detects ascending (wraps Game.Ascend + watchdog)
    update.js        polls GitHub for a newer build, notifies with a one-click reload
  features/
    autoclickers.js  clicker definitions and timers — add new ones to DEFS
    stocks.js        trend badges/tints, per-stock price states, and portfolio cost-basis tracking
    gameStates.js    the built-in states (CpS, cookies, earnings by source, prestige, portfolio, magic)
    stockTrader.js   the "buy fast/slow rise, sell the rest" autoclicker (own tab, no DEFS entry)
    stockLog.js      wraps buyGood/sellGood to log every trade (auto or manual) as an event
    history.js       buff intervals and golden-cookie pop events for the CpS graph
    cookieMonster.js loads Cookie Monster on request or at start-up
  ui/
    components.js    HTML snippets: switch, hotkey chip, icon, button
    icons.js         the inline-SVG icon set used everywhere
    pages.js         page registry — the sidebar and the panel both read it
    chart.js         shared chart core: canvas sizing, axis padding, nice scales, scroll/live view
    tab.js           the sidebar of page icons on the left beam
    plot.js          the plotting engine every chart uses: bucketing, scales, overlays, tooltips, chips
    graphs.js        the Graphs page: Cookies / Bank / Prestige tabs and their plot specs
    stockGraph.js    the Stock market page charts: portfolio value / per-stock prices, rolling performance
    stockLog.js      the trade ticker + transaction history table, also on the Stock market page
    bankToolbar.js   Sell all / autobuyer / CookieMgr buttons inside the Bank minigame
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

- **A new autoclicker:** append an entry to `DEFS` in `src/features/autoclickers.js`. The panel row, hotkey, and save data
  come for free.
- **A new setting:** call `CA.Settings.defineOption({ key, group, icon, name, desc, default })` in a feature's `init()`, and read
  it with `CA.Settings.get(key)`. Options in the `general` group appear on the Settings tab, `autoclickers` ones on the Autoclickers tab.
  `icon` is a name from `ui/icons.js`, shown at the start of the row.
- **A new chart:** `CA.UI.Plot.create({ id, title, icon, windows, coarse, log, choices, toggles, build(v), stats, tip })`
  — `build` gets the view (`v.bucketize([stateIds])` returns bars aggregated by each state's kind) and returns
  `{ series, bars, lines, hlines, intervals, markers }`. Put `p.html()` in a page and call `mount`/`tick`/`unmount`.
- **A new hotkey action:** `CA.Actions.register({ id, name, group, defaultKey, run })`.
- **A new recorded state:** `CA.States.define({ id, name, unit, group, kind, get })` before `CA.Recorder.init()`;
  `kind` is `gauge` (a level, like CpS), `counter` (a running total) or `flow` (an amount per frame, from `ctx.dt`).
  Read it back with `CA.Recorder.series(id)`.
- **A new event type:** `CA.EventLog.defineType(type, { name, icon, color, income })`, then `CA.EventLog.add({ type, title, text, cookies, data })`.
- **A new page:** `CA.UI.Pages.register({ id, label, icon, order, html, mount, unmount, tick })` from the page's own
  module. It gets a sidebar icon and a panel slot automatically; `icon` is a name from `ui/icons.js`.

CI (`.github/workflows/ci.yml`) fails a push if `dist/CookieMgr.js` does not match `src/`, so remember to build before committing.

## License

[MIT](LICENSE)
