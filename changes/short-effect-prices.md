---
bump: minor
---

- **Prices that scale with CpS** (seeds, the Golden switch, the garden drops' cookies, Wrinkler ambergris) look past a
  short effect: one that ends within the new Payback option **Wait out effects up to** (180 s) is priced away. Payback
  periods, the store's colors, the Garden replant and Garden rounds banks and the Auto buyer's queue count the price once
  it's over, and the Auto buyer and the gardener wait it out ("an effect makes it more expensive: waits it out"). An
  effect with longer left (frenzies back to back) is part of the price, as before.
- New words `payback.effectBoost()`, `payback.effectLeft()`, `payback.effectWait()`, `payback.waitingOut()`. The Tulip and
  clover rounds gardener waits out effects ending within `payback.effectWait()`; its `waitOutUpTo` knob is gone (it was 120 s, now the option's 180 s).
