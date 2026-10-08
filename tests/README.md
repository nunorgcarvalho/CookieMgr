# Tests

```
npm install          # once: jsdom + fake-indexeddb (dev only — nothing ships with the bundle)
npm test             # build, then run every suite (a few at a time)
npm test -- garden   # only files whose path contains "garden" (any number of words)
npm test -- --verbose
npm run lint         # ESLint over src/ and tests/
```

CI runs the same on every push (`.github/workflows/ci.yml`).

## How they work

Every test loads the **built bundle** (`dist/CookieMgr.js`) into a fake Cookie Clicker in jsdom —
`harness/game.mjs` — and drives it the way a player would: opening pages, clicking buttons, typing
into the code editor, saving and reloading. The fake game mirrors only the game APIs CookieMgr
touches, with the same contracts as the real one (see the comments in `game.mjs`); `harness/gardenStub.mjs`
adds a fuller Garden minigame.

```js
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } }); // a fresh game + CookieMgr
const CA = g.window.CookieMgr;
await sleep(400); // CookieMgr starts once the game is ready

CA.UI.Menu.openPage('garden');
assert(g.window.document.querySelector('[data-page="garden"]'), 'the Garden page opens');

// saved and restored: write the save, boot a second game from it
g.Game.WriteSave();
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: g.Game.modSaveData.CookieMgr });

assert(g.errors.length === 0, 'no runtime errors'); // anything thrown inside the page lands here
done();
process.exit();
```

`boot()` options: `save` (a CookieMgr save string), `idb` (fake IndexedDB — share one between boots to
test what's recorded), `withPantheon`, `withGrimoire`, `localStorageSeed`, `fullDate`. It returns
`{ window, Game, M (bank), G (grimoire), P (pantheon), goods, calls (notify / sounds / spells / loadMod), errors }`.

## The suites

- **`contract/`** — checks every *registered* thing, whatever it is: every page opens and refreshes,
  every widget type renders, every action/condition/value is well-formed and runs, every library
  entry compiles, every built-in macro's code compiles and decompiles, the save round-trips, no
  native `title` tooltips. A new action, page, widget, value or built-in macro is covered by these
  the moment it's registered — no test to write for the basics.
- **`contract/source.test.mjs`** — reads the source: core/ and features/ never use the UI, every file is in the
  build, no native `title` tooltips or `scrollIntoView`, and every CSS class is still produced by some code.
- **`unit/`** — fast, table-driven checks of pure logic (the algorithmic language).
- **`e2e/vX.Y.Z.test.mjs`** — one per release: what that release added or changed, end to end. The
  CHANGELOG entry of the same version says what each one is about. v3.0.0 has several
  (`v3.0.0-stocks`, `-garden`, `-builtins`, `-pantheon`).
- **Side by side** — when code replaces JavaScript (the built-ins in v3), a test runs the old and the new on hundreds
  of random states and requires the same outcome (`v3.0.0-stocks`: the autobuyer on 400 random markets;
  `v3.0.0-builtins`: every converted built-in; `v3.0.0-garden`: per-tile rules against the whole-plot actions).

## Adding a feature

1. Register it (`CA.Actions.register`, `CA.UI.Pages.register`, `CA.Script.defineValue`…) — the
   contract tests pick it up.
2. Write `e2e/vX.Y.Z.test.mjs` for the release: the behaviour, the UI, and save → reload.
3. When a later release changes the behaviour on purpose, update the older test's expectation and
   say why in a comment (`// v2.26: …`).
