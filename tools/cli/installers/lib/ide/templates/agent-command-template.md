---
name: '{{name}}'
description: '{{description}}'
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

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

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from @_bmad/{{module}}/agents/{{path}}
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. Pass {scope} to agent activation for artifact paths
4. Execute ALL activation steps exactly as written in the agent file
5. Follow the agent's persona and menu system precisely
6. Stay in character throughout the session
</agent-activation>
