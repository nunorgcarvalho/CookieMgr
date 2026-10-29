// v3.43.0: payback modes. A payback period is max(price − bank, 0) ÷ income + price ÷ gain, and the
// Payback mode (the Payback page's main setting, ppMode) says what the income is and what a purchase
// adds to it: raw CpS · CpS (the default, as before) · CpS + clicking · actual income (the Recorder's,
// over ppActualWindow minutes; a gain scaled by actual ÷ raw CpS). Everything follows it — the table and
// its colors, the ranking, the store, the item words. A mode is a statistic (flagged mode: its code sets
// income and returns the item's gain), so the built-ins can be changed and new ones written. Its parts
// are words (item.timeToAfford, item.earnBack, item.gainIn, item.paybackIn, payback.income…). The
// Tooltips page is the Statistics page now; the store tooltip's layout moved to Settings.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const P = CA.Payback;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => {
  Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false });
});
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.buffs = { Frenzy: { name: 'Frenzy', time: 30 * 60, maxTime: 30 * 77, multCpS: 7 } };
Game.cookies = 50;
Game.CalculateGains();
Game.computedMouseCps = Game.mouseCps();
const C = Game.cookiesPs;
const RAW = Game.cookiesPsRaw;
assert(near(C, 7 * RAW), `a Frenzy: CpS ${C} is 7× the raw CpS ${RAW}`);

// the Recorder, stubbed: 4 clicks a second; you take in 10× your raw CpS
const R = CA.Recorder;
const recent = R.recent;
let recorded = 1e6;
let asked = [];
R.recent = (secs) => (asked.push(secs), { actual: 10 * RAW, secs: Math.min(secs, recorded), cps: C, clickRate: 4 });
const realNow = Date.now;
let offset = 0;
Date.now = () => realNow() + offset;
w.Date.now = Date.now;
const later = () => (offset += 6000); // past the 5 s memo

// ---- the modes there are; the default is cps, as before
assert(P.modes().map((m) => m.id).join() === 'rawCps,cps,cpsClicking,actualIncome', `the modes (one actual income, on the one window) (${P.modes().map((m) => m.id)})`);
assert(CA.Settings.get('ppMode') === 'cps' && P.mode().id === 'cps' && value('payback.mode') === 'cps', 'the default: cps');
const modeStat = CA.Stats.get('cpsClicking');
assert(modeStat && modeStat.mode && modeStat.group === 'Payback modes' && modeStat.label === 'CpS + clicking' && /income =/.test(modeStat.source), 'each mode is a statistic: label, description, code that sets income');
assert(P.modeOf('raw').id === 'rawCps' && P.modeOf('clicking').id === 'cpsClicking' && P.modeOf('actual').id === 'actualIncome' && P.modeOf('cpsClicking').id === 'cpsClicking', 'short names: raw, clicking, actual');

const farm = () => P.table().buildings[1].Farm;
let row = farm();
assert(near(row.pp, P.pp(row.price, row.bonus)), `cps: Cookie Monster’s formula, as before (${row.pp})`);
assert(near(row.pp, Math.max(0, row.price - 50) / C + row.price / row.bonus), 'cps: the wait at CpS + price ÷ the CpS it adds');
assert(near(row.afford + row.earn, row.pp) && near(row.gain, row.bonus), 'a row has its parts: afford + earn = pp, and its gain');

// ---- raw CpS
CA.Settings.set('ppMode', 'rawCps');
later();
row = farm();
assert(row.mode === 'rawCps' && near(row.gain, row.bonus / 7), `raw: the gain is what it adds to the raw CpS (${row.gain} = ${row.bonus} ÷ 7)`);
assert(near(row.pp, (row.price - 50) / RAW + row.price / row.gain), 'raw: afford at the raw CpS + price ÷ raw gain');
assert(near(value('payback.income'), RAW) && near(value('payback.income', 'cps'), C), 'payback.income(): the mode in use’s; payback.income("cps")');

// ---- CpS + clicking
CA.Settings.set('ppMode', 'cpsClicking');
later();
row = farm();
const perClick = Game.computedMouseCps;
assert(near(P.income(), C + 4 * perClick), `clicking: CpS + 4 clicks a second × ${perClick} a click`);
assert(asked.includes(60), 'clicks averaged over the last minute (the default window)');
assert(near(row.gain, row.bonus + row.worth.mouse * 4), 'clicking: the gain counts what it adds to your clicks');
CA.Settings.set('ppClickWindow', '300');
later();
asked = [];
P.table();
assert(asked.includes(300), 'the clicks window is an option (5 minutes)');

