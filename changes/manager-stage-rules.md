---
bump: minor
---

- **Stages build on each other.** Stage 1 sets things up; each stage after it keeps only what it **changes**, and
  the rest carries over until a later stage changes it back. Managers saved earlier (each stage a full list) are
  turned into changes when loaded and run as before.
- **The stage editor shows rules.** Each stage card lists its Switch on / Switch off chips (click to flip, × to
  drop), its settings and its profiles, each with a "+" list to add one; later stages start with a folded
  "Carries over from stage N" summary. A new stage changes nothing; deleting one hands its changes to the next.
- **The code matches.** A block per stage (`if manager.stage() >= N:`) whose changes run under the new
  `manager.arriving(N)` on its first pass, so stage 1's setup is written once (Nunix late game is now 47 lines).
  Moving on makes only the new stage's changes, so a macro you flipped by hand stays flipped; jumping to a stage
  sets up the stages before it too. Profiles: the latest stage's wins.
- **Nunix late game, revised.** From the start: reindeer clicked, the Upgrade unlocker (Santa, research, Auto dragon,
  Pet the dragon, Fortunes, cheap upgrades), and research all the way up to, not into, the Elder Pact, so the
  Grandmapocalypse keeps going for the drops. Garden, Grimoire and stock market stay off. Once the veil breaks,
  the big cookie is clicked too.
