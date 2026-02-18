---
name: '{{name}}'
description: '{{description}}'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/{{bmadFolderName}}/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING workflows
3. Pass the workflow path @{project-root}/{{bmadFolderName}}/{{path}} to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written - it handles scope resolution, file type detection, and execution
5. Save outputs after EACH section when generating any documents from templates
</steps>