// ---- actual income: the gain scaled by actual ÷ raw CpS
CA.Settings.set('ppMode', 'actualIncome');
later();
asked = [];
row = farm();
assert(asked.includes(30 * 60), 'actual income over the last 30 minutes (the default window)');
assert(near(P.actualRatio(), 10) && near(value('payback.actualRatio'), 10), 'you take in 10× your raw CpS');
assert(near(P.income(), 10 * RAW) && near(row.gain, 10 * (row.bonus / 7)), `actual: income 10× raw, the gain 10× its raw gain (${row.gain})`);
assert(near(row.pp, (row.price - 50) / (10 * RAW) + row.price / row.gain), 'actual: the same formula in that income');
CA.Settings.set('ppActualWindow', '60');
later();
asked = [];
P.table();
assert(asked.includes(3600), 'the window is an option (1 hour)');
// the ranking doesn't change between raw and actual (every gain scales alike) when you can afford it all
Game.cookies = 1e12;
const order = () => P.ranking('building', { bulk: 1 }).map((x) => x.name).join();
const inActual = order();
CA.Settings.set('ppMode', 'rawCps');
assert(order() === inActual, `the same order by raw CpS and by actual income (${inActual})`);
Game.cookies = 50;

// too little recorded: not ready — the add-on stays on cps, the words say NaN
CA.Settings.set('ppMode', 'actualIncome');
recorded = 30;
later();
assert(P.mode().id === 'cps' && farm().mode === 'cps', 'under a minute recorded: by cps until it is');
assert(Number.isNaN(value('payback.income', 'actual')), 'payback.income("actual"): NaN');
recorded = 1e6;
later();
assert(P.mode().id === 'actualIncome', 'a minute recorded: by actual income');

// ---- the words and statistics: the parts in any mode
CA.Settings.set('ppMode', 'cps');
later();
const ST = CA.Stats;
const c = ST.contextOf('Farm', 'building');
const word = (id, ...a) => ST.about(c, () => value(id, ...a));
row = farm();
assert(near(word('item.timeToAfford') + word('item.earnBack'), word('item.payback')), 'item.timeToAfford() + item.earnBack() = item.payback()');
assert(near(word('item.paybackIn', 'raw'), (row.price - 50) / RAW + row.price / (row.bonus / 7)), 'item.paybackIn("raw")');
assert(near(word('item.gainIn', 'actual'), (10 * row.bonus) / 7), 'item.gainIn("actual")');
assert(near(value('building.paybackIn', 'Farm', 'raw'), word('item.paybackIn', 'raw')) && near(value('building.paybackIn', 'Farm'), row.pp), 'building.paybackIn(b, mode) — none: the mode in use');
assert(Number.isNaN(word('item.paybackIn', 'nonsense')), 'an unknown mode: NaN');
const run = (id) => ST.run(ST.get(id), c);
const modesLine = run('paybackModes');
assert(modesLine.returned && modesLine.value.length === 4 && near(modesLine.value[0], word('item.paybackIn', 'raw')) && near(modesLine.value[3], word('item.paybackIn', 'actual')), 'the “Payback in every mode” statistic');
assert(/ \+ /.test(run('paybackParts').value), `the “Afford + earn back” statistic (${run('paybackParts').value})`);
assert(/\/s$/.test(ST.run(ST.get('income'), null).value), 'the “Income” statistic');
const compiled = CA.Script.compile('return payback.income("clicking") + payback.bank()', { mode: 'stat' });
assert(!compiled.errors.length, 'payback.* words compile in a statistic');

// ---- the store follows the mode
Game.buyMode = 1;
CA.Settings.set('ppMode', 'rawCps');
const block = CA.UI.StoreInsight.buildingBlock(Game.Objects.Farm);
assert(block && block.includes(CA.Format.short(farm().pp)), 'the store tooltip’s Payback period is the raw-CpS one');

