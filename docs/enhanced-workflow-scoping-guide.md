---
title: 'Enhanced Workflow Scoping Guide'
description: How multi-scope resolution works and how to disable .bmad-scope without deleting it
---

This guide documents BMAD's multi-scope system, how scope is resolved (with parallel-safety in mind), and how to troubleshoot common scoping problems.

## What Problem Scopes Solve

Scopes isolate artifacts so multiple features/streams can be planned and executed in parallel without writing PRDs, architectures, stories, and test artifacts into the same folders.

Artifacts live under:

- `_bmad-output/_shared/` for cross-scope shared knowledge (contracts, principles, global project context)
- `_bmad-output/<scope-id>/` for per-scope planning/implementation/test artifacts

## Scope Resolution (Priority Order)

BMAD resolves the active scope using the first match in this order:

1. Inline `--scope` argument (parallel-safe)
2. Conversation memory (parallel-safe)
3. `BMAD_SCOPE` environment variable (parallel-safe)
4. `.bmad-scope` file in project root (NOT parallel-safe; ignored when disabled)
5. Prompt user (only when a workflow requires a scope and none was found)

Parallel-safe means you can run workflows concurrently (different terminals / IDE windows) without scopes colliding.

## When To Use Which Scope Source

- Use inline `--scope` for the most explicit, reproducible execution.
- Use conversation `/scope <id>` in an AI IDE to set scope per-window (parallel-safe).
- Use `BMAD_SCOPE=<id>` in shells/CI where you want a per-process default.
- Use `.bmad-scope` only as a convenience default for a single human session (it is shared across all processes).

## The `.bmad-scope` File

`.bmad-scope` is a YAML file stored in your project root and is typically gitignored.

Example:

```yaml
# BMAD Active Scope Configuration
# Auto-generated. Prefer: npx bmad-fh scope set <scope-id>
# To temporarily ignore this file for scope resolution:
#   npx bmad-fh scope file-disable

version: 1
enabled: true
active_scope: auth
set_at: '2026-02-05T04:11:47.000Z'
```

### Disabling Without Deleting

To keep the file but ensure workflows/commands do NOT use it for scope resolution:

```bash
npx bmad-fh scope file-disable
```

To re-enable:

```bash
npx bmad-fh scope file-enable
```

You can also set `enabled: false` manually.

### Legacy Files

Older `.bmad-scope` files may only contain `active_scope` and `set_at`. These are treated as `enabled: true`.

## Scope Validation Rules

Whenever a scope value is selected (from any source), it should be validated against `_bmad/_config/scopes.yaml`:

- The scope must exist in the registry.
- The scope status must be `active` (archived scopes should not be used for writing artifacts).

If `_bmad/_config/scopes.yaml` is missing, the scope system is not initialized. Run:

```bash
npx bmad-fh scope init
```

## Path Overrides When Scope Is Active

When `{scope}` is active, workflows/agents override the standard artifact paths:

- `{scope_path}` = `_bmad-output/{scope}`
- `{planning_artifacts}` = `{scope_path}/planning-artifacts`
- `{implementation_artifacts}` = `{scope_path}/implementation-artifacts`
- `{scope_tests}` = `{scope_path}/tests`

These overrides take precedence over any static paths resolved from module `config.yaml`.

## Troubleshooting

### Artifacts Going To The Wrong Scope

Common causes:

- You relied on `.bmad-scope` while running in multiple terminals/windows.
- Your conversation scope differs from your terminal `BMAD_SCOPE`.

Fix:

- Prefer inline `--scope` or `/scope <id>`.
- Disable `.bmad-scope` with `npx bmad-fh scope file-disable` if it is causing accidental fallback.

### "Scope Not Initialized" / Missing `scopes.yaml`

Run:

```bash
npx bmad-fh scope init
```

Then create and activate a scope:

```bash
npx bmad-fh scope create auth
npx bmad-fh scope set auth
```

### Scope Exists But Is Archived

Reactivate it:

```bash
npx bmad-fh scope activate <scope-id>
```

### Need Parallel Work In Two Windows

Use per-window scope selection:

- Window 1: `/scope auth`
- Window 2: `/scope payments`

Or explicitly pass `--scope` to each workflow invocation.
