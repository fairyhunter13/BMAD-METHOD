# Pattern Adaptation Rules

## Principle

Translate abstract testing patterns to any programming language using the detected language profile. Patterns are defined at a conceptual level and adapted based on the target language's characteristics, syntax, and idioms.

## Rationale

Hardcoding patterns for specific languages creates maintenance burden and limits extensibility. By separating concepts from implementations:

- **Maintainability**: Update pattern once, applies to all languages
- **Extensibility**: New languages work automatically if profile exists
- **Consistency**: Same testing philosophy across all languages
- **AI-Friendly**: Clear translation rules for code generation

## Core Adaptation Rules

### Rule 1: Test Function Declaration

**Abstract Pattern:**

```pseudocode
TEST "{description}" WITH {fixtures}:
    {body}
```

**Adaptation by `test_structure` characteristic:**

| Characteristic    | Adaptation                                                       |
| ----------------- | ---------------------------------------------------------------- |
| `function_based`  | Standalone function: `def test_name():` or `func TestName()`     |
| `class_based`     | Method in test class: `def test_name(self):`                     |
| `bdd_style`       | Block syntax: `test('name', () => {})` or `it('name', () => {})` |
| `attribute_based` | Decorated function: `@test def name():` or `#[test] fn name()`   |

**Adaptation by `async_model` characteristic:**

| Characteristic | Adaptation                                  |
| -------------- | ------------------------------------------- |
| `async-await`  | Add `async` keyword: `async test(...)`      |
| `goroutines`   | No special syntax (concurrency is implicit) |
| `promises`     | Return promise or use `.then()` chain       |
| `none`         | Synchronous function (no changes)           |

**Example Adaptations:**

```
// Profile: TypeScript + Playwright + async-await + bdd_style
test('should login', async ({ page }) => {
    await page.goto('/login');
});

// Profile: Python + pytest + async-await + function_based
@pytest.mark.asyncio
async def test_should_login(page):
    await page.goto('/login')

// Profile: Go + go-test + goroutines + function_based
func TestShouldLogin(t *testing.T) {
    page := setupPage(t)
    page.Goto("/login")
}

// Profile: Rust + cargo-test + async-await + attribute_based
#[tokio::test]
async fn test_should_login() {
    let page = setup_page().await;
    page.goto("/login").await;
}
```

---

### Rule 2: Assertion Statements

**Abstract Pattern:**

```pseudocode
ASSERT {actual} {comparison} {expected}
ASSERT {condition}
```

**Adaptation by `assertion_style` characteristic:**

| Characteristic    | Adaptation                                                       |
| ----------------- | ---------------------------------------------------------------- |
| `expect_chain`    | `expect(actual).toBe(expected)`                                  |
| `assert_function` | `assert_eq(actual, expected)` or `assertEqual(actual, expected)` |
| `assert_method`   | `Assert.AreEqual(expected, actual)`                              |
| `should_syntax`   | `actual.should.equal(expected)`                                  |
| `built_in_assert` | `assert actual == expected`                                      |

**Common Assertion Mappings:**

| Abstract     | expect_chain           | assert_function   | assert_method   |
| ------------ | ---------------------- | ----------------- | --------------- |
| `EQUALS`     | `toBe()` / `toEqual()` | `assert_eq()`     | `AreEqual()`    |
| `NOT_EQUALS` | `not.toBe()`           | `assert_ne()`     | `AreNotEqual()` |
| `TRUE`       | `toBeTruthy()`         | `assert_true()`   | `IsTrue()`      |
| `FALSE`      | `toBeFalsy()`          | `assert_false()`  | `IsFalse()`     |
| `CONTAINS`   | `toContain()`          | `assert_in()`     | `Contains()`    |
| `THROWS`     | `toThrow()`            | `assert_raises()` | `Throws()`      |
| `NULL`       | `toBeNull()`           | `assert_none()`   | `IsNull()`      |

**Example Adaptations:**

