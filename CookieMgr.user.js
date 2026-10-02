// ==UserScript==
// @name         CookieMgr
// @description  Loads the CookieMgr add-on into Cookie Clicker.
// @namespace    https://github.com/nunorgcarvalho/CookieMgr
// @include      /https?://orteil.dashnet.org/cookieclicker/
// @grant        none
// ==/UserScript==

const COOKIE_MGR_URL = 'https://nunorgcarvalho.github.io/CookieMgr/dist/CookieMgr.js';

const readyCheck = setInterval(() => {
  const Game = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).Game;
  if (typeof Game !== 'undefined' && Game.ready) {
    clearInterval(readyCheck);
    // timestamp: always the newest build, never a cached copy (GitHub Pages allows 10 minutes)
    Game.LoadMod(`${COOKIE_MGR_URL}?v=${Date.now()}`);
  }
}, 1000);
