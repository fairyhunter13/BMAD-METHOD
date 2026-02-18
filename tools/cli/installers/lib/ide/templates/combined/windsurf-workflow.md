---
description: '{{description}}'
auto_execution_mode: 'iterate'
---

# {{name}}

Load and execute workflow via the BMAD workflow engine:

1. LOAD {project-root}/_bmad/core/tasks/workflow.xml (the workflow engine)
2. Pass workflow path: {project-root}/_bmad/{{workflow_path}}
3. Follow workflow.xml exactly - it handles scope resolution and execution
