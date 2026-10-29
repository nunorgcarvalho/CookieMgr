// Purchase priority: the Auto buyer puts every purchase on one scale. Each thing in the queue gets an implied
// payback period (its payback period after the rules' weights) and a score — 100 for the best, 10 points less for
// each doubling. What a profile keeps (minutes of CpS, Lucky!, Conjure, Frenzy Lucky!, the garden's replant) is in
// the queue too, as priorities it saves up for: first (ahead of everything — as before) or placed at a score (what
// scores that or more may be bought ahead of it). The Payback page and the Manager widget say what it's saving for.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, errors } = g;
const CA = w.CookieMgr;
const doc = w.document;
const M = makeGarden(Game);
M.plotLimits = [[2, 2, 4, 4], [2, 2, 5, 4], [2, 2, 5, 5], [1, 2, 5, 5], [1, 1, 5, 5], [1, 1, 6, 5], [1, 1, 6, 6], [0, 1, 6, 6], [0, 0, 6, 6]];
Game.Objects.Farm.level = 8;
await sleep(400);
const B = CA.AutoBuyer;
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false }));
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.cookies = 1e6;
Game.CalculateGains();
M.plants.goldenClover.unlocked = 1;
M.plants.nursetulip.unlocked = 1;
CA.Garden.use('tulipCombos');
B.use('payback');
B.update('payback', { cheapBulk: 0, reserve: 0, banks: [], rules: [] });

// ---- the score: 100 the best, 10 points a doubling ----
let q = B.queue();
const things = q.items.filter((x) => x.kind !== 'bank');
assert(things.length >= 3 && things[0].score === 100, `the front scores 100 (${things.map((x) => `${x.label} ${x.score && x.score.toFixed(1)}`).join(', ')})`);
assert(things.every((x) => x.ipp === x.pp), 'no weights: the implied payback period is the payback period');
const best = things[0].ipp;
assert(
  things.every((x) => Math.abs(x.score - Math.max(0, 100 - 10 * Math.log2(x.ipp / best))) < 1e-9),
  'each scores 100 − 10 × log2(its implied PP ÷ the best)'
);
assert(things.every((x, i) => !i || x.score <= things[i - 1].score), 'scores fall down the queue');
assert(B.scoreOf(best * 2, best) === 90 && B.scoreOf(best * 4, best) === 80 && B.scoreOf(best * 4096, best) === 0, 'twice as long: 90, four times: 80, and never below 0');
assert(Math.abs(B.ippOf(80, best) - best * 4) < 1e-6, 'a score stands for an implied payback period');
// a weight ×2 costs 10 points
const second = things[1];
B.update('payback', { rules: [{ what: `b:${second.name}`, effect: 'weight', k: 2 }] });
q = B.queue();
const weighted = q.items.find((x) => x.key === second.key);
assert(weighted && Math.abs(weighted.ipp - second.pp * 2) < 1e-6, 'a weight ×2 doubles its implied payback period');
assert(Math.abs(weighted.score - (second.score - 10)) < 1e-9 || weighted.score === 0, `… and costs it 10 points (${second.score} → ${weighted.score})`);
assert(value('buyer.score', second.key) === weighted.score && value('buyer.impliedPayback', second.key) === weighted.ipp, 'buyer.score and buyer.impliedPayback');
B.update('payback', { rules: [] });

// ---- thresholds are priorities in the queue: first (as before) ----
B.update('payback', { banks: ['lucky', 'garden'] });
const lucky = value('bank.lucky');
const garden = CA.Garden.layoutCost();
assert(B.find('payback').at.lucky === 'first' && B.find('payback').at.garden === 'first' && B.find('payback').at.cps === 'first', 'a threshold comes first unless placed');
Game.cookies = Math.min(lucky, garden) / 2;
q = B.queue();
const small = garden < lucky ? 'bank:garden' : 'bank:lucky';
assert(q.items[0].kind === 'bank' && q.items[1].kind === 'bank' && q.items[0].key === small, `both lead the queue, the smaller first (${q.items.slice(0, 2).map((x) => x.key)})`);
assert(q.items[0].label && q.items[0].price === Math.min(lucky, garden) && !q.items[0].kept, 'what it keeps is its price; not kept yet');
assert(value('buyer.waitingFor') === small && B.waitingFor().kind === 'bank', `saving for it (${value('buyer.waitingFor')})`);
assert(B.next() && B.next().kind !== 'bank' && value('buyer.next') === B.next().key, 'buyer.next() still names the thing it buys after');
assert(value('buyer.budget') < 0 && B.buyNext() === 0, 'nothing is bought into it');
assert(/saving for/.test(B.readiness().text), `its button says so (${B.readiness().text})`);
const gardenItem = q.items.find((x) => x.key === 'bank:garden');
assert(/30 seeds: 22 Golden clover, 8 Nursetulip/.test(gardenItem.detail) && /30 to plant now/.test(gardenItem.detail), `the garden's: what it plants (${gardenItem.detail})`);
// covered: kept, and the buyer moves on — spending only above it
Game.cookies = Math.max(lucky, garden) + 1e9;
q = B.queue();
assert(q.items.filter((x) => x.kind === 'bank').every((x) => x.kept), 'both kept once the bank covers them');
assert(value('buyer.waitingFor') === '' && q.next && q.keep === Math.max(lucky, garden), 'it can buy now, keeping the highest');
assert(value('buyer.budget') === Game.cookies - Math.max(lucky, garden), 'its budget: the bank less what’s kept ahead');
assert(B.buyNext() === 1, 'and buys above it');

