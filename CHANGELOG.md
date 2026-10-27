# Changelog

## Unreleased

## 3.33.0 — 2026-10-27

- **The Dragon page**, in the minigames under the Grimoire: Krumblor's level, the aura in each slot and what it does,
  what the next level takes, and a **Train** button. Click a slot to switch its aura.
- **The aura picker**: every aura with the game's own icon and description, like the game's aura menu — the ones not
  trained yet dimmed with the level that trains them. It opens for a dragon slot or a profile's aura.
- **Auto dragon**, a built-in macro (with the seasons and lumps ones, and on the Dragon page): trains the dragon
  whenever you can afford its next level — buys A crumbly egg, chips and hatches the egg, trains each aura (100 of a
  building each), bakes the dragon cookie and trains the second aura slot (50 and 200 of every building). Its
  **Sacrificing buildings** setting picks which levels it may sacrifice buildings for: all, one (only the
  100-of-a-building levels) or none (cookies only).
- **Aura profiles**: named pairs of auras, one row each on the Dragon page — its name, an aura per slot, whether it's
  in use (or how many switches it needs), **Use** and **Delete**; **New profile** and **From current auras**. Using one
  puts its auras in the way the game's own switch does (each changed slot costs one of your highest buildings): with
  one slot, its first aura you've trained; with two, both, in either slot. Three come with it — **Drops** (Mind Over
  Matter + Dragon Guts), **Drops & flight** (Mind Over Matter + Dragonflight) and **Dragonflight & Harvest** (Dragonflight +
  Reaper of Fields) — and like yours they can be renamed or deleted; macros call them by id (`drops`, `dropsFlight`, `dragonFlightHarvest`),
  which a rename doesn't change. Saved with the game.
- For macros: actions `dragon.train(buildings)`, `dragon.setAura(aura, slot)`, `dragon.profile(profile)`; values
  `dragon.level()`, `dragon.aura(slot)`, `dragon.canTrain(buildings)`, `dragon.profileActive(profile)`,
  `dragon.activeProfile()`, `dragon.profiles()`. For other code: `CA.Dragon` (`apply`, `isActive`, `status`, `train`…).

## 3.32.0 — 2026-10-27

- **Garden stats, tidied.** On the Garden page the stats under the plot (Next tick, Soil, Mature, Off-layout, Grows
  next tick) now sit three to a row across the card instead of one narrow column.
- **Garden cost.** A new stat there: what planting every tile of the current layout costs at today's seed prices
  (they go up with your CpS), **green** if your bank covers it and **red** if not. Under it, smaller: what the tiles
  still missing their planned seed would cost (*all planted* when none are).

## 3.31.0 — 2026-10-27

- **Pantheon profiles.** On the Pantheon page, a **Profiles** card: named combinations of the three slots, a row
  each — its name (rename it there), a spirit (or empty) per slot, whether it's in use or how many worship swaps it
  still takes, **Use** and **Delete**; **New profile** and **From current** (what's slotted now) under them. Saved
  with the game. Two to start with, ordinary ones you can change or delete: **Wrinklers** (Skruuia, Spirit of Scorn,
  in the diamond slot, the others empty) and **Golden** (Vomitrax, Spirit of Decadence · Selebrak, Spirit of
  Festivities · Muridal, Spirit of Labor).
- Using one puts in its spirits diamond first, a swap each while swaps last (one already slotted elsewhere trades
  places, as in the Temple), then empties the slots it leaves empty (free). Without enough swaps it does what it
  can; using it again finishes it as swaps come back.
- For macros: the action **Use a Pantheon profile** — `pantheon.profile(golden)` (its id or its name) — and the
  values `pantheon.profileActive(p)`, `pantheon.profileSwaps(p)`, `pantheon.activeProfile()`, `pantheon.profiles()`.
  The two to start with keep their ids (`wrinklers`, `golden`) when renamed.

## 3.30.0 — 2026-10-27

- **Golden cookie frequency, in time.** The Stats page's golden cookie card and the Next golden cookie widget's
  numbers have a new **Frequency**: one golden cookie every so long on average with what's helping now (e.g.
  *4m 12s*; from one leaving to the next coming). It doesn't count down — it changes only when what's helping does.
  Reindeer get it too.
- The old Frequency (× vs nothing helping) is now called **Multiplier**. A widget that saved its numbers keeps its
  pick (the multiplier); tick Frequency in its settings to add the new one.
- For other code: the value word **`golden.interval`** (seconds between golden cookies on average);
  `golden.frequency` is unchanged (the multiplier).

## 3.29.0 — 2026-10-27

- **Warnings are statistics.** The bank warnings — a purchase that would take your bank below what a Lucky! (red),
  Conjure Baked Goods (orange) or a Lucky! in a Frenzy (yellow) needs — are now built-in statistics (*Lucky! bank*,
  *Conjure bank*, *Frenzy Lucky! bank*, in the Bank group) with a **`keep`** knob: how many times that bank to keep.
  Customise one like any other built-in (Reset brings it back).
- **Your own warnings**: in the editor, **Shows as: a warning**. When it has something to show about an item, the item
  gets a "!" in the store in its colour and a tag in the tooltip's ⚠ line with what it returned. Colours: any payback
  colour (red, orange, yellow, green, blue, purple, gray) or the item's own; a line can take one too.
- On the Tooltips page, **Warnings**: the switch (Settings → Store → Warnings, was Bank warnings) and the warnings in
  use, in order — the store's "!" takes the first one's colour; ↑ ↓ ✕, add one, Reset. The catalog has a **Warnings**
  filter, and a warning's button uses it or stops it. Saved in option `storeWarningList` (null: the three bank
  warnings).
- The ⚠ line's tags read "Lucky! bank −1.2M" (was "Drops bank below: Lucky! −1.2M").
- For other code: `StoreInsight.warnings(context)` → `[{ id, label, html, colour }]` (was `warnings(price)`; `banks()`
  is gone), `warningList()`, `setWarnings(list)`; `Stats.warning(s, c)`; a statistic's `warn`.

## 3.28.0 — 2026-10-27

- **The statistic editor.** On the Tooltips page, **New**, **Edit** (yours) and **Customise** (a built-in) open it in
  place of the catalog, sharing the macro editor's parts:
  - the label, what it shows, its **code name** (`stat.<name>(item)`; from the label until you give it one), what it's
    about, how it reads, its colour and its group;
  - the **code**, checked as a statistic as you type, the **library** of what a statistic can use beside it (the
    item's words first) and **knobs** for its top-level `name = 0.5` lines;
  - **what it shows** now about the best item or one you pick, as its tooltip line would, and **what it did** — each
    line it ran and what came of it; click a line number to go to it.
  - **Save** (not while the code has a problem), Cancel, **As text** (copy it to share), Delete, and **Reset** for a
    built-in you've changed (its card says "changed"). **Paste** on the page adds one copied as text.
- The library lists values **by group** (Values · This item, · Statistics, · Text…), in the macro editor too, where
  your statistics are words (`stat.priceInCps(Farm)`).
- For other code: `CA.Script.runStat(flow, env, { trace: true })` → `trace`; `CA.Stats.toText(s)`, `fromText(text)`,
  `pick(scope, item)`, `keyOf(label)`, `run(s, c, { trace })`; `CodeEditor.html(…, { mode: 'stat', item })`,
  `libraryHtml(key, { mode })`; `CodeKnobs.inner(…, { fixed })`.

## 3.27.0 — 2026-10-27

- **A Tooltips page** (next to Macros) for the store tooltip's block and its statistics:
  - **In the store tooltip**: the layout in fixed columns — the line, what it's about, **its value now**, how a value
    word reads, ↑ ↓ ✕ — and rows you can **drag** into place; add a built-in, one of your statistics or any value
    word; Reset. Live previews of a building you pick and the best upgrade, and the block's two switches.
  - **Statistics**: every statistic as a card with its live value, what it shows, its code (coloured) and how to call
    it from a macro (`stat.payback(item)`). Filter by group (Payback, Production, Achievements, Bank), Yours or On
    screen; search. Add to the tooltip (or take out) in one click; **Duplicate** a statistic to make it yours (the
    editor comes next); delete yours; ☆ puts one on the left panel as a widget.
  - **Values**: every word a statistic can read, with its signature, what it is and its value now.
- **Statistic widget**: one statistic, live, about the best building / upgrade / buy or an item you pick, on the
  Add a widget picker's **Data** shelf (Your game, renamed). Add as many as you like.
- The Payback page's Store tooltips card keeps its two switches and links to the new page.
- For other code: `CA.Stats.duplicate(id)`, `bestOf(scope)`, `about(context, fn)`, `GROUPS`; a statistic has a
  `group`. A widget type can name each widget itself (`nameOf(inst)`).

## 3.26.0 — 2026-10-27

- **See-through widgets, easier to read.** With a widget's Background on Faint or None, its muted text — the Next
  golden cookie's “next in”, “median”, “frequency” labels, the Quick stats names, notes, “Nothing has happened yet”,
  and chart axes (the golden cookie charts' and the Chart widget's) — is brighter and gets the same dark outline as
  the rest of the text, so it stands out over the game. Solid widgets look as before.
## 3.25.0 — 2026-10-27

- **Add a widget: tiles and widgets light up together.** Hover a tile in the picker and every widget of that kind
  glows on the left panel (hover a widget there and its tile lights up), the way the map and chips of Your widgets
  already do.
- **A placed tile removes.** Once a kind is placed, hovering its tile offers **Remove** instead of Add (a one-only
  widget goes; a kind that takes several loses the newest), and a small **+ Add** button under the tile places
  another.
## 3.24.0 — 2026-10-27

- **☆ stars put a ready-made widget on the left panel**, as a macro's ★ gives it a button: one click adds it (and
  shows widgets if they were hidden), the star fills, a second click takes it away. They're on the Garden page's
  **Growth** and **Effects** charts and on the Stats page's golden cookie frequency row. Any page can add one
  (`CA.UI.C.widgetStar`).
