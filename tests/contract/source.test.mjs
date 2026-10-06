// Contract tests on the source itself: the layers stay apart, every file is built, and the house
// rules hold (styled tooltips only, scrolling only inside the panel).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const files = (dir) => fs.readdirSync(path.join(SRC, dir)).filter((f) => f.endsWith('.js')).map((f) => `${dir}/${f}`);
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
/** The code without its comments (good enough for these checks: no comment markers inside strings that matter). */
const code = (f) =>
  read(f)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .map((l) => (/^\s*\/\//.test(l) ? '' : l))
    .join('\n');
const where = (f, re) =>
  code(f)
    .split('\n')
    .map((l, i) => (re.test(l) ? `${f}:${i + 1}` : null))
    .filter(Boolean);

// ---- layers: core and features never reach into the UI (main.js wires everything together)
const lower = [...files('core'), ...files('features')];
const up = lower.flatMap((f) => where(f, /CA\.UI\b/));
assert(!up.length, `core/ and features/ don’t use CA.UI${up.length ? ` — ${up.join(', ')}` : ''}`);
const coreUp = files('core').flatMap((f) => where(f, /CA\.(Macros|Garden|Seasons|AutoBuy|Grimoire|Stocks|StockTrader|Shop|GardenHistory)\b/));
assert(!coreUp.length, `core/ doesn’t depend on features${coreUp.length ? ` — ${coreUp.join(', ')}` : ''}`);

// ---- every source file is in the bundle
const build = fs.readFileSync(path.join(SRC, '../build.mjs'), 'utf8');
const all = [...files('core'), ...files('features'), ...files('ui')];
const missing = all.filter((f) => !build.includes(`'${f}'`));
assert(!missing.length, `every src file is built${missing.length ? ` — not in build.mjs: ${missing.join(', ')}` : ''}`);

// ---- house rules (out.title: a widget's saved name, not an attribute)
const ui = [...files('ui'), ...files('features')];
const titles = ui.flatMap((f) => where(f, /\stitle="|(?<!\bout)\.title\s*=[^=]|setAttribute\(\s*'title'/)).filter((x) => !x.startsWith('ui/tips.js'));
assert(!titles.length, `no native title tooltips — data-tip (ui/tips.js)${titles.length ? ` — ${titles.join(', ')}` : ''}`);
const scrolls = all.flatMap((f) => where(f, /scrollIntoView\(/));
assert(!scrolls.length, `no scrollIntoView (it shifts the game's own containers) — CA.Util.scrollInPanel${scrolls.length ? ` — ${scrolls.join(', ')}` : ''}`);

// ---- no dead CSS: every class styles.css styles is produced by some JS (literally, or by a
// `ca-badge-${…}` / 'ca-w-' + x template)
{
  const css = read('ui/styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const js = all.map(read).join('\n');
  const classes = [...new Set([...css.matchAll(/\.((?:ca|cm)-[\w-]+)/g)].map((m) => m[1]))];
  const dyn = [...js.matchAll(/((?:ca|cm)-[\w-]*-)\$\{/g), ...js.matchAll(/'((?:ca|cm)-[\w-]*-)'\s*\+/g)].map((m) => m[1]);
  const dead = classes.filter((c) => !new RegExp(`(^|[^\\w-])${c}(?![\\w-])`).test(js) && !dyn.some((p) => c.startsWith(p)));
  assert(!dead.length, `every CSS class is used (${classes.length})${dead.length ? ` — never produced by JS: ${dead.join(', ')}` : ''}`);
}

done();
process.exit();
