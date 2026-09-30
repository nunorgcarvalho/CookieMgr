# Changelog

## Unreleased

- **Stock market indicators:** every stock box in the Bank minigame now shows its trend (Stable, Slow rise, Slow fall,
  Fast rise, Fast fall, Chaotic) as a coloured strip with a symbol, so you don't have to hover. The box is tinted in the
  trend's colour and glows brighter (with a star) while you hold that stock. Both parts can be switched off in Settings.
- **Portfolio value & unrealized gains:** the stock chart on the Graphs tab now defaults to your total portfolio value
  over time plus a cost-basis line, with stat tiles for Value, Unrealized gain, Realized profit and Total gain — instead
  of a wall of individual stock prices you'd have to add up yourself. "Per stock" in the toolbar switches back to the
  old price-lines view. Cost basis is tracked from when the mod loads (buys/sells raise or realize it); it can't know
  about trades made before that.
- **Graph in the Bank minigame:** a small chart now sits right under the stock list in the Bank minigame itself, toggled
  between CpS and portfolio value. Can be turned off in Settings.
- **CpS graph defaults:** now Log scale, 5 minute window, 5 s smoothing, "With clicking" and "Unbuffed" lines on,
  "Production" line off. (Your own choices are still remembered from here on.)
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
