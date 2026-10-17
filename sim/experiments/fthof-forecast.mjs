// Does Force the Hand of Fate on combos earn more reading the forecast? Off, "good" only, and "good" with skipping ahead — at two magic levels.
//
//   npm run sim -- experiment fthof-forecast [--hours 24] [--seeds 4] [--magic 90,300] [--modes off,good0,good1,good2,good3] [--jobs N] [--json out.json]
//
// The exact simulator (the game's code, CookieMgr's code). One economy for every run: a game played
// 6 h from scratch by the payback strategy (made once, cached in sim/out/), then Wizard towers
// given (free, as the game's getFree does) up to the magic bar wanted — the game's own formula:
// 400 towers ≈ 90 magic, 7000 ≈ 300 — level 1 — and the golden cookie upgrades (Lucky day, Serendipity,
// Get lucky: a combo needs them). From there CookieMgr clicks the big cookie (20/s) and
// pops golden cookies, and its "Force the Hand of Fate on combos" macro (grimoire.js) casts:
//   off      on every combo, whatever the cast gives
//   goodN    forecast "good" — only when the next cast gives a click frenzy or a building special
//            (or a frenzy, for a combo without one) — and skipAhead N: Haggler's Charm to bring a
//            good cast closer, with spare magic (0: never)
// Nothing is bought, so what changes is only what the spells bring. Each seed gets its own game
// seed (Game.seed: what the casts' outcomes come from) and its own golden cookies; every mode plays
// the same seeds, so the difference per seed is a paired comparison.
// Reported: cookies baked over the run, the biggest combo (the most cookies baked in any 60 s), the
// highest CpS multiplier reached (buffed ÷ unbuffed, clicks aside), and the casts.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const hours = Number(arg('hours', 24));
const TOWERS = { 90: 400, 300: 7000 };
const GOLDEN = ['Lucky day', 'Serendipity', 'Get lucky'];
const MODES = String(arg('modes', 'off,good0,good1,good2,good3')).split(',');
const MAGICS = String(arg('magic', '90,300')).split(',').map(Number);
const short = (n) => {
  const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  const k = Math.max(0, Math.min(u.length - 1, Math.floor(Math.log10(Math.abs(n) || 1) / 3)));
  return `${(n / 10 ** (3 * k)).toFixed(2)}${u[k]}`;
};

