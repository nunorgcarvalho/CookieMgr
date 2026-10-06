// v2.24.1: no scrollIntoView anywhere (it shifted the whole screen); the game's fixed containers
// are put back if anything scrolls them; widget popups in the floating layer have their background;
// the code editor's caret layer can't drift from its text.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

let intoView = 0;
w.HTMLElement.prototype.scrollIntoView = () => intoView++;
const grim = CA.UI.Widgets.add('grimoire');
click(w, doc.querySelector(`#CookieMgrWidgets [data-widget="${grim.id}"] [data-w-settings]`));
CA.UI.Menu.openPage('clickers');
CA.UI.MacrosPage.edit(null);
CA.UI.Widgets.add('garden');
click(w, doc.querySelector('#CookieMgrWidgets [data-w-open-mg="Farm"]'));
await sleep(100);
assert(intoView === 0, `nothing uses scrollIntoView (${intoView})`);

// a shifted container is put back
const game = doc.getElementById('game');
Object.defineProperty(game, 'scrollTop', { value: 120, writable: true, configurable: true });
CA.Util.unshift();
assert(game.scrollTop === 0, 'unshift: the game’s container back at the top');
await sleep(2100);
game.scrollTop = 50;
await sleep(2100);
assert(game.scrollTop === 0, '…and it keeps checking');

// popups in the layer: background and all
assert(/#CookieMgrLayer \.ca-wpop \{[^}]*background/.test(CA.CSS.replace(/#CookieMgrWidgets \.ca-wpop,\n/, '')), 'widget popups get their background in the layer');
assert(/#CookieMgrLayer \.ca-gpop/.test(CA.CSS) && /#CookieMgrLayer \.ca-orb-pop/.test(CA.CSS), 'garden and minigame popups too');

// the code editor: the textarea lies over its highlighted copy and doesn't scroll on its own
assert(/textarea\.ca-code-ta \{[^}]*position: absolute;[^}]*overflow: hidden/.test(CA.CSS) && /\.ca-code \{[^}]*overflow: auto/.test(CA.CSS), 'caret layer can’t drift from the text');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
