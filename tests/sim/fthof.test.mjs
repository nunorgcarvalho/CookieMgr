// Force the Hand of Fate, forecast (features/fthof.js), against the game itself: its generator gives what
// the game's Math.seedrandom gives; then, over many saves and states — seasons (with and without a
// cookie picture draw), fewer and more than 10 buildings, Dragonflight, golden cookies on screen (the
// backfire chance), casts of other spells in between — each forecast is checked against a real cast:
// the golden cookie it summons, its outcome and whether it's a wrath cookie. Gambler's Fever Dream too:
// the spell it picks, and what Force the Hand of Fate gives through it.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 21 });
const { Game, CA } = sim;
const run = (code) => sim.game.run(code, 'test');
sim.run({ seconds: 2 });
Game.cookies = 1e15;
Game.cookiesEarned = 1e15;
Game.buyMode = 1;
Game.Objects['Wizard tower'].buy(400); // magic enough (the game recomputes the maximum every tick)
Game.Objects['Wizard tower'].level = Math.max(1, Game.Objects['Wizard tower'].level);
Game.LoadMinigames && Game.LoadMinigames();
sim.run({ seconds: 3 });
const M = Game.Objects['Wizard tower'].minigame;
assert(M && M.spells && M.spells['hand of fate'], 'the Grimoire is there');
const F = CA.Fthof;

// ---- the generator: the game's own, draw for draw
let same = 0;
const seeds = ['a/0', 'kqzxw/17', 'Zz9 x/123456', '/', '', 'é/3'];
seeds.forEach((s) => {
  const ours = F.seeded(s);
  const theirs = run(`(function () { var keep = Math.random; Math.seedrandom(${JSON.stringify(s)}); var out = []; for (var i = 0; i < 40; i++) out.push(Math.random()); Math.random = keep; return out; })()`);
  if (theirs.every((v) => v === ours())) same++;
});
assert(same === seeds.length, `the generator: 40 draws the same as Math.seedrandom for ${same} / ${seeds.length} seeds`);
const before = run('Math.random');
F.forecast(20);
assert(run('Math.random') === before, 'forecasting leaves the game’s Math.random alone');

// ---- forecasts against real casts
const clear = () => {
  Game.shimmers.slice().forEach((s) => s.die && s.die());
  Object.values(Game.buffs).forEach((b) => (b.time = 0));
  sim.run({ ms: 100 });
};
const lastShimmer = () => Game.shimmers[Game.shimmers.length - 1];
let checked = 0;
const wrong = [];
const tally = {};
const SEASONS = ['', 'christmas', 'easter', 'halloween', 'valentines', 'fools'];
function castAndCheck(label) {
  const f = F.forecast(1)[0];
  M.magic = M.magicM;
  const n0 = Game.shimmers.length;
  const ok = M.castSpell(M.spells['hand of fate']);
  const s = lastShimmer();
  checked++;
  if (!ok || Game.shimmers.length !== n0 + 1 || !s) return wrong.push(`${label}: no cast`);
  tally[s.force] = (tally[s.force] || 0) + 1;
  if (s.force !== f.outcome || !!s.wrath !== f.wrath) wrong.push(`${label}: forecast ${f.outcome}${f.wrath ? ' (wrath)' : ''}, the game ${s.force}${s.wrath ? ' (wrath)' : ''}`);
}

for (let save = 0; save < 12; save++) {
  Game.seed = `${'abcdefghijkl'[save]}${save * 7}x${save % 3}`;
  M.spellsCastTotal = save * 11;
  Game.season = SEASONS[save % SEASONS.length];
  Game.BuildingsOwned = save % 2 ? 5 : 400; // the Building special draw only with 10+
  for (let i = 0; i < 15; i++) {
    clear();
    if (i % 5 === 3) Game.gainBuff('dragonflight', 10, 1111); // no Click frenzy
    if (i % 4 === 2) {
      // a golden cookie on screen: +15% backfire
      new Game.shimmer('golden', { noWrath: true });
    }
    if (i % 6 === 5) {
      // another spell in between moves the seed on
      M.magic = M.magicM;
      M.castSpell(M.spells["haggler's charm"]);
    }
    castAndCheck(`save ${save} (${Game.season || 'no season'}, ${Game.BuildingsOwned} buildings) cast ${i}`);
  }
}
assert(!wrong.length, `${checked} casts, ${checked - wrong.length} as forecast${wrong.length ? ` — ${wrong.slice(0, 4).join('; ')}` : ''}`);
assert(Object.keys(tally).length >= 6 && tally['building special'] > 0 && (tally.clot || tally['ruin cookies']), `a spread of outcomes: ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', ')}`);

// ---- further ahead: the n-th cast
Game.seed = 'ahead';
M.spellsCastTotal = 40;
Game.season = '';
clear();
const ahead = F.forecast(5).map((x) => x.outcome);
const real = [];
for (let i = 0; i < 5; i++) {
  clear();
  M.magic = M.magicM;
  M.castSpell(M.spells['hand of fate']);
  real.push(lastShimmer().force);
}
assert(ahead.join() === real.join(), `five casts ahead: ${ahead.join(', ')}`);

