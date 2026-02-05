---
description: '{{description}}'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

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

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{{workflow_path}}
3. Pass the yaml path {{workflow_path}} as 'workflow-config' parameter to the workflow.xml instructions
4. Pass {scope} (from Step 0) to workflow.xml for path resolution
5. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
6. Save outputs after EACH section when generating any documents from templates
</steps>