- **Chart**, a new widget: a CookieMgr chart, live on the left panel — the Garden's Growth (plants by seed and stage)
  or its Effects. It follows the page chart's window, X axis and choices, resizes freely (the chart fills the box),
  and hovers like the original. Charts opt in with `widget: true` on their spec.
- **Golden cookie frequency**, a new widget: how many times more often golden cookies come than with nothing helping
  (×4 with Lucky day and Serendipity), one every how long on average, and a bar for each thing helping. Click it for
  the Stats page.
- The Stats page's golden cookie frequency row always shows now ("none yet" when nothing helps), with its ☆.



## 3.23.0 — 2026-10-27

- **Statistics.** The lines under the store's tooltips are now **statistics**: a few lines of algorithmic code — the
  macro language — that only read the game and end with `return`. In a tooltip, `item` is the building or upgrade
  hovered, and new `item.*` words read it: `item.price()`, `item.gain()`, `item.payback()`, `item.colour()`,
  `item.bulk()`, `item.owned()`, `item.wins()`, `item.share()`, `item.clickGain()`, `item.paybackOf(n)`,
  `item.colourOf(n)`, `item.kind()`. The ten built-in lines are rewritten this way and show exactly what they showed
  before. A statistic can set `label`, `note` (small print after the value) and `colour` (a payback colour, or one per
  item of a list), and shows nothing when it doesn't return. It can't act, wait or loop without end, and it stops
  after 5,000 steps.
- **Every statistic is a value word**, `stat.<name>(item)`, so macros and other statistics can use it:
  `wait until stat.payback(Farm) < 600`.
- The language: **lists** (`[a, b, c]`) anywhere a value goes; **text words** `fmt.number(x)`, `fmt.short(x)`,
  `fmt.time(s)`, `fmt.pct(x, d)`, `fmt.fixed(x, d)`; `finite(x)` and `known(x)` (yes / no);
  `paybackActualRatio(seconds)`. `return` is a statistic's keyword.
- Your own statistics (and your changes to the built-ins) are saved in a new part of the save, `stats`, and a tooltip
  line can be one of them (`{ stat: id }`). Writing and browsing them gets its own page next.
## 3.22.0 — 2026-10-27

- **Add a widget, redrawn.** The picker on the Widgets page is now four shelves — Golden cookies, Minigames, Macros,
  Your game — of tiles wearing the game's own icons: a round dial (a dark disc with a ring in its colour) for the
  widgets that sit round on the panel, a store-framed crate for the framed ones. Click a tile to place it, like buying
  an upgrade (a small **+ Add** pill appears on hover; on a widget that's already placed it says **Remove** and removes
  it, **Open** on Macro buttons goes to the Macros page); a green corner badge shows ✓ or ×N once it's placed. Hover for
  the full description. For other code: `defineType` takes `group`, `sprite` (`[col, row]` of icons.png, or
  `{ sheet, pos }`), `short` and `ring`, and `CA.UI.Widgets.defineGroup({ id, name, sprite, order })` adds a shelf;
  types with an unknown group land in a trailing "More".
## 3.19.1 — 2026-10-27

- **The next golden cookie chart keeps effects that ended.** An effect that ran since the last golden cookie left
  keeps its bar after it ends, dimmed and marked “ended”, on the same axis, with the multiplier it had — so a
  cycle's Frenzy, Click frenzy and the rest stay visible until the next golden cookie resets the axis. (CookieMgr
  remembers the effects it saw for an hour: `CA.Timers.effectsSince(secs)`; ones that ran while it wasn't loaded
  can't show.)
- **The expected moment, on the chart**: a dashed green line at now + the expected wait, labelled with how long
  until it, and the yellow now line labelled with the time since the last golden cookie — on the Stats page and the
  Next golden cookie widget.
- **Golden cookie frequency**: how many times more often golden cookies come than with nothing helping — every
  factor the game's spawn timer uses (Lucky day, Serendipity, Golden goose egg, Heavenly luck, Green yeast
  digestives, the Arcane aura, Sugar blessing, the season's star upgrade, garden plants, Muridal, Mokalsium,
  Selebrak…) multiplied together. A tile on the Stats page, in the Next golden cookie widget's numbers, and the
  word `golden.frequency`. (The game fixes a cycle's timing when the last cookie leaves, so it counts from the next.)
  The frequency effects' chips read the same way now: Lucky day ×2 (twice as often), not ×0.5 (the time between).
- **Dashed lines across at both moments**: instead of a fixed 50%, a green one where the expected line meets the
  curve (its percentage at the right edge, under the line) and a yellow one at the curve's height now (its
  percentage at the left edge, over the line).
- **Next golden cookie widget: pick its numbers.** Its settings list each number (next in, median, chance within a
  minute, window, frequency) to switch on or off; all on by default, saved with the widget.
- The chart's labels (the percentages, the times, “expected”) are drawn over its lines, curve and bars, with a dark
  outline.
## 3.19.0 — 2026-10-27

- **The Golden cookies widget is gone** — the small ring that filled towards the latest the next golden cookie could
  come. The **Next golden cookie** widget (the chart, the expected wait, the median, the chance within a minute and
  the effects running) and the **Golden timeline** do everything it did. A saved layout that still has it loads
  without it; everything else on the panel stays where it was. The Golden cookies *macro* (which pops them) stays.

## 3.18.0 — 2026-10-27

