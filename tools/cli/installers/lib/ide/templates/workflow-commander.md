---
description: '{{description}}'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING workflows
3. Pass the workflow path @{{workflow_path}} to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY - it handles scope resolution (Step 0), file type detection (YAML/MD), and execution
5. Save outputs after EACH section when generating any documents from templates
</steps>

Note: workflow.xml Step 0 automatically resolves scope from:

- Inline flags (/command --scope X)
- Conversation memory
- BMAD_SCOPE env var
- .bmad-scope file (if enabled)
