// The garden's numbers, taken from the game itself: the real minigameGarden.js is loaded (a
// headless game with a level-9 Farm) and its plants, soils and plot sizes are read off it — so the
// fast models (models/garden.mjs) never carry a copy of the game's data that could drift.
// Cached as JSON next to the game's scripts.
import fs from 'node:fs';
import path from 'node:path';
import { bootGame } from '../game/boot.mjs';
import { DIR, GAME_VERSION } from '../game/fetch.mjs';

const CACHE = path.join(DIR, 'garden.json');

/** { version, plants: { key: { name, ageTick, ageTickR, mature, immortal, weed, fungus, cost, costM, effects } }, soils: { key: { name, tick (min), effMult, weedMult, req } }, plotLimits } */
export async function gardenData({ fresh = false } = {}) {
  if (!fresh && fs.existsSync(CACHE)) {
    const d = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    if (d.version === GAME_VERSION) return d;
  }
  const g = await bootGame({ seed: 1 });
  const F = g.Game.Objects.Farm;
  F.level = 9;
  g.Game.LoadMinigames();
  g.clock.runUntil(g.clock.now + 1000);
  const M = F.minigame;
  if (!M || !M.plants) throw new Error('The garden minigame did not load');
  const text = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&bull;/g, '·').replace(/\s+/g, ' ').trim();
  const plants = {};
  for (const k of Object.keys(M.plants)) {
    const p = M.plants[k];
    plants[k] = { name: p.name, ageTick: p.ageTick, ageTickR: p.ageTickR, mature: p.mature, immortal: !!p.immortal, weed: !!p.weed, fungus: !!p.fungus, cost: p.cost, costM: p.costM, effects: text(p.effsStr) };
  }
  const soils = {};
  for (const k of Object.keys(M.soils)) {
    const s = M.soils[k];
    soils[k] = { name: s.name, tick: s.tick, effMult: s.effMult, weedMult: s.weedMult, req: s.req };
  }
  const data = { version: GAME_VERSION, plants, soils, plotLimits: M.plotLimits };
  fs.writeFileSync(CACHE, JSON.stringify(data, null, 1));
  return data;
}

/** The unlocked plot at a Farm level: { x0, y0, w, h }. */
export function plotAt(data, level) {
  const l = data.plotLimits[Math.max(1, Math.min(data.plotLimits.length, level)) - 1];
  return { x0: l[0], y0: l[1], w: l[2] - l[0], h: l[3] - l[1] };
}
