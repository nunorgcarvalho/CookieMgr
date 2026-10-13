// v3.1.2: in the Events log, a golden cookie that gives an effect shows the effect and what it
// multiplies — "Frenzy ×7", "Clot ×0.5", "Click frenzy ×777 clicks" — instead of the CpS it adds.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

const pop = (buff, wrath = 0) => {
  Game.shimmerTypes.golden.popFunc({ gain: 0, wrath, buff });
  delete Game.buffs[buff.name];
};
pop({ name: 'Frenzy', time: 3000, maxTime: 3000, multCpS: 7 });
pop({ name: 'Clot', time: 3000, maxTime: 3000, multCpS: 0.5 }, 1);
pop({ name: 'Click frenzy', time: 300, maxTime: 300, multClick: 777 });
pop({ name: 'Elder frenzy', time: 180, maxTime: 180, multCpS: 666 });

CA.UI.Menu.openPage('events');
const cells = [...doc.querySelectorAll('[data-ev-list] .ca-ev-row')].map((r) => r.querySelector('.ca-ev-cookies'));
const find = (text) => cells.find((c) => c.textContent === text);
assert(find('Frenzy ×7') && find('Frenzy ×7').classList.contains('pos'), 'Frenzy ×7 (a gain)');
assert(find('Clot ×0.5') && find('Clot ×0.5').classList.contains('neg'), 'Clot ×0.5 (a loss)');
assert(find('Click frenzy ×777 clicks'), 'a click effect: what it multiplies');
assert(find('Elder frenzy ×666'), 'Elder frenzy ×666');
assert(!cells.some((c) => /\/s CpS/.test(c.textContent)), 'no “+N/s CpS” any more');
// a drop still shows its cookies
Game.shimmerTypes.golden.popFunc({ gain: 5000 });
CA.UI.Menu.render();
assert([...doc.querySelectorAll('[data-ev-list] .ca-ev-cookies')].some((c) => /^\+/.test(c.textContent)), 'a cookie drop: its cookies, as before');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
