# Learn Language Workflow

**Workflow ID**: `_bmad/bmm/testarch/learn-language`
**Version**: 1.0 (BMad v6)

---

## Overview

Learn testing patterns for unknown, new, or custom programming languages through collaborative interaction with the user. This workflow enables TEA to support ANY language, even ones that:

- Were just released (days old)
- Are domain-specific languages (DSLs)
- Have custom testing frameworks
- Are internal/proprietary languages

**Key Principle**: The user is the expert on their language. TEA learns by asking smart questions and analyzing provided samples.

---

## When This Workflow Runs

1. **Auto-invoked** by `language-inference` when confidence < 0.5
2. **User-initiated** via `*learn-language` command
3. **Correction mode** when user wants to fix incorrect profile

---

## Step 1: Initial Assessment

### Actions

1. **Check Existing Knowledge**

   ```
   IF language_name is provided:
     SEARCH internal knowledge for language
     IF found:
       INFORM user: "I have some knowledge of {language}. Let me verify against your project."
       PROCEED to verification mode
     ELSE:
       INFORM user: "I don't have built-in knowledge of {language}. I'll learn from your examples."
       PROCEED to learning mode
   ELSE:
     PROCEED to learning mode
   ```

2. **Determine Learning Input**

   Present options to user:

   ```markdown
   I need to learn the testing patterns for this language.

   Please provide ONE of the following:

   **Option 1: Sample Test File** (Recommended)
   Paste or provide path to a test file with 2-3 tests.
   Include imports, setup, and actual test code.

   **Option 2: Documentation URL**
   Link to the testing framework documentation.
   I'll extract patterns from the docs.

   **Option 3: Quick Answers**
   Answer 4 questions about the syntax:

   1. How do you declare a test?
   2. How do you write assertions?
   3. How do you handle async operations?
   4. How do you clean up after tests?

   **Option 4: Language Name**
   If this is a known language I might recognize.
   ```

---

## Step 2: Learning from Sample File

### When User Provides Sample

1. **Validate Sample**

   ```
   IF sample is file path:
     READ file content
   ELIF sample is pasted content:
     USE directly

   VALIDATE:
     - Contains at least one identifiable test
     - Is not empty or too short (<10 lines)
     - Appears to be code (not prose)
   ```

2. **Extract Patterns**

   Analyze the sample systematically:

   **Import/Module Statements:**

   ```
   FIND lines at top of file with import-like patterns:
     - "import X from Y"
     - "from X import Y"
     - "require(X)"
     - "use X"
     - "#include X"
     - Any other module loading pattern

   EXTRACT:
     - Import syntax pattern
     - Test framework imports specifically
   ```

   **Test Declaration:**

   ```
   FIND test function/block patterns:
     - Functions with "test" in name
     - Decorated/attributed functions
     - Blocks starting with test-like keywords

   EXTRACT:
     - Full declaration syntax
     - Async markers (if present)
     - Parameter patterns
     - Body delimiters (braces, indentation)

   GENERATE template:
     e.g., "test('{description}', async () => { {body} })"
   ```

   **Assertions:**

   ```
   FIND assertion statements:
     - expect(X).toBe(Y) style
     - assert_eq(X, Y) style
     - Assert.Equal(X, Y) style
     - assert X == Y style
     - Any comparison/validation patterns

   EXTRACT all variations found
   IDENTIFY most common pattern
   ```

   **Setup/Teardown:**

   ```
   FIND setup patterns:
     - beforeEach, setUp, before hooks
     - Constructor or initialization blocks
     - Factory or fixture patterns

   FIND teardown patterns:
     - afterEach, tearDown, after hooks
     - Cleanup functions
     - defer/finally/context manager patterns
   ```

   **Async Handling:**

   ```
   FIND async patterns:
     - async/await keywords
     - Promise/Future handling
     - Callback patterns
     - Coroutine syntax
   ```

