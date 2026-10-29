# cookieMgr — notes for Claude

Developer docs: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) (build, tests, project structure, releasing).

## Versions are written after the merge — never in a pull request

Several pull requests are open at once; the version is set by the **Release** workflow when each one merges, so
none of them clash over it.

- **Do** add a changelog fragment: `changes/<feature>.md` (`sim/changes/<feature>.md` for the simulator) with
  front matter `bump: major | minor | patch` and the CHANGELOG bullets as the body. See
  [changes/README.md](changes/README.md).
- **Don't** change the version (`package.json`, `package-lock.json`, `SIM_VERSION` in `sim/sim.mjs`),
  `CHANGELOG.md`, `sim/CHANGELOG.md`, or commit `dist/` (build it to test; `git checkout origin/main -- dist`
  before committing).
- **Name things after the feature, not a version:** PR titles, `tests/e2e/<feature>.test.mjs`, screenshots in
  `docs/pr/<feature>/`, comments in code and CSS.
- Bringing a branch up to date with `main` is a plain merge/rebase: nothing to re-bump or rename.
- Don't push tags: the workflow tags `vX.Y.Z` / `sim-vX.Y.Z` and publishes the GitHub release.

CI enforces this (`node scripts/changes.mjs check origin/main`); `npm run changes` previews the next release.
