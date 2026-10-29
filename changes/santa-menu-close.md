---
bump: patch
---

- **Fixed:** levelling Santa (the Santa macro, SeasonCompletion) put up the game's Santa/dragon menu, empty and stuck,
  when no menu was open: the game redraws it after every level, and its × did nothing. It's closed again now; a
  menu you had open stays open.
