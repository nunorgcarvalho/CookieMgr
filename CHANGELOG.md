# Changelog

## Unreleased

## 2.0.0 — 2026-10-01

**Macros.** Everything CookieMgr automates is now a macro: hotkey → macro(s) → action(s).

- **Actions** (`core/actions.js`, `features/gameActions.js`): single game operations — click the big cookie, pop
  golden/wrath cookies, reindeer, wrinklers (optionally sparing shiny ones), click fortunes, trade stocks, sell all
  stocks, harvest a ripe sugar lump, switch/run another macro. Each reports how many things it did.
- **Conditions** (`core/conditions.js`): an effect is active, a building special, several effects at once, something
  to pop on screen, or any recorded state above/below a value; can be negated.
- **Macros** (`features/macros.js`): repeat every N seconds, *when* a condition happens (once per occurrence or on
  every check while it holds), or *once* on demand. The six autoclickers, the stock autobuyer and Sell all stocks are
  **built-in macros** — can't be removed or edited, can be duplicated.
- **Macros page** (was Autoclickers): **Running now** status of every active macro's actions (counts, last activity,
  errors, "not available"), built-in sections, **Your macros** with a full **editor** (name, icon, trigger, condition,
  steps with options, reorder), favourite stars, duplicate/edit/delete (delete needs a second click).
- **Hotkeys bind to macros**, and one key can trigger several macros (binding a used key now shares it instead of
  moving it). Your v1 hotkeys and running states carry over.
- The stock **autobuyer** is the same macro on the Macros page, the Stock market page and the Bank toolbar.
- Your macros and favourites are saved with your settings in the game save.
- **Fix:** with "Remember on/off states", a quick refresh could come back with everything off — the local settings
  mirror was overwritten before it was read.

## 1.6.0 — 2026-10-01

- **Events page** (new sidebar icon):
  - **Income outside CpS** — live table of cookies from golden & wrath cookies, reindeer, wrinklers, sugar lumps,
    stock trades (net), golden-effect boosts and everything else: count, cookies, average, share of baked, last
    seen; for this session / 15m / 1h / 1d / all.
  - **Event log** — newest first, per-type filter chips with counts, Income only, search, CSV download, paging.
- **More events logged:** wrinkler pops (payout computed like the game: ×1.1 and its bonuses, shiny ×3), sugar lump
  harvests, achievements, and golden-cookie effects starting.
- Settings: an **Events** card (log empty wrinklers).
- Graph event markers now come in the event type's own colour.

## 1.5.0 — 2026-10-01

- **Graphs page with tabs:** **Cookies**, **Bank** and **Prestige**.
  - Cookies: the CpS chart, now with an **averages table** under it (production / raw CpS, clicking, production +
    clicking, the with ÷ without clicking ratio, unbuffed, actually baked — now and over 1m/5m/15m/1h/3h of active
    play); **Actual CpS** (what really got baked per second, stacked by source — production, clicking, golden
    cookies & reindeer, other — against the CpS the game shows); **Cookies baked** as a running total by source, from
    the start of the session or the window.
  - Bank: cookies in the bank; bank change per second (income above the line by source, spending and wrinkler
    withering below, net line); and its running total.
  - Prestige: level if you ascended now vs. current level, cookies to the next level and an ETA at your recent actual
    CpS; prestige gained per hour.
- **Active time toggle** on every chart (and in Settings): leaves out time the game wasn't running, keeping the
  chosen window's length in actual play; dotted lines mark the cut-out stretches.
- **Bar width chooser** (Auto, 1s … 1h) for the derivative charts; windows up to 7 days and All.
- **One plotting engine** (`ui/plot.js`) under every chart — bucketing by state kind, scales, effect lanes, event
  markers, tooltips, drag-to-scroll, per-chart remembered settings. The CpS and stock charts were rebuilt on it.
- **Stock market page: Portfolio performance** — rolling return as a % of the cookies invested, green above zero /
  red below, with now / best / worst / time-gaining tiles.
- **Settings:** an icon on every row and card.
- **Sidebar** now sits just below the game's cookie-count banner (measured, so it never overlaps it on tall windows).

## 1.4.0 — 2026-10-01

- **Recorded history moved out of localStorage, into IndexedDB, per save.** The game's own save lives in
  localStorage and fails silently when it runs out of room; nothing CookieMgr records can crowd it out any more.
  Legacy localStorage keys (`CookieMgr.history.v1`, `CookieMgr.stocks.v1`) are removed on load; stock cost basis is
  migrated across.
