# Language Inference Workflow

**Workflow ID**: `_bmad/bmm/testarch/language-inference`
**Version**: 2.0 (BMad v6 - Monorepo Support)

---

## Overview

Dynamically infer programming language characteristics from project code. This workflow enables language-agnostic test generation by detecting:

- Programming language and version
- Type system characteristics
- Async/concurrency model
- Test framework and structure
- Module/import system
- Cleanup and error handling patterns
- Assertion syntax

**Key Principle**: Infer characteristics from code analysis, not from a static language registry. This enables support for any language, including newly released or custom languages.

### Monorepo Support (v2.0)

This workflow now fully supports monorepos/workspaces with:

- **Workspace detection**: Identifies monorepo structure (pnpm, npm, lerna, nx, turbo, go.work, cargo workspace, etc.)
- **Multi-package analysis**: Generates per-package language profiles
- **Workspace-level profile**: Aggregates cross-package information
- **Shared infrastructure detection**: Identifies shared test utilities, fixtures, and mocks

### Command Options

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `*LI`             | Standard inference (auto-detects workspace) |
| `*LI --workspace` | Force workspace-level analysis              |
| `*LI --package X` | Analyze specific package only               |
| `*LI --refresh`   | Re-analyze and update existing profiles     |
| `*LI --all`       | Analyze all packages in workspace           |

---

## Three-Tier Detection Strategy

### Tier 1: Known Language (Fast Path)

- Check for well-known build files (package.json, Cargo.toml, go.mod)
- Match against high-confidence patterns
- Load optimized detection rules
- **Confidence: 0.85+**

### Tier 2: Inferred Language (Analysis Path)

- Analyze code samples to extract characteristics
- Match patterns against characteristic model
- Build profile dynamically
- **Confidence: 0.5-0.85**

### Tier 3: Collaborative Learning (User Path)

- Request sample test files from user
- Learn patterns from provided examples
- Confirm understanding with user
- **Confidence: User-validated**

---

## Step 1: Project Scan

### Actions

1. **Check for Existing Profile**

   ```
   IF exists {project-root}/_bmad/testarch/language-profile.yaml:
     READ profile
     IF profile.overall_confidence >= 0.8:
       RETURN "Using existing profile (confidence: {confidence})"
     ELSE:
       INFORM "Found existing profile with low confidence. Re-analyzing..."
   ```

