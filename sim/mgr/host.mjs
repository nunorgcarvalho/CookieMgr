// CookieMgr, headless, inside the simulated page: the add-on's own core and feature modules
// (src/core, src/features — the layers that never touch the UI, which a contract test guarantees),
// straight from the source in this repo, registered through the game's real mod API
// (Game.registerMod). So the simulator's actions, values, macros, gardeners and event log *are*
// CookieMgr's: a strategy written for the simulator is code the add-on runs as it is, and back.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The add-on's module list, in load order (from build.mjs — the one place it's written down). */
export function moduleList() {
  const build = fs.readFileSync(path.join(ROOT, 'build.mjs'), 'utf8');
  const block = build.match(/const MODULES = \[([\s\S]*?)\];/);
  if (!block) throw new Error('build.mjs: no MODULES list');
  return [...block[1].matchAll(/'([^']+\.js)'/g)].map((m) => m[1]);
}
/** Staging modules (sim/mgr/staging/*.js): add-on modules written for the simulator first — [{ file, name, code }]. */
export function stagingModules() {
  const dir = path.join(ROOT, 'sim', 'mgr', 'staging');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .sort()
    .map((f) => {
      const code = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
      const m = code.match(/^CA\.(\w+) = /m);
      return { file: path.join(dir, f), name: m ? m[1] : null, code };
    });
}
/** Only what runs without a screen: core/ and features/ (not ui/, not main.js). */
export const headlessModules = () => moduleList().filter((f) => f.startsWith('core/') || f.startsWith('features/'));

/** The modules main.js starts, in its order — minus the UI's (and the update check / Cookie Monster loader). */
const START = ['EventLog', 'GameActions', 'Macros', 'Grimoire', 'Pantheon', 'Garden', 'GardenHistory', 'Shop', 'AutoBuy', 'Seasons', 'Stocks', 'StockLog', 'History', 'GameStates', 'Recorder', 'GameEvents', 'NotifyTips', 'Hotkeys', 'Ascension'];
/** Ones that only record history for the add-on's charts — off by default (they cost time, nothing reads them here). History stays on: it logs golden cookies and buffs into the event log. */
export const RECORDING = ['Recorder', 'GardenHistory', 'StockLog'];

/**
 * Loads CookieMgr into a booted game (game/boot.mjs). Options:
 *   save       CookieMgr's own save (CA.Settings.serialize()'s string — the add-on's export) to start from
 *   record     also start the history recorders (RECORDING)
 *   logAll     log every action call, even ones that did nothing (default: only ones that did something)
 * Returns { CA, actions: [{ t, id, params, n }], events() }.
 */
export function loadCookieMgr(game, { save = '', record = false, logAll = false } = {}) {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const parts = ["(function () {\n'use strict';\nconst CA = {};", `CA.VERSION = ${JSON.stringify(pkg.version)};`, "CA.CSS = '';"];
  for (const f of headlessModules()) parts.push(`// ---- src/${f}\n` + fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').replace(/\r\n/g, '\n'));
  const staging = stagingModules();
  for (const m of staging) parts.push(`// ---- sim/mgr/staging/${path.basename(m.file)}\n${m.code}`);
  parts.push('globalThis.CookieMgr = CA;\n})();');
  game.run(parts.join('\n'), 'CookieMgr (headless)');
  const CA = game.ctx.CookieMgr;
  const Game = game.Game;

  // the action log: every action a macro, a gardener or the simulator runs, at simulated time
  const actions = [];
  const run = CA.Actions.run;
  CA.Actions.run = (id, params) => {
    const n = run(id, params);
    if (n || logAll) actions.push({ t: game.clock.now, id, params: params && Object.keys(params).length ? { ...params } : undefined, n });
    return n;
  };

  const start = START.filter((k) => record || !RECORDING.includes(k)).concat(staging.map((m) => m.name).filter(Boolean));
  const failed = [];
  const mod = {
    init() {
      // History (golden cookie and buff events) follows the Recorder's on/off option: without the
      // Recorder, the option still has to exist (on)
      if (!start.includes('Recorder')) CA.Settings.defineOption({ key: 'trackHistory', group: 'general', name: 'Record history', desc: '', default: true });
      start.forEach((k) => {
        try {
          CA[k].init();
        } catch (e) {
          failed.push(`${k}: ${e && e.message}`);
        }
      });
      CA.Macros.ready();
    },
    save: () => CA.Settings.serialize(),
    load: (str) => CA.Settings.load(str),
  };
  let loaded = false;
  if (save) Game.modSaveData[CA.ID] = save;
  const load = mod.load;
  mod.load = (str) => {
    loaded = true;
    load(str);
  };
  Game.registerMod(CA.ID, mod);
  if (!loaded) mod.load('');
  if (failed.length) console.error('[sim] CookieMgr modules that failed to start:', failed.join('; '));
  return { CA, actions, failed, events: (types) => CA.EventLog.list(types) };
}
