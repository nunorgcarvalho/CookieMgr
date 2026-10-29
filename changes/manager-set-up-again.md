---
bump: patch
---

- **Fixed:** a manager kept in step with its stages only when run by hand: the Manager macro's own passes never
  checked, so an edit, Revert to default or an update didn't set its stage up again (Nunix late game stayed stopped
  before the Elder Pact, its macros off). Now every pass checks.
- **Set up again** on the active manager's row: its stage set up again as it is (what you flipped by hand since,
  back), and the Manager macro on. Revert to default and Use switch the Manager macro on too.
