---
inclusion: manual
---

# {{name}}

Load and execute workflow via the BMAD workflow engine:

1. LOAD the FULL #[[file:{{bmadFolderName}}/core/tasks/workflow.xml]] (the workflow engine)
2. Pass workflow path: #[[file:{{bmadFolderName}}/{{path}}]]
3. Follow workflow.xml EXACTLY - it handles scope resolution, file type detection, and execution
