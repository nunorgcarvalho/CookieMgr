// Upgrade adds line: a clicking upgrade's store tooltip and info card say what it adds — how much more a
// click makes, then (in parentheses) the income that is at your clicking: "Adds  +90.9% per click (+100/s)".
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);

const plastic = new Game.Upgrade('Plastic mouse', 5000);
plastic.type = 'upgrade';
plastic.unlocked = 1;
Game.UpgradesInStore = [plastic];
const iron = new Game.Upgrade('Iron mouse', 50);
iron.bought = 1;
Game.Upgrades = { 'Plastic mouse': plastic, 'Iron mouse': iron };
Game.crateTooltip = (me) => `<div class="name">${me.name}</div>`;
// CpS 1000; a click: 1 + 1% of CpS per mouse owned — Iron mouse's: 11; Plastic mouse adds 10 (+90.9%)
cpsModel(Game, { base: 1000, mouse: { 'Plastic mouse': 0.01, 'Iron mouse': 0.01 } });
Game.computedMouseCps = Game.mouseCps();
Game.cookies = 1e4;
await sleep(500);

const rowsOf = (html) => [...html.matchAll(/<div class="ca-tt-row"><span>(.*?)<\/span><b[^>]*>(.*?)<\/b><\/div>/g)].map((m) => [m[1], m[2]]);
const storeRows = () => Object.fromEntries(rowsOf(Game.crateTooltip(plastic, 'store')));

// not clicking: the share a click gains, +0/s
let r = storeRows();
assert(!('Per click' in r), `no Per click line any more (${Object.keys(r).join(' · ')})`);
assert(r.Adds === `+90.9% per click (+${CA.Format.beautify(0)}/s)`, `store tooltip, not clicking: ${r.Adds}`);

// clicking 10 a second: 10 × 10 = +100/s
CA.Recorder.recent = () => ({ clickRate: 10, actual: 1000 });
r = storeRows();
assert(r.Adds === `+90.9% per click (+${CA.Format.beautify(100)}/s)`, `store tooltip, clicking: ${r.Adds}`);

// the upgrade info card says the same
const card = CA.UI.UpgradeTip.html('Plastic mouse');
const cardRows = Object.fromEntries([...card.matchAll(/<div class="ca-uptip-row"><span>(.*?)<\/span><b[^>]*>(.*?)<\/b><\/div>/g)].map((m) => [m[1], m[2]]));
assert(!('Per click' in cardRows) && cardRows.Adds === `+90.9% per click (+${CA.Format.beautify(100)}/s)`, `info card: ${cardRows.Adds}`);

// a click that is worth little next to the upgrade: the share as a number (+100,000%… not +1000.0%)
iron.bought = 0;
Game.computedMouseCps = Game.mouseCps();
r = storeRows();
assert(r.Adds === `+${CA.Format.beautify(1000)}% per click (+${CA.Format.beautify(100)}/s)`, `a big share: ${r.Adds}`);

done();
process.exit();
