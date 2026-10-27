// v3.17.0: long numbers start on Cookie Monster's own default, the short scale (1.23 Octodec, not
// 1.23 ODe), and saves from before it — which all kept the old default — move over to it; a
// notation picked since stays.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const CA = g.window.CookieMgr;
await sleep(400);
const F = CA.Format;
const S = CA.Settings;
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

// ---- the default: the short scale
eq(S.get('numberFormat'), 'short', 'the default notation');
eq(F.FORMATS[0].v, 'short', 'first in the dropdown');
eq(F.beautify(1234567), '1.23 M', 'million: M');
eq(F.beautify(4.56e9), '4.56 B', 'billion: B');
eq(F.beautify(1.5e12), '1.5 Tr', 'trillion: Tr');
eq(F.beautify(1e33), '1 Dec', 'decillion: Dec');
eq(F.beautify(4.56e54), '4.56 Septendec', 'septendecillion: Septendec');
eq(F.beautify(7.89e57), '7.89 Octodec', 'octodecillion: Octodec');
eq(F.beautify(1e75), '1 Quattuorvigint', 'its last: Quattuorvigint');
eq(F.beautify(1e78), '1e78', 'past it: scientific, as Cookie Monster');
eq(F.short(1234), '1.23K', 'short() stays compact');
eq(F.short(7.89e57), '7.89Octodec', 'short() names it too');

// ---- saves
const save = (v, numberFormat) => JSON.stringify({ v, savedAt: 1, options: { numberFormat }, hotkeys: {} });
const restored = async (str) => {
  const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: str });
  await sleep(400);
  const out = { fmt: g2.window.CookieMgr.Settings.get('numberFormat'), n: g2.window.CookieMgr.Format.beautify(7.89e57), errors: g2.errors.length };
  g2.window.close();
  return out;
};
let r = await restored(save(1, 'abbr'));
eq(r.fmt, 'short', 'a save from before v3.17.0 on the old default moves to the short scale');
eq(r.n, '7.89 Octodec', '…and writes Octodec');
r = await restored(save(1, 'sci'));
eq(r.fmt, 'sci', 'a save from before it on another notation keeps it');
r = await restored(save(2, 'abbr'));
eq(r.fmt, 'abbr', 'abbreviated, picked since v3.17.0: kept');
eq(r.n, '7.89 ODe', '…ODe');
S.set('numberFormat', 'abbr');
g.window.Game.WriteSave();
eq(JSON.parse(g.window.Game.modSaveData.CookieMgr).v, 2, 'saves are marked as v3.17.0’s');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
