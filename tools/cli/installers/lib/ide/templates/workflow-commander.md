---
description: '{{description}}'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS IN ORDER:

<scope-resolution>
## Step 0: Resolve Scope (PARALLEL-SAFE)

Check for scope in priority order:

1. Inline flag: `/{{name}} --scope auth` or `/{{name}} auth`
2. Conversation memory (scope set earlier in this chat)
3. BMAD_SCOPE environment variable
4. .bmad-scope file (WARNING: shared across sessions; ignored when disabled)

If using .bmad-scope file:

- Parse YAML in `{project-root}/.bmad-scope`
- If `enabled: false` OR `disabled: true` → IGNORE this file (treat as not found)
- Legacy files without enabled/disabled keys are treated as enabled
- If enabled, read `active_scope`

If scope found, store as {scope} and echo: "**[SCOPE: {scope}]**"
If no scope, echo: "**[NO SCOPE]**" and continue (backward compatible)

If {scope} is set, VALIDATE it:

- Load scope registry: `{project-root}/_bmad/_config/scopes.yaml`
- If scopes.yaml is missing, clear {scope} and echo: "**[NO SCOPE]** (scope system not initialized - missing scopes.yaml)"
- Verify scope exists and status is `active`
- If invalid/archived, clear {scope} and echo: "**[NO SCOPE]** (invalid scope - ignoring)"

When {scope} is set, override paths:

- {scope_path} = {output_folder}/{scope}
- {planning_artifacts} = {scope_path}/planning-artifacts
- {implementation_artifacts} = {scope_path}/implementation-artifacts
- {scope_tests} = {scope_path}/tests

</scope-resolution>

## Step 1: Execute Workflow

NOW: LOAD the FULL @{{workflow_path}}, READ its entire contents and follow its directions exactly!

When the workflow instructs you to use `{planning_artifacts}` or `{implementation_artifacts}`, use YOUR OVERRIDDEN VALUES from Step 0, not the static config.yaml values.