- **Bank warnings, compact.** The warnings that a purchase would take your bank below what a Lucky!, Conjure Baked
  Goods or a Lucky! in a Frenzy needs to pay its most were up to three long sentences under the store's tooltips.
  Now anything whose purchase would do it gets a small coloured **!** in the corner of its store button, in the
  colour of the smallest bank it breaks: red for Lucky!, orange for Conjure, yellow for Frenzy Lucky!. Its tooltip
  says which in one line of tags, each with how far under you'd be (`⚠ Drops bank below  Lucky! −456 M  Conjure
  −1.2 B`). Banks you're already under don't warn. Still the **Bank warnings** option (Settings → Store, the Payback
  page), off by default; `warnings(price)` returns the banks as data (id, name, colour, need, short).

## 3.17.0 — 2026-10-27

- **Numbers start on Cookie Monster's own default, the short scale**: 1.23 M, 4.56 B, 7.8 Tr, 1.5 Quadr… 2.3 Dec,
  4.56 Septendec, 7.89 Octodec, up to Quattuorvigint (1e75; scientific past it, as Cookie Monster), instead of the
  abbreviated 7.89 ODe. Saves from before this version, which all kept the old default, move over to it; one on
  another notation keeps it, and the abbreviated scale is still in Settings → General → Numbers.

## 3.16.0 — 2026-10-27

- **Miscellaneous**, a new card on the Settings page, now holds **Plain Business Day** (it was under General):
  Business day without its corporate theme — the normal building names, descriptions and icons, golden cookies,
  background, news and tab title — while the season and its effects stay.
- Plain Business Day goes further: switching it re-skins the golden cookies already on screen (they used to keep
  their spam look until they faded), and the Stats menu leaves out its business lines (cookie dollars, TV show
  seasons produced).

## 3.15.0 — 2026-10-27

- **Effect timers, redrawn.** One slim bar per effect running, in the effect's own colour (Frenzy amber, Click frenzy
  blue, Dragonflight purple, Dragon Harvest orange, building specials green, Elder frenzy red…) with the game's own
  icon, draining as it runs out. On the bar: its name, what it multiplies (×7 CpS, ×777 clicks) and the time left
  (2:21, 37s); beside it, if you tick it in its settings, the chance a golden cookie comes before it ends. Bad effects (Clot, Cursed finger,
  a building's debuff…) are striped, and the time turns pink in its last 5 seconds. Every row is one line of text
  tall, so a stack of eight effects is shorter than the old widget with four. Its settings pick what to show (icon,
  multiplier, golden cookie chance — off by default), what a full bar is (the effect's own length, or a fresh
  Frenzy's with your upgrades for every bar, so the bars compare; an effect with more left than that fills its bar
  and gets a white outline, its timer still the real time left) and the order (as they started, or ending soonest first). It's its own widget now
  (`ui/effectTimers.js`); the Golden timeline keeps its chart-axis bars.
- **See-through widgets.** Every framed widget's Look settings have a **Background**: Solid (as before), Faint (40%)
  or None. See-through boxes keep their text outlined in black so it reads over the game, and the box fades in, its
  title bar floating just above it, while you hover. Effect timers starts see-through. A widget type can start
  see-through too (`defineType({ bg: 0 })`).
- The golden cookie chart's effect bars (Stats page, Next golden cookie widget) take the same colours.
- `CA.Timers.buffs()` gives each effect's buff `type` and `icon` too.

## 3.14.0 — 2026-10-27

- **The next golden cookie, as this cycle's odds.** The Stats page's chart is now the time since the last golden
  cookie left, from 0 to the latest the next can come, against the chance one has come by then (the game's own
  odds, with your upgrades): a dashed line at 50%, and a line sweeping across it as time passes, labelled with
  how far along the odds it is. The numbers above it: the expected wait (from now), **Odds so far** (0% → 100%)
  and the wrath chance. The **Next golden cookie** widget draws the same chart; the Golden timeline keeps its
  wait-from-now.
- **Golden cookie effects under it, on the same axis**: a bar per effect running, from when it started to when it
  ends (stacking as new ones come), labelled with **what it multiplies your income by** — a click effect counted at
  your click rate (yours or an autoclicker's, the last ten seconds): Click frenzy at 10 clicks/s might be ×130, at
  none ×1. No more "golden cookie before it ends" on them. The word `buff.effectiveMult(effect)` gives the same.
- The card is simpler: no more density bars, bands, percentiles, within-N chips, legend or cycle notes.
  "Making them come sooner" is now **Golden cookie frequency effects** (click one for the wait without it, as before).

## 3.13.0 — 2026-10-27

- **Removed: the Force the Hand of Fate forecast.** CookieMgr no longer reads your save's seed to say what a spell cast
  will give: knowing the dice before they roll isn't the game. It works with odds, expected values and what has
  happened. Gone: the next casts under Force the Hand of Fate's and Gambler's Fever Dream's tooltips, the
  *Force the Hand of Fate, the next casts* part of the Golden timeline widget (a widget saved with it shows the rest),
  the words `fthof.next`, `fthof.nextIs`, `fthof.after` and `fthof.castsUntil`, and the combo macro's **Forecast** and
  **Skip ahead** choices — **Force the Hand of Fate on combos** casts on every combo again. A copy of a macro you
  edited to use those words will show a compile error on its card. The simulator's `fthof-forecast` experiment is gone too.
- **Pet the dragon learns the drop order by petting.** Which drop a pet can give depends on the quarter of the hour,
  in an order the game shuffles from your save's seed; CookieMgr used to work that order out from the seed. Now it
  pets in any quarter it hasn't tried (or whose drop you're still missing) and remembers what dropped there —
  200 pets with nothing means that quarter's drop is one you have. Learned anew each run. `dragon.dropNow()` gives
  `"?"` for a quarter not tried yet.
- Kept, as they're odds and not predictions: `fthof.backfireChance()`, and a new `spell.failChance(spell)` for any spell.

## 3.12.5 — 2026-10-16

- **Force the Hand of Fate on combos says when combos can’t happen.** Every combo needs a second golden cookie
  before the first one’s Frenzy (or building special) ends; when the soonest the next one can come is later than
  that — with Lucky day alone, 2m 30s against a 77 s Frenzy — its card says so, and names which of Lucky day,
  Serendipity and Get lucky you don’t have yet. (From CA.Timers: the next golden cookie’s soonest, and
  effectDuration.)
- Macros: a built-in can give its card a hint (hint(inputs) → text, shown under its status, on or off).

## 3.12.4 — 2026-10-16

- **How long a golden cookie's effect lasts, with your upgrades**: `golden.effectDuration(effect)` — Frenzy, a building
  special, Click frenzy, Dragonflight, Dragon Harvest, Everything must go, Cookie storm, and the wrath ones (Clot,
  Cursed finger, Elder frenzy), as the game times them: Get lucky, Lasting fortune, the Lucky upgrades, Green yeast
  digestives, Epoch Manipulator and Vomitrax counted. Checked against the effects the game grants.

## 3.12.3 — 2026-10-16

- **Fix: Force the Hand of Fate on combos stalled for good in Forecast mode.** The forecast only moves when something
  is cast, so once the next cast was bad and no good one was within Skip ahead's reach, it never cast again. Now, while
  the next cast isn't good, it keeps skipping with Haggler's Charm (spare magic only — never below what Force the Hand
  of Fate costs), however far the good one is, even past the forecast's 100-cast reach. **Skip ahead** is now a cap:
  0 — no limit, the default (it used to mean never); a number stops at that many casts, and can stall.
- The simulator's experiment (`sim/experiments/fthof-forecast.mjs`; the real game, 24 h × 4 seeds, paired, no buying):
  with no limit, Forecast mode baked +79.0% ± 29.5% more than Forecast off with 90 magic (21.5 casts and 80.5 skips a
  day, every seed ahead), +917% ± 535% with 299 magic (skewed by rare stacked combos); limits of 1–10 casts stalled.
  Forecast stays off by default.

## 3.12.2 — 2026-10-16

- **Force the Hand of Fate's forecast is much cheaper to ask.** What the next casts give is worked out once for the
  state it depends on (the save's seed and spells cast, the backfire chance, the season's cookie picture, Dragonflight,
  10+ buildings) and kept; `fthof.castsUntil` looks only as far ahead as it needs, and the words skip what Gambler's
  Fever Dream would do (the tooltips and widgets still show it). Each cast is worked out from one seeding instead of
  three. A macro asking every tick (Force the Hand of Fate on combos, skip ahead) went from about 500 seedings an ask to
  none once known — a simulated hour 13× faster. Same answers.

## 3.12.1 — 2026-10-16

- **Force the Hand of Fate on combos reads the forecast.** Two new choices on its card: **Forecast** — off (as before,
  the default) or only when the next cast gives a click frenzy or a building special (or a frenzy, for a combo without
  one); **Skip ahead** — when the next cast is bad and a good one is at most that many casts away, Haggler's Charm
  (the cheapest spell) moves the forecast on, with spare magic only (never below what Force the Hand of Fate costs).
  In the simulator — the real game, 24 Frenzy + Dragonflight combos — Forecast off cast 24 times, 1 of them good;
  Forecast on cast once, on that good one. Built on v3.12.0's forecast (fthof.*).

## 3.12.0 — 2026-10-16

- **Force the Hand of Fate, forecast.** The game rolls each spell cast from your save's seed and how many spells you've
  cast, so CookieMgr replays its draws: the spell's tooltip lists what the next eight casts give (and what each would be
  as a backfire), Gambler's Fever Dream's what it would cast. Any cast moves the list on — cast something cheap to skip
  a bad one. Checked against 180 real casts (seasons, Dragonflight, buildings, backfires, other spells in between).
  Words `fthof.next()`, `fthof.nextIs(outcome)`, `fthof.after(n)`, `fthof.castsUntil(outcome)`,
  `fthof.backfireChance()` — for macros.
- **Golden cookie widgets**: **Golden timeline** — the next golden cookie's odds, its window, every effect running with
  its time left and the chance a golden cookie comes before it ends, and the next Force the Hand of Fate casts, on one
  time axis; **Next golden cookie** (the countdown and its chart) and **Effect timers** (the bars). Each picks its parts
  in its settings; the numbers are the Stats page's.

## 3.11.2 — 2026-10-16

- **Fix: working out the garden's mutation odds changed the live garden.** It ran the game's own boost calculation
  (what plants like Nursetulip do to their neighbours) on the garden itself, every second — so a plant that matured
  or died since the last tick changed its neighbours' effects at once instead of at the next tick, and a game with
  CookieMgr played differently from one without. The boosts are now worked out on a grid of CookieMgr's own (the
  game's put back, even on an error); the odds are unchanged.

## 3.11.1 — 2026-10-16

- **Mutation odds on the Garden page's own plot.** Each empty tile that can grow something at the next tick shows the
  chance (gold when a seed you haven't unlocked could), its details list each plant with its chance (a new seed
  marked), and the Garden card adds *Grows next tick* — how many plants spring up on average and the chance one is
  a new seed. The odds come from the same engine as the game garden's (v3.11.0), and its two options switch them here
  too. They're worked out again only when the plot, the soil or the tick changes.

## 3.11.0 — 2026-10-16

- **Garden mutation odds**, in the game's own garden: under an empty tile's tooltip what it can grow at the next tick and
  how likely (new seeds starred), under a seed's the chance it grows somewhere and how long that takes, and a chip on
  each empty tile. Exact, from the game's own rules — its recipes (M.getMuts), soil, repellent, wood chips' extra tries,
  the plants the tick ages first — and checked against thousands of the game's own ticks. Words
  `garden.mutationChance(x, y)`, `garden.growChance(seed)`, `garden.growIn(seed)`.
- **Minigame tooltips**: a spell's wait for magic and how long the magic takes to come back after casting, Conjure
  Baked Goods' payout and Spontaneous Edifice's building; a stock's resting value, trend, holding and worth; a spirit's
  CpS in each Pantheon slot. Words `spell.cost / waitFor / recover(spell)`, `stock.restingRatio(good)`.
- **Legacy tooltip**: the next prestige level's wait, levels an hour, the CpS ascending would add, heavenly chips after,
  the levels to the Lucky upgrades. Word `prestige.nextIn()`.
- Tests: the add-on's mutation recipe list is checked against the game's M.getMuts.

## 3.10.1 — 2026-10-16

- **The Full-garden replanter replants at the tick by default** (`replantAtTick = true`): a new round goes on
  fertilizer first, the old plants keep working, and everything is replanted in the last seconds before the tick.
  The simulator's sweep — the real game, a level-6 golden clover field, 24 h × 4 seeds, the first hour left out —
  has it ahead on every seed: golden cookie frequency +56.0% ± 0.3 against +54.8% ± 0.5 planting at once (+1.19 ±
  0.29 points), +60% or more 69.4% of the time against 68.3%. An empty plot, or a round fertilizer can't come for, is
  still planted at once. A copy you edited keeps its own setting.

## 3.10.0 — 2026-10-16

- **The store's tooltips, your way.** A **Store tooltips** card on the Payback page chooses which lines CookieMgr's
  block under the store's tooltips shows, in what order: the built-in lines (now also the price, and a building's
  payback at ×1 / ×10 / ×100) and any value word of the building, the upgrade or the game — renamed, read as a number,
  a time or a chance — with a live preview. Reset goes back to Cookie Monster's layout (the default).
- **Bank warnings are off by default** (Cookie Monster's layout, without them); switch them on in Settings → Store or
  on the card.

## 3.9.1 — 2026-10-16

- **Fix: the Full-garden replanter left an empty plot unplanted** until the next tick (up to a 15-minute clay tick,
  longer while the soil couldn't change). An empty plot — the first round, or every plant dead — is planted at once.
- **When a new round is planted is a knob, `replantAtTick`:** off (the new default) — the plants still alive
  harvested and the whole layout planted at once, on fertilizer; on (what v3.4.2 did) — fertilizer first, the old
  plants kept working until the last `plantWindow` seconds before the tick, then everything replanted. Even then it
  plants at once when there's nothing to keep working, or no quick tick to wait for (fertilizer on its cooldown).
- **Numbers: Cookie Monster's own suffixes and spacing** — copied from its source: …No, De, UDe, DDe… SpDe, ODe, NDe,
  Vi… up to UCt (1e306), with a space before the name (1.23 M). Compact numbers on chart axes stay unspaced (1.23K).
- Tests: the runner runs half the cores' worth of files at once (at most 6; `--jobs=N` or `TEST_JOBS`); v2.23.0,
  v2.5.0, v2.16.0, v2.24.0 and v3.3.1 wait for what they wait on instead of fixed times.

## 3.9.0 — 2026-10-16

- **The next golden cookie, as statistics** (Stats page): the wait's whole distribution, exact from the game's own
  rule and checked against it — expected, median, most likely, the chance within a minute and this second, the wrath
  chance; a chart of the odds over time (density, cumulative chance, 25–75% and 10–90% bands, mean and median; hover
  for any moment), percentiles, the chance within 10 s / 30 s / 1 min / 5 min, this cycle's bounds; what makes them
  come sooner as chips, each a what-if. The Golden cookies widget's popup gains a sparkline and the median.
- **Timer bars on the chart's axis**: the next golden cookie's window, and each effect running with the time it has
  left and **the chance a golden cookie comes before it ends** — on the bar, in the widget's popup, and as
  `buff.goldenChance(effect)`.
- **Minimum bulk** (Settings → Store, the store toolbar, the Payback page): Best building, `buy.best`, `best` and the
  Payback page's best buy buy ×1, ×10 or ×100 at a time — up to the next multiple with Round to multiples on; the Best
  buy store sort ranks at least that many. Auto (the default) is what it was: ×10 with Round to multiples, else ×1.
- **Payback by actual income**: a chip on the Payback page shows payback periods by what you've really been taking in
  (the Recorder's baked cookies — clicking, golden cookies, wrinklers) instead of CpS: PP × CpS ÷ your actual income
  over a stretch of play as long as the period (at least 5 minutes). Also a line in the store's tooltips, and
  `paybackActual(seconds)`, `actualIncome(seconds)`.
- **Switches are out of payback**: Elder Pledge, the Golden switch, season biscuits and the other switches have no
  payback period — never the best buy, never bought by the buyers, no tooltip block; the Payback page shows them only
  with its filter chip, greyed. `upgrade.gain / payback` are NaN for them.
- **Upgrades: best first** (Settings → Store): the store lists its upgrades by payback colour, then payback period,
  switches last.
- Settings: page option cards show options with choices as dropdowns too.
- In CI, the parity tests against Cookie Monster fail instead of skipping when they can't download it.

## 3.8.0 — 2026-10-16

- **Numbers in Cookie Monster's notations, everywhere.** A **Numbers** setting (Settings → General): short scale,
  abbreviated — the default, 1.23M, 45.6B, 1.23Qa — short scale (1.23 M, 4.56 Quadr), metric, scientific, engineering,
  or the game's own. Three significant digits (999.96K rounds up to 1M), numbers under a million in full; every
  number CookieMgr shows follows it (the event log's and the stock trader's texts, which used the game's formatter
  directly, too).
- **Plain Business Day**: an option to keep the normal building names, descriptions and icons, golden cookies,
  news, background and tab title during Business day — its effects stay. Takes effect at once, kept in the save.
- Settings: an option with choices shows as a dropdown.

## 3.7.2 — 2026-10-16

- **Payback is much cheaper to work out.** It measures only what's asked: buying (Best building / Best upgrade,
  `best`, `pp.best`, `buy.best`) asks for the buildings you can buy at the amount you'd buy and the store's
  upgrades — not every building at ×1, ×10 and ×100 (locked ones too), which only the store's colours and the
  Payback page need. An upgrade whose wait to afford alone outlasts the best building's payback period isn't measured
  for the best buy; cookie upgrades that win nothing are worked out (CpS × their power) after one of them is measured
  as a check. The store redraws its colours from a table up to 2 s old. Same answers — checked against Cookie
  Monster and the full table. In the simulator a fresh game runs about 6× faster (255× real time, from 44×), a
  big-bank game about 5× faster (19×, from 4×).
- The parity tests against Cookie Monster wait for its numbers and allow it a refresh or two (no more flaky runs
  when the machine is busy), and skip when Cookie Monster can't be downloaded.

## 3.7.1 — 2026-10-16

- **Charts: one hover readout that follows the x axis.** Wherever the cursor is: the time; every golden-cookie
  effect active there, each with what it multiplies, and — two or more — all of them combined (the overall boost to
  CpS and clicks); then the bar's production figures. Over an effect lane (it's highlighted) or an event marker,
  that one's details are added as a section of the same box instead of replacing it.
- **Game-off stretches are quiet.** On the Active time axis their dotted lines are much fainter, the cursor no longer
  snaps to them, and a stretch within the hovered bar is a one-line note ("Game off for 1h 20m here").
- Charts: an effect interval can say what it multiplies (`mults`), for the readout to combine.

## 3.7.0 — 2026-10-16

- **Alerts** (Cookie Monster's notifications, CookieMgr's way): built-in "When…" macros for a golden cookie, a wrath
  cookie, a reindeer, a fortune cookie in the news, the Grimoire's magic full and the sugar lump ripe — each flashes
  the screen, plays a sound and notes it (event log, game or desktop notification), its card picking the colour,
  sound and where (Macros page → Alerts). New actions `alert.flash`, `alert.sound`, `alert.notify`; new conditions
  `fortune`, `lumpRipe`. While a golden cookie is on screen the tab's title starts with ✦ (wrath: ⚠) and its icon
  becomes the cookie (Events page option).
- Actions can take free text (a text field in the macro editor and on built-in cards).

## 3.6.0 — 2026-10-16

- **Cookie Monster's statistics, CookieMgr's way** — a **Stats** page and a **Payback** page, and the store shows
  what each purchase is worth. Every figure from the game's own formulas and checked against Cookie Monster in the
  real game (the simulator's parity tests: Lucky!, Conjure, chains, wrinklers, next-achievement amounts — exact).
  - **Payback** page: the best buy; every building at ×1 / ×10 / ×100 in its payback colour with its payback
    period, CpS added and price — click to buy; the next achievement; upgrades best first; the payback options.
  - **Stats** page: the bank golden cookies and spells need to pay their most (Lucky!, Frenzy, chains, Conjure Baked
    Goods, Spontaneous Edifice) as meters; the next golden cookie's odds, worked out exactly; prestige; wrinklers;
    timers; what if (Pantheon spirits, dragon auras — the CpS each would bring); what's left to collect.
  - **The store**: prices in their payback colour, a dot on each upgrade, and a CookieMgr block under the game's
    tooltips — bonus income, payback period, when you can afford it, share of production, next achievement, and a
    warning when buying would drop your bank below a Lucky! / Frenzy / Conjure bank. Each can be turned off
    (Settings → Store).
  - A **Golden cookies** widget: the next golden cookie's expected wait.
  - Where the game and Cookie Monster differ, this follows the game: Spontaneous Edifice needs half the price in the
    bank (not twice it); the Dragon Guts aura makes wrinklers pay 20% more.
  - 36 new code words: `bank.*`, `reward.*`, `golden.*`, `prestige.*`, `wrinklers.*`, `missing.*`,
    `buff.timeLeft`, `lump.ripeIn`, `magic.fullIn`, `autosave.in`, `pantheon.cpsGain`, `dragon.auraCpsGain`.

## 3.5.0 — 2026-10-16

- **CookieMgr no longer needs Cookie Monster.** Payback periods are CookieMgr's own: what each purchase adds is asked
  of the game itself (make the change, run the game's CpS calculation, undo), counting the achievements it would win,
  with Cookie Monster's formula and colours — checked against Cookie Monster in the real game, every building at ×1,
  ×10 and ×100 and every store upgrade the same to the last digit.
  - **Best building** and **Best upgrade** work without Cookie Monster (no more "Needs Cookie Monster").
  - The store's **sort** is CookieMgr's own: Default, **Best buy** (was "Bulk PP"; with Round to multiples on, the
    payback period of exactly what a click buys) and Achievement — never locked.
  - New code words: `pp.best / kind / price / of / buy` (the `cm.*` names still work), `best(kind)`,
    `buy.best(kind)`, `building.price / gain / payback`, `building.priceOf / gainOf / paybackOf(building, n)`,
    `building.toNextAchievement`, `upgrade.gain / payback`, `timeTo(price)`, `clickRate()`,
    `building.buy / sell(building, n)`.
  - Loading Cookie Monster is still there under Integrations, for its displays.

## 3.4.2 — 2026-10-16

- **The Full-garden replanter starts a new round fertilizer first.** It switches to fertilizer as soon as a round is
  due — which brings the next tick within 3 minutes — keeps the old plants working until then, and harvests and
  replants the whole layout in the last `plantWindow` (15) seconds before that tick, so the new plants grow on it
  straight away instead of sitting as seedlings until the next one. On a level-6 golden clover field: golden cookies
  +55.8% on average instead of +55.0%, at the same number of plantings. (If the soil can't change yet — its
  10-minute cooldown — it still replants just before the next tick.) Edited copies of the gardener keep their code.

## 3.4.1 — 2026-10-16

- **Fix: a popped golden cookie was counted again while it faded out.** The game keeps a popped shimmer on screen
  (marked popped) for a moment, and the Golden cookies macro — every 100 ms — popped it again each time: nothing
  happened in the game, but its count and the logs went up.
  `shimmers()`, `shimmer.pop` and "a golden cookie is on screen" now skip popped ones.

## 3.4.0 — 2026-10-16

- **Two replanting gardeners.** The Effect maximizer is now the **Steady replanter** (each plant replaced as it
  dies — same code, same id). New: the **Full-garden replanter** — plants the whole layout at once, grows it on
  fertilizer, holds it on clay once most of it is mature (its soil rule, *Grow together, then clay*), doesn't
  replant plants that die, and replants everything once fewer than `replantBelow` (75%) are left. On a level-6
  golden clover field: golden cookies +55% on average instead of +49%, and +60% or more about 60% of the time
  instead of 4%. The **Golden clover combos** profile loads it with Fill and Golden clover.
- **Variables as controls.** Above a gardener's or soil rule's code, every top-level `name = number` or
  `true/false` line is a control — a percentage slider in 5% steps, a number slider, or a switch, each with a box
  for an exact value — in step with the code both ways. ⚙ sets how a variable shows (kind, range, step, unit, or
  hidden), kept with the algorithm; the built-ins come with theirs.
- **"Fertilizer, then clay" switches at 0.9** (was 0.67): with plants replanted one at a time fertilizer only
  lowers effects (×0.75) and makes plants die sooner, so it's now kept for a freshly planted garden. Edited copies
  keep their number.
- New garden values: `garden.layoutTiles()`, `garden.layoutMature()`, `garden.layoutYoung()`.

## 3.3.1 — 2026-10-14

- **The Seeds slot picks seeds by their icons**: a tab per letter of the template (its seed's icon and name), and
  under it the seeds as the game shows them, with their effects on hover — the ones you've unlocked, or every one
  with a toggle. Picking a seed on *As planted* makes a seed set of yours with it.
- **Fix: the Current garden / As planted didn't follow your changes.** Your clicks on the garden were only noted
  while the Current garden template was picked, and only once something had asked for it; the page also didn't show
  changes until it was redrawn. Now every click on a tile (and the game's Harvest all) is noted from the start,
  whatever is picked, and the slots update as it happens. **Take it again** on a live template or seed set takes the
  garden afresh.

## 3.3.0 — 2026-10-14

- **The auto-gardener is four layers, and profiles that combine them.** Each layer is picked on its own, has
  built-ins you can edit (and revert) and ones of your own (Save as new, rename, delete):
  - **Gardener** — what it does, as code (Effect maximizer, Weed collector, Mutation tracker).
  - **Soil rule** — a little code of its own that picks the soil, run when the gardener calls `garden.soilRule()`:
    Fertilizer, then clay · Fertilizer, then wood chips · Always fertilizer / clay / wood chips · Leave the soil.
  - **Template** — where seeds go, as letters: Fill (every one-seed garden), Bare, Checkerboard, Mutation rows,
    Rings, and the live Current garden. A template sits on your plot from its top-left unlocked tile, so a 6×6 one
    fits a smaller garden.
  - **Seeds** — which seed each letter is: a few for their effects, and every two-parent mutation recipe in the
    game (→ Cronerice: A Baker's wheat, B Thumbcorn…).
  - **Profiles** pick all four at once: Max effects · current garden, Golden clover field, Mutation hunt, Juicy
    queenbeet, Weed farm — and yours.
- **The Auto-gardener's card on the Garden page, redone**: a profile bar (pick, Save into it, Save as new, From the
  garden), four slots showing what's picked, and the one you click in detail below — code with the library, a grid
  to paint letters on, or a seed per letter. The Macros page card has the same five choices.
- **From the garden** reuses a template you have when the garden is laid out the same way (Fill for one seed
  everywhere) and seeds you have with the same letters.
- Garden profiles from before become profiles of the same name (a template and seeds that lay them out as they
  were); the gardeners you had stay.

## 3.2.0 — 2026-10-14

- **The auto-gardener comes in two layers, picked separately**: the **layout** (which seed goes on which tile — a
  garden profile) and the **gardener** (what it does — algorithmic code). Pick both on the Auto-gardener's card on
  the Garden page, or on its card on the Macros page.
- **Three built-in gardeners**, each editable and revertable:
  - **Effect maximizer** — what the auto-gardener did before: fertilizer while plants grow, clay once they're mature;
    replants plants about to die. It now only clears the tiles the layout has a seed for, and leaves tiles the
    layout keeps empty alone.
  - **Weed collector** — keeps the garden bare on fertilizer for weeds and fungi; harvests old meddleweed (for brown
    mold and crumbspore) and new seeds once mature, clears the rest.
  - **Mutation tracker** — grows the layout's parents, then wood chips for mutations; clears seeds you already have
    from the other tiles at once, keeps new ones (and copies of ones unlocked in the last hour) until they're mature.
- **Gardeners of your own**: **Save as new** on the Gardener card makes one from the code in the editor; rename or
  delete it there.
- **The Current garden** layout keeps whatever is planted, without saving a profile: it replants plants that die,
  follows what you plant or harvest by hand, and ignores weeds and mutations that spring up. It's the layout when
  you haven't picked one.
- New garden values: `garden.layoutYoungShare()`, `garden.isUnlocked(seed)`, `garden.unlockedAgo(seed)`,
  `garden.soilAvailable(soil)`.
- Rules you had written for a profile become a gardener of yours ("*profile* rules"), in use if that profile was.

## 3.1.2 — 2026-10-12

- **Events log: a golden cookie that gives an effect shows the effect and its multiplier** — "Frenzy ×7", "Clot ×0.5",
  "Click frenzy ×777 clicks" — instead of the CpS it added. Earlier events show it the same way.

## 3.1.1 — 2026-10-12

- **Fix: the garden charts' Time view with "Active time" on** could show the wrong garden for a time — not lining up
  with the Garden ticks view. Snapshots carried an active-time stamp worked out on the side, which was far off when
  taken before the history recorder had loaded or after the game had been closed. They're placed by when they
  happened now (the same clock every chart uses), which also fixes history already saved.
- **The default garden rules keep their numbers in variables at the top** — `fertilizerAbove = 0.67`,
  `tickWindow = 15`, `dyingOver = 0.5` — and switch the soil first (its effects count the whole time, not only at the
  tick). Saved rules with the threshold written into `if garden.youngShare() > 0.67:` get it lifted into a
  `fertilizerAbove` variable at the top the same way; nothing else in them changes.
- Removed the leftovers of the add-on's old name (and the one-time move of settings saved under it).

## 3.1.0 — 2026-10-08

- **Zoom into a chart by dragging across it**: pick a stretch of the x axis and the chart shows just that (a shaded
  band and its length while you drag; Esc lets go). Zooms stack — **Zoom out** (or a double-click) steps back one,
  and choosing a window clears it; a stretch that reaches now stays live. Every chart has it, the garden charts on
  their "garden ticks" axis too.
- **Looking back is now a shift-drag** (scrolling sideways still works).

## 3.0.0 — 2026-10-08

**Everything runs on one flexible substrate: algorithmic macros.** Every built-in that makes a decision is now code you
can read, change and revert — built from small, tested building blocks for each part of the game — and the language
grew what real strategies need. The pages and buttons look and work as before.

- **The language**: arithmetic (`+ - * / %`, brackets: `cookies() > 0.1 * cps() * 60`); **variables**
  (`target = cookies() * 0.1`, `ready = buff(Frenzy) and magic() > 50`, then `if ready:`); **loops over live lists**
  (`for good in stocks():`, `for tile in garden.tiles():` — as far as they get each pass, resuming mid-list after a
  wait); **options computed when a line runs** (`stock.buy(good, 10)`); **named blocks** (`def sell(good):` … `sell(x)`);
  `log <any value>`; yes / no values (`garden.isMature(tile)`) as conditions on their own.
- **Building blocks**, all in the library with their Lookup:
  - stock market — `stocks()`, `stock.mode / price / held / room / max / delta / cost / resting(good)`,
    `stock.buy / sell(good, n)`, brokers;
  - garden, tile by tile — `garden.tiles()`, `garden.plantAt / wantAt / age / decay / isMature / isNew / isEmpty /
    isOff(tile)`, `garden.harvest(tile)`, `garden.plant(tile, seed)`, `garden.seeds()`;
  - shimmers and wrinklers — `shimmers()`, `shimmer.pop(s)`, `wrinklers()`, `wrinkler.isFed / isShiny(w)`, `wrinkler.pop(w)`;
  - sugar lump — `lump.isRipe() / isMature() / pick()`;
  - buying — `cm.best(kind, skip)`, `cm.buy(thing)`, `upgrades()`, `buy.upgrade(u)`, `research.next(stopBefore)`;
  - the dragon — `dragon.canPet() / dropNow() / pet()`;
  - **the Pantheon** (new) — `pantheon.god(slot)`, `pantheon.slotOf(god)`, `pantheon.swaps()`, and
    `pantheon.slot(god, slot)`, the same as dragging a spirit in the Temple: automations that weren't possible before;
  - macros — `macro.isOn(id)`.
- **The built-ins as code**: the Stock market autobuyer, Golden cookies, Wrath cookies, Reindeer, Wrinklers, the Sugar
  lump harvester, Best building, Best upgrade, Research, Cheap upgrades and Pet the dragon are default code over the
  blocks (Edit on a card to read or change it; Revert to default). Their choices are **inputs** — variables in their
  code, still on their cards, shift-click still flipping one, your old choices carried over. Each was checked side by
  side against the JavaScript it replaced, on hundreds of random states: the same trades, pops and purchases.
- **The Auto-gardener is its garden profile's rules**: the active profile's code runs directly, from the top every
  second; a profile switched or rules saved apply on the next pass, rules that can't run stop it with the line, and
  its Edit opens the Garden page's Rules card.
- Shortcut macros (Repeat, When…, Once) are unchanged; the Big cookie, Fortune news, Elder Pledge, Sell all and the
  spells stay shortcuts — there's nothing for them to decide.
- Fixes along the way: code written back out keeps text quoted where a bare word would read as a value; the Cookie
  Monster buyers' candidate list is no longer reused across passes.
- Tests: a unit suite for the new language, side-by-side tests for every converted built-in (stocks on 400 random
  markets, per-tile garden rules on 120 random gardens), the Pantheon, and `waitFor` instead of fixed sleeps where
  timing matters; the runner gives a failure one more run alone and reports it as flaky if it passes then.

## 2.31.0 — 2026-10-08

- **The stock autobuyer hires stockbrokers** whenever it can afford one and the market has room (each makes buying
  goods 5% cheaper) — before it buys stocks. A choice on its row turns it off; only selling hires none. Also an action
  of its own: `stocks.hireBrokers()`.
- **Every macro is algorithmic code now.** Repeat, When… and Once macros are shortcuts that write it: they run on the
  same engine as algorithmic macros, and the editor shows what one amounts to under **As code** — with **Carry on as
  code** to continue it as an algorithm. Switching a macro to Algorithmic writes out everything it did, a When…'s
  conditions included. Nothing changes in how they look or run.
- **Lookup in the library**: a tab listing the names that go inside the parentheses — spells, effects, macros,
  seasons, buildings, soils… — with where each list is used; click a name to write it where the cursor is.
- Fix: code written back out (`not (a and b)`, `(a or b) and c`) keeps the parentheses it needs.

## 2.30.0 — 2026-10-08

- **Force the Hand of Fate on combos** (was "on Click frenzy"): now an algorithmic macro that casts as soon as two
  effects line up and there's enough magic — Frenzy + Dragonflight, Frenzy + Click frenzy, Frenzy + a building
  special, a building special + Dragonflight, a building special + Click frenzy. Its code can be edited (and reverted)
  like any built-in's.
- **Store sorts in the order Default, Bulk PP, Achievement**, named so.
- **Fix: scrolling down the buildings jumped back to the top** after a moment. The guard against a shifted screen
  (v2.24.1) also reset the store's own scroll; it now only touches containers the game doesn't let scroll.

## 2.29.1 — 2026-10-06

- **Faster Grimoire page and widgets**: the time until a spell is affordable (and until magic is full) is worked out
  from the game's refill formula instead of simulated frame by frame — up to millions of steps per spell, twice a
  second. A test checks it against the game's formula.
- **Fix: switching saves (an import) could lose the buff/effect log** of the save you left, or file it under the new
  one.
- `npm test` says so once when the bundle doesn't parse.

## 2.29.0 — 2026-10-06

- **Fix: a widget's text size now applies to its hover popups** too (they lost it when popups moved to the
  floating layer).
- **Fix: widgets saved with an unusual id** could break their own controls; such ids are replaced when loaded.
- Under the hood (no visible change otherwise):
  - Pages set themselves up through one helper (`CA.UI.Pages.scope`) that undoes everything when you leave the page
    — listeners, timers, charts, the code editor — and a contract test checks that every page leaves nothing
    running. The Stock market page is assembled from its parts.
  - Numbers and times are formatted in core (`CA.Format`), and recent averages come from the recorder: features
    no longer reach into the UI. `morph`, `replay` and two-click buttons live in `ui/dom.js`; the game lookups
    (`CA.Util.has`, `CA.Util.minigame`, `CA.Ascension.inProgress`) exist once.
  - 55 unused CSS rules removed (the old flow-block editor, the old status block, …); a test keeps it that way.
  - ESLint (`npm run lint`), run by CI along with the tests; a source test enforces the layers and house rules.

## 2.28.0 — 2026-10-06

- **Safer saves.** Each part of CookieMgr's save (your macros, widgets, garden profiles…) now loads on its own: if one
  can't be read, the rest still load, and a copy of what couldn't be read is kept in the browser (you're told).
  Before, one such error could leave the others at their defaults and the local copy then overwrote them.
- **Imports and other devices' saves now apply.** The local copy (which survives a quick refresh) is used only on
  start-up, only for the same bakery, and only when it isn't older than the game's save — so importing a save, or a
  cloud save from another machine, brings its CookieMgr settings along.
- **Settings of pages you haven't opened yet** keep their saved values (they were reset when defined late).
- **Algorithmic macros with a problem in their code won't start** (instead of running with lines quietly missing):
  you're told which line, and its card shows it. One that hits an error while running stops and says why, instead
  of failing every pass.
- **Elder Pledge's "how" choice** is there from the start (it only appeared after editing the macro).
- **Garden history is kept per save**, like the rest of the history (importing another save no longer mixes them).
- **Fix:** a problem while logging a stock trade could break the Bank's buy/sell buttons; the dragon's drop order
  could leave the game's random numbers seeded; macro names with markup in notification titles.
- Under the hood: features register their own parts of the save (`CA.Settings.registerSection`); start-up carries
  on past a module that fails; v2.22's flow blocks and old code settings are converted to code when loaded and the
  old block editor, flow settings and "All autoclickers" leftovers are gone.

## 2.27.0 — 2026-10-06

- **Tests in the repo**: `npm test` builds and runs every suite in parallel (about half a minute), and CI runs them
  on every push. New **contract tests** check everything that's registered — every page opens and refreshes, every
  widget renders, every action runs with its defaults, every condition and value works, every library entry
  compiles, every built-in's code compiles and round-trips, the save survives save → load → save, a broken save
  doesn't stop start-up — so new features are covered the moment they're registered. A unit suite covers the
  algorithmic language line by line. See `tests/README.md`.
- **Fix: a macro's settings on the Stock market, Garden and Grimoire pages** (its interval box, its choices) didn't
  do anything — they only worked on the Macros page.
- **Fix: the browser's own tooltips showing** instead of (or along with) CookieMgr's: on refreshing parts (the store
  bar, the running strip, the widget map), the Sell all buttons and the toolbars. Every tip is a styled one now, and
  the Sell all estimate updates while you hover it.
- **Fix: library entries that didn't compile** when inserted — names with spaces (`spell.cast("hand of fate")`) and
  comparison options are quoted now.
- **Fix: `state(…)` couldn't be compared** in code (`if state(cps) > 1e9:`) — it was always read as the condition of
  the same name.
- **Fix: `wait 5m` waited 5 million seconds**: `5m` / `2min` / `30s` are times in a wait now.
- **Fix: a `#` inside quotes** (`log "step #1"`) cut the line as if it were a comment.
- An argument you wrote out stays written when code is shown again, even when it's the default.

