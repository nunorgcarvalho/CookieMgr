// v2.17.1: hover popups in a floating layer above the game's beams; figures joined with "·" and a
// shared unit once; empty garden tiles replanted at once.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, withPantheon: true });
const { window: w, Game } = g;
const M = makeGarden(Game);
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// ---- figures on one row
const J = CA.UI.Plot.fmt.joinFigures;
assert(J(['1.2K/s', '3.4M/s']) === '1.2K · 3.4M/s', `shared "/s" once (${J(['1.2K/s', '3.4M/s'])})`);
assert(J(['1.2K/s', '3.4K/s']) === '1.2K · 3.4K/s', 'magnitude letters stay with their number');
assert(J(['12%', '40%']) === '12 · 40%', 'percent');
assert(J(['3', '5']) === '3 · 5', 'no unit');
assert(J(['−5', '+7 cookies']) === '−5 · +7 cookies', 'different units: each keeps its own');

// ---- the floating layer
const layer = doc.getElementById('CookieMgrLayer');
assert(layer && layer.parentNode === doc.body, 'one layer, straight under <body> (outside the game’s panels)');
CA.UI.Menu.openPage('pantheon');
const god = doc.querySelector('[data-page="pantheon"] .ca-god[data-pop]');
god.querySelector('.ca-god-name').dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const float = layer.querySelector('.ca-float');
assert(float && float.style.display === 'block' && /Holobore/.test(float.textContent) && float.querySelector('.ca-gpop'), 'spirit popup shown in the layer');
doc.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
assert(float.style.display === 'none', 'and hidden after');
CA.UI.Widgets.add('grimoire');
const orb = doc.querySelector('#CookieMgrWidgets .ca-orb[data-pop]');
orb.querySelector('.ca-orb-label').dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
assert(float.style.display === 'block' && /Magic/.test(float.textContent), 'widget popups too');
CA.UI.Menu.openPage('graphs');
await sleep(50);
assert(layer.querySelector('.ca-tip[data-plot-tip="actual"]'), 'chart tooltips live in the layer');
CA.UI.Menu.openPage('settings');
CA.UI.Menu.render();
await sleep(50);
CA.UI.Graphs.tick();
assert(!layer.querySelector('.ca-tip[data-plot-tip="actual"]') || !doc.querySelector('[data-plot="actual"]'), 'removed with their chart');

// ---- garden: empty tiles planted at once
M.plot[2][1] = [0, 0];
M.nextStep = Date.now() + 200e3;
CA.Garden.snapshot('Here');
M.plot[2][2] = [M.plants.bakerWheat.id + 1, 3];
CA.Garden.snapshot('Two');
CA.Garden.use(CA.Garden.profiles()[1].id);
M.plot[2][2] = [0, 0];
Game.cookies = 1e9;
CA.Garden.tend();
assert(M.plot[2][2][0] === M.plants.bakerWheat.id + 1, 'an empty tile is replanted straight away, minutes before the tick');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
