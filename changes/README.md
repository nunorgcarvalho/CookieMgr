# Changelog fragments

A pull request never bumps the version, edits `CHANGELOG.md` or commits `dist/`. It adds one file here instead,
named after the change (`changes/manager-widget.md`, not `changes/v4.1.0.md`):

```md
---
bump: minor
---

- **Manager widget:** the stage a manager is in, what moves it on, and the macros at work.
- **Fixed:** …
```

- `bump`: `major` (breaks saves or changes how something works for good), `minor` (a feature), `patch` (a fix,
  docs, screenshots).
- The body is the CHANGELOG text, as it should read under the version heading (no `#`/`##` headings: the release
  writes `## X.Y.Z — date`).

When the pull request merges, the **Release** workflow (`.github/workflows/release.yml`) takes every fragment
waiting here: the biggest bump sets the next version, the fragments become its CHANGELOG section (oldest first)
and are deleted, `package.json` and `dist/` are updated, and it commits `vX.Y.Z: <PR title>`, tags `vX.Y.Z` and
publishes a GitHub release.

`node scripts/changes.mjs next` shows what the next release would be. The simulator has its own fragments, in
`sim/changes/`.
