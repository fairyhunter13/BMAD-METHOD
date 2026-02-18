---
name: '{{name}}'
description: '{{description}}'
---

Execute the BMAD '{{name}}' workflow via the workflow engine:

CRITICAL STEPS:

1. LOAD the workflow engine from {project-root}/{{bmadFolderName}}/core/tasks/workflow.xml
2. Pass workflow path: {project-root}/{{bmadFolderName}}/{{path}}
3. Follow workflow.xml EXACTLY - it handles scope resolution, file type detection, and execution
4. Save outputs after EACH section when generating documents from templates

WORKFLOW ENGINE: {project-root}/{{bmadFolderName}}/core/tasks/workflow.xml
WORKFLOW FILE: {project-root}/{{bmadFolderName}}/{{path}}
