# Execution plans

This directory holds **task-specific** instructions: what to build or change, in what order, and how to know you’re done.

## For agents

- **Start here** when [AGENTS.md](../AGENTS.md) or your assignment mentions `exec-plans/`, or when completing scoped repo work that has a matching file here.
- Prefer the plan’s **steps and acceptance criteria** over guessing scope.
- Use [agent_resources/](../agent_resources/) for **system** background (architecture, product rules, API/env lookups).

## For authors

Add a Markdown file per task or epic slice, for example:

- `feature-name.md`
- `2026-04-14-fix-campaign-list-auth.md`

**Include** where helpful:

- Objective and **non-goals**
- **Steps** (ordered checklist)
- **Files / areas** to touch (`backend/routes/...`, `frontend/src/...`)
- **Acceptance criteria** or test commands to run
- Links to issues, design docs in `agent_resources/design-docs/`, or PRs

**Relationship to design docs:** large or risky changes may need a design doc in `agent_resources/design-docs/` *before* implementation; the exec plan can link to it and focus on execution.
