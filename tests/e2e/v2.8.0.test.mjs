// v2.8.0: not-enough-magic feedback, the last market tick. (Its minigame and events widgets were
// redone in v2.9 — see test_v290.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const browser = { factory: new IDBFactory(), IDBKeyRange };
const g = boot({ idb: browser });
const { window: w, Game, M, G, goods, calls } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const W = () => doc.getElementById('CookieMgrWidgets');

// ---- not enough magic
G.magic = 5;
CA.UI.Menu.openPage('wizard');
CA.UI.WizardPage.sync();
const tile = [...doc.querySelectorAll('[data-wiz-spell]')].find((el) => el.dataset.wizSpell === 'hand of fate');
const btn = tile.querySelector('[data-wiz-cast-btn]');
assert(!btn.disabled && btn.classList.contains('ca-unaffordable'), 'unaffordable cast button: dimmed but clickable');
calls.notify.length = 0;
calls.sounds.length = 0;
click(w, btn);
assert(calls.spells.length === 0, 'nothing cast');
const note = calls.notify.find((n) => n.title === 'Not enough magic');
assert(note && /Force the Hand of Fate needs <b>70<\/b> magic — you have 5 \(ready in/.test(note.desc), `explains why (${note && note.desc})`);
assert(btn.classList.contains('ca-shake') && calls.sounds.some((x) => /spellFail/.test(x)), 'button shakes, fail sound');
// the same from a spell's button on the left panel
CA.Macros.setFav('castFthof', true);
CA.UI.Widgets.tick();
calls.notify.length = 0;
const wb = W().querySelector('[data-w-trigger="castFthof"]');
click(w, wb);
assert(calls.notify.some((n) => n.title === 'Not enough magic') && wb.classList.contains('ca-shake'), 'spell button widget gives the same feedback');
G.magic = 100;
calls.notify.length = 0;
click(w, W().querySelector('[data-w-trigger="castFthof"]'));
assert(calls.spells.join() === 'Force the Hand of Fate' && !calls.notify.some((n) => n.title === 'Not enough magic'), 'with magic it just casts');

// ---- the last market tick (the round widgets that show it: test_v290)
goods[0].stock = 10;
goods[1].stock = 0;
M.ticks = 1;
CA.Stocks.sample();
goods[0].val += 2;
goods[1].val += 5; // not held: doesn't count
M.ticks = 2;
M.tickT = 30 * 25;
CA.Stocks.sample();
const lt = CA.Stocks.lastTick();
assert(lt && lt.dollars === 20 && lt.cookies === 20 * Game.cookiesPsRawHighest && lt.held === 1, `last tick: shares held × price change ($${lt && lt.dollars})`);
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
