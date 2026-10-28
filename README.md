# cookieMgr

**A [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) add-on that plays the boring parts for you and shows
you what's really going on.** It clicks golden cookies, buys the best building or upgrade, tends the garden, casts
spells and trades stocks, and it charts where every cookie came from. It loads like
[Cookie Monster](https://github.com/CookieMonsterTeam/CookieMonster): one click, nothing to download, and you always
get the newest version.

![cookieMgr in the game: the sidebar of pages next to the big cookie, a widget on the left panel](docs/readme/game.png)

## Install

cookieMgr runs in the browser version of the game at
[orteil.dashnet.org/cookieclicker](https://orteil.dashnet.org/cookieclicker/). Pick one of these three ways.

### 1. Bookmarklet (recommended)

1. Make a new bookmark in your browser (right-click the bookmarks bar → **Add page…** / **Add bookmark…**).
2. Name it `cookieMgr`, and paste this whole line as its **URL**:

   ```text
   javascript:(function(){Game.LoadMod('https://nunorgcarvalho.github.io/cookieMgr/dist/CookieMgr.js?v='+Date.now());}());
   ```

3. Open the game, wait for it to finish loading, and click the bookmark.

A column of small icons appears next to the big cookie. That's cookieMgr. Click the bookmark again each time you
open the game; it always loads the latest version.

### 2. Userscript (loads by itself every time)

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or
   [Violentmonkey](https://violentmonkey.github.io/).
2. Open [CookieMgr.user.js](https://github.com/nunorgcarvalho/cookieMgr/raw/main/CookieMgr.user.js) and click
   **Install** when your userscript manager asks.

From then on cookieMgr loads whenever you open the game.

### 3. Console (one time, nothing to save)

Open the game, press **F12** (**Cmd+Option+I** on a Mac) and pick the **Console** tab, then paste this line and press
**Enter**. (Chrome may ask you to type `allow pasting` first.)

```js
Game.LoadMod('https://nunorgcarvalho.github.io/cookieMgr/dist/CookieMgr.js?v=' + Date.now());
```

### It didn't load?

- **Clicking the bookmark does nothing.** Check that the bookmark's URL starts with `javascript:`. Some browsers
  drop that part when you paste it into the address bar, so paste it into the bookmark's URL field instead.
- **Clicked it before the game finished loading.** Wait until you can see the big cookie, then click it again.
- **Clicked it twice.** cookieMgr only loads once per page. Reload the game page (your game is saved) and click the
  bookmark once.
- Still stuck? [Open an issue](https://github.com/nunorgcarvalho/cookieMgr/issues) and say which browser you use.

## Your first five minutes

Everything lives behind the **column of icons** on the left. Hover an icon for its name, click it to open that
page, click it again to close it.

1. **Macros** (⚡): switch on **Golden cookies**, and cookieMgr pops every golden cookie the moment it appears.
   **Big cookie** clicks the cookie for you.
2. **Payback** ($): switch on the **Auto buyer**. It buys whatever pays for itself fastest, and shows its queue so you
   can see what's next and why.
3. **Stats** (the bar chart icon): watch your cookies per second, where they come from, and what golden cookies are worth right now.
4. **Widgets**: star (☆) anything you want to keep on screen, like a golden cookie timer or a macro's button,
   and drag it where you like on the left panel.

Your settings and history are saved with your game, so they're there the next time you load cookieMgr.

## What's inside

### Stats

Charts of your cookies per second, where every cookie came from (buildings, clicking, golden cookies, stock
trades…), your bank and your prestige, recorded every second and kept between sessions. Zoom in, look back as far as
you like, and see each Frenzy and Click frenzy shaded behind the chart. Next to the charts: when the next golden
cookie is due, how much bank Lucky! and other payouts need, what each Pantheon spirit or dragon aura would add, and
what's still left to collect.

![The Stats page: cookies per second with a Frenzy and a Click frenzy](docs/readme/stats.png)

### Payback and the Auto buyer

Every building and upgrade gets a **payback period**: how long until it has paid for itself. cookieMgr asks the game
itself what each purchase adds, so the numbers are exact. The **Auto buyer** buys from a queue sorted by payback, with
profiles (buildings only, upgrades only, your own rules) and a bank reserve so it never spends the cookies you're
saving for Lucky!. The game's store is colored by payback too.

![The Payback page: the Auto buyer, its queue and the active profile](docs/readme/payback.png)

### Macros

Everything cookieMgr automates is a **macro**: built-ins for clicking, golden and wrath cookies, reindeer,
wrinklers, fortunes, alerts and stock trading, plus your own. Give any macro a hotkey or a button on the left panel.
Need more than a switch? Write a macro in cookieMgr's own simple code, with a library of everything it can read and
do.

![The Macros page: the built-in autoclickers](docs/readme/macros.png)

### Minigames

- **Garden**: an Auto-gardener that plants layouts, harvests and hunts for new seeds, with the odds of each mutation
  shown on the game's own tiles.
- **Stock market**: trend badges on every stock, a stock trader, Sell all, and charts of your portfolio and trades.
- **Grimoire**: cast spells from a button or a hotkey, and auto-cast Force the Hand of Fate at the right moment.
- **Pantheon** and **Dragon**: what each spirit and aura would add right now, and profiles that swap them for you.

### Events and Statistics

**Events** is a log of everything that happened (golden cookies and what they did, wrinklers, sugar lumps, trades,
ascensions), with a table of income outside your CpS. **Statistics** lets you choose what the store's tooltips show,
and write your own statistics.

### Widgets and Settings

**Widgets** are small panels you place on the game's left side: macro buttons, golden cookie odds, effect timers,
charts, the garden, the stock market and more. **Settings** has number notation (short scale, metric, scientific…),
hotkeys, history export and import, and a button to load Cookie Monster alongside if you like both.

**Coming in v4.0.0:** managers that play a whole ascension for you in stages, switching macros and profiles as
the run goes on.

## Good to know

- **Fair play.** cookieMgr never reads the game's random seed to predict what comes next. It works from expected
  values and your own history only.
- **Your data stays with you.** Settings are saved inside your Cookie Clicker save (so they survive export and
  import), and the recorded history stays in your browser.
- **Updates.** cookieMgr checks for a newer version every 15 minutes and offers a one-click reload. It never updates
  itself without asking.
- **Cookie Monster is optional.** cookieMgr doesn't need it, but works fine next to it.
- **Turning it off.** Reload the game page without clicking the bookmark.

## Learn more

- **[The full guide](docs/GUIDE.md)**: every page, option and macro word in detail.
- **[Changelog](CHANGELOG.md)**: what changed in each version.
- **[Developing cookieMgr](docs/DEVELOPMENT.md)**: building, testing, the project layout and how to add things.
- **[The simulator](sim/README.md)**: run Cookie Clicker headless to test strategies over weeks of game time.

## License

[MIT](LICENSE)
