# Design docs (major changes)

Use this folder for **written design** before **implementation** when a change is **major** (see [AGENTS.md](../../AGENTS.md)). The doc is the place to align on behavior, scope, and tradeoffs—especially for humans and agents working together.

**Task-level steps** (checklists, acceptance criteria for a single assignment) belong in repo-root [`exec-plans/`](../../exec-plans/); link from there to a design doc when the task implements a major design.

## When to create one

Create a design doc **before writing implementation code** if **any** of these apply:

- Touches **auth, tenancy, billing, or PII** in a new way
- Adds or changes **API contracts** consumed by the frontend or external clients
- Changes **database schema**, **job processing**, or **background pollers**
- Introduces a **new integration** (vendor, queue, storage) or **moves** logic across layers (`routes` / `services` / `workers`)
- Is **large or risky** enough that reviewers need a shared picture before reading a diff

**Small fixes** (copy, a single bug fix, one test, localized UI tweak) do **not** need a design doc.

## File naming

Use a **short kebab-case slug** plus optional date prefix so files sort well:

- `2026-04-14-campaign-auth-scoping.md`
- `ad-job-idempotency.md`

One topic per file; link related docs from the body.

## Suggested outline

Paste and fill in:

1. **Context** — Problem, who it affects, link to issues or product notes.
2. **Goals / non-goals** — What success means; what is explicitly out of scope.
3. **Current behavior** — Pointer to code paths or [PRODUCT.md](../PRODUCT.md) / [ARCHITECTURE.md](../ARCHITECTURE.md).
4. **Proposed behavior** — User-visible and system behavior after the change.
5. **Design** — Components, data flow, API shapes, schema deltas (bullet diagrams welcome).
6. **Alternatives considered** — 1–2 options and why this one won.
7. **Migration & rollout** — Feature flags, deploy order, backfill, backwards compatibility.
8. **Testing** — What tests or manual checks prove it ([TESTING.md](../TESTING.md)).
9. **Open questions** — Decisions still needed before or during implementation.

## After implementation

- Update the design doc with a **“Implementation notes”** section (what changed vs plan, if different), or link the merging PR.
- If the design is obsolete, add a line at the top: **Status: superseded by …** rather than deleting history.
