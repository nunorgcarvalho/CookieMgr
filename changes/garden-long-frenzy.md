---
bump: patch
---

- **Fixed:** the Tulip and clover rounds gardener never replanted the golden clovers while frenzies ran back to back
  (long combos): it waited for every effect that makes seeds dearer to end. It now waits one out only if it ends
  within `waitOutUpTo` (2 min, a new knob); with longer left it plants at today's price, the Garden rounds bank keeps
  today's price, and the queue's garden rows aren't held. New word `garden.priceBoostLeft()`.
- **Fixed:** a garden row's gain in the Auto buyer queue counted a Frenzy's CpS as steady income, so during one the
  golden cookie part looked like nothing and the row "never paid back"; it now takes CpS + clicking without effects.
