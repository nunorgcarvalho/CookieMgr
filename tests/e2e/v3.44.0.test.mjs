// v3.44.0: the Auto buyer. One buyer for buildings and upgrades replaces Best building and Best
// upgrade: a profile ranks everything into one queue by payback period, then its rules (first, weight,
// cap, never — each with an optional "when" in code), and the Auto buyer macro buys the front. The
// queue, the profiles and the buyer are words and actions; old saves move over (which buyers ran, their
// skip and reserve, their hotkey). The Payback page sits above Macros and opens with it.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const B = CA.AutoBuyer;
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false }));
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.cookies = 50;
Game.CalculateGains();

// ---- the queue ----
assert(B.activeProfile() === 'payback' && B.list().map((p) => p.id).join() === 'payback,buildings,upgrades', 'three seeded profiles, Payback active');
let q = B.queue();
assert(q.items.length >= 3, `the queue has every building (${q.items.length})`);
const pps = q.items.map((x) => x.pp);
assert(pps.every((v, i) => i === 0 || v >= pps[i - 1]), 'sorted by payback period');
const front = q.items[0];
assert(value('buyer.next') === front.key && value('buyer.rank', front.key) === 1, `buyer.next is the front (${front.key})`);
assert(value('buyer.queue').length === q.items.length, 'buyer.queue lists it');

// a weight pushes the front back; never holds it back; first pulls the last forward
B.update('payback', { rules: [] }); // (the seeded Buy all upgrades rule, v3.50, aside)
B.addRule('payback', { what: `b:${front.name}`, effect: 'weight', k: 1000 });
q = B.queue();
assert(q.items[q.items.length - 1].name === front.name && q.items[q.items.length - 1].rules.includes('weight ×1000'), 'weight ×1000: last');
B.setRule('payback', 0, { effect: 'never' });
q = B.queue();
assert(!q.items.some((x) => x.name === front.name) && q.held.some((x) => x.name === front.name), 'never: held back');
assert(value('buyer.rank', front.key) === 0, 'rank 0 when held back');
const lastName = q.items[q.items.length - 1].name;
B.addRule('payback', { what: `b:${lastName}`, effect: 'first' });
q = B.queue();
assert(q.items[0].name === lastName && q.items[0].first, 'first: to the front');
// a "when" in code
B.setRule('payback', 1, { when: 'cookies() > 1e9' });
q = B.queue();
assert(q.items[0].name !== lastName, 'first only when its condition holds');
assert(B.whenProblem('cookies( >') !== '', 'a broken condition is reported');
B.update('payback', { rules: [] });

// cap: no more than n owned — the bulk cut short
B.update('payback', { bulk: 10, rules: [{ what: 'b:Grandma', effect: 'cap', n: 8 }] });
q = B.queue();
const gr = q.items.find((x) => x.name === 'Grandma');
assert(gr && gr.n === 3, `cap 8 with 5 owned: buys 3 (${gr && gr.n})`);
B.update('payback', { rules: [{ what: 'b:Grandma', effect: 'cap', n: 5 }] });
assert(B.queue().held.some((x) => x.name === 'Grandma'), 'at the cap: held back');
B.update('payback', { bulk: 'auto', rules: [] });

// kinds
B.use('upgrades');
assert(B.queue().items.length === 0 && value('buyer.next') === '', 'Upgrades only, no upgrades in the store: nothing');
assert(value('buyer.profileActive', 'Upgrades only') && value('buyer.activeProfile') === 'upgrades', 'by name');
B.use('payback');

// ---- buying ----
Game.cookies = 1e9;
const before = Game.Objects[B.next().name].amount;
const name = B.next().name;
assert(CA.Actions.get('buyer.buyNext').run({ profile: '' }) === 1 && Game.Objects[name].amount > before, 'buyer.buyNext buys the front');
B.update('payback', { reserve: 1e9 });
assert(value('buyer.budget') < 0 && CA.Actions.get('buyer.buyNext').run({ profile: '' }) === 0, 'a reserve it never spends');
assert(/keeping the reserve|nothing/.test(B.readiness().text) || !B.readiness().ok, 'readiness says why');
B.update('payback', { reserve: 0 });

// the macro, in code
const m = CA.Macros.get('autoBuyer');
assert(m && m.mode === 'flow' && !CA.Macros.problemOf('autoBuyer'), 'the Auto buyer macro compiles');
assert(CA.Macros.get('cmBuildings') === m && CA.Macros.get('cmUpgrades') === m, 'the old ids mean it');
const had = Object.values(Game.Objects).reduce((s, b) => s + b.amount, 0);
CA.Macros.runOnce('autoBuyer');
assert(Object.values(Game.Objects).reduce((s, b) => s + b.amount, 0) > had, 'one pass buys');
CA.Macros.set('cmBuildings', true, { silent: true });
assert(CA.Macros.isOn('autoBuyer'), 'switching an old id on switches it');
CA.Macros.set('autoBuyer', false, { silent: true });