## 2.26.0 — 2026-10-06

- **Garden rules**: what the Auto-gardener does is now algorithmic code, one set per garden profile, edited on the
  Garden page's new **Rules** card (the macros' code editor, with the library beside it). **Save** keeps a profile's
  own rules, **Revert to default** brings back the default ones; while the gardener runs, the lines it took light up
  and its decisions show under the code.
- **The default rules** do what the gardener did before (plant empty tiles at once, unlock new seeds, pull out
  mismatches and harvest plants about to die in the last seconds before a tick — your old threshold and timing carry
  over), plus a **soil rule**: fertilizer while more than 0.67 of the planted tiles are still growing, clay once a
  third of them are mature. Change the numbers or the soils right in the code.
- **The garden's own words** for rules and any algorithmic macro: `garden.plantEmpty()`, `garden.harvestNew()`,
  `garden.pullMismatches(keepNew)`, `garden.harvestDying(threshold)`, `garden.harvestMature()`,
  `garden.soil(type)`; the condition `garden.soilIs(type)`; the values `garden.tickIn()`, `garden.youngShare()`,
  `garden.matureShare()`, `garden.plants()`, `garden.mature()`, `garden.empty()`, `garden.offProfile()`.
- The death-chance threshold and "seconds before the tick" fields are gone from the Auto-gardener card — they're
  numbers in the rules now.
