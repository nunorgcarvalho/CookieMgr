// v3.16.0: Plain Business Day lives in its own Miscellaneous card on the Settings page; switching it
// re-skins the golden cookies already on screen, and the Stats menu drops its business lines.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const S = CA.Settings;
await sleep(400);
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

// ---- the Miscellaneous card
eq(S.definitions().find((d) => d.key === 'foolsPlain').group, 'misc', 'Plain Business Day is a Miscellaneous option');
CA.UI.Menu.openPage('settings');
const heads = [...doc.querySelectorAll('#menu .ca-card')].map((c) => c.textContent);
const misc = heads.find((t) => t.includes('Miscellaneous'));
assert(misc && misc.includes('Plain Business Day'), 'the Settings page has a Miscellaneous card with it');
assert(!heads.find((t) => t.startsWith('General') && t.includes('Plain Business Day')), 'no longer under General');

// ---- golden cookies already on screen
Game.season = 'fools';
const shimmer = (wrath) => {
  const l = doc.createElement('div');
  l.style.backgroundImage = 'url(img/spamCookies.gif)';
  l.style.width = l.style.height = '128px';
  return { type: 'golden', wrath, l };
};
const gold = shimmer(0);
const wrath = shimmer(1);
Game.shimmers = [gold, wrath, { type: 'reindeer', l: doc.createElement('div') }];
S.set('foolsPlain', true);
assert(gold.l.style.backgroundImage.includes('goldCookie.png') && gold.l.style.width === '96px', 'on: a golden cookie on screen turns golden again');
assert(wrath.l.style.backgroundImage.includes('wrathCookie.png'), '…a wrath cookie, a wrath cookie');
eq(Game.shimmers[2].l.style.backgroundImage, '', 'other shimmers untouched');
S.set('foolsPlain', false);
assert(gold.l.style.backgroundImage.includes('spamCookies.gif') && gold.l.style.width === '128px', 'off: back to the business look');
Game.season = 'christmas';
gold.l.style.backgroundImage = 'url(img/goldCookieWreath.png)';
S.set('foolsPlain', true);
assert(gold.l.style.backgroundImage.includes('goldCookieWreath.png'), 'another season: its cookies are left alone');
S.set('foolsPlain', false);

// ---- the Stats menu
Game.season = 'fools';
Game.onMenu = 'stats';
Game.UpdateMenu = () => {
  doc.getElementById('menu').innerHTML =
    '<div class="listing"><b>Seasonal event:</b> Business day</div>' +
    '<div class="listing"><b>Money made from selling cookies :</b> 1.2 million cookie dollars</div>' +
    '<div class="listing"><b>TV show seasons produced :</b> 4</div>';
};
S.set('foolsPlain', true);
const lines = () => [...doc.querySelectorAll('#menu .listing')].map((l) => l.textContent);
eq(lines().length, 1, 'on: the business lines are gone, at once');
assert(lines()[0].includes('Business day'), '…the season itself still shows');
Game.UpdateMenu();
eq(lines().length, 1, '…and stay gone as the menu redraws');
S.set('foolsPlain', false);
eq(lines().length, 3, 'off: they come back');

done();
process.exit();