3. **Infer Characteristics**

   From extracted patterns, infer:

   ```yaml
   characteristics:
     typing:
       # Look for type annotations in function signatures
       value: static | dynamic | gradual
       evidence: '{extracted_signature}'

     async_model:
       # Based on async patterns found
       value: async-await | promises | callbacks | none
       evidence: '{extracted_async_pattern}'

     test_structure:
       # Based on test declaration pattern
       value: function_based | class_based | bdd_style
       evidence: '{extracted_test_pattern}'

     cleanup_idiom:
       # Based on cleanup patterns found
       value: defer | context_manager | hooks | try_finally | manual
       evidence: '{extracted_cleanup_pattern}'

     assertion_style:
       # Based on assertion patterns found
       value: expect_chain | assert_function | assert_method
       evidence: '{extracted_assertion_pattern}'
   ```

---

## Step 3: Learning from Documentation

### When User Provides URL

1. **Fetch Documentation**

   ```
   FETCH url content
   IF fetch fails:
     ASK user to paste relevant section instead
   ```

2. **Parse Documentation**

   Look for:
   - "Getting Started" or "Quick Start" sections
   - "Writing Tests" or "Test Syntax" sections
   - Code examples (in code blocks)
   - API reference for assertions

3. **Extract Patterns from Docs**

   ```
   FOR each code block in documentation:
     IF appears to be test code:
       EXTRACT same patterns as sample file analysis

   PREFER examples labeled as "basic" or "simple"
   CAPTURE multiple examples to understand variations
   ```

---

## Step 4: Learning from Quick Answers

### When User Answers Questions

1. **Question 1: Test Declaration**

   ```markdown
   **How do you declare a test in this language?**

   Please paste an example:
   ```

   Example user response:

   ```zig
   test "addition works" {
       try std.testing.expect(add(2, 3) == 5);
   }
   ```

   EXTRACT: Test declaration pattern with placeholders

2. **Question 2: Assertions**

   ```markdown
   **How do you write assertions?**

   Show me 2-3 examples of different assertions:
   ```

   Example user response:

   ```zig
   try std.testing.expect(x == y);
   try std.testing.expectEqual(expected, actual);
   try std.testing.expectError(error.OutOfMemory, failing_fn());
   ```

   EXTRACT: All assertion patterns

3. **Question 3: Async Handling**

   ```markdown
   **How do you handle async operations?**

   (Type "none" if the language doesn't have async, or show an example)
   ```

   EXTRACT: Async pattern or mark as "none"

4. **Question 4: Cleanup**

   ```markdown
   **How do you clean up resources after a test?**

   Show how you would ensure cleanup runs even if test fails:
   ```

   EXTRACT: Cleanup idiom pattern

---

## Step 5: Confirm Understanding

### Present Learned Patterns

```markdown
## I've learned the following patterns:

**Language:** {inferred_name or "Unknown"}

### Test Declaration
```

{extracted_test_pattern}

```

### Assertions
```

{assertion_pattern_1}
{assertion_pattern_2}

```

### Async Handling
{async_description or "None detected"}

### Cleanup Pattern
```

{cleanup_pattern}

```

---

**Is this correct?**

1. Yes, this is correct
2. No, let me provide corrections
3. Let me show you another example
```

### Handle Corrections

If user selects "No":

```markdown
What needs to be corrected?

1. Test declaration pattern
2. Assertion patterns
3. Async handling
4. Cleanup pattern
5. All of the above - let me provide a better example
```

For each correction, re-prompt for that specific pattern and update.

---

## Step 6: Generate Profile

### Actions

