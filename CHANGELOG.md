# Changelog

## Unreleased

## 1.1.1 — 2026-09-30

- **Fixed settings/autoclicker-state persistence:** "Remember on/off states" (and the states
  themselves, including the stock-trader autoclicker) could silently fail to survive a page
  refresh — not a CookieMgr-specific bug, but a gap in Cookie Clicker's own save timing (it only
  autosaves once every 60 real seconds and doesn't force a save on refresh/close, so a change
  made shortly before reloading could be lost for any mod). Settings are now also mirrored to
  localStorage the instant anything changes (same approach already used for history/stock data)
  and preferred over a possibly-stale game save on load.
- **Stock market amounts now shown in $ (the Bank minigame's own stock-price units)** instead of
  raw cookies, which scale with your CpS and could overflow the summary tiles. Applies to the
  transaction table's Price/Total columns, the ticker, and the Bought/Sold/Spent/Earned/Net
  summary tiles.
- **Cleaner stock graph axis numbers:** the stock chart's y-axis now uses the same "nice round
  number" tick logic as the CpS graph (shared via `CA.UI.Chart.niceLinearScale`), instead of raw
  fractions of the data's min/max.
- **Tick bars show HH:MM**, not HH:MM:SS (the detailed transaction table still shows seconds).
- Investigated a reported "Frenzy keeps stacking into absurd durations" concern: confirmed via
  the actual Cookie Clicker source that Frenzy-type buffs are defined with `add:true`, meaning
  the game itself adds a new Frenzy's duration on top of one already running — this is vanilla
  behavior (and a well-known late-game "perma-frenzy" strategy), not something CookieMgr causes;
  our code never grants buffs or double-invokes the game's own golden-cookie pop logic.

## 1.1.0 — 2026-09-30

- **Stock market tab:** the stock chart moved off the Graphs tab onto its own new **Stock market** tab, alongside a new
  autoclicker — **buy fast/slow rise, sell the rest**: each tick it buys the max it can afford of fast-rising stocks,
  then slow-rising ones, and sells anything it holds that isn't currently rising. It is deliberately kept out of "All
  on/off" and the toggle-all hotkey — it's switched on its own row on the new tab.
- **Trade ticker + transaction history:** the Stock market tab now has a scrolling ticker at the bottom showing every
  buy/sell as it happens (from the autoclicker or from clicking the Bank's own buttons — both go through the same
  code, so both show up), plus a scrollable transaction history table (time, action, stock, shares, price, total).
  Session-only for now.
- **CPS tab:** the Graphs tab is renamed **CPS**.
- **Shared chart framework:** the CPS graph, stock chart and Bank-embedded chart now share one
  core (`ui/chart.js`) for canvas sizing, dynamic axis padding, and time bucketing — less
  duplicated code, and the fix below applies to every chart at once.
- **Scrollable graphs:** the CPS and stock charts can now be dragged (or scrolled sideways) to
  look further back in time, independent of the live edge; a "Jump to live" control snaps back.
  Pausing is now just a manual way to freeze the same view a drag would.
- **Fixed bar-jitter while live or scrolling:** the CpS graph's bars are bucketed on an absolute
  time grid instead of one relative to the visible window, so live tracking (or panning) no
  longer reshuffles which raw samples land in which bar — bars only slide into/out of view, they
  don't reflow.
- **Average line:** the CpS graph now draws a dashed horizontal line at the average CpS for
  whatever period is currently shown, labelled with the value.
- **Fast golden cookie notifications:** popping a golden/wrath cookie (or a reindeer) now shows
  an immediate, short-lived notification of its own; can be turned off in Settings ("Golden
  cookie notifications"). Each pop's event now also records which buff(s) it granted (name,
  duration, multipliers) as structured data, not just the scraped popup text — for future use.
- **Stock ticker summary:** the Stock market tab's transaction history now leads with session
  stat tiles (Bought, Sold, Spent, Earned, Net), plus a row of compact bar tiles for the last 5
  one-second ticks that had a trade (bought vs. sold, and net cookies for that tick).

## 1.0.0 — 2026-09-30

- **Stock market indicators:** every stock box in the Bank minigame now shows its trend (Stable, Slow rise, Slow fall,
  Fast rise, Fast fall, Chaotic) as a coloured strip with a symbol, so you don't have to hover. The box is tinted in the
  trend's colour and glows brighter (with a star) while you hold that stock. Both parts can be switched off in Settings.
- **Portfolio value & unrealized gains:** the stock chart on the Graphs tab now defaults to your total portfolio value
  over time plus a cost-basis line, with stat tiles for Value, Unrealized gain, Realized profit and Total gain — instead
  of a wall of individual stock prices you'd have to add up yourself. "Per stock" in the toolbar switches back to the
  old price-lines view. Cost basis is tracked from when the mod loads (buys/sells raise or realize it); it can't know
  about trades made before that.
- **Graph in the Bank minigame:** a small chart now sits right under the stock list in the Bank minigame itself, toggled
  between portfolio value and per-stock prices (same "Sync to owned stocks" setting as the Graphs-tab chart, so buying
  a stock shows it in both places automatically). Can be turned off in Settings.
- **Update check:** CookieMgr now checks GitHub every 15 minutes for a newer build and, if there is one, shows a
  notification with a one-click reload. It never updates itself silently — see the note in src/core/update.js for why.
- **CpS graph is now a stacked bar chart:** each bar is Production (bottom) with Clicking stacked on top, so the total
  bar height is your combined income — replaces the old "with clicking"/"production" line toggles. The Unbuffed CpS
  line is now always on (no longer a toggle) as a dashed reference line over the bars.
  Defaults otherwise: Log scale, 5 minute window, 5 s smoothing. (Your own choices are still remembered from here on.)
- **History survives a page refresh:** the rolling 4-hour CpS/effect record is now mirrored to localStorage every 20s
  (and on page close), separate from the actual game save, so reloading the page doesn't blank the graphs. Stock price
  history and portfolio value/cost-basis history now do the same — cost basis and realized profit carry over too,
  instead of resetting to the current price on every reload.
- **Fewer redundant markers:** a golden/wrath cookie pop no longer gets its own diamond marker when the effect it
  granted is already visible as a shaded band right there — reindeer pops and effect-less pops still show one.
- **Y-axis labels:** the CpS and stock graphs now size their left margin to whatever the numbers actually render as
  (long Numbers-preference names included), instead of clipping wide labels; freed-up space went to the plot itself.

## 0.3.0 — 2026-09-30

- **Tabs** at the top of the panel: Autoclickers, Graphs, Settings.
- **CpS graph:** live, adjustable window (1 m–3 h), smoothing, log scale, unbuffed / production / with-clicking lines,
  measured click income, pause and clear.
- **Effect shading:** every active buff as a coloured, stackable band with hover details; golden / wrath / reindeer /
  ascension markers.
- History recorder (session-only, rolling 4 h) with a setting to turn it off.
- Repo: CI check, MIT license, Prettier/EditorConfig, `npm run check`, docs and screenshots.

## 0.2.0 — 2026-09-29

First version as a proper add-on (was a single-line bookmarklet). Renamed from Cookie Agent to CookieMgr.

- Loads through the official mod API; settings saved inside the game save.
- Side tab on the left beam opens the CookieMgr panel in the game's menu area.
- Autoclickers from v0.1: big cookie, golden, wrath, reindeer, fortune news, wrinklers — each with a switch and a
  rebindable hotkey (modifiers supported). Toggle-all hotkey plus All on / All off buttons.
- Settings: turn off autoclickers on ascension, toggle notifications, remember on/off states, panel hotkey.
- Stops the old v0.1 bookmarklet if it is running.

## 0.1

Bookmarklet with hotkeys A / C / G / R / W / F / K (see `legacy/`).