- Under the hood: the code editor and its library are one shared component (`ui/codeEditor.js`), used by the
  macro editor and the garden rules.

## 2.25.0 — 2026-10-06

- **Every built-in macro can be edited**: Edit on its card opens the full editor; your version replaces it (its card
  says "edited"), and **Revert to default** brings back the original — changed settings too.
- **How often a macro runs is a number box** now: times a second for the fast ones — the Big cookie up to 50, the most
  clicks a second the game counts — or every so many seconds for the rest.
- **New: Elder Pledge** macro — buys the Elder Pledge whenever the Grandmapocalypse is on and it's for sale.
- **SeasonCompletion leaves the Grandmapocalypse on its second Christmas visit** (the reindeer cookies don't need
  wrinklers), keeping the elders pledged from there on.

## 2.24.1 — 2026-10-06

- **Fix: the screen shifting down** (and not scrolling back): opening widget settings, the macro editor or a
  card's chip used the browser's scrollIntoView, which also scrolls the game's own fixed containers. Everything now
  scrolls only the panel it's in, and CookieMgr puts the game's containers back if anything ever moves them — which
  also repairs a screen that's already shifted.
- **Fix: see-through widget popups** (minigame widgets, the status bar, garden tiles): their background didn't make
  it into the floating layer.
- **Fix: the code editor's cursor not lining up** with the text: the coloured copy behind the text and the text you
  type no longer scroll separately — only the editor's box scrolls, with the line numbers pinned beside it.