/** The economy every run starts from: 6 h of the payback strategy, from scratch (cached). */
async function baseSave() {
  const { SIM_VERSION } = await import('../sim.mjs');
  const { GAME_VERSION } = await import('../game/fetch.mjs');
  const file = path.join(HERE, '..', 'out', `fthof-base-${GAME_VERSION}-${SIM_VERSION}.txt`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const { runOne } = await import('../runner.mjs');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  process.stderr.write('  making the starting economy (6 h of the payback strategy)…\n');
  await runOne({ strategy: 'payback', seed: 42, span: '6h', saveOut: file });
  return fs.readFileSync(file, 'utf8');
}

async function one(mode, magic, seed) {
  const { createSim } = await import('../sim.mjs');
  const save = await baseSave();
  const sim = await createSim({ seed, save, sampleEvery: 0 });
  const { Game, CA } = sim;
  // a seed of its own: Force the Hand of Fate's outcomes come from Game.seed and the casts so far
  Game.seed = Game.makeSeed();
  // the golden cookie upgrades every combo player has: without Serendipity and Get lucky the next
  // golden cookie comes 150 s at the soonest and a Frenzy lasts 77 s — popped at once, no two ever meet
  GOLDEN.forEach((u) => Game.Upgrades[u].earn());
  CA.Macros.list().forEach((m) => CA.Macros.isOn(m.id) && CA.Macros.set(m.id, false, { silent: true }));
  const WT = Game.Objects['Wizard tower'];
  const want = TOWERS[magic] || magic;
  if (WT.amount < want) WT.getFree(want - WT.amount);
  WT.level = Math.max(1, WT.level);
  Game.LoadMinigames();
  sim.run({ seconds: 3 });
  const M = WT.minigame;
  if (!M) throw new Error('no Grimoire');
  M.computeMagicM();
  M.magic = M.magicM;
  const id = CA.Grimoire.AUTO_ID;
  CA.Macros.setInput(id, 'forecast', mode === 'off' ? 'off' : 'good');
  CA.Macros.setInput(id, 'skipAhead', mode === 'off' ? 0 : Number(mode.replace(/\D/g, '')) || 0);
  sim.macro('bigCookie');
  sim.macro('golden');
  sim.macro(id);
  const baked0 = Game.cookiesEarned;
  const window = new Array(60).fill(0);
  let prev = Game.cookiesEarned;
  let best60 = 0;
  let sum60 = 0;
  let bestMult = 1;
  const wall = Date.now();
  for (let s = 0; s < hours * 3600; s++) {
    sim.run({ seconds: 1 });
    const d = Game.cookiesEarned - prev;
    prev = Game.cookiesEarned;
    sum60 += d - window[s % 60];
    window[s % 60] = d;
    if (sum60 > best60) best60 = sum60;
    if (Game.unbuffedCps > 0) bestMult = Math.max(bestMult, Game.cookiesPs / Game.unbuffedCps);
  }
  const casts = (spell) => sim.actions.filter((a) => a.id === 'spell.cast' && a.params && a.params.spell === spell).reduce((n, a) => n + a.n, 0);
  return { mode, magic, seed, magicM: M.magicM, baked: Game.cookiesEarned - baked0, best60, bestMult, fthof: casts('hand of fate'), haggler: casts("haggler's charm"), unbuffed: Game.unbuffedCps, wallS: (Date.now() - wall) / 1000 };
}

if (process.argv.includes('--one')) {
  const r = await one(arg('mode', 'off'), Number(arg('magicLevel', 90)), Number(arg('seed', 1)));
  process.send(r);
  process.exit(0);
} else {
  const seeds = Number(arg('seeds', 4));
  const jobs = Number(arg('jobs', Math.max(1, Math.min(6, Math.floor(os.cpus().length / 2)))));
  await baseSave(); // once, before the runs fan out
  const specs = [];
  for (const magic of MAGICS) for (let s = 1; s <= seeds; s++) MODES.forEach((m) => specs.push([m, magic, s]));
  const me = fileURLToPath(import.meta.url);
  const results = [];
  const t0 = Date.now();
  let next = 0;
  await new Promise((resolve) => {
    let running = 0;
    const launch = () => {
      if (next >= specs.length) return running || resolve();
      const [m, magic, s] = specs[next++];
      running++;
      const c = fork(me, ['--one', '--mode', m, '--magicLevel', String(magic), '--seed', String(s), '--hours', String(hours)], { silent: true });
      let err = '';
      c.stderr.on('data', (d) => (err += d));
      c.on('message', (r) => results.push(r));
      c.on('exit', (code) => {
        running--;
        if (code) console.error(`\nrun ${m} ${magic} seed ${s} failed:\n${err.slice(-800)}`);
        process.stderr.write(`\r  ${results.length}/${specs.length} runs (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
        launch();
      });
    };
    for (let k = 0; k < jobs; k++) launch();
  });
  process.stderr.write('\n');
  const stat = (xs) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
    return { m, se: sd / Math.sqrt(xs.length) };
  };
  console.log(`Force the Hand of Fate on combos — ${hours} h per run, ${seeds} seeds, clicking 20/s, golden cookies popped, nothing bought\n`);
  for (const magic of MAGICS) {
    const rs = results.filter((r) => r.magic === magic);
    if (!rs.length) continue;
    const base = (seed) => rs.find((r) => r.mode === 'off' && r.seed === seed);
    console.log(`max magic ${Math.round(rs[0].magicM)} (${TOWERS[magic] || magic} wizard towers), unbuffed CpS ${short(rs[0].unbuffed)}/s`);
    console.log(`  ${'mode'.padEnd(7)} ${'baked (mean ± se)'.padEnd(22)} ${'vs off, per seed'.padEnd(44)} ${'biggest 60 s'.padEnd(20)} ${'top ×CpS'.padEnd(10)} FtHoF  Haggler  wall s`);
    MODES.forEach((m) => {
      const ms = rs.filter((r) => r.mode === m).sort((a, b) => a.seed - b.seed);
      if (!ms.length) return;
      const b = stat(ms.map((r) => r.baked));
      const big = stat(ms.map((r) => r.best60));
      const mult = stat(ms.map((r) => r.bestMult));
      const deltas = ms.map((r) => (base(r.seed) ? r.baked / base(r.seed).baked - 1 : NaN));
      const d = stat(deltas.filter(Number.isFinite));
      const per = m === 'off' ? '—' : `${deltas.map((x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`).join(' ')} → ${d.m >= 0 ? '+' : ''}${(d.m * 100).toFixed(1)} ± ${(d.se * 100).toFixed(1)}%`;
      const avg = (k) => ms.reduce((a, r) => a + r[k], 0) / ms.length;
      console.log(
        `  ${m.padEnd(7)} ${`${short(b.m)} ± ${short(b.se)}`.padEnd(22)} ${per.padEnd(44)} ${`${short(big.m)} ± ${short(big.se)}`.padEnd(20)} ${`×${mult.m.toFixed(0)}`.padEnd(10)} ${avg('fthof').toFixed(1).padEnd(6)} ${avg('haggler').toFixed(1).padEnd(8)} ${avg('wallS').toFixed(0)}`
      );
    });
    console.log('');
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(results, null, 1));
  console.log(`${results.length} runs in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
