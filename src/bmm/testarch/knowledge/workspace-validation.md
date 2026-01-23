# Workspace/Monorepo Validation Guide

This guide provides validation scenarios for testing the language-agnostic TestArch system in monorepo contexts.

## Validation Scenarios

### Scenario 1: pnpm Workspace Detection

**Setup:**

```
project-root/
├── pnpm-workspace.yaml
├── package.json
├── packages/
│   ├── frontend/
│   │   ├── package.json
│   │   └── src/
│   ├── backend/
│   │   ├── package.json
│   │   └── src/
│   └── shared/
│       ├── package.json
│       └── src/
```

**pnpm-workspace.yaml:**

```yaml
packages:
  - 'packages/*'
```

**Expected Behavior:**

1. `*LI` should detect workspace and prompt for scope
2. `*LI --workspace` should generate:
   - `_bmad/testarch/workspace-profile.yaml`
   - `_bmad/testarch/packages/frontend/language-profile.yaml`
   - `_bmad/testarch/packages/backend/language-profile.yaml`
   - `_bmad/testarch/packages/shared/language-profile.yaml`
3. Each package profile should have `workspace_context` section

**Validation Checklist:**

- [ ] Workspace type detected as "pnpm"
- [ ] All packages discovered
- [ ] Per-package profiles generated
- [ ] Dependencies between packages detected
- [ ] Shared test utilities identified

---

### Scenario 2: Go Workspace Detection

**Setup:**

```
project-root/
├── go.work
├── cmd/
│   └── api/
│       ├── go.mod
│       └── main.go
├── pkg/
│   └── shared/
│       ├── go.mod
│       └── utils.go
└── internal/
    └── auth/
        ├── go.mod
        └── auth.go
```

**go.work:**

```
go 1.21

use (
    ./cmd/api
    ./pkg/shared
    ./internal/auth
)
```

**Expected Behavior:**

1. Workspace type detected as "go-work"
2. All modules discovered from `use` directives
3. Each module gets its own language profile
4. Shared testutil patterns detected

**Validation Checklist:**

- [ ] Workspace type is "go-work"
- [ ] 3 packages detected (cmd/api, pkg/shared, internal/auth)
- [ ] All profiles have Go characteristics
- [ ] Test framework detected as "go-test"

---

### Scenario 3: Cargo Workspace Detection

**Setup:**

```
project-root/
├── Cargo.toml  # with [workspace]
├── crates/
│   ├── core/
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   ├── api/
│   │   ├── Cargo.toml
│   │   └── src/main.rs
│   └── cli/
│       ├── Cargo.toml
│       └── src/main.rs
```

**Root Cargo.toml:**

```toml
[workspace]
members = [
    "crates/*",
]
```

**Expected Behavior:**

1. Workspace type detected as "cargo-workspace"
2. All crates discovered
3. Rust characteristics detected for all

**Validation Checklist:**

- [ ] Workspace type is "cargo-workspace"
- [ ] 3 crates detected
- [ ] All profiles have Rust characteristics
- [ ] Test framework is "cargo-test"

---

### Scenario 4: Mixed Language Monorepo

**Setup:**

```
project-root/
├── pnpm-workspace.yaml
├── packages/
│   ├── web/           # TypeScript
│   │   ├── package.json
│   │   └── src/
│   └── api/           # TypeScript
│       ├── package.json
│       └── src/
├── services/
│   ├── ml/            # Python
│   │   └── pyproject.toml
│   └── gateway/       # Go
│       └── go.mod
└── e2e/               # Cross-package E2E
    └── package.json
```

**Expected Behavior:**

1. Mixed workspace detected
2. Languages correctly identified per package:
   - web: TypeScript
   - api: TypeScript
   - ml: Python
   - gateway: Go
3. E2E suite detected as cross-package

**Validation Checklist:**

- [ ] 4 packages detected (plus e2e)
- [ ] TypeScript (2), Python (1), Go (1) distribution correct
- [ ] E2E suite in `shared_test_infrastructure.e2e_suites`
- [ ] `language_distribution.primary_languages` includes TypeScript, Python, Go

---

### Scenario 5: Nx Monorepo

**Setup:**

```
project-root/
├── nx.json
├── workspace.json
├── apps/
│   ├── web/
│   │   └── project.json
│   └── api/
│       └── project.json
└── libs/
    ├── shared/
    │   └── project.json
    └── test-utils/
        └── project.json
```