```
// Abstract: ASSERT response.status EQUALS 200

// TypeScript (expect_chain)
expect(response.status).toBe(200);

// Python (assert_function)
assert_eq(response.status, 200)
# or
assert response.status == 200

// Go (assert_function via testify)
assert.Equal(t, 200, response.Status)

// C# (assert_method)
Assert.AreEqual(200, response.Status);

// Rust (assert_function)
assert_eq!(response.status, 200);
```

---

### Rule 3: Cleanup / Resource Management

**Abstract Pattern:**

```pseudocode
SETUP:
    resource = ACQUIRE_RESOURCE()
TEST:
    USE resource
CLEANUP:
    RELEASE resource  // MUST run even if test fails
```

**Adaptation by `cleanup_idiom` characteristic:**

| Characteristic    | Adaptation                                   |
| ----------------- | -------------------------------------------- |
| `defer`           | `defer cleanup()` at start of test           |
| `context_manager` | `with acquire() as resource:`                |
| `try_finally`     | `try { test } finally { cleanup }`           |
| `hooks`           | `afterEach(() => cleanup())` or `tearDown()` |
| `raii`            | Resource cleanup via destructor/Drop         |

**Example Adaptations:**

```
// Abstract: Create user, test with user, delete user

// Go (defer)
func TestUserFlow(t *testing.T) {
    user := createTestUser(t)
    defer deleteTestUser(user.ID)  // Runs on exit, even on failure

    // test with user
}

// Python (context_manager)
def test_user_flow():
    with create_test_user() as user:
        # test with user
        pass
    # auto-cleanup when exiting context

// TypeScript/Playwright (hooks)
test.describe('User Flow', () => {
    let user;

    test.beforeEach(async () => {
        user = await createTestUser();
    });

    test.afterEach(async () => {
        await deleteTestUser(user.id);
    });

    test('test with user', async () => {
        // test
    });
});

// Rust (RAII via Drop)
#[test]
fn test_user_flow() {
    let user = TestUser::create();  // Drop impl handles cleanup
    // test with user
}  // user.drop() called automatically

// Java (try_finally)
@Test
void testUserFlow() {
    User user = createTestUser();
    try {
        // test with user
    } finally {
        deleteTestUser(user.getId());
    }
}
```

---

### Rule 4: Async Operations

**Abstract Pattern:**

```pseudocode
result = AWAIT async_operation()
```

**Adaptation by `async_model` characteristic:**

| Characteristic | Adaptation                         |
| -------------- | ---------------------------------- |
| `async-await`  | `const result = await asyncOp()`   |
| `promises`     | `asyncOp().then(result => ...)`    |
| `goroutines`   | `result := <-channel` or sync call |
| `coroutines`   | `result = yield from async_op()`   |
| `none`         | Synchronous call (no async)        |

**Example Adaptations:**

```
// Abstract: AWAIT fetch_user(id)

// TypeScript (async-await)
const user = await fetchUser(id);

// JavaScript (promises)
fetchUser(id).then(user => {
    // use user
});

// Python (async-await)
user = await fetch_user(id)

// Go (channels/goroutines)
user := <-fetchUserChan(id)
// or synchronous
user := fetchUser(id)

// Rust (async-await)
let user = fetch_user(id).await;
```

---

### Rule 5: Fixture / Dependency Injection

**Abstract Pattern:**

```pseudocode
FIXTURE api_client:
    client = CREATE_CLIENT()
    PROVIDE client
    CLEANUP: client.close()

TEST uses api_client:
    api_client.get('/users')
```

**Adaptation by `fixture_pattern` characteristic:**

| Characteristic          | Adaptation                                  |
| ----------------------- | ------------------------------------------- |
| `decorator_fixture`     | `@pytest.fixture` decorated function        |
| `parameter_injection`   | Test receives fixtures as parameters        |
| `method_hooks`          | `setUp()` creates, instance variable stores |
| `function_hooks`        | `beforeEach()` creates, closure captures    |
| `constructor_injection` | Inject via constructor                      |
| `factory_functions`     | Helper functions called in test             |

**Example Adaptations:**

