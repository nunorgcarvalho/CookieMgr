// cookieMgr releases — changelog fragments in, versions out. Zero dependencies, just Node 18+.
//
// Pull requests never touch a version. Each one adds a fragment instead:
//
//   changes/<slug>.md         the add-on        (CHANGELOG.md, package.json, dist/, tag vX.Y.Z)
//   sim/changes/<slug>.md     the simulator     (sim/CHANGELOG.md, SIM_VERSION in sim/sim.mjs, tag sim-vX.Y.Z)
//
//   ---
//   bump: minor              major | minor | patch
//   ---
//   - **What changed:** the CHANGELOG bullets, as they should read.
//
// After a merge to main, the Release workflow runs `release`: the biggest bump of the waiting fragments sets
// the next version, their text becomes its CHANGELOG section, the fragments are deleted and dist/ is rebuilt.
//
//   node scripts/changes.mjs next             what the next release would be (nothing is written)
//   node scripts/changes.mjs release          write it (the Release workflow; also fine locally to preview)
//   node scripts/changes.mjs check <base>     a pull request's rules, against <base> (CI)

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUMPS = ['patch', 'minor', 'major'];

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const tryGit = (...args) => {
  try {
    return git(...args);
  } catch {
    return '';
  }
};

const PKG = {
  name: 'add-on',
  dir: 'changes',
  changelog: 'CHANGELOG.md',
  tag: (v) => `v${v}`,
  getVersion: () => JSON.parse(read('package.json')).version,
  setVersion(v) {
    write('package.json', read('package.json').replace(/("version":\s*")[^"]+(")/, `$1${v}$2`));
    const lock = JSON.parse(read('package-lock.json'));
    lock.version = v;
    if (lock.packages && lock.packages['']) lock.packages[''].version = v;
    write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
  },
  heading: (v, date) => `## ${v} — ${date}`,
};
const SIM_FILE = 'sim/sim.mjs';
const SIM_RE = /(export const SIM_VERSION = ')([^']+)(')/;
const SIM = {
  name: 'simulator',
  dir: 'sim/changes',
  changelog: 'sim/CHANGELOG.md',
  tag: (v) => `sim-v${v}`,
  getVersion: () => read(SIM_FILE).match(SIM_RE)[2],
  setVersion: (v) => write(SIM_FILE, read(SIM_FILE).replace(SIM_RE, `$1${v}$3`)),
  heading: (v, date, addOn) => `## ${v} — ${date} (add-on v${addOn})`,
};

/** A fragment's { file, bump, body }, or throws saying what's wrong with it. */
function parseFragment(file) {
  const text = read(file);
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: must start with a front matter block (---\\nbump: minor\\n---)`);
  const bump = (m[1].match(/^bump:\s*(\S+)\s*$/m) || [])[1];
  if (!BUMPS.includes(bump)) throw new Error(`${file}: bump must be one of ${BUMPS.join(', ')} (got ${bump || 'nothing'})`);
  const body = m[2].trim();
  if (!body) throw new Error(`${file}: says nothing — write the CHANGELOG bullets under the front matter`);
  if (/^#{1,2} /m.test(body)) throw new Error(`${file}: no # or ## headings — the release writes the version heading`);
  return { file, bump, body };
}

/** The waiting fragments of a package, oldest first (by when git first saw them, then by name). */
function fragments(pkg) {
  const dir = path.join(ROOT, pkg.dir);
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => `${pkg.dir}/${f}`);
  const added = (f) => Number(tryGit('log', '--diff-filter=A', '--format=%ct', '-1', '--', f)) || Infinity;
  return files.map((f) => ({ ...parseFragment(f), at: added(f) })).sort((a, b) => a.at - b.at || a.file.localeCompare(b.file));
}

function bumpVersion(version, bump) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** What releasing a package would do: null when nothing waits. */
function plan(pkg) {
  const frags = fragments(pkg);
  if (!frags.length) return null;
  const bump = BUMPS[Math.max(...frags.map((f) => BUMPS.indexOf(f.bump)))];
  const from = pkg.getVersion();
  return { pkg, frags, bump, from, version: bumpVersion(from, bump), notes: frags.map((f) => f.body).join('\n') };
}

/**
 * The changelog with a new version section: whatever sat under "## Unreleased" (if anything) and the fragments,
 * under the new heading; "## Unreleased" stays, empty, on top.
 */
function addSection(changelog, heading, notes) {
  const lines = changelog.split('\n');
  let at = lines.findIndex((l) => /^## Unreleased/.test(l));
  let held = '';
  if (at >= 0) {
    let end = lines.findIndex((l, i) => i > at && /^## /.test(l));
    if (end < 0) end = lines.length;
    held = lines
      .slice(at + 1, end)
      .join('\n')
      .trim();
    lines.splice(at, end - at, '## Unreleased', '');
    at += 2;
  } else {
    at = lines.findIndex((l) => /^## /.test(l));
    if (at < 0) at = lines.length;
  }
  const body = [held, notes].filter(Boolean).join('\n');
  lines.splice(at, 0, heading, '', body, '');
  return lines.join('\n');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function next() {
  const plans = [plan(PKG), plan(SIM)].filter(Boolean);
  if (!plans.length) return console.log('Nothing to release: no fragments in changes/ or sim/changes/.');
  for (const p of plans) {
    console.log(`${p.pkg.name}: ${p.from} → ${p.version} (${p.bump}; ${p.frags.map((f) => f.file).join(', ')})\n`);
    console.log(p.notes + '\n');
  }
}

function release() {
  const date = today();
  const addOn = plan(PKG);
  const sim = plan(SIM);
  const out = { version: '', sim_version: '', tags: [] };
  const notes = [];
  if (addOn) {
    addOn.pkg.setVersion(addOn.version);
    write(PKG.changelog, addSection(read(PKG.changelog), PKG.heading(addOn.version, date), addOn.notes));
    out.version = addOn.version;
    out.tags.push(PKG.tag(addOn.version));
    notes.push(addOn.notes);
  }
  if (sim) {
    sim.pkg.setVersion(sim.version);
    write(SIM.changelog, addSection(read(SIM.changelog), SIM.heading(sim.version, date, PKG.getVersion()), sim.notes));
    out.sim_version = sim.version;
    out.tags.push(SIM.tag(sim.version));
    if (addOn) notes.push(`### Simulator ${sim.version}\n\n${sim.notes}`);
    else notes.push(sim.notes);
  }
  for (const p of [addOn, sim].filter(Boolean)) for (const f of p.frags) fs.rmSync(path.join(ROOT, f.file));

  execFileSync(process.execPath, ['build.mjs'], { cwd: ROOT, stdio: 'inherit' });

  const title = [addOn && `v${addOn.version}`, sim && `sim v${sim.version}`].filter(Boolean).join(', ');
  if (title) {
    console.log(`Released ${title}`);
    fs.writeFileSync(path.join(ROOT, '.release-notes.md'), notes.join('\n\n') + '\n');
  } else console.log('No fragments: dist/ rebuilt only.');
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `title=${title}\nversion=${out.version}\nsim_version=${out.sim_version}\ntags=${out.tags.join(' ')}\n`
    );
  }
}

/** A pull request's rules: versions, changelogs and dist/ are the release's to write; fragments must parse. */
function check(base) {
  if (!base) throw new Error('usage: node scripts/changes.mjs check <base ref>');
  const mergeBase = git('merge-base', base, 'HEAD');
  const changed = git('diff', '--name-only', '--diff-filter=ACMRD', mergeBase, 'HEAD').split('\n').filter(Boolean);
  const added = git('diff', '--name-only', '--diff-filter=A', mergeBase, 'HEAD').split('\n').filter(Boolean);
  const at = (ref, file) => tryGit('show', `${ref}:${file}`);
  const errors = [];
  const fix = 'leave it as main has it (git checkout origin/main -- <file>) and add a fragment in changes/ instead';

  const touched = (f) => changed.includes(f);
  if (changed.some((f) => f.startsWith('dist/')))
    errors.push(`dist/ is built by the Release workflow after the merge: don't commit it (git checkout origin/main -- dist).`);
  for (const f of [PKG.changelog, SIM.changelog]) if (touched(f)) errors.push(`${f} is written by the Release workflow: ${fix}.`);
  const version = (ref, f) => (at(ref, f).match(/"version":\s*"([^"]+)"/) || [])[1];
  for (const f of ['package.json', 'package-lock.json'])
    if (touched(f) && version(mergeBase, f) !== version('HEAD', f))
      errors.push(`${f}: the version is the Release workflow's to bump: ${fix}.`);
  const simVersion = (ref) => (at(ref, SIM_FILE).match(SIM_RE) || [])[2];
  if (touched(SIM_FILE) && simVersion(mergeBase) !== simVersion('HEAD'))
    errors.push(`${SIM_FILE}: SIM_VERSION is the Release workflow's to bump: add a fragment in sim/changes/ instead.`);
  for (const f of added.filter((f) => /^tests\/e2e\/v\d+\.\d+\.\d+/.test(f)))
    errors.push(`${f}: name new end-to-end tests after the feature (tests/e2e/<feature>.test.mjs), not a version.`);

  for (const pkg of [PKG, SIM]) {
    try {
      fragments(pkg);
    } catch (e) {
      errors.push(e.message);
    }
  }
  const fragmentAdded = (pkg) => added.some((f) => f.startsWith(pkg.dir + '/') && f.endsWith('.md'));
  if (changed.some((f) => f.startsWith('src/')) && !fragmentAdded(PKG))
    console.log(`::warning::src/ changed but no changes/<slug>.md was added: this ships with the next release, unannounced.`);
  if (changed.some((f) => f.startsWith('sim/') && !f.startsWith('sim/changes/')) && !fragmentAdded(SIM))
    console.log(`::warning::sim/ changed but no sim/changes/<slug>.md was added.`);

  if (errors.length) {
    for (const e of errors) console.log(`::error::${e}`);
    console.error(`\n${errors.length} problem(s). See docs/DEVELOPMENT.md → Releasing.`);
    process.exit(1);
  }
  console.log('Pull request rules: OK.');
  for (const p of [plan(PKG), plan(SIM)].filter(Boolean)) console.log(`On merge: ${p.pkg.name} ${p.from} → ${p.version} (${p.bump})`);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'next') next();
  else if (cmd === 'release') release();
  else if (cmd === 'check') check(rest[0]);
  else {
    console.error('usage: node scripts/changes.mjs next | release | check <base ref>');
    process.exit(2);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
