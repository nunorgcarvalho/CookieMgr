---
bump: minor
---

- **Tooltip layouts:** the store tooltip's lines can be saved as layouts, like the other profiles. The built-in
  **Default** is always there and can't be deleted (once changed, **Revert to default**); **Save as a new layout**
  copies the lines in use under a name. **Use** / **In use** and trash cans as everywhere else, and the line editor
  below edits the layout in use. Macros: `tooltips.profile(name)`, `tooltips.activeProfile`,
  `tooltips.profileActive(name)`, `tooltips.profiles`. A layout you had already changed stays as the Default, edited.
- **Default tooltip lines:** Bonus income, Payback period, Income by actual income, Payback period by actual income,
  Share of production, Next upgrade, Next achievement (Affordable and Wins are still there to add). The plain
  **Bonus income** and **Payback period** lines are by raw CpS: Bonus income is the raw CpS an item adds (and its
  share of your raw CpS), and the Default's Payback period is the raw CpS one ("Payback, raw CpS", now labelled
  "Payback period", in its payback color while the payback mode is Raw CpS).
