# Language Inference Checklist

## Pre-Workflow Validation

- [ ] Project directory is accessible
- [ ] No existing profile with high confidence (>0.9) that should be preserved
- [ ] User has confirmed scope (if monorepo detected)

## Detection Phase

### Build File Analysis

- [ ] Scanned for all known build files (package.json, Cargo.toml, go.mod, etc.)
- [ ] Recorded which build files were found
- [ ] Extracted language hints from build files

### File Extension Analysis

- [ ] Collected all unique file extensions in project
- [ ] Filtered out non-source extensions (.md, .json, .yaml, etc.)
- [ ] Identified primary source file extension

### Test Directory Discovery

- [ ] Located test directories (tests/, test/, **tests**/, spec/)
- [ ] Identified test file naming patterns
- [ ] Counted existing test files

## Characteristic Inference

### Type System

- [ ] Analyzed function signatures for type annotations
- [ ] Detected generic/template syntax if present
- [ ] Assigned typing characteristic with confidence score

### Async Model

- [ ] Searched for async/await keywords
- [ ] Checked for Promise/Future types
- [ ] Identified concurrency patterns (goroutines, actors, etc.)
- [ ] Assigned async_model characteristic with confidence score

### Test Structure

- [ ] Analyzed test file organization
- [ ] Identified test declaration pattern (function, class, BDD blocks)
- [ ] Assigned test_structure characteristic with confidence score

### Module System

- [ ] Analyzed import/export statements
- [ ] Identified module system type
- [ ] Assigned module_system characteristic with confidence score

### Cleanup Idiom

- [ ] Searched for cleanup patterns (defer, finally, context managers)
- [ ] Identified test hooks (beforeEach, afterEach, setUp, tearDown)
- [ ] Assigned cleanup_idiom characteristic with confidence score

### Assertion Style

- [ ] Analyzed assertion statements in test files
- [ ] Identified assertion syntax pattern(s)
- [ ] Assigned assertion_style characteristic with confidence score

## Syntax Pattern Extraction

- [ ] Extracted test function declaration pattern
- [ ] Extracted at least one assertion pattern
- [ ] Extracted import statement pattern
- [ ] Extracted fixture/setup pattern (if applicable)
- [ ] Created pattern templates with placeholders

## Test Framework Detection

- [ ] Identified test framework from dependencies/imports
- [ ] Determined test run command
- [ ] Located config file (if exists)
- [ ] Documented framework capabilities

## Confidence Evaluation

- [ ] Calculated overall confidence score
- [ ] If confidence < 0.7: Prompted user for assistance
- [ ] If confidence < 0.5: Invoked collaborative learning
- [ ] User confirmed profile (if interactive)

## Profile Generation

### Required Fields

- [ ] `metadata.schema_version` is set to "1.0"
- [ ] `metadata.generated_at` has valid timestamp
- [ ] `metadata.source` indicates detection tier
- [ ] `metadata.overall_confidence` is between 0.0 and 1.0
- [ ] `language.inferred_name` is populated
- [ ] `language.confidence` is between 0.0 and 1.0
- [ ] `language.file_extensions` is non-empty array

### Characteristics

- [ ] All characteristic fields have `value` and `confidence`
- [ ] Evidence is provided for each characteristic
- [ ] No confidence score is exactly 0.0 or 1.0 (unless definitive)

### Syntax Patterns

- [ ] `test_function` pattern is populated
- [ ] `assertion.patterns` has at least one entry
- [ ] Patterns use consistent placeholder syntax `{placeholder}`
- [ ] Example code is provided for each pattern

### Test Framework

- [ ] `detected` field is populated (or "unknown")
- [ ] `run_command` is provided (or null if unknown)
- [ ] `capabilities` are documented

### Project Context

- [ ] `test_directory` is identified
- [ ] `existing_tests` count is accurate
- [ ] `test_file_pattern` is documented

## Output Validation

- [ ] Profile file written to `{project-root}/_bmad/testarch/language-profile.yaml`
- [ ] File is valid YAML (can be parsed)
- [ ] Profile can be loaded by schema validator
- [ ] Summary presented to user
- [ ] Next steps documented

## Edge Cases Handled

- [ ] Multiple languages: User prompted and primary selected
- [ ] Monorepo: Scope clarified with user
- [ ] Unknown language: Collaborative learning invoked
- [ ] No test files: Informed user, generated partial profile
- [ ] Conflicting signals: Lowest confidence used, alternatives documented

## Quality Checks

- [ ] No hardcoded language assumptions
- [ ] Patterns extracted from actual code, not guessed
- [ ] User corrections incorporated (if any)
- [ ] Learning history recorded

## Post-Workflow

- [ ] Profile is usable by other TEA workflows
- [ ] User informed of how to update profile
- [ ] No sensitive information in profile (secrets, credentials)
