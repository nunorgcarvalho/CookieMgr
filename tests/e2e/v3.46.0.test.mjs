// v3.46.0: the chart widget's legend can be hidden (its Legend setting), and a resized chart widget never scrolls
// (CSS only: the legend gives up its room first — checked in a browser, jsdom has no layout).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const idb = { factory: new IDBFactory(), IDBKeyRange };
const g = boot({ idb });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
makeGarden(Game);
await sleep(400);
const W = CA.UI.Widgets;
CA.Settings.set('widgetsShown', true);
W.list().forEach((x) => W.remove(x.id));

const a = W.add('chart', null, { plot: 'gardenEffects' });
W.render();
await sleep(10);
const box = () => doc.querySelector(`#CookieMgrWidgets [data-widget="${a.id}"] .ca-wcharts`);
assert(box() && !box().classList.contains('no-legend'), 'a chart widget shows its legend to start');

W.openSettings(a.id);
const sel = () => doc.querySelector(`[data-w-editor="${a.id}"] select[data-w-opt="legend"]`);
assert(sel() && sel().value === 'show', 'its settings have a Legend choice, Shown');
sel().value = 'hide';
sel().dispatchEvent(new w.Event('change', { bubbles: true }));
W.tick();
assert(a.legend === 'hide' && box().classList.contains('no-legend'), 'picking Hidden: saved, and the widget leaves the legend out');

a.stats = ['numbers'];
W.openSettings(a.id);
assert(!sel(), 'no Legend choice while no chart is shown');

const saved = W.serialize().find((x) => x.id === a.id);
assert(saved.legend === 'hide', 'the choice is saved');
g.Game.WriteSave();
const g2 = boot({ idb, save: g.Game.modSaveData.CookieMgr });
await sleep(500);
const b = g2.window.CookieMgr.UI.Widgets.get(a.id);
assert(b && b.legend === 'hide', '…and loaded');

assert(g.errors.length === 0 && g2.errors.length === 0, `no runtime errors ${g.errors.concat(g2.errors).join(' | ')}`);
done();
process.exit();
