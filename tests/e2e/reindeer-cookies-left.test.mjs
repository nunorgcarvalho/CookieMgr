// The Manager widget names a season's last few drops instead of counting them: in Nunix late game's
// Reindeer stage, "Next stage when" lists the reindeer cookies still to get (bright: in the store).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const G = CA.Managers;

// the game's lists (main.js), with the reindeer cookies' icons
Game.santaDrops = ['Increased merriness', 'Improved jolliness', 'A lump of coal', 'An itchy sweater', 'Reindeer baking grounds', 'Weighted sleighs', 'Ho ho ho-flavored frosting', 'Season savings', 'Toy workshop', 'Naughty list', 'Santa\'s bottomless bag', 'Santa\'s helpers', 'Santa\'s legacy', 'Santa\'s milk and cookies'];
Game.reindeerDrops = ['Christmas tree biscuits', 'Snowflake biscuits', 'Snowman biscuits', 'Holly biscuits', 'Candy cane biscuits', 'Bell biscuits', 'Present biscuits'];
Game.easterEggs = Array.from({ length: 20 }, (_, i) => `Egg ${i + 1}`);
Game.Upgrades = Game.Upgrades || {};
Game.reindeerDrops.forEach((n, i) => (Game.Upgrades[n] = { name: n, icon: [12 + i, 10], unlocked: 0, bought: 0 }));

// Christmas's upgrades all in, Santa maxed, three reindeer cookies still to get (one in the store)
const deer = Game.reindeerDrops.slice();
const left = deer.slice(-3);
const owned = ['A festive hat', ...Game.santaDrops, ...deer.slice(0, -3)];
const before = Game.Has;
Game.Has = (n) => owned.includes(n) || before(n);
Game.santaLevel = 14;
Game.Upgrades[left[0]].unlocked = 1;

eq(JSON.stringify(CA.Seasons.missing('christmas')), JSON.stringify(left), 'missing: the reindeer cookies not owned, in order');
eq(JSON.stringify(CA.Seasons.missing('christmas', 'upgrades')), '[]', 'none of the upgrades');

const nunix = G.find('nunixLateGame');
const u = G.untilParts(nunix.stages[1].until);
assert(u && JSON.stringify(u.parts[0].missing) === JSON.stringify(left), `the until part names them: ${u && JSON.stringify(u.parts[0].missing)}`);
const drops = G.untilParts(nunix.stages[0].until);
assert(drops.parts.every((p) => Array.isArray(p.missing)), 'every season.complete part has its missing list');
assert(!G.untilParts('cookies() > 10').parts[0].missing, 'other conditions: none');

CA.Macros.set('manager', false, { silent: true });
G.goTo(2);
G.step();
const inst = CA.UI.Widgets.add('manager');
inst.stats = ['until'];
const h = CA.UI.ManagerWidget.html(inst);
assert(/<em>3 left<\/em>/.test(h) && !/\d+\/22/.test(h), 'Reindeer: "3 left", not counted out of 22');
left.forEach((n) => assert(h.includes(`<span>${n}</span>`), `names ${n}`));
assert(!deer.slice(0, -3).some((n) => h.includes(`<span>${n}</span>`)), 'not the ones owned');
assert((h.match(/ca-mw-leftitem store/g) || []).length === 1 && /ca-mw-leftico/.test(h), 'the one in the store is bright; each has its icon');

// many left (the Drops stage, Easter's 20 eggs): still counted with a bar
Game.Has = before;
G.goTo(1);
G.step();
const h0 = CA.UI.ManagerWidget.html(inst);
assert(/\d+\/20<\/em>/.test(h0) && !/ca-mw-left"/.test(h0.split('Easter')[1].split('ca-mw-cond')[0]), 'Easter with all 20 to get: counted');

CA.Macros.list().forEach((m) => CA.Macros.isOn(m.id) && CA.Macros.set(m.id, false, { silent: true }));
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();

function eq(got, want, what) {
  assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);
}