1. **Build Complete Profile**

   ```yaml
   language_profile:
     metadata:
       schema_version: '1.0'
       generated_at: { timestamp }
       last_updated: { timestamp }
       source: 'tier-3-collaborative'
       overall_confidence: 0.80 # User-validated

     language:
       inferred_name: { user_provided_or_inferred }
       confidence: { 0.9 if user_confirmed else 0.7 }
       file_extensions: { detected_extensions }
       evidence:
         - 'Learned from user-provided sample'
         - 'User confirmed patterns'

     characteristics:
       typing: { inferred_typing }
       async_model: { inferred_async }
       test_structure: { inferred_structure }
       module_system: { inferred_modules }
       cleanup_idiom: { inferred_cleanup }
       assertion_style: { inferred_assertions }
       fixture_pattern: { inferred_fixtures }

     syntax_patterns:
       test_function:
         pattern: { extracted_pattern }
         example: { user_provided_example }
       assertion:
         patterns: { all_assertion_patterns }
         preferred: 0
       # ... other patterns

     test_framework:
       detected: { framework_name_or_unknown }
       confidence: { confidence }
       import_pattern: { extracted_import }
       run_command: { user_provided_or_null }

     adaptation_hints:
       cleanup_strategy: { recommended }
       composition_strategy: { inferred }
       factory_strategy: { inferred }

     learning_history:
       - timestamp: { timestamp }
         action: 'sample_learning'
         details: 'Learned from user-provided test file'
         affected_fields: ['all']
       - timestamp: { timestamp }
         action: 'user_confirmation'
         details: 'User confirmed extracted patterns'
         affected_fields: ['overall_confidence']
   ```

2. **Save Profile**

   Write to `{project-root}/_bmad/testarch/language-profile.yaml`

---

## Step 7: Verification Test

### Optional: Generate Sample Test

````markdown
To verify I've learned correctly, I'll generate a simple test.

**Here's a test I would generate:**

```{language}
{generated_sample_test}
```
````

Does this look correct for your language?

- Yes, perfect!
- Close, but {correction}
- No, let me show you the correct version

````

If corrections needed, update profile and re-verify.

---

## Special Cases

### Learning Multiple Test Styles

Some languages support multiple test frameworks:

```markdown
I notice your examples use different patterns:

**Pattern A (from example 1):**
````

test("name", () => { expect(x).toBe(y) })

```

**Pattern B (from example 2):**
```

describe("suite", () => { it("name", () => { assert(x === y) }) })

```

Which is your primary testing style, or do you use both?
```

Store multiple patterns, mark preferred.

### Domain-Specific Languages (DSLs)

For DSLs that extend a host language:

```markdown
This appears to be a DSL. What is the host language?

- JavaScript/TypeScript
- Python
- Ruby
- Other: {specify}

I'll base my understanding on the host language's patterns
while learning your DSL-specific extensions.
```

### Internal/Proprietary Languages

```markdown
For proprietary languages, I'll need:

1. Test file examples (required)
2. Any style guide or conventions (helpful)
3. Common patterns your team uses (helpful)

All learned patterns stay in your project's profile
and are not shared externally.
```

---

## Output Summary

```markdown
## Language Learned Successfully!

**Language:** {name}
**Source:** User-provided examples
**Confidence:** {confidence}%

### Patterns Captured

| Pattern          | Status             |
| ---------------- | ------------------ |
| Test declaration | Learned            |
| Assertions       | {count} variations |
| Async handling   | {status}           |
| Cleanup          | {idiom}            |
| Imports          | Learned            |

### Profile Saved

Location: `_bmad/testarch/language-profile.yaml`

### Using This Profile

All TEA workflows will now generate tests in {language}.

**Commands you can use:**

- `*atdd` - Generate acceptance tests
- `*automate` - Expand test coverage
- `*framework` - Set up test infrastructure

**To update this profile:**

- Run `*learn-language` again
- Or edit the profile directly
```

---

## Validation Checklist

- [ ] User provided at least one input (sample, URL, or answers)
- [ ] Test declaration pattern extracted
- [ ] At least one assertion pattern captured
- [ ] User confirmed the learned patterns
- [ ] Profile saved successfully
- [ ] Profile is valid YAML
- [ ] All required fields populated
