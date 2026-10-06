// v2.12.1: minigame widgets close the open menu first; chart hover boxes aren't clipped by cards.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// a row for the Farm, to scroll to
const area = doc.createElement('div');
area.id = 'centerArea';
area.style.overflowY = 'scroll';
Object.defineProperty(area, 'scrollHeight', { value: 2000 });
Object.defineProperty(area, 'clientHeight', { value: 600 });
let scrolled = null;
area.scrollTo = (o) => (scrolled = o);
let pageScrolled = false;
const row = doc.createElement('div');
row.id = 'row2';
row.scrollIntoView = () => (pageScrolled = true);
row.getBoundingClientRect = () => ({ top: 5000, bottom: 5100, left: 0, right: 100, width: 100, height: 100 });
area.appendChild(row);
doc.getElementById('game').appendChild(area);

CA.UI.Widgets.add('garden');
CA.UI.Menu.openPage('graphs');
assert(Game.onMenu === 'cookiemgr', 'our panel is open');
const orb = doc.querySelector('#CookieMgrWidgets [data-w-open-mg="Farm"]');
click(w, orb);
assert(Game.onMenu === '' && Game.Objects.Farm.onMinigame === 1, 'click closes the panel and opens the Garden');
await sleep(100);
assert(scrolled && scrolled.top === 1400 && !pageScrolled, `then scrolls only the middle panel, clamped to its end (${scrolled && scrolled.top})`);

// the game's own menus too
Game.ShowMenu('stats');
click(w, orb);
assert(Game.onMenu === '', 'closes the Stats menu as well');

// chart hover boxes are fixed to the window
assert(doc.getElementById('CookieMgrLayer') && /#CookieMgrLayer \{[^}]*position: fixed/.test(CA.CSS), 'hover boxes live in a fixed floating layer (v2.17.1)');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
