// Periodically checks GitHub Pages for a newer build and lets you know with one click to
// reload — it deliberately does NOT try to hot-swap the running mod in place. cookieMgr
// monkey-patches several Game.* functions (see CA.Util.wrap) and injects DOM/CSS with no
// matching teardown, so re-initializing over itself without a full page reload risks
// double-wrapped functions and leaked listeners/timers. A plain "click to reload" is the safe
// way to actually apply an update; this only ever removes the manual "go check GitHub" step.
//
// How often: version.txt is a few bytes on GitHub Pages, which has no per-request rate limit
// (only a soft 100 GB/month bandwidth cap), and the ?t= query skips its CDN cache (max-age 10
// min) so a check always sees the live file. A release reaches Pages a minute or two after its
// merge, so every 5 minutes, plus a quick check whenever the Settings page opens (at most once a
// minute), finds it promptly without polling for nothing.

CA.Update = (() => {
  const VERSION_URL = 'https://nunorgcarvalho.github.io/cookieMgr/dist/version.txt';
  const CHECK_MS = 5 * 60 * 1000;
  const FIRST_CHECK_MS = 30000;
  const SOON_MS = 60 * 1000; // checkSoon() skips a check if the last one was this recent

  let notifiedVersion = null;
  let lastCheck = 0;
  let latest = null; // the version the last successful check saw

  /** True if `a` (e.g. "0.4.0") is a newer semver-ish version than `b`. */
  function isNewer(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const va = pa[i] || 0;
      const vb = pb[i] || 0;
      if (va !== vb) return va > vb;
    }
    return false;
  }

  async function check() {
    if (typeof fetch !== 'function' || !CA.Settings.get('updateCheck')) return;
    lastCheck = Date.now();
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const remote = (await res.text()).trim();
      if (!/^\d+\.\d+\.\d+$/.test(remote)) return;
      const known = latest !== null;
      latest = remote;
      if (remote === notifiedVersion || !isNewer(remote, CA.VERSION)) {
        if (!known) CA.Events.emit('update', null); // first answer: now known to be up to date
        return;
      }
      notifiedVersion = remote;
      CA.Events.emit('update', remote);
      CA.Util.notify(
        `cookieMgr v${remote} is available`,
        `You're on v${CA.VERSION}. <a href="javascript:void(0)" onclick="location.reload()">Reload now</a> to update — ` +
          `cookieMgr can't safely update itself without a page reload.`,
        CA.ICON,
        6
      );
    } catch (e) {
      /* offline, blocked, CORS-blocked, whatever — this is a convenience check, never fatal */
    }
  }

  /** The newer version found (e.g. "4.11.0"), or null if you're up to date or it isn't known yet. */
  function available() {
    return notifiedVersion && isNewer(notifiedVersion, CA.VERSION) ? notifiedVersion : null;
  }

  /** 'available' (a newer release was found), 'current' (a check found nothing newer) or null (not known: no check has answered yet, or Check for updates is off). */
  function status() {
    if (available()) return 'available';
    return latest !== null && CA.Settings.get('updateCheck') ? 'current' : null;
  }

  /** Checks now unless the last check was under a minute ago (the Settings page calls this as it opens). */
  function checkSoon() {
    if (Date.now() - lastCheck >= SOON_MS) check();
  }

  function init() {
    CA.Settings.defineOption({
      key: 'updateCheck',
      icon: 'refresh',
      group: 'general',
      name: 'Check for updates',
      desc: 'Periodically checks GitHub for a newer cookieMgr build and lets you know — never updates automatically.',
      default: true,
    });
    setTimeout(check, FIRST_CHECK_MS);
    setInterval(check, CHECK_MS);
  }

  return { init, check, checkSoon, available, status, isNewer };
})();
