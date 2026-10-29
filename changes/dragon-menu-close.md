---
bump: patch
---

- **Fixed:** petting the dragon (the Pet the dragon macro, and the upgrade unlocker that runs it) left the game's dragon menu open
  for good: it was never redrawn, so its auras looked stale after a profile switched them (until a reload), and its × did
  nothing. It now closes again after petting.
