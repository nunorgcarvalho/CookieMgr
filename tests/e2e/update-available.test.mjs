// New version available: once the update check finds a newer release, the Settings page shows
// "New version vX available · Reload" under the version; it checks every
// 5 minutes, and again as the Settings page opens unless the last check was under a minute ago.
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot();
const { window: w } = g;
const CA = w.CookieMgr;
await sleep(400);
const U = CA.Update;

let remote = CA.VERSION;
const urls = [];
w.fetch = async (url) => {
  urls.push(url);
  return { ok: true, text: async () => `${remote}\n` };
};
const note = () => w.document.querySelector('#CookieMgrMenu [data-ca-update-note]');

// ---- up to date: nothing shows ----
assert(U.isNewer('4.11.0', '4.10.9') && U.isNewer('5.0.0', '4.99.99') && !U.isNewer('4.10.0', '4.10.0'), 'isNewer compares numerically');
CA.UI.Menu.openPage('settings:general');
await sleep(20);
assert(urls.length === 1 && /version\.txt\?t=\d+/.test(urls[0]), `opening Settings checks right away, past the CDN cache (${urls[0]})`);
assert(U.available() === null && note() && note().hidden, 'up to date: the note is hidden');

// ---- a newer release: the note appears without re-rendering the page ----
const [a, b, c] = CA.VERSION.split('.').map(Number);
const next = `${a}.${b + 1}.0`;
remote = next;
CA.UI.Menu.openPage('settings:general');
await sleep(20);
assert(urls.length === 1, 'reopening within a minute does not check again');
const page = w.document.querySelector('#CookieMgrMenu .ca-page');
await U.check();
assert(U.available() === next, `available(): ${U.available()}`);
assert(note() && !note().hidden && note().textContent.includes(`New version v${next} available`), `the note: "${note() && note().textContent}"`);
assert(note().querySelector('[data-ca="reload"]'), 'with a Reload link');
assert(w.document.querySelector('#CookieMgrMenu .ca-page') === page, 'shown in place, not by re-rendering the page');

// ---- other Settings tabs have no overview card; the note comes back with General ----
CA.UI.Menu.openPage('settings:store');
assert(!note(), 'no note on the Store tab');
CA.UI.Menu.openPage('settings:general');
assert(note() && note().textContent.includes(`v${next}`), 'back on General: still there');

// ---- an older or equal remote never shows ----
remote = `${a}.${b}.${c}`;
await U.check();
assert(U.available() === next, 'a later check of the same old version keeps the newer one found');

// ---- option off: no checks ----
CA.Settings.set('updateCheck', false);
const n = urls.length;
await U.check();
assert(urls.length === n, 'Check for updates off: no request');

assert(g.errors.length === 0, `no runtime errors (${g.errors.join('; ')})`);
done();
process.exit();