- **States + recorder:** a registry of measurable states (`core/states.js`) sampled every second into frames
  (`core/recorder.js`), counting **active play time** only. Progressive resolution: 1 s for the last 3 h of play,
  15 s to 24 h, 2 min to 7 days, 15 min beyond — merged by mean / last / sum depending on the state's kind, so
  totals stay exact. Kept indefinitely.
- **New recorded states:** cookies baked (this ascension / all time), earnings split by source (production,
  clicking, golden cookies & reindeer, other), spending, wrinkler withering, prestige (level, level if ascending now,
  gain this run, heavenly chips), portfolio value / cost / realized profit, every stock price, Grimoire magic.
- **Central event log** (`core/eventLog.js`): golden/wrath cookies, reindeer, ascensions and stock trades in one
  persisted, filterable log — the base for the upcoming Events page.
- **Settings → History data:** recorded-history summary, **Export** to a file, **Import** from one (replaces this
  save's history), and **Clear** — destructive ones need a confirming second click.
- The CpS graph and the Stock market chart now read from the recorder; the stock chart keeps its history across
  browser restarts.

## 1.3.0 — 2026-10-01

- **Sidebar of icons:** the beam tabs are now small icons; hovering one slides its page name out to the left.
- **Page registry:** pages register themselves (`CA.UI.Pages`) with an id, label, icon and lifecycle hooks; the
  sidebar and the panel both read the registry, so new pages (Events, Wizard Tower, …) slot in with one call.
  Shared inline-SVG icon set (`ui/icons.js`).
- **No more "CookieMgr" title** at the top of every page — more room for the page itself.
- **CPS → Graphs:** the page is renamed ahead of it growing more graph types.
- **Bank minigame:** the embedded portfolio/per-stock graph is gone. In its place, a small toolbar right under the
  Bank's own header with **Sell all stocks** (hover shows the cookie payout), the **Autobuyer** switch, and a
  **CookieMgr** button that opens the Stock market page — styled with the game's own bank buttons. Can be turned off.
- **Cookie Monster integration:** Settings → Integrations has a **Load now** button for the latest Cookie Monster
  release and a **Load Cookie Monster on start-up** toggle (skipped if it's already running).
- README: a terminology table (page, tab, action, macro, hotkey, event, state) used consistently from here on.

## 1.2.2 — 2026-09-30

- **Critical fix: the game's own save could silently stop landing.** CpS/effect history and —
  far more severely — every stock's price history (Cookie Clicker has 11 stock types) were being
  mirrored to localStorage in full, up to 4 hours of 1-second samples each. For a long session
  that could reach several megabytes, on top of the actual Cookie Clicker save (which also lives
  in localStorage). Browsers cap localStorage at roughly 5-10MB per origin, and the game's own
  save-write function swallows a quota-exceeded error silently (no console error, no warning) —
  so once a mod's own data crowded out the quota, the *game's* save would quietly stop updating,
  and a refresh would revert you to whenever it last actually succeeded. Fixed by only persisting
  the last 10 minutes (plenty for the "quick refresh" case this was built for) instead of the
  full in-memory buffer — verified with a test simulating the exact worst case (4 hours, 11
  stocks): the persisted data drops from an estimated several megabytes to about 250KB combined.
- **Sell all** is now its own prominent card at the top of the Stock market tab instead of a
  small button sharing a row with the autoclicker controls, and hovering it shows the actual
  number of cookies selling everything right now would pay out (computed with the Bank
  minigame's own cookiesPsRawHighest × price × shares formula, not an approximation).

## 1.2.1 — 2026-09-30

- **Removed the now-duplicate tab bar inside the panel:** the beam flaps added in 1.2.0 already
  switch pages, so the matching row of tab buttons at the top of the panel was redundant — gone,
  freeing that space for the actual page content.
- **Icons on the beam flaps:** a cookie for Autoclickers, a little bar-chart for CPS, "$" for
  Stock market, and a gear for Settings.

## 1.2.0 — 2026-09-30

- **Sell all:** a button on the Stock market tab that sells every stock you hold and turns the
  "buy fast/slow rise" autoclicker off first, so it doesn't just buy everything straight back.
- **Side tabs, one per page:** the single "CookieMgr" flap on the left beam is now a stack of
  flaps, one per page (Autoclickers / CPS / Stock market / Settings). Clicking one jumps straight
  to that page, opening the panel if it's closed; clicking the page that's already open closes
  the panel, same as before.

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
