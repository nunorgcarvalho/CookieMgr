---
bump: minor
---

- **Payback modes by actual income at three depths:** **Actual, 15 min**, **Actual, 1 h** and **Actual, 3 h**
  count payback periods in what you actually took in (everything baked) over the last 15 minutes, hour or 3 hours
  of play. They're chips on the Payback page beside the others, statistics on the Payback modes shelf
  (`actualIncome15m`, `actualIncome1h`, `actualIncome3h`; short names `actual15m`, `actual1h`, `actual3h`), and
  usable anywhere a mode is, e.g. `item.paybackIn("actual1h")` or an Auto buyer profile's mode. The Recorder keeps
  every second of the last 3 hours of play, so the 3 h one reads full-resolution history.
- The old Actual income mode stays as **Actual, custom**: its window is still the Options card's "Actual income
  over" (5 minutes to 3 hours).
- `payback.actualIncome(minutes)` takes an optional window in minutes (none: the custom window).
