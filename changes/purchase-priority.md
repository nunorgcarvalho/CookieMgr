---
bump: minor
---

- **Purchase priority:** the Auto buyer puts every purchase on one scale. Each thing in its queue gets an **implied
  payback period** (its payback period after the rules' weights) and a **score**, 0–100: 100 for the best payback
  period, 10 points less for each doubling (a weight ×2 costs 10 points). The Payback page's queue shows both.
- **Thresholds are priorities:** what a profile keeps — minutes of CpS, the Lucky!, Conjure, Frenzy Lucky! banks and
  the garden's replant — sits in the queue as a row of its own that the buyer saves up for. Each is **first** (the
  default, as before: nothing is bought into it) or placed **after what scores N+**, so only things that good may
  spend into it. The garden's row lists the seeds it plants and how many are missing now.
- **What it's waiting for:** the Auto buyer card and the Manager widget's Auto buyer row say what it's saving for
  ("Saving: Garden replant", how far along, why it comes first) and what it buys after; the next thing's card says
  why it's next and its score. New words `buyer.impliedPayback(thing)` and `buyer.waitingFor()`; `buyer.score(thing)`
  is now the 0–100 score (it was the weighted payback period, now `buyer.impliedPayback`).
