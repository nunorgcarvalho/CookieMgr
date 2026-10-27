// v3.33.0: the Garden page's stats sit in rows of three under the plot (not one narrow column), and a new
// Garden cost tile: what planting the whole layout costs at today's seed prices (they scale with CpS), green if
// the bank covers it, red if not, with what the planned tiles still missing their seed would cost under it.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const M = makeGarden(Game); // tiles x 1–4, y 2–4: 12 open tiles
await sleep(400);
const LY = CA.GardenLayers;
const B = CA.Format.beautify;
const set = (x, y, key) => (M.plot[y][x] = key ? [M.plants[key].id + 1, 0] : [0, 0]);

LY.pick('template', 'fill');
LY.pick('seeds', 'bakerWheat');
Game.cookiesPs = 1000; // a Baker's wheat: max(30, 1000 × 1 × 60) = 60,000
Game.cookies = 1e6;
set(1, 2, 'bakerWheat');
set(2, 2, 'bakerWheat');
set(3, 2, 'thumbcorn'); // off-layout: still to plant
CA.UI.Menu.openPage('garden');
const stats = () => doc.querySelector('[data-page="garden"] [data-gp-stats]');
const costTile = () => [...stats().querySelectorAll('.ca-stat')].find((t) => t.querySelector('.ca-stat-label').textContent === 'Garden cost');
const read = () => ({ value: costTile().querySelector('.ca-stat-value').textContent, sub: costTile().querySelector('.ca-stat-sub').textContent, cls: costTile().querySelector('.ca-gcost').className });

assert(stats() && costTile(), 'the Garden page has a Garden cost tile');
let r = read();
assert(r.value === B(12 * 60000) && r.sub === `${B(10 * 60000)} left to plant`, `the whole layout: 12 × 60,000; left: the 10 tiles without their seed (${r.value}; ${r.sub})`);
assert(/\bpos\b/.test(r.cls), 'a bank of 1M covers 720K: green');

Game.cookies = 5e5;
CA.UI.GardenPage.sync();
assert(/\bneg\b/.test(read().cls), 'a bank of 500K does not: red');

Game.cookiesPs = 10000; // seed prices follow CpS
CA.UI.GardenPage.sync();
r = read();
assert(r.value === B(12 * 600000) && r.sub === `${B(10 * 600000)} left to plant`, `seed prices scale with CpS (${r.value})`);

for (let y = 2; y < 5; y++) for (let x = 1; x < 5; x++) set(x, y, 'bakerWheat');
Game.cookies = 1e9;
CA.UI.GardenPage.sync();
r = read();
assert(r.sub === 'all planted' && /\bpos\b/.test(r.cls), 'every tile as planned: all planted');

const css = doc.querySelector('style#CookieMgrStyle, style') ? [...doc.querySelectorAll('style')].map((s) => s.textContent).join('') : '';
assert(/\.ca-garden-row \.ca-gstats\s*\{[^}]*grid-template-columns:\s*repeat\(3/.test(css), 'under the plot the stats go three to a row');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