// ---- the Payback page: the mode is its main setting
CA.Settings.set('ppMode', 'cps');
CA.UI.Menu.openPage('payback');
await sleep(100);
const chips = () => [...doc.querySelectorAll('[data-pp-mode]')];
assert(chips().map((b) => b.dataset.ppMode).join() === 'rawCps,cps,cpsClicking,actualIncome', 'a chip a mode, at the top of the page');
assert(chips().find((b) => b.classList.contains('on')).dataset.ppMode === 'cps', 'the one in use is on');
assert(chips().every((b) => b.dataset.tip && /\/s/.test(b.textContent)), 'each explains itself and shows its income now');
chips()[0].click();
await sleep(100);
assert(CA.Settings.get('ppMode') === 'rawCps', 'clicking a chip: that mode');
const cell = doc.querySelector('.ca-pp-cell');
assert(/to afford \+ .* to earn back \(by Raw CpS\)/.test(cell.dataset.tip), `a cell’s tip: its parts, by the mode (${cell.dataset.tip.slice(0, 120)})`);
const win = doc.querySelector('[data-pp-pick="ppActualWindow"][data-v="15"]');
win.click();
await sleep(50);
assert(CA.Settings.get('ppActualWindow') === '15', 'the Options card sets the actual-income window');
assert(CA.Settings.definitions().find((d) => d.key === 'ppMode').choices.length === 4, 'the Settings page lists the modes');

// ---- edit modes: the Statistics page, on its Payback modes shelf
doc.querySelector('[data-pp-editmodes]').click();
await sleep(100);
const cards = () => [...doc.querySelectorAll('[data-st-card]')].map((c) => c.dataset.stCard);
assert(CA.UI.Menu.currentTab() === 'tooltips', 'edit modes: the Statistics page');
assert(cards().join() === 'rawCps,cps,cpsClicking,actualIncome', `the Payback modes shelf (${cards()})`);
const use = doc.querySelector('[data-st-mode="cpsClicking"]');
use.click();
await sleep(50);
assert(CA.Settings.get('ppMode') === 'cpsClicking', 'a mode’s card: use as the payback mode');
assert(doc.querySelector('[data-st-mode="cpsClicking"]').classList.contains('on'), 'and it says so');

// ---- a built-in mode changed: everything follows
CA.Settings.set('ppMode', 'cps');
later();
const before = farm().pp;
CA.Stats.update('cps', { source: 'income = 2 * cps()\nreturn 2 * item.gain()' });
later();
row = farm();
assert(row.mode === 'cps' && near(row.pp, (row.price - 50) / (2 * C) + row.price / (2 * row.bonus)), `a built-in mode changed (twice the income, twice the gain): ${before} → ${row.pp}`);
CA.Stats.remove('cps'); // back to how it came
later();
assert(near(farm().pp, before), 'Reset: back to how it came');

// ---- a mode of yours
const mine = CA.Stats.add({ label: 'Half CpS', mode: true, source: 'income = cps() / 2\nreturn item.gain() / 2' });
assert(mine.mode && mine.scope === 'item', 'a statistic of yours can be a payback mode');
assert(CA.Settings.definitions().find((d) => d.key === 'ppMode').choices.some((x) => x.v === mine.id), 'it’s a choice of the setting');
assert(P.modeOf('halfCps').id === mine.id, 'and has a code name: item.paybackIn("halfCps")');
CA.Settings.set('ppMode', mine.id);
later();
row = farm();
assert(row.mode === mine.id && near(row.pp, (row.price - 50) / (C / 2) + row.price / (row.bonus / 2)), 'and works like the others');
assert(CA.Stats.fromText(CA.Stats.toText(mine)).mode === true, 'shared as text, it stays a mode');
CA.Stats.remove(mine.id);
later();
assert(P.mode().id === 'cps', 'deleted: back to cps');

// ---- the tooltip's layout is on the Settings page now
CA.UI.Menu.openPage('settings:store');
await sleep(100);
assert(doc.querySelector('[data-tl-lines]') && doc.querySelector('[data-tl-warns]'), 'Settings: the store tooltip’s lines and warnings');
const delBtn = doc.querySelector('[data-tl-del="0"]');
const n0 = CA.UI.StoreInsight.lines().length;
delBtn.click();
await sleep(50);
assert(CA.UI.StoreInsight.lines().length === n0 - 1, 'and they work there (✕ takes a line out)');
CA.UI.StoreInsight.setLines(null);
assert(CA.UI.Pages.get('tooltips').label === 'Statistics', 'the Tooltips page is the Statistics page');

R.recent = recent;
Date.now = realNow;
w.Date.now = realNow;
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