2. **Discover Build/Config Files**

   Search for:
   - `package.json` (JavaScript/TypeScript)
   - `tsconfig.json` (TypeScript - definitive)
   - `pyproject.toml`, `requirements.txt`, `setup.py` (Python)
   - `go.mod` (Go - definitive)
   - `Cargo.toml` (Rust - definitive)
   - `pom.xml`, `build.gradle`, `build.gradle.kts` (Java/Kotlin)
   - `*.csproj`, `*.fsproj` (C#/F#)
   - `Gemfile` (Ruby)
   - `mix.exs` (Elixir)
   - `gleam.toml` (Gleam)
   - Any other recognized build files

3. **Collect File Extensions**

   ```
   extensions = UNIQUE(file.extension FOR file IN project)
   source_extensions = FILTER(extensions, NOT in [.md, .json, .yaml, .yml, .toml, .lock, .txt])
   ```

4. **Find Test Directories**

   Look for:
   - `tests/`, `test/`, `__tests__/`, `spec/`
   - Files matching: `*_test.*`, `*.test.*`, `*.spec.*`, `test_*.*`, `*Test.*`

---

## Step 1b: Workspace Detection

### Purpose

Before analyzing individual languages, detect if this is a monorepo/workspace project. This determines whether to generate a single profile or a workspace profile with per-package profiles.

### Actions

1. **Check for Workspace Markers**

   Search for workspace configuration files (in order of specificity):

   ```yaml
   # From language-characteristics.yaml workspace_detection.workspace_markers

   workspace_markers:
     # JavaScript/TypeScript Ecosystem
     - pnpm-workspace.yaml → type: "pnpm"
     - lerna.json → type: "lerna"
     - nx.json → type: "nx"
     - turbo.json → type: "turbo"
     - rush.json → type: "rush"
     - package.json (with "workspaces" field) → type: "npm-workspaces"

     # Go Ecosystem
     - go.work → type: "go-work"

     # Rust Ecosystem
     - Cargo.toml (with [workspace] section) → type: "cargo-workspace"

     # Python Ecosystem
     - Multiple pyproject.toml in subdirectories → type: "python-monorepo"

     # Java/JVM Ecosystem
     - settings.gradle or settings.gradle.kts → type: "gradle-multiproject"
     - pom.xml (with <modules> section) → type: "maven-multimodule"

     # .NET Ecosystem
     - *.sln → type: "dotnet-solution"

     # Build Systems
     - WORKSPACE or WORKSPACE.bazel → type: "bazel"
     - pants.toml → type: "pants"
     - .buckconfig → type: "buck2"
   ```

2. **If Workspace Detected**

   ```
   is_workspace = TRUE
   workspace_type = detected_type
   workspace_root = project_root

   # Parse workspace configuration to find packages
   packages = PARSE_WORKSPACE_CONFIG(workspace_marker_file)

   # For each package, extract basic info
   FOR package IN packages:
     package.path = relative_path_to_package
     package.build_file = primary_build_file  # package.json, go.mod, etc.
     package.likely_language = infer_from_build_file

   # Check for existing workspace profile
   IF exists {project-root}/_bmad/testarch/workspace-profile.yaml:
     LOAD workspace_profile
     COMPARE with detected packages
     IF packages changed:
       INFORM "Workspace structure changed. Some packages need re-analysis."
   ```

3. **Workspace Mode Decision**

   ```
   IF command == "*LI --workspace":
     # Force full workspace analysis
     PROCEED to Workspace Analysis (Step 1c)

   ELIF command == "*LI --package {name}":
     # Single package mode
     FIND package matching {name}
     IF NOT found:
       ERROR "Package '{name}' not found in workspace"
     SET analysis_scope = [package]
     PROCEED to Step 2 (language detection for single package)

   ELIF is_workspace AND package_count > 1:
     # Auto-detected workspace
     PROMPT user:
       "This appears to be a {workspace_type} monorepo with {package_count} packages:

        Languages detected:
        - TypeScript: {ts_count} packages
        - Python: {py_count} packages
        - Go: {go_count} packages

        How would you like to proceed?

        1. **Analyze all packages** - Generate full workspace profile
        2. **Select specific packages** - Choose which to analyze
        3. **Analyze current directory** - Focus on current package only
        4. **Skip for now** - I'll specify a package later with *LI --package X"

     AWAIT user_choice

     IF choice == 1: PROCEED to Workspace Analysis (Step 1c)
     IF choice == 2: PROMPT for package selection, SET analysis_scope
     IF choice == 3: SET analysis_scope = [current_directory_package]
     IF choice == 4: RETURN early with workspace detection summary

   ELSE:
     # Single project (not a workspace)
     SET is_workspace = FALSE
     PROCEED to Step 2 (single project detection)
   ```

---

## Step 1c: Workspace Analysis (Full Monorepo Mode)

### When to Use

- User ran `*LI --workspace` or `*LI --all`
- User selected "Analyze all packages" in workspace prompt
- Automated CI/CD context requiring full workspace profile

### Actions

1. **Parse All Packages**

   ```
   packages = []

   CASE workspace_type:
     "pnpm":
       # Read pnpm-workspace.yaml
       globs = yaml.packages[]
       FOR glob IN globs:
         packages += EXPAND_GLOB(glob)

     "npm-workspaces" | "yarn-workspaces":
       # Read package.json workspaces field
       workspaces = package_json.workspaces
       IF workspaces is array:
         globs = workspaces
       ELSE:  # yarn-style object
         globs = workspaces.packages
       FOR glob IN globs:
         packages += EXPAND_GLOB(glob)

     "go-work":
       # Parse go.work file
       FOR line IN go_work:
         IF line starts with "use":
           packages += extract_use_path(line)

     "cargo-workspace":
       # Read Cargo.toml [workspace].members
       members = toml.workspace.members
       FOR pattern IN members:
         packages += EXPAND_GLOB(pattern)

     "gradle-multiproject":
       # Parse settings.gradle
       FOR line IN settings_gradle:
         IF line contains "include":
           packages += extract_includes(line)

     "nx" | "turbo":
       # Scan for project.json or package.json in subdirectories
       packages = FIND_ALL files matching "*/package.json" or "*/project.json"

     DEFAULT:
       # Directory scan
       packages = FIND_ALL directories with build files
   ```

2. **Analyze Each Package**

   ```
   workspace_profile = {
     metadata: {
       workspace_type: workspace_type,
       workspace_root: workspace_root,
       created_at: NOW(),
       tea_version: TEA_VERSION
     },
     packages: {
       total_count: len(packages),
       by_language: {},
       items: []
     }
   }

   FOR package IN packages:
     # Run single-package detection
     package_profile = RUN_STEPS_2_THROUGH_6(package.path)

     # Add to workspace profile
     workspace_profile.packages.items.append({
       name: package.name,
       path: package.path,
       primary_language: package_profile.language.inferred_name,
       profile_path: "_bmad/testarch/packages/{package.name}/language-profile.yaml",
       profile_status: "generated",
       test_framework: package_profile.test_framework.detected,
       test_directory: package_profile.project_context.test_directory,
       has_tests: package_profile.project_context.existing_tests > 0,
       test_count: package_profile.project_context.existing_tests,
       depends_on: DETECT_INTERNAL_DEPS(package),
       tags: INFER_TAGS(package)  # frontend, backend, library, etc.
     })

     # Save individual package profile
     SAVE package_profile to {project-root}/_bmad/testarch/packages/{package.name}/language-profile.yaml

     # Update language counts
     lang = package_profile.language.inferred_name
     workspace_profile.packages.by_language[lang] += 1
   ```

3. **Detect Shared Test Infrastructure**

   ```
   workspace_profile.shared_test_infrastructure = {
     test_utilities: [],
     shared_fixtures: [],
     e2e_suites: [],
     shared_mocks: []
   }

   # Find shared test utilities
   FOR known_location IN ["packages/test-utils", "libs/testing", "shared/test-helpers", "internal/testutil"]:
     IF EXISTS known_location:
       workspace_profile.shared_test_infrastructure.test_utilities.append({
         name: package_name_at(known_location),
         path: known_location,
         exports: DETECT_EXPORTS(known_location),
         used_by: FIND_IMPORTERS(known_location)
       })

   # Find E2E test suites
   FOR known_location IN ["e2e/", "tests/e2e/", "integration/"]:
     IF EXISTS known_location:
       workspace_profile.shared_test_infrastructure.e2e_suites.append({
         name: directory_name,
         path: known_location,
         framework: DETECT_E2E_FRAMEWORK(known_location),
         covers_packages: DETECT_COVERED_PACKAGES(known_location)
       })

   # Find shared fixtures
   FOR known_location IN ["fixtures/", "test-fixtures/", "__fixtures__/", "testdata/"]:
     IF EXISTS known_location:
       # Add to shared_fixtures
   ```

4. **Build Test Execution Configuration**

   ```
   workspace_profile.test_execution = {
     strategy: DETECT_STRATEGY(),  # orchestrated if nx/turbo, per_package otherwise
     orchestrator: {},
     dependency_graph: {}
   }

   IF workspace_type IN ["nx", "turbo", "lerna"]:
     workspace_profile.test_execution.orchestrator = {
       tool: workspace_type,
       test_target: "test",
       affected_command: GENERATE_AFFECTED_COMMAND(workspace_type)
     }

   # Build dependency graph for test ordering
   workspace_profile.test_execution.dependency_graph = BUILD_TOPOLOGICAL_ORDER(packages)
   ```

5. **Generate CI Configuration Hints**

   ```
   workspace_profile.ci_configuration = {
     matrix_strategy: DETERMINE_MATRIX_STRATEGY(packages),
     shared_steps: GENERATE_SHARED_STEPS(workspace_type),
     cache_keys: GENERATE_CACHE_KEYS(workspace_type)
   }
   ```

6. **Set Workspace Defaults**

   ```
   # Determine defaults from most common values
   workspace_profile.workspace_defaults = {
     test_framework: MOST_COMMON(packages.test_framework),
     coverage_threshold: { lines: 80, branches: 75, functions: 80 },
     test_patterns: UNION(packages.test_patterns),
     characteristics: COMMON_CHARACTERISTICS(packages)
   }
   ```

7. **Save Workspace Profile**

   ```
   SAVE workspace_profile to {project-root}/_bmad/testarch/workspace-profile.yaml
   ```

---

## Step 2: Tier 1 - Known Language Detection

### Actions

1. **Match Build Files**

   ```yaml
   # From language-characteristics.yaml build_file_hints
   IF tsconfig.json EXISTS: language = "TypeScript"
     confidence = 0.99
   ELIF go.mod EXISTS: language = "Go"
     confidence = 0.99
   ELIF Cargo.toml EXISTS: language = "Rust"
     confidence = 0.99
   ELIF package.json EXISTS:
     IF package.json.devDependencies.typescript: language = "TypeScript"
       confidence = 0.95
     ELSE: language = "JavaScript"
       confidence = 0.90
   # ... continue for other known patterns
   ```

2. **Detect Test Framework**

   For detected language, check for known test framework markers:

   **TypeScript/JavaScript:**
   - `@playwright/test` in dependencies → Playwright
   - `jest` in dependencies → Jest
   - `vitest` in dependencies → Vitest
   - `cypress` in dependencies → Cypress
   - `mocha` in dependencies → Mocha

   **Python:**
   - `pytest` in requirements → pytest
   - `unittest` imports → unittest

   **Go:**
   - `testing` package imports → go-test

   **Rust:**
   - `#[test]` attributes → cargo-test

   **Java:**
   - `org.junit` imports → JUnit
   - `org.testng` imports → TestNG

3. **If High Confidence (>= 0.85)**

   Skip to Step 4 (Sample Analysis) for syntax pattern extraction.

---

## Step 3: Tier 2 - Characteristic Inference

### When to Use

- No definitive build file found
- Unknown file extensions
- Multiple possible languages

### Actions

1. **Sample Source Files**

   ```
   samples = SELECT UP TO {sample_limit} files WHERE:
     - extension IN source_extensions
     - file size < 50KB
     - NOT in node_modules, vendor, .git, etc.
   ```

2. **Extract Characteristics**

   For each sample, analyze:

   **Type System:**

   ```
   IF contains type annotations (: Type, -> Type, <T>):
     typing = "static" | "gradual"
     confidence = 0.8
   ELIF no type annotations:
     typing = "dynamic"
     confidence = 0.7
   ```

   **Async Model:**

   ```
   IF contains "async" AND "await":
     async_model = "async-await"
   ELIF contains "go " followed by function call:
     async_model = "goroutines"
   ELIF contains "spawn" or "send" or "receive":
     async_model = "actors"
   ELIF contains ".then(" or "Promise":
     async_model = "promises"
   ELSE:
     async_model = "none" | "unknown"
   ```

   **Module System:**

   ```
   IF contains "import X from" or "export":
     module_system = "esm"
   ELIF contains "require(" or "module.exports":
     module_system = "commonjs"
   ELIF contains "from X import" or "import X":
     module_system = "python_import"
   ELIF contains "package " at file start:
     module_system = "go_package"
   ```

3. **Analyze Test Files Specifically**

   If test files found, extract:

   **Test Structure:**

   ```
   IF contains "describe(" AND "it(":
     test_structure = "bdd_style"
   ELIF contains "test(" or "Test(":
     test_structure = "function_based"
   ELIF contains "class *Test" or "class Test*":
     test_structure = "class_based"
   ELIF function names start with "test_" or end with "_test":
     test_structure = "function_based"
   ```

   **Assertion Style:**

   ```
   IF contains "expect(X).toBe" or "expect(X).toEqual":
     assertion_style = "expect_chain"
   ELIF contains "assert_eq" or "assertEqual":
     assertion_style = "assert_function"
   ELIF contains "Assert.AreEqual" or "assertEquals":
     assertion_style = "assert_method"
   ELIF contains "should.equal" or "should.be":
     assertion_style = "should_syntax"
   ```

4. **Aggregate Confidence**

   ```
   overall_confidence = WEIGHTED_AVERAGE(
     characteristic.confidence FOR characteristic IN detected
   )
   ```

---

## Step 4: Sample Analysis for Syntax Patterns

### Actions

1. **Extract Syntax Patterns from Test Files**

   Regardless of detection tier, analyze actual test files to learn syntax patterns:

   ```
   FOR test_file IN test_files:

     # Test function pattern
     FIND pattern matching test declarations
     EXTRACT: declaration syntax, async marker, parameter injection

     # Assertion patterns
     FIND all assertion statements
     EXTRACT: assertion syntax variations

     # Import patterns
     FIND import/require statements
     EXTRACT: module import syntax

     # Setup/teardown patterns
     FIND beforeEach, setUp, etc.
     EXTRACT: hook syntax
   ```

2. **Create Syntax Pattern Templates**

   Convert extracted patterns to templates with placeholders:

   ```
   # Extracted from: test('should login', async ({ page }) => { ... })

   test_function:
     pattern: "test('{description}', async ({fixtures}) => {\n  {body}\n})"
     variables:
       description: "Test description string"
       fixtures: "Destructured fixture parameters"
       body: "Test implementation code"
   ```

3. **Identify Cleanup Idiom**

   ```
   IF contains "defer " statements:
     cleanup_idiom = "defer"
   ELIF contains "with " context managers:
     cleanup_idiom = "context_manager"
   ELIF contains "afterEach" or "tearDown":
     cleanup_idiom = "hooks"
   ELIF contains "try {" AND "finally {":
     cleanup_idiom = "try_finally"
   ELSE:
     cleanup_idiom = "manual"
   ```

---

## Step 5: Confidence Evaluation

### Actions

1. **Check Overall Confidence**

   ```
   IF overall_confidence >= 0.85:
     STATUS = "HIGH_CONFIDENCE"
     PROCEED to Step 6

   ELIF overall_confidence >= 0.5:
     STATUS = "MEDIUM_CONFIDENCE"
     INFORM user:
       "I've detected {language} with {framework} (confidence: {confidence}).
        Some characteristics are uncertain:
        {list uncertain characteristics}

        Should I proceed, or would you like to provide a sample test file?"

     IF user confirms:
       PROCEED to Step 6
     ELSE:
       PROCEED to Step 5b (Collaborative Learning)

   ELSE:
     STATUS = "LOW_CONFIDENCE"
     PROCEED to Step 5b (Collaborative Learning)
   ```

2. **Step 5b: Collaborative Learning**

   ```
   PROMPT user:
     "I'm having trouble identifying this project's language and testing patterns.

      I found files with extensions: {extensions}
      Build files: {build_files or 'none found'}

      Please provide ONE of:

      1. **A sample test file** (paste content or file path)
         - Include 2-3 actual tests
         - Include imports and any setup

      2. **The language name** (if I should recognize it)

      3. **Documentation URL** for the test framework

      4. **Quick answers:**
         - How do you declare a test? (syntax example)
         - How do you write assertions? (syntax example)"

   AWAIT user_response

   IF user provides sample file:
     ANALYZE sample for patterns
     UPDATE profile with learned patterns
     CONFIRM with user

   ELIF user provides language name:
     SEARCH knowledge for language
     IF found: LOAD known patterns
     ELSE: CONTINUE asking for sample

   ELIF user provides documentation URL:
     FETCH documentation
     EXTRACT patterns from docs
     CONFIRM with user

   ELIF user provides quick answers:
     BUILD profile from answers
     CONFIRM with user
   ```

---

## Step 6: Generate Language Profile

### Actions

1. **Assemble Profile**

   ```yaml
   language_profile:
     metadata:
       schema_version: '1.0'
       generated_at: { current_timestamp }
       source: { detection_tier }
       overall_confidence: { calculated_confidence }

     language:
       inferred_name: { detected_language }
       confidence: { language_confidence }
       file_extensions: { detected_extensions }
       evidence: { detection_evidence }

     characteristics:
       typing: { detected_typing }
       async_model: { detected_async }
       test_structure: { detected_structure }
       module_system: { detected_modules }
       cleanup_idiom: { detected_cleanup }
       error_handling: { detected_errors }
       assertion_style: { detected_assertions }
       fixture_pattern: { detected_fixtures }

     syntax_patterns:
       test_function: { extracted_pattern }
       assertion: { extracted_assertions }
       import_statement: { extracted_imports }
       # ... all extracted patterns

     test_framework:
       detected: { framework_name }
       confidence: { framework_confidence }
       import_pattern: { framework_import }
       run_command: { framework_run_cmd }

     project_context:
       test_directory: { detected_test_dir }
       source_directory: { detected_src_dir }
       package_manager: { detected_pkg_manager }
       existing_tests: { test_file_count }

     adaptation_hints:
       cleanup_strategy: { recommended_cleanup }
       composition_strategy: { recommended_composition }
       factory_strategy: { recommended_factory }

     learning_history:
       - timestamp: { current_timestamp }
         action: 'initial_inference'
         details: { detection_summary }
   ```

2. **Save Profile**

   Write to `{project-root}/_bmad/testarch/language-profile.yaml`

   Create directory if not exists.

---

## Step 7: Present Results

### Output Format

```markdown
## Language Profile Generated

**Detection Method:** {Tier 1: Known | Tier 2: Inferred | Tier 3: Collaborative}

**Language:** {inferred_name} ({confidence}% confidence)
**Test Framework:** {detected_framework} ({framework_confidence}% confidence)

### Detected Characteristics

| Characteristic  | Value             | Confidence    |
| --------------- | ----------------- | ------------- |
| Type System     | {typing}          | {confidence}% |
| Async Model     | {async_model}     | {confidence}% |
| Test Structure  | {test_structure}  | {confidence}% |
| Cleanup Idiom   | {cleanup_idiom}   | {confidence}% |
| Assertion Style | {assertion_style} | {confidence}% |

### Syntax Patterns Learned

**Test Declaration:**
```

{test_function_pattern}

```

**Assertions:**
```

{assertion_patterns}

```

### Adaptation Hints

- **Cleanup Strategy:** {cleanup_strategy}
- **Composition Strategy:** {composition_strategy}
- **Factory Strategy:** {factory_strategy}

### Next Steps

Profile saved to: `_bmad/testarch/language-profile.yaml`

All TEA workflows will now use this profile to generate language-appropriate tests.

**To update this profile:**
- Run `*language-inference` again
- Or provide corrections with `*learn-language`
```

---

## Handling Special Cases

### Multiple Languages in Project (Non-Workspace)

If a single project (not a workspace) has multiple languages:

```
DETECT all languages present
PROMPT user:
  "This project contains multiple languages:
   - TypeScript (frontend, 45 files)
   - Python (backend, 32 files)

   Which should I focus on for test generation?
   Or should I create profiles for both?"

IF user selects one:
  GENERATE profile for selected language

IF user selects both:
  GENERATE language-profile-typescript.yaml
  GENERATE language-profile-python.yaml
  SET primary profile based on user preference
```

### Monorepo/Workspace Handling

Workspaces are now handled comprehensively in **Step 1b** and **Step 1c**.

Key behaviors:

1. **Auto-Detection**: Workspace markers are checked in Step 1b
2. **User Choice**: User can choose full workspace analysis or single package
3. **Profile Structure**:
   - Workspace profile: `_bmad/testarch/workspace-profile.yaml`
   - Per-package profiles: `_bmad/testarch/packages/{name}/language-profile.yaml`
4. **Commands**:
   - `*LI --workspace` - Force full workspace analysis
   - `*LI --package X` - Analyze specific package
   - `*LI --all` - Analyze all packages without prompting

### Workspace Profile Updates

When re-running `*LI` in a workspace with existing profiles:

```
IF exists workspace-profile.yaml:
  LOAD existing profile
  DETECT current packages

  new_packages = current_packages - existing_packages
  removed_packages = existing_packages - current_packages

  IF new_packages OR removed_packages:
    PROMPT user:
      "Workspace structure has changed:
       - New packages: {new_packages}
       - Removed packages: {removed_packages}

       Should I:
       1. Update workspace profile (analyze new, remove old)
       2. Full re-analysis
       3. Skip (keep existing)"

  IF user selects 1:
    FOR package IN new_packages:
      ANALYZE and ADD to workspace profile
    FOR package IN removed_packages:
      REMOVE from workspace profile
    SAVE updated workspace profile
```

### Cross-Package Test Utilities

When detecting shared test infrastructure:

```
# Detect test utility packages
FOR package IN workspace_packages:
  IF package.name contains "test-util" OR "testing" OR "test-helpers":
    MARK as test_utility_package

    # Find who uses this utility
    importers = FIND packages that import from this package

    workspace_profile.shared_test_infrastructure.test_utilities.append({
      name: package.name,
      path: package.path,
      used_by: importers
    })
```

### Unknown Language Protocol

If confidence remains below 0.5 even after Tier 2 analysis:

```
PROMPT:
  "I cannot confidently identify this language.

   Files found: {file_list}

   This might be:
   - A newly released language
   - A domain-specific language (DSL)
   - A language I don't have patterns for

   To proceed, I need you to provide a sample test file.
   This will teach me the patterns for this language."
```

---

## Validation

After completing all steps, verify:

- [ ] Language profile file exists and is valid YAML
- [ ] All required fields are populated
- [ ] Confidence scores are within [0.0, 1.0]
- [ ] At least one syntax pattern is captured
- [ ] Test framework is identified (or marked as "unknown")
- [ ] Profile can be loaded by other TEA workflows

Refer to `checklist.md` for comprehensive validation criteria.

---

## Integration with Other Workflows

This workflow is automatically invoked by:

- `*framework` - Before scaffolding test infrastructure
- `*atdd` - Before generating tests
- `*automate` - Before expanding test coverage
- `*test-review` - To understand test patterns

### Single Project Integration

```
IF NOT exists language-profile.yaml:
  RUN language-inference workflow
  AWAIT profile generation
THEN:
  LOAD profile
  ADAPT patterns to detected language
```

### Workspace Integration

When operating in a workspace context:

```
# Step 0: Determine context
IF exists workspace-profile.yaml:
  LOAD workspace_profile

  IF user_specified_package:
    # User ran command in specific package or with --package flag
    package = FIND package in workspace_profile.packages
    LOAD package.profile_path as language_profile
  ELSE:
    # Working from workspace root
    PROMPT user:
      "This is a workspace with {package_count} packages.
       Which package should this workflow target?

       [List of packages with languages]

       Or run on all packages with --all flag"

ELIF is_workspace_marker_present:
  # Workspace exists but no profile yet
  RUN language-inference --workspace
  LOAD generated profiles

ELSE:
  # Single project
  STANDARD single-project flow
```

### Workflow-Specific Workspace Behaviors

**`*framework`** (Test Framework Setup):

- Can scaffold shared test utilities at workspace level
- Creates per-package test configurations
- Sets up shared fixtures directory

**`*automate`** (Test Automation):

- Can target specific package or all packages
- Uses workspace dependency graph for test ordering
- Shared test utilities available to all packages

**`*atdd`** (Acceptance TDD):

- Works on current package by default
- Can generate integration tests that span packages
- Uses E2E suites from shared_test_infrastructure

**`*ci`** (CI Configuration):

- Uses workspace_profile.ci_configuration for matrix setup
- Generates language-specific job configurations
- Includes affected-only test commands

**`*test-review`** (Test Quality):

- Can review single package or workspace-wide
- Aggregates coverage metrics across packages
- Identifies gaps in shared test infrastructure

---

## Output Files

### Single Project

```
{project-root}/
├── _bmad/
│   └── testarch/
│       └── language-profile.yaml      # Main profile
```

### Workspace (Monorepo)

```
{project-root}/
├── _bmad/
│   └── testarch/
│       ├── workspace-profile.yaml     # Workspace-level profile
│       └── packages/
│           ├── {package-a}/
│           │   └── language-profile.yaml
│           ├── {package-b}/
│           │   └── language-profile.yaml
│           └── {package-c}/
│               └── language-profile.yaml
```