// ---- an old save moves over ----
const S = CA.Settings;
const old = JSON.parse(S.serialize());
delete old.buyer;
old.macros = { custom: [], prefs: { cmBuildings: { inputs: { skip: true, reserve: 30 } } } };
old.running = ['cmBuildings'];
old.hotkeys = { ...(old.hotkeys || {}), 'macro.cmBuildings': 'KeyB' };
S.set('rememberStates', true);
old.options = { ...(old.options || {}), rememberStates: true };
S.load(JSON.stringify(old));
const bp = B.find('buildings');
assert(B.activeProfile() === 'buildings' && bp.skip === true && bp.reserve === 30, `only Best building ran: Buildings only, with its skip and reserve (${B.activeProfile()}, ${bp.skip}, ${bp.reserve})`);
assert(CA.Macros.isOn('autoBuyer'), 'and the Auto buyer runs');
assert(S.getHotkey('macro.autoBuyer') === 'KeyB', 'its hotkey carried over');
CA.Macros.set('autoBuyer', false, { silent: true });

// ---- the page ----
const ids = CA.UI.Pages.list().slice().sort((a, b) => a.order - b.order).map((p) => p.id);
assert(ids.indexOf('payback') === ids.indexOf('clickers') - 1 && CA.UI.Pages.get('payback').group === 'custom', `Payback right above Macros (${ids.join(',')})`);

// the hub at the top of the page
const doc = w.document;
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
CA.UI.Menu.openPage('payback');
await sleep(50);
const menu = () => doc.getElementById('CookieMgrMenu');
const firstCard = menu().querySelector('.ca-card');
assert(firstCard && firstCard.classList.contains('ca-ab') && /Auto buyer/.test(firstCard.textContent), 'the page opens with the Auto buyer card');
assert(menu().querySelector('[data-pp-modes] [data-pp-mode]'), 'with the payback mode chips');
assert(menu().querySelectorAll('[data-ab-use]').length === B.list().length, 'a chip a profile');
assert(menu().querySelector('[data-ab-queue] tr.front'), 'the queue, its front marked');
click(menu().querySelector('[data-ab-use="upgrades"]'));
assert(B.activeProfile() === 'upgrades', 'a profile chip makes it active');
click(menu().querySelector('[data-ab-use="payback"]'));
click(menu().querySelector('[data-ab-act="rule-cheap"]'));
assert(B.find().rules.length === 2 && B.find().rules[1].what === 'cheap', 'Cheap first adds a rule');
const sel = menu().querySelector('[data-ab-rule="1"][data-k="effect"]');
sel.value = 'never';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(B.find().rules[1].effect === 'never', 'the rule’s select changes it');
B.update('payback', { rules: [] });
click(menu().querySelector('[data-ab-act="toggle"]'));
assert(CA.Macros.isOn('autoBuyer'), 'its switch turns the Auto buyer on');
CA.Macros.set('autoBuyer', false, { silent: true });

// Buy all upgrades: every store upgrade but switches, research and the vaulted, cheapest first
const mk = (name, price, pool = '') => ({ name, dname: name, pool, bought: 0, unlocked: 1, icon: [0, 0], getPrice: () => price, buy() { if (Game.cookies >= price) { Game.cookies -= price; this.bought = 1; } }, isVaulted: () => name === 'Vaulted' });
Game.UpgradesInStore = [mk('B', 20), mk('A', 10), mk('Switch', 1, 'toggle'), mk('Research', 1, 'tech'), mk('Vaulted', 1), mk('Dear', 1e30)];
Game.cookies = 35;
assert(B.allUpgrades().map((x) => x.u.name).join() === 'A,B,Dear', 'what it covers, cheapest first');
assert(CA.Actions.get('buy.allUpgrades').run({}) === 2 && Game.cookies === 5, 'buys what it can afford');

// upgrades shown with their icon and info card: a line naming one, a macro button's "next:", an event
const kw = mk('Kitten workers', 1e40);
Game.Upgrades = { ...(Game.Upgrades || {}), 'Kitten workers': kw };
Game.UpgradesInStore = [kw];
const line = CA.UI.C.withUpgrade('next: Kitten workers — in 5m', 'Kitten workers');
assert(/class="ca-upref"/.test(line) && /data-upgrade="Kitten workers"/.test(line) && /^next: /.test(line) && / — in 5m$/.test(line), `withUpgrade: the name becomes its icon + hoverable name (${line})`);
assert(CA.UI.C.withUpgrade('a <b>', '') === 'a &lt;b&gt;', 'no upgrade: just escaped');
B.use('upgrades');
B.update('upgrades', { rules: [{ what: 'u:Kitten workers', effect: 'first' }] }); // it adds nothing here: "first" takes it anyway
assert(B.readiness().upgrade === 'Kitten workers', 'the Auto buyer’s readiness names the upgrade it waits for');
CA.Macros.setFav('autoBuyer', true);
CA.UI.Widgets.tick();
const wb = doc.querySelector('#CookieMgrWidgets [data-w-trigger="autoBuyer"]');
assert(wb && wb.parentNode.querySelector('.ca-upref[data-upgrade="Kitten workers"]'), 'its button’s next: line shows the upgrade with its icon');
CA.Macros.setFav('autoBuyer', false);
B.update('upgrades', { rules: [] });
B.use('payback');
Game.UpgradesInStore = [];
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
