---
description: '{{description}}'
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS IN ORDER:

<scope-resolution>
## Step 0: Resolve Scope (PARALLEL-SAFE)

Check for scope in priority order:

1. Inline flag: `/{{name}} --scope auth` or `/{{name}} auth`
2. Conversation memory (scope set earlier in this chat)
3. BMAD_SCOPE environment variable
4. .bmad-scope file (WARNING: shared across sessions)

If scope found, store as {scope} and echo: "**[SCOPE: {scope}]**"
If no scope, echo: "**[NO SCOPE]**" and continue (backward compatible)

When {scope} is set, override paths:

- {scope_path} = {output_folder}/{scope}
- {planning_artifacts} = {scope_path}/planning-artifacts
- {implementation_artifacts} = {scope_path}/implementation-artifacts
  </scope-resolution>

## Step 1: Execute Workflow

NOW: LOAD the FULL @{{workflow_path}}, READ its entire contents and follow its directions exactly!

When the workflow instructs you to use `{planning_artifacts}` or `{implementation_artifacts}`, use YOUR OVERRIDDEN VALUES from Step 0, not the static config.yaml values.
