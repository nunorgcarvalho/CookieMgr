// The Auto buyer's corner: a widget that runs the Auto buyer (the Manager widget while its stage has it
// on) shows, top-right of its title bar, the last three things it bought and what it buys next — each
// with a card on hover (price, payback period, +CpS, when affordable) — refreshed live.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const B = CA.AutoBuyer;
const G = CA.Managers;
const Wd = CA.UI.Widgets;

const spec = { Cursor: [15, 0.1], Grandma: [100, 1] };
Object.keys(spec).forEach((n, i) => Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false }));
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.cookies = 0;
Game.CalculateGains();
B.update('payback', { cheapBulk: 0 });

// ---- a stage with the Auto buyer on: the corner shows ----
CA.Macros.set('manager', false, { silent: true });
G.goTo(1);
G.step();
assert(!CA.Macros.isOn('manager') && CA.UI.ManagerWidget.runsBuyer(), 'Nunix stage 1 runs the Auto buyer: shown even while the Manager macro is off');
const inst = Wd.add('manager');
Wd.render();
const corner = () => doc.querySelector(`[data-widget="${inst.id}"] .ca-w-head [data-w-buyer]`);
assert(corner(), 'a corner in the title bar');
const next = () => corner().querySelector('.ca-wbuy-next');
const f = B.next();
assert(f && next() && /Next for the Auto buyer/.test(next().innerHTML), `what it buys next (${f && f.label})`);
const card = next().querySelector('.ca-wpop').textContent;
assert(/price/.test(card) && /payback period/.test(card) && /affordable/.test(card) && /in /.test(card), `its card: price, payback period, when (${card})`);
assert(!next().classList.contains('can'), 'not affordable yet');
assert(corner().querySelectorAll('.ca-wbuy-past').length === 0, 'nothing bought yet');

// ---- it buys: the purchases land in the corner, live ----
Game.cookies = 1e12;
let n = 0;
for (let i = 0; i < 4; i++) n += B.buyNext();
assert(n === 4 && B.recentBought().length === 4, `four bought (${n})`);
// through the macro's way too: pp.buy of what buyer.next named
const key = CA.Script.VALUES.find((v) => v.id === 'buyer.next').get();
CA.Actions.get('pp.buy').run({ thing: key });
assert(B.recentBought().length === 5 && B.recentBought()[0].key === key, `pp.buy(buyer.next()) counts (${key})`);
Wd.tick();
const past = corner().querySelectorAll('.ca-wbuy-past');
assert(past.length === 3, `the last three (${past.length})`);
assert(past[2].classList.contains('hot') && /Bought just now/.test(past[2].innerHTML), 'the newest on the right, flashing');
assert(/paid/.test(past[0].querySelector('.ca-wpop').textContent), 'a past one’s card: what it paid');
assert(next().classList.contains('can'), 'next: affordable now');

// ---- click: the Payback page ----
click(w, next());
assert(CA.Settings.get('tab') === 'payback', 'click opens the Payback page');

// ---- a stage without it: no corner ----
const eff = G.effective;
G.effective = (m, i) => ({ ...eff(m, i), macros: { golden: 'on' } });
assert(!CA.UI.ManagerWidget.runsBuyer(), 'a stage that leaves the Auto buyer off: no');
Wd.tick();
assert(corner().innerHTML === '', 'and its corner is empty');
G.effective = eff;
Wd.tick();
assert(corner().querySelector('.ca-wbuy-next'), 'back on: shown again');

// ---- widgets that don't run it have none ----
const stats = Wd.add('stats');
Wd.render();
assert(!doc.querySelector(`[data-widget="${stats.id}"] [data-w-buyer]`), 'a Quick stats widget has no corner');

assert(g.errors.length === 0, `no runtime errors (${g.errors.join('; ')})`);
done();
process.exit();
