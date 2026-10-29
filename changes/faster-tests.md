---
bump: patch
---

- **Faster tests and CI:** CI runs the tests in four shards side by side (about 1.5 min instead of 6); locally
  `npm test` runs a file per core, slowest first (about 3 min instead of 6). Scrolling a row into view no longer
  asks for computed styles of every panel above it.
