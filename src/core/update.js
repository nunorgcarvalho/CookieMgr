// Periodically checks GitHub Pages for a newer build and lets you know with one click to
// reload — it deliberately does NOT try to hot-swap the running mod in place. CookieMgr
// monkey-patches several Game.* functions (see CA.Util.wrap) and injects DOM/CSS with no
// matching teardown, so re-initializing over itself without a full page reload risks
// double-wrapped functions and leaked listeners/timers. A plain "click to reload" is the safe
// way to actually apply an update; this only ever removes the manual "go check GitHub" step.

CA.Update = (() => {
  const VERSION_URL = 'https://nunorgcarvalho.github.io/CookieMgr/dist/version.txt';
  const CHECK_MS = 15 * 60 * 1000;
  const FIRST_CHECK_MS = 30000;

  let timer = null;
  let notifiedVersion = null;

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
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const remote = (await res.text()).trim();
      if (!/^\d+\.\d+\.\d+$/.test(remote) || remote === notifiedVersion || !isNewer(remote, CA.VERSION)) return;
      notifiedVersion = remote;
      CA.Util.notify(
        `CookieMgr v${remote} is available`,
        `You're on v${CA.VERSION}. <a href="javascript:void(0)" onclick="location.reload()">Reload now</a> to update — ` +
          `CookieMgr can't safely update itself without a page reload.`,
        CA.ICON,
        6
      );
    } catch (e) {
      /* offline, blocked, CORS-blocked, whatever — this is a convenience check, never fatal */
    }
  }

  function init() {
    CA.Settings.defineOption({
      key: 'updateCheck',
      icon: 'refresh',
      group: 'general',
      name: 'Check for updates',
      desc: 'Periodically checks GitHub for a newer CookieMgr build and lets you know — never updates automatically.',
      default: true,
    });
    setTimeout(check, FIRST_CHECK_MS);
    timer = setInterval(check, CHECK_MS);
  }

  return { init };
})();
