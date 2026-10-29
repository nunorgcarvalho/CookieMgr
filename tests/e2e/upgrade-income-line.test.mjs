// Upgrade income line: the store tooltip's default lines say what an item adds to your actual income
// ("Income, actual income  +200/s": its gain, clicks and all, scaled by actual income — no ×CpS note), and
// "Payback period, actual income". The old "Per click" line is the "Income" statistic, off by default:
// how much more a click makes, then (in parentheses) the income that is at your clicking — and the
// upgrade info card reads that way: "Income  +90.9% per click (+100/s)".
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

const SI = CA.UI.StoreInsight;
// the default lines: no per-click line; nothing by actual income until a minute is recorded
let r = storeRows();
assert(SI.isDefault() && !SI.lines().includes('click') && SI.lines().includes('actualGain'), `default lines: actualGain, not click (${SI.lines().join()})`);
assert(!('Per click' in r) && !('Income' in r) && !('Income, actual income' in r), `not ready: no income line (${Object.keys(r).join(' · ')})`);

// clicking 10 a second (+100/s at CpS 1000), taking in 2000/s: ×2 → +200/s
CA.Recorder.recent = (secs) => ({ clickRate: 10, actual: 2000, secs: Math.min(secs || 600, 600), cps: 1000 });
await sleep(5200); // the 5 s income memo
r = storeRows();
assert(r['Income, actual income'] === `+${CA.Format.beautify(200)}/s`, `Income, actual income: ${r['Income, actual income']}`);
assert('Payback period, actual income' in r && !/CpS\)/.test(r['Payback period, actual income']), `Payback period, actual income, no ×CpS note: ${r['Payback period, actual income']}`);

// the per-click statistic, added to the lines
SI.setLines(['click']);
r = storeRows();
assert(r.Income === `+90.9% per click (+${CA.Format.beautify(100)}/s)`, `Income (per click): ${r.Income}`);

// the upgrade info card says the same
const card = CA.UI.UpgradeTip.html('Plastic mouse');
const cardRows = Object.fromEntries([...card.matchAll(/<div class="ca-uptip-row"><span>(.*?)<\/span><b[^>]*>(.*?)<\/b><\/div>/g)].map((m) => [m[1], m[2]]));
assert(!('Per click' in cardRows) && cardRows.Income === `+90.9% per click (+${CA.Format.beautify(100)}/s)`, `info card: ${cardRows.Income}`);

// a click that is worth little next to the upgrade: the share as a number (+100,000%… not +1000.0%)
iron.bought = 0;
Game.computedMouseCps = Game.mouseCps();
r = storeRows();
assert(r.Income === `+${CA.Format.beautify(1000)}% per click (+${CA.Format.beautify(100)}/s)`, `a big share: ${r.Income}`);

done();
process.exit();