// ---- placed at a score: what scores that or more goes ahead (and may spend into it) ----
B.update('payback', { banks: ['lucky'], at: { lucky: 50 } });
Game.cookies = lucky / 2;
q = B.queue();
const li = q.items.findIndex((x) => x.key === 'bank:lucky');
const bank = q.items[li];
assert(li > 0 && q.items.slice(0, li).every((x) => x.score >= 50) && q.items.slice(li + 1).every((x) => x.kind === 'bank' || x.score < 50), `Lucky! sits after what scores 50+ (at ${li + 1} of ${q.items.length})`);
assert(bank.score === 50 && Math.abs(bank.ipp - B.ippOf(50, q.best)) < 1e-6, 'its score is its place; its implied payback period the one that stands for');
const front = q.items[0];
assert(q.next === front && value('buyer.waitingFor') !== 'bank:lucky', 'what scores above it is bought first, Lucky! or not');
if (front.price <= Game.cookies) assert(B.buyNext() === 1, 'it spends into the Lucky! bank for what scores above it');
// nothing scores 50+ any more: it saves for Lucky!
B.update('payback', { at: { lucky: 100 } });
q = B.queue();
assert(q.items[0].key === 'bank:lucky' || q.items[0].score >= 100, 'placed at 100: only the very best goes ahead of it');
B.update('payback', { at: { lucky: 'first' } });
assert(B.queue().items[0].key === 'bank:lucky', 'first again: ahead of everything');

// ---- saved and loaded; profiles saved before priorities: everything first ----
B.update('payback', { at: { lucky: 70, garden: 30 } });
const S = CA.Settings;
const saved = JSON.parse(S.serialize());
B.update('payback', { at: {} });
S.load(JSON.stringify(saved));
assert(B.find('payback').at.lucky === 70 && B.find('payback').at.garden === 30, 'places are saved');
assert(B.update('payback', { at: { lucky: 'nonsense', garden: 250 } }).at.lucky === 'first' && B.find('payback').at.garden === 100, 'kept to first or 0–100');
const old = JSON.parse(JSON.stringify(saved));
old.buyer.profiles.forEach((p) => delete p.at);
S.load(JSON.stringify(old));
assert(B.list().every((p) => B.THRESHOLDS.every((id) => p.at[id] === 'first')), 'an older save: every threshold first');

// ---- the Payback page: the queue's columns, its priority rows, the editor's places ----
const menu = () => doc.getElementById('CookieMgrMenu');
B.update('payback', { banks: ['lucky', 'garden'], at: { lucky: 'first', garden: 'first' } });
Game.cookies = Math.min(lucky, garden) / 2;
CA.UI.Menu.openPage('payback');
await sleep(50);
const heads = [...menu().querySelectorAll('.ca-ab-queue th')].map((th) => th.textContent);
assert(heads.includes('Implied PP') && heads.includes('Score'), `the queue: Implied PP and Score columns (${heads})`);
const bankRows = menu().querySelectorAll('.ca-ab-queue tr.bank');
assert(bankRows.length === 2 && menu().querySelector('.ca-ab-queue tr.saving'), 'its thresholds: rows of their own, the one it’s saving for marked');
assert(/priority: first/.test(bankRows[0].textContent), 'with their priority');
assert(menu().querySelector('.ca-ab-queue .ca-ab-score'), 'scores drawn with a bar');
const nx = menu().querySelector('.ca-ab-next.saving');
assert(nx && /Saving for/.test(nx.textContent) && /then:/.test(nx.textContent), `the Auto buyer card: what it saves for, then what it buys (${nx && nx.textContent})`);
const sel = menu().querySelector('[data-ab-at="lucky"]');
assert(sel && sel.value === 'first' && menu().querySelector('[data-ab-at="garden"]'), 'the editor: a place a threshold');
sel.value = '60';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(B.find('payback').at.lucky === 60, 'picking a place sets it');
assert(/each in its place/.test(menu().querySelector('[data-ab-keep]').textContent), 'the keep line says they’re placed');
B.update('payback', { at: { lucky: 'first' } });

// ---- the Manager widget's row: what it's saving for, and why ----
CA.Macros.set('manager', false, { silent: true });
CA.Managers.goTo(1);
CA.Managers.step();
const Wd = CA.UI.Widgets;
const inst = Wd.add('manager');
Wd.render();
const row = () => doc.querySelector(`[data-widget="${inst.id}"] .ca-mw-p-buyer`);
if (CA.UI.ManagerWidget.runsBuyer()) {
  const sv = row().querySelector('.ca-wbuy-next.saving');
  assert(sv && /Saving: /.test(row().querySelector('.ca-wbuy-text b').textContent), `saving: shown first (${row().querySelector('.ca-wbuy-text').textContent})`);
  const card = sv.querySelector('.ca-wpop').textContent;
  assert(/why first/.test(card) && /then/.test(card), `its card: why it comes first, and what's after it (${card})`);
  Game.cookies = Math.max(lucky, garden) + 1e9;
  Wd.tick();
  const txt = row().querySelector('.ca-wbuy-text').textContent;
  assert(!row().querySelector('.ca-wbuy-next.saving') && /score/.test(txt), `covered: what it buys next, with its score (${txt})`);
  assert(/why next/.test(row().querySelector('.ca-wbuy-next .ca-wpop').textContent), 'its card says why it’s next');
} else assert(false, 'the stage runs the Auto buyer');

assert(errors.length === 0, `no runtime errors (${errors.length}): ${errors.slice(0, 3).join(' | ')}`);
done();
process.exit();