```
// Abstract: FIXTURE api_client that provides HTTP client

// TypeScript/Playwright (parameter_injection)
// fixtures/api.ts
export const test = base.extend<{ apiClient: ApiClient }>({
    apiClient: async ({}, use) => {
        const client = new ApiClient();
        await use(client);
        await client.close();
    }
});

// test.spec.ts
test('get users', async ({ apiClient }) => {
    const users = await apiClient.get('/users');
});

// Python/pytest (decorator_fixture)
@pytest.fixture
def api_client():
    client = ApiClient()
    yield client
    client.close()

def test_get_users(api_client):
    users = api_client.get('/users')

// Go (factory_functions - Go doesn't have fixtures)
func setupApiClient(t *testing.T) *ApiClient {
    client := NewApiClient()
    t.Cleanup(func() { client.Close() })
    return client
}

func TestGetUsers(t *testing.T) {
    client := setupApiClient(t)
    users := client.Get("/users")
}

// Java/JUnit (method_hooks)
class ApiTests {
    private ApiClient apiClient;

    @BeforeEach
    void setUp() {
        apiClient = new ApiClient();
    }

    @AfterEach
    void tearDown() {
        apiClient.close();
    }

    @Test
    void testGetUsers() {
        var users = apiClient.get("/users");
    }
}
```

---

### Rule 6: Error Handling in Tests

**Abstract Pattern:**

```pseudocode
ASSERT_THROWS {error_type}:
    operation_that_should_fail()
```

**Adaptation by `error_handling` + `assertion_style`:**

```
// Abstract: ASSERT_THROWS ValidationError: validate(invalid_data)

// TypeScript (exceptions + expect_chain)
expect(() => validate(invalidData)).toThrow(ValidationError);
// or async
await expect(validateAsync(invalidData)).rejects.toThrow(ValidationError);

// Python (exceptions + assert_function)
with pytest.raises(ValidationError):
    validate(invalid_data)

// Go (error_returns)
_, err := validate(invalidData)
assert.ErrorIs(t, err, ErrValidation)

// Rust (result_types)
assert!(matches!(validate(invalid_data), Err(ValidationError)));
// or
assert!(validate(invalid_data).is_err());

// Java (exceptions + assert_method)
assertThrows(ValidationException.class, () -> {
    validate(invalidData);
});
```

---

## Pattern Translation Process

When generating code, TEA follows this process:

```
1. LOAD abstract pattern from knowledge fragment
2. LOAD language profile
3. FOR each abstract construct in pattern:
   a. LOOKUP corresponding characteristic in profile
   b. SELECT adaptation rule based on characteristic value
   c. APPLY syntax_pattern from profile
   d. SUBSTITUTE placeholders with actual values
4. VALIDATE generated code against profile patterns
5. RETURN adapted code
```

## Handling Missing Information

If profile is incomplete:

| Missing           | Fallback                               |
| ----------------- | -------------------------------------- |
| `test_structure`  | Infer from test file samples           |
| `async_model`     | Default to synchronous                 |
| `cleanup_idiom`   | Use try/finally (most universal)       |
| `assertion_style` | Use most common in detected framework  |
| `fixture_pattern` | Use factory functions (most universal) |

## Anti-Patterns

**DON'T hardcode language-specific patterns:**

```
// Bad: Assumes TypeScript
const code = `test('${name}', async () => { ${body} })`;
```

**DO use profile-driven generation:**

```
// Good: Uses profile
const pattern = profile.syntax_patterns.test_function.pattern;
const code = pattern
    .replace('{description}', name)
    .replace('{body}', body);
```

**DON'T assume characteristics:**

```
// Bad: Assumes async-await exists
await someOperation();
```

**DO check characteristics:**

```
// Good: Check async model
if (profile.characteristics.async_model.value === 'async-await') {
    // generate await
} else if (profile.characteristics.async_model.value === 'promises') {
    // generate .then()
} else {
    // generate sync call
}
```

## Integration Points

- **Used by workflows**: `*atdd`, `*automate`, `*framework`, `*test-review`
- **Depends on**: `language-profile.yaml` (generated by `*language-inference`)
- **Related fragments**:
  - `fixture-architecture.md` - Abstract fixture patterns
  - `test-levels-framework.md` - Test level selection (language-agnostic)
  - `test-quality.md` - Quality standards (language-agnostic)
