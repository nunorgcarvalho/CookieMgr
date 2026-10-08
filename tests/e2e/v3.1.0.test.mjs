// v3.1.0: drag across a chart to zoom into that stretch of its x axis — a band while you drag,
// zooms stack, Zoom out / double-click steps back, a window chip clears it, a stretch reaching now
// stays live, shift-drag still pans, Esc lets go; the garden's "ticks" axis zooms too.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const GM = makeGarden(Game);
await sleep(1500); // a few recorded seconds

CA.UI.Menu.openPage('graphs');
await sleep(100);
const P = CA.UI.Plot.get('cps');
P.tick();
const card = () => doc.querySelector('[data-plot="cps"]');
const canvas = () => card().querySelector('[data-plot-canvas]');
const mouse = (type, x, extra = {}) => (type === 'mousedown' || type === 'dblclick' ? canvas() : w).dispatchEvent(new w.MouseEvent(type, { bubbles: true, clientX: x, clientY: 50, button: 0, ...extra }));
const L = () => P.layout();
assert(L() && L().plot.w > 100, 'the chart is drawn');
const { plot } = L();
const W0 = L().v.W;

// ---- drag across: a band, then the zoom
mouse('mousedown', plot.x + 100);
mouse('mousemove', plot.x + 260);
assert(!P.zoomed(), 'nothing yet while dragging');
mouse('mouseup', plot.x + 260);
let z = P.zoomed();
const want = (160 / plot.w) * W0;
assert(z && Math.abs(z.windowMs - Math.max(5000, want)) < 50 && z.depth === 1, `zoomed into the stretch dragged across (${z && Math.round(z.windowMs)} ms of ${Math.round(W0)})`);
assert(P.isPaused() && /Zoomed/.test(card().querySelector('[data-plot-live]').textContent), 'a stretch in the past: paused there, and it says “Zoomed”');
const unzoom = () => card().querySelector('[data-plot-unzoom]');
assert(unzoom() && !unzoom().hidden, 'a Zoom out chip');
// zooms stack
const plot2 = L().plot;
mouse('mousedown', plot2.x + 50);
mouse('mousemove', plot2.x + 200);
mouse('mouseup', plot2.x + 200);
assert(P.zoomed().depth === 2 && P.zoomed().windowMs <= z.windowMs, 'zoom in again: they stack');
// back out: the chip, then a double-click
click(w, unzoom());
assert(P.zoomed().depth === 1 && Math.abs(P.zoomed().windowMs - z.windowMs) < 1, 'Zoom out: one step back');
mouse('dblclick', plot.x + 10);
assert(!P.zoomed() && !P.isPaused() && unzoom().hidden && L().v.W === W0, 'double-click: back to where it was (live, its window)');

// ---- small drags are clicks; Esc lets go
mouse('mousedown', plot.x + 100);
mouse('mousemove', plot.x + 103);
mouse('mouseup', plot.x + 103);
assert(!P.zoomed(), 'a tiny drag doesn’t zoom');
mouse('mousedown', plot.x + 100);
mouse('mousemove', plot.x + 300);
w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' }));
mouse('mouseup', plot.x + 300);
assert(!P.zoomed(), 'Esc lets go of the stretch');

// ---- a stretch reaching now stays live
mouse('mousedown', plot.x + plot.w - 120);
mouse('mousemove', plot.x + plot.w + 40); // past the edge: up to now
mouse('mouseup', plot.x + plot.w + 40);
assert(P.zoomed() && !P.isPaused(), 'zoomed into the latest stretch: still live');
// a window chip clears the zoom
click(w, card().querySelector('[data-plot-set][data-val="3600"]'));
assert(!P.zoomed() && unzoom().hidden, 'picking a window clears the zoom');

// ---- shift-drag still pans (and doesn't zoom)
mouse('mousedown', plot.x + 100, { shiftKey: true });
mouse('mousemove', plot.x + 300, { shiftKey: true });
mouse('mouseup', plot.x + 300, { shiftKey: true });
assert(!P.zoomed(), 'shift-drag pans instead of zooming (with a few seconds of history there is nowhere further back to go)');
P.resume();

// ---- the garden's charts: on their "garden ticks" axis too
const H = CA.GardenHistory;
GM.plot[2][1] = [1, 5];
H.sample();
for (let i = 0; i < 6; i++) {
  await sleep(30);
  GM.nextStep += GM.stepT * 1000;
  H.sample();
}
CA.UI.Menu.openPage('garden');
await sleep(50);
const G = CA.UI.Plot.get('garden');
click(w, doc.querySelector('[data-plot="garden"] [data-plot-set][data-val="ticks"]'));
G.tick();
assert(G.layout().v.custom && typeof G.layout().v.custom.timeAt === 'function', 'garden ticks: an axis that maps back to time');
const gp = G.layout().plot;
assert(G.zoomTo(gp.x + gp.w * 0.4, gp.x + gp.w * 0.9) && G.zoomed(), 'zooming on the ticks axis');
G.zoomOut();
assert(!G.zoomed(), 'and back');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