## 2.24.0 — 2026-10-06

- **Algorithmic macros** (replacing v2.22's flow blocks): written like pseudo-code, indented like Python — actions,
  `switch on/off`, `wait until …` / `wait 30 seconds`, `repeat until …:`, `while …:`, `repeat N times:`, `forever:`,
  `if / elif / else`, `for x in [a, b]:`, `parallel:` with `branch:` blocks, `stop`, `log`, comments. Conditions join
  with and / or / not and compare values: cookies(), cps(), magic(), owned(season, part), total(season, part),
  santaLevel(), building(Farm), state(…)…
- **A code editor** for them: coloured, numbered lines; problems listed as you type (click to jump); Tab / Enter
  indent for you; while it runs, the lines it's on light up and what it's checking shows underneath.
- **The library**, always beside the macro editor: every action, condition, value and keyword — search it, click to
  insert (into the code at the cursor, or as a step), ★ to pin your favourites at the top.
- **SeasonCompletion is now an algorithm** whose code you can edit ("Edit its code", "Reset to default"). Christmas
  comes first for its upgrades and Santa's Final Claus, then Easter, Halloween and Valentine's day, then Christmas
  again for the reindeer cookies, then Business day for good. Its card shows the line it's on with the counts it
  checks, and the if / elif decisions it took.
- Old v2.22 flows open in the editor written out as code.
- New: `season.complete` and `season.buyDrops` take a part (all / upgrades / cookies).

## 2.23.0 — 2026-10-06

- **Widget settings come to you:** the ⚙ (or a widget on the Widgets page) scrolls its settings into view with a
  flash. Livelier too: the header in the widget's own colour, S / M / L / XL presets for text size and size, and a
  **Place** grid that snaps the widget to a corner, an edge or the middle of the left panel.
- **Hold a buying macro's button to buy fast** (Best building, Best upgrade, Research, Cheap upgrades): it buys again
  and again until you let go — without switching the macro on.
- **Wrinklers: pop once fed** (default) — only a wrinkler that has eaten can drop Halloween cookies and such — or at
  once; shift-click its button to switch.
- **Tooltips on notifications** about an upgrade or an achievement: the same tooltip the store and stats menu show.
- SeasonCompletion now keeps the elders pledged by default at its last season.

## 2.22.0 — 2026-10-06

- **Flow macros:** a new kind of macro — an agent made of blocks: Do (an action), Wait (until conditions hold), Until
  (repeat blocks until conditions hold), If (then / else), Parallel (branches side by side) and Forever, nested as
  deep as you like. Each pass moves every branch on as far as it can; a flow that reaches its end switches itself
  off, and a running flow's card says what it's waiting for.
- **SeasonCompletion** (built-in flow, replaces the Season keeper): starts the research — and the Grandmapocalypse —
  right away, and alongside goes through the seasons in your order, switching on what collects each one's drops,
  buying them (and upgrading Santa) until the season is complete; on the last season it stays and leaves the
  Grandmapocalypse (Elder Covenant, keep pledging, or stay). Settings: the season order (default Christmas → Easter →
  Halloween → Valentine's day → Business day) and how it ends. Duplicate it to edit the flow itself.
- **New conditions and actions** for flows (and your macros): a season is on / complete, all research bought, the
  Grandmapocalypse is on; buy a season's drops, upgrade Santa, leave the Grandmapocalypse.
- **The macro editor, redone:** a header with icon, name, description and Save / Cancel / Delete; the kind of macro as
  cards; interval presets; numbered step cards; conditions as "when … and …" rows; flows as nested blocks with
  "+ Do · Wait · Until · If · Parallel · Forever" under every list.

## 2.21.0 — 2026-10-06

- **Best building** and **Best upgrade** (need Cookie Monster): buy the lowest payback period. Best building buys up to
  the next multiple of 10 when Round to multiples is on; clicking upgrades (no PP from Cookie Monster) are judged by
  what they add per click × your clicks per second; with both on, together they buy the lowest PP overall. "Skip
  what you can't afford" (shift-click the button) buys the best affordable one instead of saving up.
- **Research**: buys the Bingo center's research as it comes, stopping before the one you pick (One mind by default).
- **Cheap upgrades**: buys any upgrade costing under 1 second (adjustable) of your unbuffed production.
- **Pet the dragon**: works out which quarter of the hour drops which dragon upgrade (fixed by your save) and, in a
  quarter whose drop you're missing, opens the dragon, pets it until it drops and closes it.
- **Buttons show whether they can act:** the buying macros (and others that can tell) are tinted muted green / red
  for whether the next purchase is affordable, say what and when on hover, and shake when switched on but stuck.
- **Cookie Monster macros say they need it:** a warning with "Load it" on their card, and their switch is disabled
  until it's running.

## 2.20.0 — 2026-10-06

- **Your widgets is a map now:** a small map of the left panel with every widget where it sits (the big cookie drawn
  in for bearings), beside a chip per widget — instead of a list of rows.
- **Hovering links them:** hover a widget on the map, its chip, or the widget itself on the left panel, and all of
  them light up together. Click for its settings; × on a chip removes it.
- **Widget settings redone:** a header (what it is, Remove, Done) over two sections — Look (text size, size or title)
  and Shows (what that widget lets you choose). The widget glows on the left panel while its settings are open.

## 2.19.0 — 2026-10-06

- **Settings on every built-in macro:** how often it runs ("20× a second", "every 1s"…) and every choice its actions
  have — Big cookie animation, sparing shiny wrinklers, the season, ripe/mature lumps… A one-line summary on each card;
  click it for the settings.
- **Stock market autobuyer: Buy rising stocks** on/off — off, it only sells what you hold when it stops rising.
  Shift-click its button on the left panel to switch.
- **"Running now" merged into the Macros page:** a strip at the top with a chip per running macro (warmer the busier
  it is; click to find its card, × to stop it) and **Stop all**; a running macro's card shows what each of its steps
  has done.
- **"All autoclickers" removed** (the row and its A hotkey) — a group macro does the same, for exactly what you want.

## 2.18.0 — 2026-10-06

- **Garden effects chart:** what your plants do over time — the game's Garden information figures (CpS,
  cookies/click, golden cookie frequency, random drops, upgrade costs…), soil, growth stages and tile boosts included.
  A line per effect in %, tiles for the biggest ones now, seed-unlock markers.
- **Garden ticks as the x axis:** both garden charts can show a bar per garden tick (counted back from now) instead of
  time, so ticks of different soils take the same room. Garden ticks are now counted and kept with the history.
- Charts can now have an x axis in other units than time (used by the garden charts).

## 2.17.1 — 2026-10-06

- **Fix: popups no longer go under the game's side beams.** Every hover popup — chart tooltips, garden tiles,
  spirits, the round widgets, the status bar, simple tips — is now drawn in one floating layer on top of everything.
- **Chart tooltip rows stay on one line**, and their figures are separated by a centred dot instead of a slash, with a
  unit they all share written once at the end: "Clicking (raw · boosted)  1.2K · 3.4K/s". Tables use "·" too.
- **Fix: going to a minigame no longer shoves the screen** — only the middle panel scrolls, and never past its end.
- **Auto-gardener: empty tiles are replanted straight away** (so the plant starts growing and working at once);
  pulling out mismatches and saving plants about to die still happen just before the tick.

## 2.17.0 — 2026-10-06

- **Store toolbar:** the store's sort and rounding switches are now a row of small icon buttons along the bottom of
  the store, stretching across it, instead of tabs sticking out of its side. The building list gets room so its last
  row still scrolls clear.
- **Round to multiples works for selling too:** with ×10 or ×100, selling stops at the multiple below (37 → 30), as
  buying stops at the one above (37 → 40). The store's sell price follows. (Renamed from "Round bulk buys up".)

## 2.16.0 — 2026-10-05

- **Garden growth chart**, beside the plot on the Garden page: stacked bars over time of how many of each seed were
  at each growth stage. Each seed has its own colour (close to its sprite), younger stages are darker shades of it,
  and mature plants sit at the bottom of each seed's stack, so a crop's bars brighten from the bottom up as it grows.
  **Show**: seed × stage, seeds, or stages. Window chips, "% of total", one tooltip row per seed, stat tiles (plants,
  seeds unlocked, harvests), and a marker for each newly unlocked seed.
- New **Garden** event type: "Unlocked …" whenever a seed is unlocked.
- The garden is recorded as a snapshot each time the plot changes (not every second), kept per save in this browser.

## 2.15.0 — 2026-10-05

- **Every option has one home:** on the page of the feature it changes, in an Options card at the bottom — no more
  options shown both on their page and on Settings. Golden cookie notifications moved to Events; graph options to
  Graphs. Clearer names: "Macro on/off notifications", "Toolbar in the Stock market".
- **Settings page redone:** an overview on top (recording, macros running, widgets placed, Cookie Monster), the
  CookieMgr-wide options, and **All options** — every page's options as quick on/off chips, each group titled with a
  link to its page.
- **More varied layouts:** options as a grid of tiles; built-in macros as cards (with an activity meter — the same
  bands as the rings on their buttons); the Widgets page's "Add a widget" as a gallery. Your own macros stay as rows.
- **Styled hover tips everywhere** in CookieMgr instead of the browser's own tooltips.

## 2.14.0 — 2026-10-05

- **Sidebar reordered and grouped:** Events, Graphs | Garden, Stock market, Pantheon, Grimoire | Macros, Widgets,
  Settings — data, minigames, customization, with a small gap between groups.
- **Grimoire** is the new name of the Wizard tower page.
- **New Pantheon page:** your three slots with each spirit's effect there, worship swaps (left, next one back), and
  every spirit — hover one for what it does in each slot.
- **Links between pages:** a page's mention of another is a link to it (the Garden / Stock market / Grimoire sections
  on the Macros page, "Macros page" hints…), and each minigame page has **Open in game**.
