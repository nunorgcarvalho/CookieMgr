# CookieMgr

_(Previously called Cookie Agent.)_

A [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) add-on for automating tasks and (soon) visualizing data.
It loads like [Cookie Monster](https://github.com/CookieMonsterTeam/CookieMonster): a one-line bookmarklet pulls the
latest build from GitHub Pages, so pushing to this repo updates everyone's add-on.

## Features (v0.2)

- **CookieMgr tab** on the beam between the cookie panel and the middle panel. Clicking it opens the CookieMgr
  panel in the game's menu area (same place as Options / Stats). A green badge shows how many autoclickers are running.
- **Autoclickers**, each with an on/off switch and a rebindable hotkey:

  | Autoclicker    | Default key | What it does                                   |
  | -------------- | ----------- | ---------------------------------------------- |
  | Big cookie     | `C`         | Clicks the big cookie 20×/second               |
  | Golden cookies | `G`         | Pops golden cookies (not wrath)                |
  | Wrath cookies  | `W`         | Pops wrath cookies                             |
  | Reindeer       | `R`         | Pops reindeer                                  |
  | Fortune news   | `F`         | Clicks fortunes in the news ticker             |
  | Wrinklers      | `K`         | Pops wrinklers as soon as they attach          |
  | Toggle all     | `A`         | All on — or all off if everything is running   |

- **All on / All off** buttons.
- **Settings**: turn everything off when ascending (default on), toggle notifications, remember on/off states across
  reloads, optional hotkey to open/close the panel.
- Hotkeys support modifiers (e.g. `Shift + G`). Click a key chip, press the new key; `Esc` cancels, `Backspace` clears.
  Binding a key that's already in use moves it (you get a notification).
- Settings are stored in the regular Cookie Clicker save via the official mod API (`Game.registerMod`), so they survive
  exports/imports.
- If the old v0.1 bookmarklet is running, CookieMgr shuts it down on load.

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
    events.js        tiny pub/sub bus ('clickers', 'settings', 'hotkeys', 'ascend')
    actions.js       registry of hotkey-able actions
    settings.js      options + hotkey bindings, save/load (JSON inside the game save)
    hotkeys.js       global keydown listener + "press a key" capture mode
    ascension.js     detects ascending (wraps Game.Ascend + watchdog)
  features/
    autoclickers.js  clicker definitions and timers — add new ones to DEFS
  ui/
    components.js    HTML snippets: switch, hotkey chip, icon, button
    tab.js           the side tab on the left beam
    menu.js          the panel (hooks Game.ShowMenu / Game.UpdateMenu)
    styles.css       all styling, scoped to #CookieMgrTab / #CookieMgrMenu
  main.js            waits for the game, registers the mod (init/save/load)
build.mjs            concatenates src/ in order into one IIFE in dist/
legacy/              the original v0.1 bookmarklet, for reference
```

Modules are plain scripts that attach to a shared `CA` namespace (exposed as `window.CookieMgr` for debugging).
If you add a file, add it to `MODULES` in `build.mjs` in the right order.

### Adding things

- **A new autoclicker:** append an entry to `DEFS` in `src/features/autoclickers.js`. The panel row, hotkey, and save data
  come for free.
- **A new setting:** call `CA.Settings.defineOption({ key, group, name, desc, default })` in a feature's `init()`, and read
  it with `CA.Settings.get(key)`. Options in the `autoclickers` group show up in the Settings card.
- **A new hotkey action:** `CA.Actions.register({ id, name, group, defaultKey, run })`.
