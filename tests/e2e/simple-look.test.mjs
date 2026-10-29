// Simple cookie background (option simpleLook, off by default): switches off the game's cursors,
// particles, click numbers and milk, remembering how they were, and puts them back when turned off.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const S = CA.Settings;
Game.prefs = { cursors: 1, particles: 1, numbers: 0, milk: 1, fancy: 1 };

assert(S.get('simpleLook') === false, 'off by default');
assert(S.optionsIn('general').some((d) => d.key === 'simpleLook'), 'on the Settings page’s General card');
assert(CA.Hotkeys.get('look.simple'), 'a hotkey can toggle it');

S.set('simpleLook', true);
assert(['cursors', 'particles', 'numbers', 'milk'].every((k) => Game.prefs[k] === 0), 'on: the extras are off');
assert(Game.prefs.fancy === 1, 'other game settings untouched');

S.set('simpleLook', false);
assert(Game.prefs.cursors === 1 && Game.prefs.particles === 1 && Game.prefs.numbers === 0 && Game.prefs.milk === 1, 'off: the game’s own settings come back');
assert(S.get('simpleLookWas') === '', 'and nothing stays remembered');

CA.Hotkeys.get('look.simple').run();
assert(S.get('simpleLook') === true && Game.prefs.cursors === 0, 'the hotkey turns it on');
Game.prefs.cursors = 1; // a save loaded with them on
CA.Events.emit('settings', null);
assert(Game.prefs.cursors === 0, 'loading a save keeps them off');
CA.Hotkeys.get('look.simple').run();
assert(Game.prefs.cursors === 1 && Game.prefs.milk === 1, 'and off again');

// the white glow behind the cookie (shine.png) has no game switch: it's skipped while drawing
const shine = { alt: 'shine' };
const cookie = { alt: 'cookie' };
const drawn = [];
Game.Loader = { assets: { 'shine.png': shine, 'perfectCookie.png': cookie } };
Game.LeftBackground = { drawImage: (img) => drawn.push(img.alt) };
Game.DrawBackground = () => {
  Game.LeftBackground.drawImage(shine);
  Game.LeftBackground.drawImage(cookie);
};
S.set('simpleLook', true);
Game.DrawBackground();
assert(drawn.join() === 'cookie', `on: no glow, the cookie still drawn (${drawn})`);
assert(!('drawImage' in Game.LeftBackground) || Game.LeftBackground.drawImage.length === 1, 'drawImage put back after drawing');
drawn.length = 0;
S.set('simpleLook', false);
Game.DrawBackground();
assert(drawn.join() === 'shine,cookie', `off: the glow is back (${drawn})`);

// the Settings page shows it
CA.UI.Menu.openPage('settings:general');
await sleep(50);
const doc = w.document;
assert(doc.querySelector('[data-option="simpleLook"]'), 'its tile');
assert(/Simple cookie background on \/ off/.test(doc.getElementById('menu').textContent), 'its hotkey row');

assert(g.errors.length === 0, `no runtime errors (${g.errors.join('; ')})`);
done();
process.exit();
