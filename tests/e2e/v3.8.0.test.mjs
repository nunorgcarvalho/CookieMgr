// v3.8.0: long numbers in Cookie Monster's notations — the Numbers setting (Settings → General:
// short scale abbreviated by default, short scale, metric, scientific, engineering, the game's
// own), three significant digits, under a million in full; options with choices as a dropdown,
// kept in the save. And Plain Business Day: the season's look off, its effects kept.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const F = CA.Format;
const S = CA.Settings;
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

// ---- short scale, abbreviated (the default until v3.17.0, which starts on the short scale)
S.set('numberFormat', 'abbr');
eq(F.beautify(0), '0', 'zero');
eq(F.beautify(7), '7', 'a small whole number');
eq(F.beautify(2.567, 2), '2.57', 'floats: decimals under 1000');
eq(F.beautify(12.4, 0), '12', '…none asked for');
eq(F.beautify(0.5), '0.5', 'a fraction');
eq(F.beautify(0.004), '0.004', 'a fraction too small for its decimals still shows');
eq(F.beautify(0.0004), '4e-4', 'tiny: scientific');
eq(F.beautify(1234), '1,234', 'under a million: in full');
eq(F.beautify(999999), '999,999', '…up to 999,999');
eq(F.beautify(999999.6), '1 M', '999,999.6 rounds over: 1M, not 1,000,000');
eq(F.beautify(1e6), '1 M', 'a million');
eq(F.beautify(1234567), '1.23 M', 'three significant digits');
eq(F.beautify(12345678), '12.3 M', '…12.3M');
eq(F.beautify(123456789), '123 M', '…123M');
eq(F.beautify(999.96e6), '1 B', '999.96M rolls over to 1B (not 1000M)');
eq(F.beautify(999.4e6), '999 M', '999.4M stays 999M');
eq(F.beautify(1.5e15), '1.5 Qa', 'quadrillion: Qa');
eq(F.beautify(4.56e33), '4.56 De', 'decillion: De (v3.9.1: Cookie Monster’s spelling)');
eq(F.beautify(1e200), '100 QiSx', '1e200: Cookie Monster’s names go up to 1e306 (v3.9.1)');
eq(F.beautify(-1234567), '-1.23 M', 'negatives');
eq(F.signed(-1234567), '−1.23 M', 'signed, negative');
eq(F.signed(2.5e9), '+2.5 B', 'signed, positive');
eq(F.beautify(NaN), '0', 'NaN');
eq(F.beautify(Infinity), '∞', 'Infinity');
eq(F.beautify(-Infinity), '-∞', '-Infinity');
eq(F.beautify('2500000'), '2.5 M', 'a number in a string');
// short(): abbreviated from 1000 (axes, chips)
eq(F.short(999), '999', 'short: under 1000');
eq(F.short(1234), '1.23K', 'short: 1.23K');
eq(F.short(999960), '1M', 'short: 999.96K rolls over to 1M');
eq(F.short(-45600), '-45.6K', 'short: negatives');
eq(F.short(0.25), '0.25', 'short: a fraction');
eq(F.short(NaN), '0', 'short: NaN');

// ---- the other notations
const as = (fmt) => S.set('numberFormat', fmt);
as('short');
eq(F.beautify(1.5e12), '1.5 Tr', 'short scale: 1.5 Tr');
eq(F.beautify(4.56e15), '4.56 Quadr', 'short scale: 4.56 Quadr');
eq(F.short(1234), '1.23K', 'short scale: short() stays compact');
as('metric');
eq(F.beautify(1.5e12), '1.5 T', 'metric: T');
eq(F.beautify(4.56e15), '4.56 P', 'metric: P');
eq(F.beautify(1e40), '1e40', 'metric: past its last prefix, scientific');
as('sci');
eq(F.beautify(1234), '1.23e3', 'scientific: from 1000');
eq(F.beautify(1.5e15), '1.5e15', 'scientific');
eq(F.beautify(9.9996e5), '1e6', 'scientific: 9.9996e5 rolls over to 1e6');
eq(F.beautify(-4.56e20), '-4.56e20', 'scientific: negatives');
as('eng');
eq(F.beautify(1.5e15), '1.5e15', 'engineering: 1.5e15');
eq(F.beautify(1.5e16), '15e15', 'engineering: 15e15');
eq(F.beautify(1.5e17), '150e15', 'engineering: 150e15');
eq(F.beautify(999.96e15), '1e18', 'engineering: 999.96e15 rolls over to 1e18');
as('game');
eq(F.beautify(1.5e7), w.Beautify(1.5e7, 1), 'the game’s own: its Beautify');
as('bogus');
eq(F.beautify(1.5e15), '1.5 Quadr', 'an unknown notation: the default (v3.17.0: the short scale)');
as('abbr');
eq(CA.UI.Plot.fmt.beautify(2.5e9), '2.5 B', 'charts write numbers the same way (CA.UI.Plot.fmt)');