**Expected Behavior:**

1. Workspace type detected as "nx"
2. Projects discovered from project.json files
3. Test utilities package identified

**Validation Checklist:**

- [ ] Workspace type is "nx"
- [ ] test-utils identified in `shared_test_infrastructure`
- [ ] Nx targets detected for test execution

---

## Validation Commands

### Full Workspace Analysis

```
*LI --workspace
```

**Expected Output:**

```
## Workspace Profile Generated

**Workspace Type:** pnpm
**Packages:** 4

| Package | Language | Framework | Tests |
|---------|----------|-----------|-------|
| @acme/web | TypeScript | vitest | 45 |
| @acme/api | TypeScript | vitest | 32 |
| ml-service | Python | pytest | 28 |
| gateway | Go | go-test | 40 |

**Shared Infrastructure:**
- Test utilities: @acme/test-utils
- E2E suites: e2e/web, e2e/api
- Shared fixtures: fixtures/

Profiles saved to: _bmad/testarch/
```

### Single Package Analysis

```
*LI --package @acme/web
```

**Expected Output:**

```
## Language Profile Generated

**Package:** @acme/web
**Language:** TypeScript (0.98)
**Framework:** vitest

Workspace context:
- Depends on: @acme/shared
- Shared utils: @acme/test-utils

Profile saved to: _bmad/testarch/packages/web/language-profile.yaml
```

---

## Integration Test Scenarios

### Test 1: Framework Scaffolding in Workspace

```
# From workspace root
*framework --package @acme/api
```

**Verify:**

- [ ] Correct package targeted
- [ ] Imports from shared test-utils generated
- [ ] Framework config uses workspace conventions
- [ ] Test directory created in package, not root

### Test 2: ATDD in Workspace

```
# From packages/web/
*atdd
```

**Verify:**

- [ ] Package auto-detected from current directory
- [ ] Shared fixtures available for import
- [ ] Tests generated in package test directory
- [ ] Imports reference workspace packages correctly

### Test 3: CI Configuration for Workspace

```
*ci --workspace
```

**Verify:**

- [ ] Matrix strategy uses `language_distribution`
- [ ] Affected-only command generated for orchestrator
- [ ] Shared steps include workspace dependency install
- [ ] Cache keys reference workspace lockfile

---

## Profile Validation

### Workspace Profile Required Fields

```yaml
# workspace-profile.yaml must have:
metadata:
  workspace_name: required
  workspace_type: required
  workspace_root: required
  created_at: required

packages:
  total_count: required
  by_language: required
  items: required  # array of package_entry

# Each package_entry must have:
- name: required
- path: required
- primary_language: required
- profile_path: required
- profile_status: required
```

### Language Profile Required Fields (in workspace context)

```yaml
# language-profile.yaml must have:
metadata:
  overall_confidence: >= 0.5

language:
  inferred_name: required

workspace_context:  # NEW - required for workspace packages
  is_workspace_package: true
  workspace_root: required
  package_name: required
```

---

## Error Scenarios

### Error 1: Missing Package

```
*LI --package @nonexistent/pkg
```

**Expected:** Error message listing available packages

### Error 2: Workspace Not Profiled

```
# On first run in workspace
*framework
```

**Expected:** Prompt to run `*LI --workspace` first

### Error 3: Conflicting Frameworks

```
# Package A uses Jest, Package B uses Vitest
*framework --all
```

**Expected:** Per-package framework selection, not global override

---

## Performance Considerations

For large monorepos (50+ packages):

1. **Incremental Analysis:** Re-running `*LI` should skip unchanged packages
2. **Parallel Detection:** Package analysis should run in parallel
3. **Caching:** Profile freshness based on lockfile/source changes
4. **Selective Rebuild:** `*LI --package X` should only update that package

---

## Troubleshooting

### Profile Not Loading

1. Check file exists at expected path
2. Validate YAML syntax
3. Check confidence threshold (>= 0.5)
4. Run `*LI --refresh` to regenerate

### Wrong Language Detected

1. Check build files in package
2. Verify file extensions
3. Provide sample test file
4. Run `*learn-language` for corrections

### Shared Utils Not Found

1. Check `shared_test_infrastructure.test_utilities` in workspace profile
2. Verify package exports in test-utils
3. Check dependency relationships
