// v4.0.2: the code editor fills its column, at least as tall as the library beside it (Macros, Statistics,
// Managers, Garden), and a click below the last line puts the caret at the end of the code.
import fs from 'fs';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w } = g;
const CA = w.CookieMgr;
await sleep(400);
const doc = w.document;
const menu = () => doc.getElementById('CookieMgrMenu');

// the layout (jsdom doesn't lay out: the rules are checked in the stylesheet)
const css = fs.readFileSync(new URL('../../src/ui/styles.css', import.meta.url), 'utf8');
const last = (sel) => {
  const all = [...css.matchAll(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`, 'g'))];
  return all.length ? all[all.length - 1][1] : '';
};
assert(/align-items: stretch/.test(last('#CookieMgrMenu .ca-ed-layout')), 'the editor column stretches to the library');
assert(
  /height: 640px/.test(last('#CookieMgrMenu .ca-ed-layout > .ca-ed-lib')),
  'the library keeps its height (searching it doesn’t resize the code)'
);
const code = last('#CookieMgrMenu .ca-ed-layout .ca-code');
assert(/flex: 1 1 0/.test(code) && /max-height: none/.test(code), 'the code takes the room its column has left');

// a click below the last line: the caret at the end
CA.UI.Menu.openPage('managers');
await sleep(50);
const box = menu().querySelector('[data-mgr-code] .ca-code');
const ta = box.querySelector('[data-code]');
assert(box && ta, 'the Managers page has its code editor');
box.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
assert(doc.activeElement === ta && ta.selectionStart === ta.value.length, 'a click below the lines: the caret at the end');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
