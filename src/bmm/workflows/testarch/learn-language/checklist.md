# Learn Language Checklist

## Input Validation

- [ ] User provided at least one learning input:
  - [ ] Sample test file, OR
  - [ ] Documentation URL, OR
  - [ ] Quick answers to questions, OR
  - [ ] Language name to verify
- [ ] Input is non-empty and appears to be valid
- [ ] If file path provided, file exists and is readable

## Pattern Extraction

### Test Declaration

- [ ] Identified test declaration syntax
- [ ] Extracted function/block structure
- [ ] Captured async markers (if present)
- [ ] Created template with placeholders
- [ ] Provided concrete example

### Assertions

- [ ] Found at least one assertion pattern
- [ ] Extracted all assertion variations
- [ ] Identified preferred/most common pattern
- [ ] Created templates for each variation

### Module System

- [ ] Identified import/module syntax
- [ ] Captured test framework import specifically
- [ ] Created import template

### Async Handling

- [ ] Determined if language has async support
- [ ] If yes, captured async/await syntax
- [ ] If no, marked as "none"

### Cleanup Idiom

- [ ] Identified cleanup pattern used
- [ ] Classified idiom (defer, hooks, finally, etc.)
- [ ] Captured cleanup syntax

## Characteristic Inference

- [ ] Typing characteristic inferred with evidence
- [ ] Async model characteristic inferred with evidence
- [ ] Test structure characteristic inferred with evidence
- [ ] Cleanup idiom characteristic inferred with evidence
- [ ] Assertion style characteristic inferred with evidence

## User Confirmation

- [ ] Presented learned patterns to user
- [ ] User confirmed patterns are correct
- [ ] If corrections needed:
  - [ ] Captured corrections
  - [ ] Updated patterns
  - [ ] Re-confirmed with user

## Profile Generation

### Required Fields

- [ ] `metadata.schema_version` = "1.0"
- [ ] `metadata.source` = "tier-3-collaborative"
- [ ] `metadata.overall_confidence` reflects user validation
- [ ] `language.inferred_name` is set
- [ ] `language.file_extensions` captured

### Characteristics

- [ ] All characteristics have `value` and `confidence`
- [ ] Evidence provided from user's examples

### Syntax Patterns

- [ ] `test_function.pattern` populated
- [ ] `test_function.example` from user's input
- [ ] `assertion.patterns` has at least one entry
- [ ] Placeholders use `{name}` format consistently

### Learning History

- [ ] Recorded learning action
- [ ] Recorded user confirmation

## Output

- [ ] Profile saved to correct location
- [ ] File is valid YAML
- [ ] Summary presented to user
- [ ] Next steps documented

## Quality Checks

- [ ] Patterns actually came from user input (not guessed)
- [ ] User validated the output
- [ ] Profile usable by other TEA workflows
- [ ] No sensitive data captured
