---
bump: minor
---

- **Garden rounds, tulips first:** the Tulip and clover rounds gardener (8 nursetulips together + clover combos)
  plants each round whole, once the bank covers all of it, and waits out effects that make seeds dearer (a Frenzy:
  7 times). The nursetulips go first: no golden clover round starts while a tulip round is due. Knobs
  `wholeRounds`, `tulipsFirst`, `waitOutEffects`; new words `garden.roundCost(seed)`, `garden.priceBoost()`,
  `garden.roundsReserve()`.
- **Garden rounds bank:** a new Auto buyer bank that keeps what the garden's rounds need, at unbuffed prices: the
  nursetulips' round while they aren't all planted, plus the **Rounds margin** (default 1.25) × a golden clover round. Seeds cost
  minutes of CpS, so CpS bought never brings a round closer; the buyer spends only what's above. Nunix late game's
  Golden cookie combos profile keeps it in place of Garden replant (saved profiles too).
