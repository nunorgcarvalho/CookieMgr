// Tooltip layouts: the store tooltip's lines saved as layouts — the built-in Default (always there, can't be
// deleted; once changed, Revert to default) and yours (Save as a new layout, rename, Use / In use, trash). The
// line editor edits the layout in use; tooltips.profile(name) switches in code. The Default's lines: Bonus income
// and Payback period by raw CpS, then by actual income, Share of production, Next upgrade, Next achievement.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click, waitFor } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w } = g;
const doc = w.document;
const CA = w.CookieMgr;
const SI = CA.UI.StoreInsight;
await sleep(400);

// the Default's lines
assert(SI.DEFAULT_LINES.join() === 'bonus,paybackRaw,actualGain,actual,share,nextUpgrade,next', `the Default's lines (${SI.DEFAULT_LINES.join()})`);
assert(CA.Stats.get('paybackRaw').label === 'Payback period' && /rawGain/.test(CA.Stats.get('bonus').source), 'plain Bonus income / Payback period: by raw CpS');
assert(SI.activeProfile() === 'default' && SI.profiles().length === 1 && SI.isDefault() && !SI.defaultEdited(), 'only the Default, as it comes');

CA.UI.Menu.openPage('settings:store');
await sleep(50);
const page = () => doc.querySelector('[data-page="settings"]');
const rows = () => [...page().querySelectorAll('[data-tp-row]')];
const row = (id) => page().querySelector(`[data-tp-row="${id}"]`);
const act = (id, a) => row(id).querySelector(`[data-tp-act="${a}"]`);
assert(rows().length === 1 && row('default').querySelector('.ca-inuse') && !act('default', 'delete') && !act('default', 'revert'), 'Default: In use, no trash, no Revert');

// change the Default: Revert to default shows (two clicks)
click(w, page().querySelector('[data-tl-del]'));
assert(SI.defaultEdited() && /edited/.test(row('default').textContent) && act('default', 'revert'), 'edited: a Revert to default button');
click(w, act('default', 'revert'));
assert(SI.defaultEdited(), 'the first click only arms it');
click(w, act('default', 'revert'));
assert(!SI.defaultEdited() && SI.lines().join() === SI.DEFAULT_LINES.join(), 'reverted');

// save as a new layout: a copy, now in use; editing it leaves the Default alone
click(w, page().querySelector('[data-tp-act="new"]'));
const mine = SI.activeProfile();
assert(mine !== 'default' && rows().length === 2 && row(mine).querySelector('.ca-inuse') && act('default', 'use'), 'a new layout, in use');
click(w, page().querySelector('[data-tl-del]'));
assert(SI.lines().length === SI.DEFAULT_LINES.length - 1 && !SI.defaultEdited(), 'its lines change, the Default’s don’t');
const name = row(mine).querySelector('[data-tp-name]');
name.value = 'Short';
name.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(SI.profileOf('short') && SI.profileOf('short').id === mine, 'renamed (found by name, any case)');

// Use: the tooltip's lines follow
click(w, act('default', 'use'));
assert(SI.activeProfile() === 'default' && SI.lines().length === SI.DEFAULT_LINES.length, 'Use the Default');
// in code
CA.Actions.run('tooltips.profile', { profile: 'Short' });
assert(SI.activeProfile() === mine && SI.lines().length === SI.DEFAULT_LINES.length - 1, 'tooltips.profile(Short)');
const val = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);
assert(val('tooltips.activeProfile') === mine && val('tooltips.profileActive', 'short') === true && val('tooltips.profiles').join() === `default,${mine}`, 'the words');

// saved with the settings
const saved = JSON.parse(JSON.stringify(CA.Settings.get('storeTooltipProfiles')));
assert(saved.length === 1 && saved[0].name === 'Short' && saved[0].lines.length === SI.DEFAULT_LINES.length - 1, 'kept with your settings');

// delete the one in use: back to the Default
await waitFor(() => row(mine));
click(w, act(mine, 'delete'));
click(w, act(mine, 'delete'));
assert(SI.profiles().length === 1 && SI.activeProfile() === 'default' && rows().length === 1, 'deleted: the Default in use');
assert(!SI.removeProfile('default') && SI.profiles().length === 1, 'the Default can’t be deleted');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