// ---- the setting: a dropdown in Settings → General; options with choices all render as one
CA.UI.Menu.openPage('settings');
const choiceDefs = S.definitions().filter((d) => d.choices);
assert(choiceDefs.some((d) => d.key === 'numberFormat'), 'the Numbers option has choices');
// (each one shown as a settings row; one shown on a page of its own, like the Payback page's, has its own control)
choiceDefs.filter((d) => doc.querySelector(`[data-option="${d.key}"]`)).forEach((d) => {
  const sel = doc.querySelector(`[data-option="${d.key}"] select[data-ca-choice="${d.key}"]`);
  assert(sel && [...sel.options].map((o) => o.value).join() === d.choices.map((c) => c.v).join() && sel.value === String(S.get(d.key)), `${d.key}: a dropdown with its choices, showing the current one`);
  assert(!doc.querySelector(`[data-option="${d.key}"] .ca-switch`), `${d.key}: no on/off switch`);
});
const sel = doc.querySelector('select[data-ca-choice="numberFormat"]');
sel.value = 'sci';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
eq(S.get('numberFormat'), 'sci', 'picking one sets it');
eq(F.beautify(2.5e9), '2.5e9', '…and numbers follow at once');

// ---- Plain Business Day: look-only functions as if no season, real effects untouched
Game.season = 'fools';
const cursor = Game.Objects.Cursor;
cursor.rebuild = function () {
  this.shownName = Game.season === 'fools' ? 'Rolling pin' : 'Cursor';
};
cursor.tooltip = () => (Game.season === 'fools' ? 'Rolling pin: business' : 'Cursor: autoclicks');
Game.shimmerTypes.golden.initFunc = (me) => (me.pic = Game.season === 'fools' ? 'spamCookies.gif' : 'goldCookie.png');
Game.getNewTicker = () => (Game.season === 'fools' ? 'Business news' : 'Cookie news');
Game.particleAdd = () => (Game.season === 'fools' ? 'smallDollars.png' : 'cookie');
Game.DrawBackground = () => (Game.season === 'fools' ? 'bgMoney' : 'bgBlue');
Game.getTimeMod = () => (Game.season === 'fools' ? 0.95 : 1); // a real effect: not touched
cursor.rebuild();
eq(cursor.shownName, 'Rolling pin', 'option off: Business day looks as the game has it');
const opt = S.definitions().find((d) => d.key === 'foolsPlain');
assert(opt && opt.default === false && opt.group === 'misc', 'Plain Business Day: an option, off by default (Settings → Miscellaneous)');
S.set('foolsPlain', true);
eq(cursor.shownName, 'Cursor', 'turned on: the store row is redrawn at once with the normal name');
eq(cursor.tooltip(), 'Cursor: autoclicks', 'the building tooltip');
const gc = {};
Game.shimmerTypes.golden.initFunc(gc);
eq(gc.pic, 'goldCookie.png', 'the golden cookie');
eq(Game.getNewTicker(), 'Cookie news', 'the news');
eq(Game.particleAdd(), 'cookie', 'falling cookies, not dollars');
eq(Game.DrawBackground(), 'bgBlue', 'the background');
eq(Game.season, 'fools', 'the season is still Business day');
eq(Game.getTimeMod(), 0.95, 'and its effects still count (golden cookie timing sees it)');
doc.title = '1.23M cookies - Cookie Baker';
await sleep(20);
eq(doc.title, '1.23M cookies - Cookie Clicker', 'the tab title: Cookie Clicker');
// another season: nothing changes
Game.season = 'christmas';
eq(Game.getNewTicker(), 'Cookie news', 'another season: as it is');
Game.season = 'fools';
S.set('foolsPlain', false);
eq(cursor.shownName, 'Rolling pin', 'turned off: back to the game’s look, no reload');
eq(Game.getNewTicker(), 'Business news', '…the news too');

// ---- saved
S.set('foolsPlain', true);
Game.WriteSave();
const data = JSON.parse(Game.modSaveData.CookieMgr);
assert(data.options.numberFormat === 'sci' && data.options.foolsPlain === true, 'both kept in the save');
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: Game.modSaveData.CookieMgr });
await sleep(400);
const CA2 = g2.window.CookieMgr;
assert(CA2.Settings.get('numberFormat') === 'sci' && CA2.Format.beautify(2.5e9) === '2.5e9' && CA2.Settings.get('foolsPlain') === true, 'restored: the notation and Plain Business Day');
CA2.UI.Menu.openPage('settings');
eq(g2.window.document.querySelector('select[data-ca-choice="numberFormat"]').value, 'sci', 'the dropdown shows the saved choice');

assert(g.errors.length + g2.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
