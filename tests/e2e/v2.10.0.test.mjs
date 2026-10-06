// v2.10.0: Season keeper and Sugar lump harvester built-ins, with choices on their rows.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();

/** Seasons and lumps as main.js has them (computeSeasons' buyFunction, clickLump). */
function stubGame(Game) {
  Game.season = '';
  Game.baseSeason = '';
  Game.seasonT = 0;
  Game.seasons = {
    christmas: { name: 'Christmas', trigger: 'Festive biscuit' },
    valentines: { name: "Valentine's day", trigger: 'Lovesick biscuit' },
    fools: { name: 'Business day', trigger: "Fool's biscuit" },
    easter: { name: 'Easter', trigger: 'Bunny biscuit' },
    halloween: { name: 'Halloween', trigger: 'Ghostly biscuit' },
  };
  Game.Upgrades = {};
  Object.keys(Game.seasons).forEach((k) => {
    const up = {
      name: Game.seasons[k].trigger,
      season: k,
      unlocked: 1,
      bought: 0,
      price: 1e9,
      canBuy() {
        return Game.cookies >= this.price;
      },
      buy() {
        if (this.bought || !this.canBuy()) return;
        Game.cookies -= this.price;
        // buyFunction: the other biscuits are locked + unlocked again (bought = 0)
        Object.values(Game.Upgrades).forEach((u) => u !== this && (u.bought = 0));
        this.bought = 1;
        Game.season = this.season;
        Game.seasonT = 30 * 3600 * 24;
        Game.seasonBuys = (Game.seasonBuys || 0) + 1;
      },
    };
    Game.Upgrades[up.name] = up;
  });
  let switcher = false;
  Game.Has = (n) => (n === 'Season switcher' ? switcher : false);
  const hour = 3600 * 1000;
  Game.lumpMatureAge = 20 * hour;
  Game.lumpRipeAge = 23 * hour;
  Game.lumpOverripeAge = 24 * hour;
  Game.lumpT = Date.now() - 21 * hour; // mature, not ripe
  Game.canLumps = () => true;
  Game.lumpClicks = 0;
  Game.clickLump = () => {
    Game.lumpClicks++;
    Game.lumpT = Date.now();
  };
  return { setSwitcher: (v) => (switcher = v) };
}

const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const ctl = stubGame(Game);
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// ---- the section and its rows
CA.UI.Menu.openPage('clickers');
const row = (id) => doc.querySelector(`[data-macro-row="${id}"]`);
assert(/Seasons, lumps & the dragon/.test(doc.querySelector('[data-page="clickers"]').textContent), 'a Seasons & sugar lumps section');
const sel = (id) => row(id).querySelector('select[data-macro-param]');
assert(!row('season'), 'the Season keeper is gone (SeasonCompletion replaces it, v2.22)');
assert(row('lumps') && sel('lumps').value === 'ripe', 'Lump harvester: ripe by default');

// ---- keeping a season (the action SeasonCompletion uses)
const keep = (season) => CA.Actions.run('season.keep', { season });
assert(!CA.Actions.get('season.keep').available(), 'needs the Season switcher');
ctl.setSwitcher(true);
Game.cookies = 1e6; // can't afford the biscuit
assert(keep('christmas') === 0 && Game.season === '', 'waits until it can afford it');
Game.cookies = 5e9;
assert(keep('christmas') === 1 && Game.season === 'christmas', 'buys the season’s biscuit');
assert(keep('christmas') === 0 && Game.seasonBuys === 1, 'nothing to do while it lasts');
assert(CA.Actions.describe({ action: 'season.keep', params: { season: 'halloween' } }) === 'Keep Halloween going', 'describes its season');
assert(keep('halloween') === 1 && Game.season === 'halloween' && Game.Upgrades['Festive biscuit'].bought === 0, 'switches to another season');
// the season runs out (main.js: bought = 0, season back to the base one)
Game.Upgrades['Ghostly biscuit'].bought = 0;
Game.season = Game.baseSeason;
assert(keep('halloween') === 1 && Game.season === 'halloween' && Game.seasonBuys === 3, 'rebuys it when the season ends');

// ---- sugar lumps
Game.lumpT = Date.now() - 21 * 3600 * 1000;
assert(CA.Macros.runOnce('lumps') === 0 && Game.lumpClicks === 0, 'ripe mode: leaves a mature lump alone');
sel('lumps').value = 'mature';
sel('lumps').dispatchEvent(new w.Event('change', { bubbles: true }));
assert(CA.Macros.runOnce('lumps') === 1 && Game.lumpClicks === 1, 'mature mode: harvests it now');
assert(CA.Macros.runOnce('lumps') === 0, 'a fresh lump isn’t touched');
Game.lumpT = Date.now() - 23.5 * 3600 * 1000;
sel('lumps').value = 'ripe';
sel('lumps').dispatchEvent(new w.Event('change', { bubbles: true }));
assert(CA.Macros.runOnce('lumps') === 1, 'ripe mode: harvests a ripe lump');
assert(CA.Actions.describe({ action: 'lump.harvest', params: { when: 'mature' } }) === 'Harvest the sugar lump once mature (50%)', 'action describes its choice (your own macros can use it too)');

// ---- duplicates keep the choice; saved and restored
sel('lumps').value = 'mature';
sel('lumps').dispatchEvent(new w.Event('change', { bubbles: true }));
const copy = CA.Macros.duplicate('lumps');
assert(copy && copy.steps[0].params.when === 'mature' && !copy.options, 'duplicate takes the chosen setting');
Game.WriteSave();
const saved = Game.modSaveData.CookieMgr;
assert(JSON.parse(saved).macros.prefs.lumps.params['0.when'] === 'mature', 'choice saved');
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: saved });
stubGame(g2.Game);
await sleep(400);
const CA2 = g2.window.CookieMgr;
assert(CA2.Macros.stepsOf(CA2.Macros.get('lumps'))[0].params.when === 'mature', 'choice restored');
CA2.UI.Menu.openPage('clickers');
assert(g2.window.document.querySelector('[data-macro-row="lumps"] select[data-key="when"]').value === 'mature', 'and shown on its card');

// ---- the macro editor keeps its own styles (v2.9's widget editor no longer shares its classes)
const css = CA.CSS;
assert(!/#CookieMgrMenu \.ca-editor-body\s*{\s*display:\s*flex/.test(css) && /\.ca-weditor-body/.test(css), 'widget editor styles scoped (no unscoped .ca-editor-body flex rule)');

assert(g.errors.length === 0 && g2.errors.length === 0, 'no runtime errors' + (g.errors.length + g2.errors.length ? `: ${g.errors.concat(g2.errors).slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