- **Condensed chart tooltips:** on the Actual CpS and Cookie bank charts, each category is one row with its figures
  side by side, as in the tables — "Clicking (raw / boosted)", "Buildings (−bought / +sold)".

## 2.13.0 — 2026-10-05

- **Every macro switches off when you ascend** (with "Turn off when ascending" on) — the stock autobuyer and the
  sugar lump harvester no longer keep going.
- **Big cookie click animation:** a choice on the Big cookie's row — cookie + number (the game's), cookie only, or
  none. Only CookieMgr's clicks are affected. Also an option of the "Click the big cookie" action in your own macros.
- **Activity rings on macro buttons:** a band around each button shows how busy it has been over the last few
  minutes — none when idle, thicker and warmer up to many times a second. Hover for the rate.
- **Spell buttons show whether you can cast:** muted green with enough magic, muted red without.
- **Grimoire widget target:** count down to full magic, to a spell's cost, or to a fixed amount (settings ⚙). A tick
  on the ring marks the target and the widget glows once you have enough.
- The Auto-gardener's icon now shows (mature Baker's wheat).

## 2.12.1 — 2026-10-05

- **Fix: minigame widgets now take you to the minigame** from anywhere: a click closes whatever menu is open
  (CookieMgr's, Stats, Options…) before opening the minigame, then scrolls to the top of its building's row.
- **Fix: chart hover boxes were cut off** at the edges of their card; they now stay whole and inside the window.

## 2.12.0 — 2026-10-05

- **Store side switch:** a small column on the left edge of the store, level with the buildings:
  - **Building sort** (needs Cookie Monster) — best buy first (Cookie Monster's payback period for the amount you're
    buying: ×1, ×10 or ×100), next achievement first, or the game's order. It sets Cookie Monster's own sort setting,
    so it stays in step with Cookie Monster's menu.
  - **Round up** — with ×10 or ×100 selected, a click buys only what it takes to reach the next multiple (37 owned,
    ×10 → buys 3). The store's price shows the rounded amount too. Also in Settings → Store.
- **Cookie Monster dependency:** without Cookie Monster the sort buttons are locked and say so; clicking one loads
  Cookie Monster. Settings → Integrations lists what needs it.

## 2.11.0 — 2026-10-05

- **Garden page** (new, under the Wizard tower): your plot as it is now — each plant at its growth stage, the chance
  a mature plant dies on the coming tick, tiles that don't match your profile ringed in red, the profile's seed faded
  in on empty tiles; hover a tile for details. Plus the next tick, the soil, and how many plants are mature.
- **Garden profiles:** save the current garden (the seed on every tile, and the soil) as a profile; rename, switch
  or delete them.
- **Auto-gardener** (new built-in macro; ★ it for an on/off button on the left panel). While on, it keeps the garden
  like the active profile. In the last 15 seconds before each garden tick (adjustable) it:
  - pulls out plants that don't belong (weeds, mutations, leftovers);
  - harvests a mature plant when its chance of dying on the coming tick is over your threshold (50% by default;
    100% lets them die), then replants it;
  - plants the profile's seed on every empty tile you can afford;
  - switches to the profile's soil when the game allows it.

  Any time, it harvests a seed you haven't unlocked yet as soon as it's mature, which unlocks it (can be turned off).
- The death chance comes from the game's own aging rule (including tile boosts and Supreme Intellect), worked out
  exactly rather than estimated.

## 2.10.0 — 2026-10-05

- **Season keeper** (new built-in macro): pick a season on its row; while it's on, it buys that season's biscuit as soon
  as you can afford it — switching from another season if one is running — and buys it again whenever the season
  runs out. Needs the Season switcher heavenly upgrade.
- **Sugar lump harvester** (new built-in macro): harvests your lump when it's **ripe** (always pays) or, if you pick
  **mature** on its row, as soon as it matures (about 3 hours sooner, but the game's 50% chance of getting nothing).
  The "Harvest the sugar lump" action in your own macros has the same choice.
- Built-in macros can now have choices right on their row (saved with your settings; a duplicate keeps them).
- Fix: v2.9's widget settings styles spilled over into the macro editor's layout.

## 2.9.0 — 2026-10-05

- **Round minigame widgets:** the Grimoire, Garden and Stock market widgets are now small round meters instead of
  boxes — the ring is the timer, a short label sits under it, details pop up on hover, a click opens the minigame:
  - **Grimoire** — ring = magic; label = time until full.
  - **Garden** — ring and label = next garden tick; four dots under it count your plants by stage.
  - **Stock market** — ring and label = next market tick; the label shows what the last tick did to the stocks you held.
- **New Pantheon widget:** your three slotted spirits under a ring counting down to the next worship swap; click to
  open the Pantheon.
- **Widget settings:** every widget has a ⚙ that opens its settings on the Widgets page — text size for all, size for
  round ones and buttons, a title for framed ones, plus what its type adds. The Widgets page also lists the widgets
  you've placed, each with its settings.
- **Quick stats: choose your stats** from 17 (CpS, clicks per second, bank, buildings, prestige this run, time to the
  next prestige level, heavenly chips, sugar lumps, golden cookies clicked, wrinklers…).
- **Latest events** settings moved from the widget into the same settings page.
- Widgets now refresh in place, so a popup you're hovering no longer flickers.

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

First version as a proper add-on (was a single-line bookmarklet).

- Loads through the official mod API; settings saved inside the game save.
- Side tab on the left beam opens the CookieMgr panel in the game's menu area.
- Autoclickers from v0.1: big cookie, golden, wrath, reindeer, fortune news, wrinklers — each with a switch and a
  rebindable hotkey (modifiers supported). Toggle-all hotkey plus All on / All off buttons.
- Settings: turn off autoclickers on ascension, toggle notifications, remember on/off states, panel hotkey.
- Stops the old v0.1 bookmarklet if it is running.

## 0.1

Bookmarklet with hotkeys A / C / G / R / W / F / K (see `legacy/`).
