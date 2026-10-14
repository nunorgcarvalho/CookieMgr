// v3.3.1: the Seeds slot picks seeds from icons with their names (a tab per letter; seeds you
// haven't unlocked behind a toggle); the Current garden / As planted follows what you do by hand
// from the start, whatever template is picked — and the page shows it as it happens.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const M = makeGarden(Game); // tiles x 1–4, y 2–4
const G = CA.Garden;
const LY = CA.GardenLayers;
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const plantByHand = (x, y, key) => {
  M.seedSelected = M.plants[key].id;
  M.clickTile(x, y);
  M.seedSelected = -1;
};
Game.cookies = 1e12;
set(1, 2, 'bakerWheat', 5);
await sleep(1300);

// ---- your clicks are followed from the start (nothing opened, nothing asked)
assert(M.__caWatched, 'the garden’s clicks are watched once it’s there');
LY.pick('template', 'checker'); // As planted, under another template
plantByHand(2, 2, 'thumbcorn');
const asPlanted = () => LY.get('seeds', 'current').data.map;
assert(G.currentPlot()[2][2] === 'thumbcorn' && asPlanted().A === 'bakerWheat' && asPlanted().B === 'thumbcorn', 'a seed planted by hand: in As planted (whatever template is picked)');

// ---- the page follows it live
CA.UI.Menu.openPage('garden');
const card = () => doc.querySelector('[data-page="garden"] [data-gp-rules]');
const q = (s) => card().querySelector(s);
click(w, q('[data-gp-slot="seeds"]'));
assert(/Thumbcorn/.test(q('[data-gp-letter="B"]').textContent), 'the Seeds slot: As planted, its letters');
M.clickTile(1, 2); // harvest the wheat by hand
CA.UI.GardenPage.sync();
assert(G.currentPlot()[2][1] === null && /Thumbcorn/.test(q('[data-gp-letter="A"]').textContent) && /nothing/.test(q('[data-gp-letter="B"]').textContent), 'a harvest by hand: the slot and the detail change as it happens');
assert(/Thumbcorn/.test(q('[data-gp-slot="seeds"]').textContent) && !/Baker/.test(q('[data-gp-slot="seeds"]').textContent), '…the slot’s summary too');
// Harvest all
plantByHand(3, 3, 'bakerWheat');
M.harvestAll();
assert(G.currentPlot().flat().every((k) => !k), 'the game’s Harvest all: followed');

// ---- Take it again: what's planted now (changed some other way)
set(1, 2, 'thumbcorn', 3);
set(2, 2, 'bakerWheat', 3);
assert(!G.currentPlot()[2][1], 'not by hand: not followed');
click(w, q('[data-gp-act="recapture"]'));
assert(G.currentPlot()[2][1] === 'thumbcorn' && G.currentPlot()[2][2] === 'bakerWheat' && /Thumbcorn/.test(q('[data-gp-letter="A"]').textContent), 'Take it again: taken afresh');

// ---- picking a seed on the live set: a seed set of yours with it
click(w, q('[data-gp-letter="B"]'));
click(w, q('[data-gp-seedpick="bakeberry"]'));
const mine = LY.get('seeds', LY.picked('seeds'));
assert(!mine.builtin && !mine.live && mine.name === 'As planted (copy)' && mine.data.map.A === 'thumbcorn' && mine.data.map.B === 'bakeberry', 'a pick on As planted: a seed set of yours, picked');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
