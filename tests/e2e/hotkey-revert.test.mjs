// Hotkey revert: a hotkey chip's small button takes it back to the key it comes with (it used to
// remove the key). It shows only once the key differs from its default; Backspace while rebinding
// still leaves it with no key.
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot();
const { window: w } = g;
const CA = w.CookieMgr;
await sleep(400);
const S = CA.Settings;
const doc = w.document;
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const chip = () => doc.querySelector('#CookieMgrMenu [data-hotkey="macro.bigCookie"]');

CA.UI.Menu.openPage('macros');
if (w.Game.onMenu !== CA.MENU_ID) w.Game.ShowMenu(CA.MENU_ID);
await sleep(50);
CA.UI.Menu.render();
assert(chip() && !chip().querySelector('[data-ca="unbind"]'), 'no remove button any more');
const revert = () => chip().querySelector('.ca-key-revert[data-ca="revert-hotkey"]');
assert(revert() && chip().classList.contains('default'), 'a revert button, hidden while the key is its default');
assert(/\(C\)/.test(revert().dataset.tip) && !revert().hasAttribute('title'), `its tip names the default key (${revert().dataset.tip})`);

S.setHotkey('macro.bigCookie', 'KeyJ');
CA.UI.Menu.render();
assert(!chip().classList.contains('default') && S.getHotkey('macro.bigCookie') === 'KeyJ', 'rebound: the revert button shows');
click(revert());
assert(S.getHotkey('macro.bigCookie') === 'KeyC' && S.isDefaultHotkey('macro.bigCookie'), 'clicked: back to C');
CA.UI.Menu.render();
assert(chip().classList.contains('default'), 'and hidden again');

S.setHotkey('macro.bigCookie', '');
CA.UI.Menu.render();
assert(chip().classList.contains('unset') && !chip().classList.contains('default'), 'no key at all: revert still offered');
click(revert());
assert(S.getHotkey('macro.bigCookie') === 'KeyC', 'and brings the default back');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