// ---- Gambler's Fever Dream: the spell it picks, and Force the Hand of Fate through it
let gfdChecked = 0;
const gfdWrong = [];
for (let k = 0; k < 40 && gfdChecked < 6; k++) {
  Game.seed = `gfd${k}`;
  M.spellsCastTotal = k;
  clear();
  M.magic = M.magicM;
  const f = F.forecast(1)[0];
  if (!f.gfd || f.gfd.spell !== 'hand of fate') continue;
  const n0 = Game.shimmers.length;
  M.castSpell(M.spells["gambler's fever dream"]);
  sim.run({ seconds: 2 }); // it casts a second later
  const s = lastShimmer();
  gfdChecked++;
  if (Game.shimmers.length !== n0 + 1 || s.force !== f.gfd.fthof.outcome || !!s.wrath !== f.gfd.fthof.wrath) gfdWrong.push(`gfd${k}: forecast ${f.gfd.fthof.outcome}, the game ${s && s.force}`);
}
assert(gfdChecked >= 3 && !gfdWrong.length, `Gambler's Fever Dream → Force the Hand of Fate: ${gfdChecked} as forecast${gfdWrong.length ? ` — ${gfdWrong.join('; ')}` : ''}`);

// ---- words
Game.seed = 'words';
M.spellsCastTotal = 0;
clear();
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);
const f5 = F.forecast(30);
assert(V('fthof.next') === f5[0].outcome && V('fthof.nextIs', f5[0].outcome) === true && V('fthof.after', 3) === f5[2].outcome, `fthof.next / nextIs / after (${f5.slice(0, 3).map((x) => x.outcome).join(', ')})`);
const firstFrenzy = f5.findIndex((x) => x.outcome === 'frenzy');
assert(V('fthof.castsUntil', 'frenzy') === firstFrenzy && Math.abs(V('fthof.backfireChance') - M.getFailChance(M.spells['hand of fate'])) < 1e-12, `fthof.castsUntil(frenzy) ${firstFrenzy}, fthof.backfireChance`);

// ---- cached (v3.12.2): what's asked often is worked out once per state — and equals working it out afresh
// as the state changes: a cast, the season, the building count crossing 10, a golden cookie appearing
// (the backfire chance), Dragonflight, the grandmapocalypse (which mustn't matter: the cookie is forced)
const fc = () => M.getFailChance(M.spells['hand of fate']);
const fresh = (k) => Array.from({ length: k }, (_, i) => F.castAt(`${Game.seed}/${M.spellsCastTotal + i}`, fc()).outcome);
const cachedAgrees = (label) => {
  const want = fresh(100);
  const got = F.forecast(30, { gfd: false }).map((x) => x.outcome);
  const until = ['frenzy', 'click frenzy', 'building special', 'clot'].every((o) => V('fthof.castsUntil', o) === want.indexOf(o));
  assert(got.join() === want.slice(0, 30).join() && V('fthof.next') === want[0] && V('fthof.after', 7) === want[6] && until, `cached = afresh: ${label}`);
};
Game.seed = 'cache';
M.spellsCastTotal = 3;
Game.season = '';
Game.BuildingsOwned = 400;
clear();
cachedAgrees('as it is');
M.magic = M.magicM;
M.castSpell(M.spells["haggler's charm"]);
cachedAgrees('after a cast');
Game.season = 'easter';
cachedAgrees('Easter (a picture draw)');
Game.season = 'christmas';
cachedAgrees('Christmas (none)');
Game.BuildingsOwned = 9;
cachedAgrees('9 buildings');
Game.BuildingsOwned = 10;
cachedAgrees('10 buildings');
new Game.shimmer('golden', { noWrath: true });
cachedAgrees('a golden cookie on screen');
Game.gainBuff('dragonflight', 10, 1111);
cachedAgrees('Dragonflight');
clear();
const wrathBefore = F.forecast(30, { gfd: false }).map((x) => x.outcome).join();
Game.elderWrath = 3;
assert(F.forecast(30, { gfd: false }).map((x) => x.outcome).join() === wrathBefore, 'the grandmapocalypse changes nothing (the cookie is forced golden or wrath)');
cachedAgrees('the grandmapocalypse');
Game.elderWrath = 0;

// ---- and cheap: a macro asking four things every 250 ms for a minute seeds next to nothing
Game.seed = 'perf';
M.spellsCastTotal = 0;
clear();
V('fthof.next'); // the state's rows: worked out once…
const s0 = F.seedings();
const t0 = Date.now();
for (let tick = 0; tick < 240; tick++) {
  V('fthof.castsUntil', 'click frenzy');
  V('fthof.castsUntil', 'building special');
  V('fthof.nextIs', 'frenzy');
  V('fthof.after', 2);
}
const perMinute = F.seedings() - s0;
const ms = Date.now() - t0;
assert(perMinute <= 100, `960 asks in a minute of ticks: ${perMinute} seedings (at most the 100 casts looked at once; v3.12.1: ~500 an ask), ${ms} ms`);
const s1 = F.seedings();
M.magic = M.magicM;
M.castSpell(M.spells["haggler's charm"]);
V('fthof.castsUntil', 'building special');
assert(F.seedings() - s1 <= 100, `after a cast: worked out once more (${F.seedings() - s1} seedings)`);
const s2 = F.seedings();
V('fthof.next');
assert(F.seedings() === s2, 'and asking again: none');

done();
process.exit();
