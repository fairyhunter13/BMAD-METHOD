---
description: 'Set or check the active scope for this conversation (parallel-safe)'
---

# Scope Management Command

This command allows you to set, check, or clear the scope for this conversation session.
Using inline scope is the **parallel-safe** way to work with multiple scopes simultaneously.

<scope-command>

## Parse Command Arguments

Check what the user is requesting:

Before responding, compute these values for display:

- `{env_scope}`: read `BMAD_SCOPE` environment variable (if set)
- `{file_scope}`, `{file_enabled}`, `{file_set_at}`:
  - check for `{project-root}/.bmad-scope`
  - parse YAML
  - if `enabled: false` OR `disabled: true` → treat file as disabled
  - otherwise read `active_scope` and `set_at`
- `{effective_scope}`: conversation scope > env var > file scope (ONLY if file enabled)

## `/scope` (no arguments) - Show Current Scope

Display the current scope status:

```
**Current Scope Status:**
- Conversation scope: {scope} (or "not set")
- BMAD_SCOPE env var: {env_scope} (or "not set")
- .bmad-scope file: {file_scope} (enabled: {file_enabled}, set_at: {file_set_at}) (or "not found")
- Effective scope: {effective_scope} (conversation > env var > file)
- Note: .bmad-scope is shared across sessions (NOT parallel-safe). Disable without deleting:
  - `npx bmad-fh scope file-disable`
```

## `/scope <scope-id>` - Set Scope for Conversation

Example: `/scope auth`, `/scope payment-v2`

1. Validate scope-id matches pattern: alphanumeric with hyphens
2. Check if scope exists in `{project-root}/_bmad/_config/scopes.yaml`
3. If scope doesn't exist, ask: "Scope '{scope-id}' not found. Create it? (y/n)"
4. Store {scope} = scope-id for this conversation
5. Calculate scope paths:
   - {scope_path} = {output_folder}/{scope}
   - {planning_artifacts} = {scope_path}/planning-artifacts
   - {implementation_artifacts} = {scope_path}/implementation-artifacts
   - {scope_tests} = {scope_path}/tests
6. Echo confirmation:

   ```
   **[SCOPE: {scope}]** Scope set for this conversation.

   All subsequent commands will use this scope:
   - Planning artifacts: {planning_artifacts}
   - Implementation artifacts: {implementation_artifacts}
   - Tests: {scope_tests}

   This scope will persist for this conversation only (parallel-safe).
   To use a different scope in another window, run `/scope <other-scope>` there.
   ```

## `/scope --clear` or `/scope clear` - Clear Scope

1. Clear {scope} from conversation memory
2. Echo:

   ```
   **[NO SCOPE]** Scope cleared for this conversation.

   Subsequent commands will:
    - Fall back to BMAD_SCOPE env var (if set)
    - Then fall back to .bmad-scope file (if enabled)
    - Or run without scope isolation
   ```

## `/scope --list` or `/scope list` - List Available Scopes

1. Load `{project-root}/_bmad/_config/scopes.yaml`
2. Display all scopes:

   ```
    **Available Scopes:**
    - auth (active_scope in .bmad-scope; file enabled)
    - payments
    - notifications
    - user-profile

   Use `/scope <name>` to set scope for this conversation.
   Use `/scope --create <name>` to create a new scope.
   ```

## `/scope --create <name>` or `/scope create <name>` - Create New Scope

1. Validate name matches pattern
2. Check scope doesn't already exist
3. Create scope directory structure:
   - {output_folder}/{name}/
   - {output_folder}/{name}/planning-artifacts/
   - {output_folder}/{name}/implementation-artifacts/
   - {output_folder}/{name}/tests/
4. Add to scopes.yaml
5. Optionally set as conversation scope
6. Echo confirmation

## `/scope --info` or `/scope info` - Show Detailed Scope Info

Display comprehensive scope information:

```
**Scope System Information:**

 Current State:
 - Conversation scope: {scope}
 - BMAD_SCOPE env var: {env_scope}
 - .bmad-scope file scope: {file_scope} (enabled: {file_enabled})
 - Effective scope: {effective_scope} (conversation > env var > file)

Scope Paths (when scope is active):
- Base: {output_folder}/{scope}/
- Planning: {planning_artifacts}
- Implementation: {implementation_artifacts}
- Tests: {scope_tests}

 Parallel Execution:
 - Conversation scope: PARALLEL-SAFE (isolated per window)
 - .bmad-scope file: NOT parallel-safe (shared)
 - Recommendation: Use `/scope <name>` or `--scope` flag for parallel work
 - To disable .bmad-scope without deleting: `npx bmad-fh scope file-disable`
```

</scope-command>

<parallel-safety-notes>
## Parallel Execution Guide

When working on multiple scopes simultaneously (e.g., in different IDE windows):

**DO:**

- Use `/scope auth` at the start of each conversation to set the scope
- Or pass `--scope auth` to each command: `/workflow-prd --scope auth`
- Each window maintains its own conversation scope

**DON'T:**

- Rely on `.bmad-scope` file for parallel work (it's shared!)
- Assume scope persists across conversation resets

**Example - Two Windows Working in Parallel:**

```
# Window 1:
/scope auth
/agent-pm
> CP (Create PRD)
# PRD goes to {output_folder}/auth/planning-artifacts/

# Window 2:
/scope payments
/agent-pm
> CP (Create PRD)
# PRD goes to {output_folder}/payments/planning-artifacts/
```

</parallel-safety-notes>
