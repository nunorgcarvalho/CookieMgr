// Downloads the real game's scripts (Cookie Clicker by Orteil — © Orteil, not ours to commit) into
// sim/.game/<version>/, once. The simulator runs this exact code headless (game/boot.mjs).
//
//   node sim/game/fetch.mjs            the files for GAME_VERSION (skips what's already there)
//   node sim/game/fetch.mjs --force    download again
//
// The CDN serves the scripts directly (the page itself sits behind a bot check).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GAME_VERSION = '2.058'; // what the simulator is checked against (index.html's VERSION)
export const BASE = 'https://cdn.dashnet.org/cookieclicker/';
export const FILES = ['main.js', 'minigameGarden.js', 'minigameGrimoire.js', 'minigameMarket.js', 'minigamePantheon.js', 'loc/EN.js'];
/** Mods the simulator can load too (downloaded on first use, like the game): name → URL. */
export const MODS = { 'CookieMonster.js': 'https://cookiemonsterteam.github.io/CookieMonster/dist/CookieMonster.js' };
export const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.game', GAME_VERSION);

/** The folder with the game's scripts, downloading what's missing. */
export async function ensureGame({ force = false, quiet = false } = {}) {
  for (const f of FILES) {
    const out = path.join(DIR, f);
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 0) continue;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const res = await fetch(BASE + f + `?v=${GAME_VERSION}`, { headers: { 'User-Agent': 'Mozilla/5.0 (CookieMgr simulator)' } });
    if (!res.ok) throw new Error(`Couldn't download ${f}: HTTP ${res.status}`);
    const text = await res.text();
    if (/^\s*<!DOCTYPE/i.test(text)) throw new Error(`Couldn't download ${f}: got a web page instead of the script (bot check?)`);
    fs.writeFileSync(out, text);
    if (!quiet) console.log(`[sim] fetched ${f} (${(text.length / 1024).toFixed(0)} KB)`);
  }
  return DIR;
}

/** A mod's script, downloaded once into sim/.game/<version>/mods/; its path. */
export async function ensureMod(name, { quiet = false } = {}) {
  const out = path.join(DIR, 'mods', name);
  if (fs.existsSync(out) && fs.statSync(out).size > 0) return out;
  if (!MODS[name]) throw new Error(`Unknown mod ${name}`);
  const res = await fetch(MODS[name]);
  if (!res.ok) throw new Error(`Couldn't download ${name}: HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await res.text());
  if (!quiet) console.log(`[sim] fetched mod ${name}`);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensureGame({ force: process.argv.includes('--force') }).then((d) => console.log(`[sim] game ${GAME_VERSION} in ${d}`));
}
