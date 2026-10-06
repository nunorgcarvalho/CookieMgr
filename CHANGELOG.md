# Changelog

## Unreleased

## 2.8.1 — 2026-10-05

- **Fix: the Quick stats widget couldn't draw** ("Game.UpgradesById.filter is not a function") — the game keeps its upgrades and achievements in objects keyed by id, not arrays.

## 2.8.0 — 2026-10-02

- **Feedback when a spell needs more magic:** cast buttons stay clickable (dimmed) when you can't afford the spell;
  clicking one shakes it, plays the game's spell-fail sound and says the cost, your magic and when it'll be ready.
  Spell buttons on the left panel do the same.
- **Minigame widgets**, each in its minigame's colours, opening it on click:
  - **Garden** — plants at each growth stage (bud, sprout, bloom, mature; the game's own thresholds) and a countdown
    to the next garden tick.
  - **Stock market** — how many different stocks you hold, the last market tick's change for the stocks you held
    going into it ($ and cookies), and a countdown to the next tick.
  - **Grimoire** — magic meter and time until full.
- **Latest events widget is configurable:** ⚙ sets how many events to keep (scrollable) and which types to show;
  add as many as you like.

## 2.7.0 — 2026-10-02

- **Drops split into unboosted / CpS boost:** a drop's payout scales with CpS, so under a CpS effect part of it is the
  effect's doing (payout × (1 − unbuffed ÷ buffed CpS)); none when Lucky! hit its cap of 15% of the bank.
- **Stock equity:** what your stocks would sell for now, in cookies — a new recorded state, a new category (off by
  default; up / down), and an Equity tile on the Stock market chart. At a purchase it rises by what the bank paid
  minus the broker's cut; at a sale it falls by exactly what the bank received; in between it follows prices.
  "Stocks" is now "Stock trades".
- **Tables: one row per category,** figures side by side — "(raw / boosted)", "(−bought / +sold)", "(raw)"…; simple
  rows (In, Out, Net, the CpS multipliers, clicks per second) are shorter, without subtitles.
- **% of total** toggle on stacked bar charts (CpS, Actual CpS, Cookie bank).
- **Log scale only on line charts** — added to Prestige, stock prices and Magic; removed from the stacked bar charts.
- **Quick stats widget:** CpS + clicking, actual CpS, run started, upgrades, prestige level (and max), achievements,
  all-time baked.
- **Event log:** golden cookies that granted an effect (Frenzy, Clot…) show the CpS they added or took away. Stock
  trades in the income table are one row: −bought / +sold.

## 2.6.0 — 2026-10-02

- **The ledger:** every change to the bank is now recorded in seven categories, money in and out separately:
  building CpS, clicking, drops (Lucky!, chains, storms, reindeer… and wrath losses), stocks, buildings (purchases and
  sales), upgrades, and other (the remainder — wrinklers, lumps, spells…). Building CpS and clicking are also split
  into their unboosted part and the extra from CpS effects. "Other" is the bank change minus everything else, so the
  categories add up to exactly what the bank did, every second.
- **Building and upgrade purchases/sales are logged** as events, with exact amounts (bulk buys are one event).
- **One mega Actual CpS chart:** pick categories with chips, ▲ Gains / ▼ Losses, ✦ CpS-boosted (the effect extra on
  top of the unboosted part, in a lighter shade), window, smoothing, log scale, effect lanes now with each effect's
  icon. Its table lists each category now and over 1 min – 3 h, with totals in, out and net.
- **Cookie bank chart** below it: the same categories added up; shares every setting with Actual CpS, and with
  everything included it matches the real bank exactly.
- **Signed log scale** on charts with negative values.
- These replace the old Actual CpS, Cookies baked and the Bank tab's three charts.
- **Widgets resize** from their bottom-right corner: buttons and the status bar scale (keeping their shape), framed
  boxes take any width and height. Sizes are saved.
- **Fix: widgets jumping around after a refresh** — positions were measured in JavaScript at load and re-placed as the
  panel settled (Cookie Monster resizes it). They're now positioned with CSS percentages and simply follow the panel.
- **Sidebar order:** Events at the top; Macros just above Widgets.

## 2.5.0 — 2026-10-01

- **Raw clicking, properly:** clicks per second × what one click is worth with no effects. A click's value depends
  on effects twice (click buffs, and the mouse upgrades' share of the *buffed* CpS), so it's computed with the game's
  own click formula using unbuffed CpS and no buffs. New recorded states: clicks, clicks per second, cookies per
  click, cookies per click with no effects. The CpS table adds a clicks-per-second row.
- **Actual CpS gets the Bank framework:** ▲ Gains / ▼ Losses chips (losses off by default) — spending and wrinkler
  withering below the line with a net line — and a table under it: each source, actual, losses and net, now and over
  1 min – 3 h.
- **Fix: hidden lines still sized the y-axis** (e.g. the net line with Losses off), so hiding data didn't rescale.
  Only drawn series count now, and any setting change redraws every chart on screen.
- **Log axes ignore inactive time:** bars covering mostly time the game wasn't running don't set the floor; they're
  trimmed at the bottom.
- **Prestige ETAs follow the Prestige chart's window** (15m … All) instead of a fixed 15 minutes.
- **The panel uses the full width** of the middle section, and live tables have fixed column widths (no more
  jumping or scrollbar).

## 2.4.0 — 2026-10-01

- **Fix: settings (and running macros, widgets…) lost on refresh/upgrade.** The game only calls a mod's `load()` when
  its save already holds data for that mod — which it doesn't until its first autosave with CookieMgr (once a
  minute). In that window CookieMgr skipped its own local mirror and started from defaults, and the next change
  overwrote the mirror. The mirror is now restored either way.
- **Group macros:** a new **Group** trigger — a switch for several macros at once (on turns all members on, off turns
  them all off; it's on while they all are). Pick members from a checklist in the editor.
- **CpS table as three stages:** 1 raw production → 2 + raw clicking (click effects like Click frenzy divided back
  out) → 3 actual, plus the multipliers between them (clicking, effects & golden, total). New recorded state:
  clicking without click effects.
- **Fix: averages right after loading read low** — the first frame after a gap recorded its flows (cookies baked,
  clicking…) as zero instead of unknown. They're now left out, and rates divide by the seconds actually measured.
- **Log scale fits the data** (just under the smallest bar total to just over the largest, round ticks) instead of
  whole powers of ten, so the variation is visible.
- **Prestige target** on the Prestige tab: a 1–999 number and a magnitude; levels and cookies to go, ETA, progress
  bar, and the target line on the chart.
- **Widgets:**
  - New macro buttons line up from the bottom-right corner upwards, wrapping to the next column on the left at the
    CookieMgr sidebar.
  - The Running now bar shows a styled popup per icon instead of the browser's tooltip, and refreshes in place.
  - Button labels show name, state and hotkey.
  - Whatever you hover comes to the front, so labels are never hidden under a neighbour.
  - Starker green ring on running macros.

## 2.3.0 — 2026-10-01

- **Fix: widgets dragged over the big cookie couldn't be grabbed again** — the game's invisible cookie click
  target sits at z-index 10000, above the widget layer. Widgets now sit just above it (still below the game's
  popups, golden cookies, notes and tooltips).
- **Each ★ favourite is its own widget:** a round icon button you can move on its own — click to switch it on/off
  (glows while running) or run it, hover for its name. Starring adds it, un-starring (or ×) removes it. A v2.1
  Shortcuts widget turns into individual buttons where it was.
- **Running now widget is a status bar:** just an icon per running macro, pulsing while it works; hover for the
  details, click to open the Macros page. (The Macros page keeps the detailed view.)
- Frameless widgets drag from anywhere — a press that doesn't move is a click.
- **Charts smooth with a centered moving average** instead of widening bars: every chart's **Smooth** chooser (Off,
  5s … 1h) averages each point over the time around it, weighted by time; bars stay narrow. Defaults: CpS 5s, Actual
  CpS and bank change 15s, prestige per hour 15m. Running totals and the (already rolling) stock performance aren't
  smoothed.
- **Bank charts: ▲ Gains / ▼ Losses** chips to show either side alone (the axis rescales) or both.

## 2.2.0 — 2026-10-01

- **Wizard tower page** (new sidebar icon): the magic meter with refill rate and time to full; every spell with live
  cost, backfire chance, a **Cast** button (or when it'll be affordable, from the game's own refill formula) and a ★
  for the Shortcuts widget; **Auto-cast**; **Spell combos**; and a **Magic** chart with every cast marked.
- **Spells are macros:** a built-in "Cast …" macro per spell (button, hotkey, shortcut widget), and a new
  **Cast a spell** action for your own macros. **New combo** starts a macro that casts several spells in order.
- **Force the Hand of Fate on Click frenzy** — built-in, non-removable: while on, casts FtHoF as soon as a Click
  frenzy is running and there's enough magic (so it still casts if the magic arrives mid-frenzy).
- **Conditions can be combined:** **And…** in the macro editor adds conditions that must all hold. New conditions:
  enough magic for a spell, magic at a % of the maximum. v2.0 single-condition macros upgrade automatically.
- **Spell events** in the event log — every cast, from CookieMgr or the Grimoire's own buttons, and whether it
  backfired.
- **Grimoire toolbar** inside the minigame: the auto-cast switch and a button to the Wizard tower page (optional).
- New recorded state: maximum magic.

## 2.1.0 — 2026-10-01

- **Widgets** on the game's left panel, around the big cookie: add them on the new **Widgets** page, drag them by
  the title bar, fold (▾) or remove (×) them. Styled like the game's own framed boxes.
  - **Shortcuts** — buttons for your ★ favourite macros (switch on/off, or run), lit while running.
  - **Running now** — the macro status block, also poppable straight from the Macros page.
  - **Quick stats** — CpS, actual CpS (1 min), bank, prestige this run, time to the next level.
  - **Latest events** — the newest event-log entries.
- Show/hide all widgets and lock them in place (Widgets page). Positions scale with the window; saved with settings.
- Clicks on widgets never reach the big cookie.
- **Fix:** events logged while the event log was still loading from storage could vanish from the on-screen log
  until the next reload.

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
