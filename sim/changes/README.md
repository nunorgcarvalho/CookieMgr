# Simulator changelog fragments

Like the add-on's (`changes/README.md`): a pull request that changes the simulator adds `sim/changes/<slug>.md`

```md
---
bump: minor
---

- **What changed:** …
```

and never edits `SIM_VERSION` or `sim/CHANGELOG.md`. On merge the Release workflow bumps `SIM_VERSION` in
`sim/sim.mjs`, writes the `## X.Y.Z — date (add-on vA.B.C)` section and tags `sim-vX.Y.Z`.
