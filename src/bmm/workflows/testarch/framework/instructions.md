<!-- Powered by BMAD-CORE™ -->

# Test Framework Setup

**Workflow ID**: `_bmad/bmm/testarch/framework`
**Version**: 4.0 (BMad v6)

---

## Overview

Initialize a production-ready test framework architecture (Playwright or Cypress) with fixtures, helpers, configuration, and best practices. This workflow scaffolds the complete testing infrastructure for modern web applications.

---

## Phase 0: Language & Workspace Detection (Language-Agnostic)

**Critical:** Before scaffolding, detect the project's language, testing characteristics, and workspace context.

### Actions

1. **Check for Workspace Context**

   ```
   # Check if this is a monorepo/workspace
   IF exists {project-root}/_bmad/testarch/workspace-profile.yaml:
     SET is_workspace = TRUE
     READ workspace_profile

     # Determine target package
     IF user_specified_package:
       SET target_package = user_specified_package
     ELIF current_directory is inside a package:
       SET target_package = current_package
     ELSE:
       PROMPT user:
         "This is a workspace with {package_count} packages.
          Which package should *framework scaffold?

          [List packages with their languages]

          Or use --package flag: *framework --package @myorg/api"

     # Load the package's language profile
     profile_path = workspace_profile.packages[target_package].profile_path
     READ language_profile from profile_path

   ELIF workspace_marker_exists:
     # Workspace detected but not yet profiled
     INFORM "Workspace detected. Running language inference for all packages..."
     EXECUTE `*language-inference --workspace`
     RELOAD and continue from step 1

   ELSE:
     SET is_workspace = FALSE
     # Continue with single-project flow
   ```

2. **Check for Existing Language Profile (Single Project)**

   ```
   IF NOT is_workspace:
     IF exists {project-root}/_bmad/testarch/language-profile.yaml:
       READ profile
       IF profile.overall_confidence >= 0.8:
         USE existing profile
         SKIP to Phase 0 Step 4
       ELSE:
         INFORM "Low confidence profile found. Re-running detection..."
   ```

3. **Run Language Inference (If No Profile)**

   If no profile exists OR confidence is low:
   - Execute `*language-inference` workflow (or inline detection)
   - Generate `language-profile.yaml` with detected characteristics
   - Save to `{project-root}/_bmad/testarch/language-profile.yaml`

   **Reference:** `src/bmm/workflows/testarch/language-inference/instructions.md`

4. **Load Language Profile**

   Read and cache the following from `language-profile.yaml`:

   ```yaml
   language:
     inferred_name: # e.g., "TypeScript", "Python", "Go", "Rust"
     file_extensions: # e.g., [".ts", ".tsx"]

   characteristics:
     typing: # "static", "gradual", "dynamic"
     async_model: # "async-await", "promises", "goroutines", "none"
     test_structure: # "bdd_style", "function_based", "class_based"
     cleanup_idiom: # "hooks", "defer", "context_manager", "try_finally"
     assertion_style: # "expect_chain", "assert_function", "assert_method"
     fixture_pattern: # "extend_base", "decorator", "setup_method"

   test_framework:
     detected: # e.g., "playwright", "pytest", "go-test", "cargo-test"
     import_pattern: # e.g., "import { test } from '@playwright/test'"
     run_command: # e.g., "npx playwright test"

   syntax_patterns:
     test_function: # Template for test declaration
     assertion: # Template for assertions
     import_statement: # Template for imports

   # For workspace packages
   workspace_context: # (if applicable)
     is_workspace_package: true
     workspace_root: '../..'
     package_name: '@myorg/api-client'
     depends_on: ['@myorg/types']
     shared_test_utils: ['@myorg/test-utils']
   ```

5. **Load Adaptation Rules**

   **Knowledge Base Reference:** `testarch/knowledge/adaptation-rules.md`

   Load pattern translation rules for adapting abstract patterns to the detected language:
   - Cleanup strategies per language
   - Fixture composition patterns
   - Factory patterns
   - Assertion syntax mappings

6. **Load Shared Test Infrastructure (Workspace Only)**

   ```
   IF is_workspace:
     # Check for shared test utilities
     shared_utils = workspace_profile.shared_test_infrastructure.test_utilities

     # These can be referenced in scaffolded tests
     FOR util IN shared_utils:
       REGISTER util.name for import resolution
       NOTE util.exports as available helpers

     # Check for workspace defaults
     workspace_defaults = workspace_profile.workspace_defaults
     USE workspace_defaults.test_framework as framework preference
     USE workspace_defaults.test_patterns as file patterns
   ```

**Halt Condition:** If language detection fails (confidence < 0.3) AND user cannot provide sample test file, HALT with message: "Unable to detect project language. Please provide a sample test file or run `*learn-language`."

---

## Preflight Requirements

**Critical:** Verify these requirements before proceeding. If any fail, HALT and notify the user.

- ✅ Language profile exists with confidence >= 0.5 (from Phase 0)
- ✅ Project build file exists (detected in Phase 0)
- ✅ No existing test harness is already configured (check for existing framework config)
- ✅ Architectural/stack context available (project type, bundler, dependencies)

---

## Step 1: Run Preflight Checks

### Actions

1. **Validate Project Structure (Language-Aware)**

   Based on detected language from Phase 0:

   **JavaScript/TypeScript:**
   - Read `{project-root}/package.json`
   - Extract project type (React, Vue, Angular, Next.js, Node, etc.)
   - Identify bundler (Vite, Webpack, Rollup, esbuild)
   - Note existing test dependencies

   **Python:**
   - Read `pyproject.toml`, `requirements.txt`, or `setup.py`
   - Extract project type (Django, Flask, FastAPI, etc.)
   - Note existing test dependencies (pytest, unittest)

   **Go:**
   - Read `go.mod`
   - Extract module name and dependencies
   - Note existing test patterns

   **Rust:**
   - Read `Cargo.toml`
   - Extract crate name and dependencies
   - Note existing test patterns

   **Other Languages:**
   - Read detected build file from language profile
   - Extract project metadata
   - Note existing test patterns

2. **Check for Existing Framework**

   Search for test framework config based on detected language:

   **JavaScript/TypeScript:** `playwright.config.*`, `cypress.config.*`, `jest.config.*`, `vitest.config.*`
   **Python:** `pytest.ini`, `pyproject.toml[tool.pytest]`, `conftest.py`
   **Go:** `*_test.go` files with custom framework imports
   **Rust:** `tests/` directory with integration tests
   **Other:** Framework-specific config from language profile

   If found, HALT with message: "Existing test framework detected. Use workflow `upgrade-framework` instead."

3. **Gather Context**
   - Look for architecture documents (`architecture.md`, `tech-spec*.md`)
   - Check for API documentation or endpoint lists
   - Identify authentication requirements

**Halt Condition:** If preflight checks fail, stop immediately and report which requirement failed.

---

## Step 2: Scaffold Framework

### Actions

1. **Framework Selection (Language-Aware)**

   **Read from Language Profile:**

   If `language_profile.test_framework.detected` is set with high confidence:
   - Use the detected framework
   - Skip framework selection logic

   **Otherwise, select based on detected language:**

   **JavaScript/TypeScript:**
   - **Playwright** (recommended for): Large repos, multi-browser, complex flows, parallel workers
   - **Cypress** (recommended for): Small teams, component testing, real-time reloading
   - **Vitest** (recommended for): Unit/component tests in Vite projects
   - **Jest** (recommended for): Unit tests in React/Node projects

   **Python:**
   - **pytest** (recommended, default): Most flexible, fixture-based, extensive plugins
   - **unittest** (fallback): Built-in, class-based tests

   **Go:**
   - **go-test** (default): Built-in testing package
   - **testify** (optional): Extended assertions and mocking

   **Rust:**
   - **cargo-test** (default): Built-in test framework
   - **rstest** (optional): Parametrized tests, fixtures

   **Java/Kotlin:**
   - **JUnit 5** (recommended): Modern test framework
   - **TestNG** (alternative): Advanced test configuration

   **Other Languages:**
   - Use framework from language profile if detected
   - Or prompt user for preferred test framework

   **Detection Strategy:**
   - Check language profile for existing framework
   - Check build file for existing test dependencies
   - Consider `project_size` variable from workflow config
   - Use `framework_preference` variable if set
   - Default to language's recommended framework

2. **Create Directory Structure (Language-Aware)**

   Use the language profile to determine idiomatic directory structure:

   **JavaScript/TypeScript (default):**

   ```
   {project-root}/
   ├── tests/                        # Root test directory
   │   ├── e2e/                      # E2E test files
   │   ├── support/                  # Framework infrastructure
   │   │   ├── fixtures/             # Test fixtures (data, mocks)
   │   │   ├── helpers/              # Utility functions
   │   │   └── factories/            # Data factories
   │   └── README.md                 # Test suite documentation
   ```

   **Python:**

   ```
   {project-root}/
   ├── tests/                        # Root test directory
   │   ├── e2e/                      # E2E test files (test_*.py)
   │   ├── conftest.py               # Shared fixtures (pytest)
   │   ├── fixtures/                 # Test fixtures
   │   ├── factories/                # Data factories
   │   └── README.md                 # Test suite documentation
   ```

   **Go:**

   ```
   {project-root}/
   ├── tests/                        # Integration tests (or alongside source)
   │   ├── e2e/                      # E2E test files (*_test.go)
   │   ├── testutil/                 # Test utilities and helpers
   │   ├── fixtures/                 # Test fixtures
   │   └── README.md                 # Test suite documentation
   ```

   **Rust:**

   ```
   {project-root}/
   ├── tests/                        # Integration tests
   │   ├── e2e/                      # E2E test files
   │   ├── common/                   # Shared test utilities (mod.rs)
   │   └── README.md                 # Test suite documentation
   ├── src/
   │   └── lib.rs                    # Unit tests inline (#[cfg(test)])
   ```

   **Note**: Users organize test files as needed. The **fixtures/factories** folders are the critical pattern for test data used across tests.

   **Workspace/Monorepo Structure:**

   When operating in a workspace context, create test infrastructure that works with shared utilities:

   ```
   {workspace-root}/
   ├── _bmad/
   │   └── testarch/
   │       ├── workspace-profile.yaml   # Workspace-level profile
   │       └── packages/
   │           └── {package}/
   │               └── language-profile.yaml
   ├── packages/
   │   ├── test-utils/                  # Shared test utilities (if exists)
   │   │   ├── src/
   │   │   │   ├── fixtures/            # Shared fixtures
   │   │   │   ├── factories/           # Shared factories
   │   │   │   ├── mocks/               # Shared mocks
   │   │   │   └── index.ts             # Exports
   │   │   └── package.json
   │   │
   │   └── {target-package}/            # Package being scaffolded
   │       ├── tests/                   # Package-specific tests
   │       │   ├── e2e/
   │       │   ├── unit/
   │       │   └── fixtures/            # Package-local fixtures
   │       ├── {framework-config}       # e.g., vitest.config.ts
   │       └── package.json
   │
   ├── e2e/                             # Cross-package E2E tests (if applicable)
   │   ├── tests/
   │   └── {framework-config}
   │
   └── fixtures/                        # Workspace-wide fixtures (optional)
   ```

   **Workspace-Aware Imports:**

   When generating test files in a workspace package, import shared utilities:

   ```typescript
   // TypeScript workspace example
   import { createMockUser, setupTestDb } from '@myorg/test-utils';
   import { test, expect } from 'vitest';
   ```

   ```python
   # Python workspace example
   from shared.test_utils import create_mock_user, setup_test_db
   import pytest
   ```

   ```go
   // Go workspace example
   import (
       "testing"
       "myorg.com/shared/testutil"
   )
   ```

3. **Generate Configuration File (Language-Aware)**

   **IMPORTANT:** Use the language profile's `syntax_patterns` to generate idiomatic configuration.

   **Knowledge Base Reference:** `testarch/knowledge/adaptation-rules.md`

   Generate configuration based on detected language and framework:

   ***

   **JavaScript/TypeScript + Playwright** (`playwright.config.ts`):

   ```typescript
   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './tests/e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     timeout: 60 * 1000,
     expect: { timeout: 15 * 1000 },
     use: {
       baseURL: process.env.BASE_URL || 'http://localhost:3000',
       trace: 'retain-on-failure',
       screenshot: 'only-on-failure',
       video: 'retain-on-failure',
     },
     reporter: [['html'], ['junit', { outputFile: 'test-results/junit.xml' }], ['list']],
     projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
   });
   ```

   ***

   **Python + pytest** (`pyproject.toml` or `pytest.ini`):

   ```toml
   # pyproject.toml
   [tool.pytest.ini_options]
   testpaths = ["tests"]
   python_files = ["test_*.py", "*_test.py"]
   python_functions = ["test_*"]
   addopts = "-v --tb=short --strict-markers"
   markers = [
       "e2e: End-to-end tests",
       "unit: Unit tests",
       "integration: Integration tests",
   ]
   timeout = 60
   ```

   **Python + pytest-playwright** (`conftest.py`):

   ```python
   import pytest
   from playwright.sync_api import Page

   @pytest.fixture(scope="session")
   def browser_context_args(browser_context_args):
       return {**browser_context_args, "base_url": "http://localhost:3000"}
   ```

   ***

   **Go + go-test** (no config file, conventions):

   ```go
   // tests/e2e/main_test.go
   package e2e

   import (
       "os"
       "testing"
   )

   var baseURL string

   func TestMain(m *testing.M) {
       baseURL = os.Getenv("BASE_URL")
       if baseURL == "" {
           baseURL = "http://localhost:3000"
       }
       os.Exit(m.Run())
   }
   ```

   ***

   **Rust + cargo-test** (`Cargo.toml`):

   ```toml
   [dev-dependencies]
   tokio = { version = "1", features = ["full", "test-util"] }

   [[test]]
   name = "e2e"
   path = "tests/e2e/mod.rs"
   ```

   ***

   **For other languages:** Use `adaptation-rules.md` to translate the abstract configuration pattern to the target language's idioms.

4. **Generate Environment Configuration**

   Create `.env.example`:

   ```bash
   # Test Environment Configuration
   TEST_ENV=local
   BASE_URL=http://localhost:3000
   API_URL=http://localhost:3001/api

   # Authentication (if applicable)
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=

   # Feature Flags (if applicable)
   FEATURE_FLAG_NEW_UI=true

   # API Keys (if applicable)
   TEST_API_KEY=
   ```

5. **Generate Node Version File**

   Create `.nvmrc`:

   ```
   20.11.0
   ```

   (Use Node version from existing `.nvmrc` or default to current LTS)

6. **Implement Fixture Architecture (Language-Aware)**

   **Knowledge Base Reference**: `testarch/knowledge/fixture-architecture.md`

   Generate fixtures using the language profile's `fixture_pattern` and `cleanup_idiom`:

   ***

   **JavaScript/TypeScript + Playwright** (`tests/support/fixtures/index.ts`):

   ```typescript
   import { test as base } from '@playwright/test';
   import { UserFactory } from './factories/user-factory';

   type TestFixtures = {
     userFactory: UserFactory;
   };

   export const test = base.extend<TestFixtures>({
     userFactory: async ({}, use) => {
       const factory = new UserFactory();
       await use(factory);
       await factory.cleanup(); // Auto-cleanup
     },
   });

   export { expect } from '@playwright/test';
   ```

   ***

   **Python + pytest** (`tests/conftest.py`):

   ```python
   import pytest
   from tests.factories.user_factory import UserFactory

   @pytest.fixture
   def user_factory():
       factory = UserFactory()
       yield factory  # Provide to test
       factory.cleanup()  # Auto-cleanup after test

   @pytest.fixture
   def authenticated_user(user_factory, page):
       user = user_factory.create()
       # ... login logic ...
       yield user
       user_factory.delete(user.id)
   ```

   ***

   **Go + go-test** (`tests/testutil/fixtures.go`):

   ```go
   package testutil

   import "testing"

   type UserFactory struct {
       createdUsers []string
   }

   func NewUserFactory() *UserFactory {
       return &UserFactory{}
   }

   func (f *UserFactory) Create() User {
       user := createTestUser()
       f.createdUsers = append(f.createdUsers, user.ID)
       return user
   }

   func (f *UserFactory) Cleanup(t *testing.T) {
       t.Cleanup(func() {
           for _, id := range f.createdUsers {
               deleteUser(id)
           }
       })
   }
   ```

   ***

   **Rust + cargo-test** (`tests/common/mod.rs`):

   ```rust
   pub struct UserFactory {
       created_users: Vec<String>,
   }

   impl UserFactory {
       pub fn new() -> Self {
           Self { created_users: vec![] }
       }

       pub fn create(&mut self) -> User {
           let user = create_test_user();
           self.created_users.push(user.id.clone());
           user
       }
   }

   impl Drop for UserFactory {
       fn drop(&mut self) {
           for id in &self.created_users {
               delete_user(id);
           }
       }
   }
   ```

   ***

   **For other languages:** Translate the abstract fixture pattern using `adaptation-rules.md`:
   - **Cleanup idiom:** defer (Go), context_manager (Python), Drop trait (Rust), try-finally (Java), hooks (JS/TS)
   - **Fixture composition:** extend_base (Playwright), pytest fixtures (Python), test helpers (Go)

7. **Implement Data Factories (Language-Aware)**

   **Knowledge Base Reference**: `testarch/knowledge/data-factories.md`

   Generate factories using the language profile's patterns:

   ***

   **JavaScript/TypeScript** (`tests/support/factories/user-factory.ts`):

   ```typescript
   import { faker } from '@faker-js/faker';

   export class UserFactory {
     private createdUsers: string[] = [];

     async createUser(overrides = {}) {
       const user = {
         email: faker.internet.email(),
         name: faker.person.fullName(),
         password: faker.internet.password({ length: 12 }),
         ...overrides,
       };
       const response = await fetch(`${process.env.API_URL}/users`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(user),
       });
       const created = await response.json();
       this.createdUsers.push(created.id);
       return created;
     }

     async cleanup() {
       for (const userId of this.createdUsers) {
         await fetch(`${process.env.API_URL}/users/${userId}`, { method: 'DELETE' });
       }
       this.createdUsers = [];
     }
   }
   ```

   ***

   **Python** (`tests/factories/user_factory.py`):

   ```python
   from faker import Faker
   import requests
   import os

   fake = Faker()

   class UserFactory:
       def __init__(self):
           self.created_users = []
           self.api_url = os.getenv("API_URL", "http://localhost:3000/api")

       def create(self, **overrides):
           user_data = {
               "email": fake.email(),
               "name": fake.name(),
               "password": fake.password(length=12),
               **overrides,
           }
           response = requests.post(f"{self.api_url}/users", json=user_data)
           user = response.json()
           self.created_users.append(user["id"])
           return user

       def cleanup(self):
           for user_id in self.created_users:
               requests.delete(f"{self.api_url}/users/{user_id}")
           self.created_users = []
   ```

   ***

   **Go** (`tests/testutil/user_factory.go`):

   ```go
   package testutil

   import (
       "github.com/brianvoe/gofakeit/v6"
   )

   type UserFactory struct {
       createdUsers []string
       apiURL       string
   }

   func NewUserFactory() *UserFactory {
       return &UserFactory{
           apiURL: getEnvOrDefault("API_URL", "http://localhost:3000/api"),
       }
   }

   func (f *UserFactory) Create(overrides ...map[string]interface{}) User {
       user := User{
           Email:    gofakeit.Email(),
           Name:     gofakeit.Name(),
           Password: gofakeit.Password(true, true, true, false, false, 12),
       }
       // Apply overrides...
       created := apiCreateUser(f.apiURL, user)
       f.createdUsers = append(f.createdUsers, created.ID)
       return created
   }

   func (f *UserFactory) Cleanup() {
       for _, id := range f.createdUsers {
           apiDeleteUser(f.apiURL, id)
       }
       f.createdUsers = nil
   }
   ```

   ***

   **Rust** (`tests/common/user_factory.rs`):

   ```rust
   use fake::{Fake, faker::internet::en::*, faker::name::en::*};

   pub struct UserFactory {
       created_users: Vec<String>,
       api_url: String,
   }

   impl UserFactory {
       pub fn new() -> Self {
           Self {
               created_users: vec![],
               api_url: std::env::var("API_URL")
                   .unwrap_or_else(|_| "http://localhost:3000/api".to_string()),
           }
       }

       pub async fn create(&mut self) -> User {
           let user = User {
               email: SafeEmail().fake(),
               name: Name().fake(),
               password: Password(12..13).fake(),
           };
           let created = api_create_user(&self.api_url, &user).await;
           self.created_users.push(created.id.clone());
           created
       }
   }

   impl Drop for UserFactory {
       fn drop(&mut self) {
           for id in &self.created_users {
               // Sync cleanup or spawn cleanup task
               let _ = std::thread::spawn(|| api_delete_user(&self.api_url, id));
           }
       }
   }
   ```

   ***

   **For other languages:** Use `adaptation-rules.md` to translate the factory pattern:
   - Find faker equivalent for the language
   - Apply cleanup idiom from language profile
   - Use override pattern appropriate to language (kwargs, options struct, builder)

8. **Generate Sample Tests (Language-Aware)**

   Generate sample tests using the language profile's `syntax_patterns.test_function`:

   ***

   **JavaScript/TypeScript + Playwright** (`tests/e2e/example.spec.ts`):

   ```typescript
   import { test, expect } from '../support/fixtures';

   test.describe('Example Test Suite', () => {
     test('should load homepage', async ({ page }) => {
       await page.goto('/');
       await expect(page).toHaveTitle(/Home/i);
     });

     test('should create user and login', async ({ page, userFactory }) => {
       const user = await userFactory.createUser();
       await page.goto('/login');
       await page.fill('[data-testid="email-input"]', user.email);
       await page.fill('[data-testid="password-input"]', user.password);
       await page.click('[data-testid="login-button"]');
       await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
     });
   });
   ```

   ***

   **Python + pytest + playwright** (`tests/e2e/test_example.py`):

   ```python
   import pytest
   from playwright.sync_api import Page, expect

   class TestExampleSuite:
       def test_should_load_homepage(self, page: Page):
           page.goto("/")
           expect(page).to_have_title(re.compile(r"Home", re.IGNORECASE))

       def test_should_create_user_and_login(self, page: Page, user_factory):
           user = user_factory.create()
           page.goto("/login")
           page.fill('[data-testid="email-input"]', user["email"])
           page.fill('[data-testid="password-input"]', user["password"])
           page.click('[data-testid="login-button"]')
           expect(page.locator('[data-testid="user-menu"]')).to_be_visible()
   ```

   ***

   **Go + go-test** (`tests/e2e/example_test.go`):

   ```go
   package e2e

   import (
       "testing"
       "tests/testutil"
   )

   func TestShouldLoadHomepage(t *testing.T) {
       page := testutil.NewPage(t)
       page.Goto("/")
       testutil.ExpectTitle(t, page, "Home")
   }

   func TestShouldCreateUserAndLogin(t *testing.T) {
       page := testutil.NewPage(t)
       factory := testutil.NewUserFactory()
       factory.Cleanup(t) // Register cleanup

       user := factory.Create()
       page.Goto("/login")
       page.Fill(`[data-testid="email-input"]`, user.Email)
       page.Fill(`[data-testid="password-input"]`, user.Password)
       page.Click(`[data-testid="login-button"]`)
       testutil.ExpectVisible(t, page, `[data-testid="user-menu"]`)
   }
   ```

   ***

   **Rust + cargo-test** (`tests/e2e/example_test.rs`):

   ```rust
   use crate::common::{UserFactory, TestPage};

   #[tokio::test]
   async fn test_should_load_homepage() {
       let page = TestPage::new().await;
       page.goto("/").await;
       assert!(page.title().await.contains("Home"));
   }

   #[tokio::test]
   async fn test_should_create_user_and_login() {
       let page = TestPage::new().await;
       let mut factory = UserFactory::new();
       let user = factory.create().await;

       page.goto("/login").await;
       page.fill(r#"[data-testid="email-input"]"#, &user.email).await;
       page.fill(r#"[data-testid="password-input"]"#, &user.password).await;
       page.click(r#"[data-testid="login-button"]"#).await;
       assert!(page.is_visible(r#"[data-testid="user-menu"]"#).await);
   }
   ```

   ***

   **For other languages:** Use the `syntax_patterns.test_function` from language profile to generate idiomatic test structure.

9. **Update Build Configuration with Test Scripts (Language-Aware)**

   Add test execution scripts to the appropriate build file:

   ***

   **JavaScript/TypeScript** (`package.json`):

   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui",
       "test:e2e:headed": "playwright test --headed"
     }
   }
   ```

   ***

   **Python** (`pyproject.toml` or `Makefile`):

   ```toml
   # pyproject.toml
   [tool.poetry.scripts]
   test = "pytest:main"

   # Or Makefile
   # test-e2e:
   #     pytest tests/e2e -v
   ```

   Or provide commands in README:

   ```bash
   pytest tests/e2e -v           # Run E2E tests
   pytest tests/e2e -v --headed  # Run with browser visible (playwright)
   ```

   ***

   **Go** (`Makefile` or README):

   ```makefile
   # Makefile
   test-e2e:
   	go test -v ./tests/e2e/...

   test-e2e-verbose:
   	go test -v -count=1 ./tests/e2e/...
   ```

   ***

   **Rust** (`Cargo.toml` scripts or README):

   ```bash
   cargo test --test e2e         # Run E2E tests
   cargo test --test e2e -- --nocapture  # With output
   ```

   ***

   **Note**: Use `language_profile.test_framework.run_command` for the base command.

10. **Generate Documentation**

    Create `tests/README.md` with setup instructions (see Step 3 deliverables).

---

## Step 3: Deliverables

### Primary Artifacts Created

1. **Configuration File**
   - `playwright.config.ts` or `cypress.config.ts`
   - Timeouts: action 15s, navigation 30s, test 60s
   - Reporters: HTML + JUnit XML

2. **Directory Structure**
   - `tests/` with `e2e/`, `api/`, `support/` subdirectories
   - `support/fixtures/` for test fixtures
   - `support/helpers/` for utility functions

3. **Environment Configuration**
   - `.env.example` with `TEST_ENV`, `BASE_URL`, `API_URL`
   - `.nvmrc` with Node version

4. **Test Infrastructure**
   - Fixture architecture (`mergeTests` pattern)
   - Data factories (faker-based, with auto-cleanup)
   - Sample tests demonstrating patterns

5. **Documentation**
   - `tests/README.md` with setup instructions
   - Comments in config files explaining options

### README Contents

The generated `tests/README.md` should include:

- **Setup Instructions**: How to install dependencies, configure environment
- **Running Tests**: Commands for local execution, headed mode, debug mode
- **Architecture Overview**: Fixture pattern, data factories, page objects
- **Best Practices**: Selector strategy (data-testid), test isolation, cleanup
- **CI Integration**: How tests run in CI/CD pipeline
- **Knowledge Base References**: Links to relevant TEA knowledge fragments

---

## Important Notes

### Knowledge Base Integration

**Critical:** Check configuration and load appropriate fragments.

Read `{config_source}` and check `config.tea_use_playwright_utils`.

**If `config.tea_use_playwright_utils: true` (Playwright Utils Integration):**

Consult `{project-root}/_bmad/bmm/testarch/tea-index.csv` and load:

- `overview.md` - Playwright utils installation and design principles
- `fixtures-composition.md` - mergeTests composition with playwright-utils
- `auth-session.md` - Token persistence setup (if auth needed)
- `api-request.md` - API testing utilities (if API tests planned)
- `burn-in.md` - Smart test selection for CI (recommend during framework setup)
- `network-error-monitor.md` - Automatic HTTP error detection (recommend in merged fixtures)
- `data-factories.md` - Factory patterns with faker (498 lines, 5 examples)

Recommend installing playwright-utils:

```bash
npm install -D @seontechnologies/playwright-utils
```

Recommend adding burn-in and network-error-monitor to merged fixtures for enhanced reliability.

**If `config.tea_use_playwright_utils: false` (Traditional Patterns):**

Consult `{project-root}/_bmad/bmm/testarch/tea-index.csv` and load:

- `fixture-architecture.md` - Pure function → fixture → `mergeTests` composition with auto-cleanup (406 lines, 5 examples)
- `data-factories.md` - Faker-based factories with overrides, nested factories, API seeding, auto-cleanup (498 lines, 5 examples)
- `network-first.md` - Network-first testing safeguards: intercept before navigate, HAR capture, deterministic waiting (489 lines, 5 examples)
- `playwright-config.md` - Playwright-specific configuration: environment-based, timeout standards, artifact output, parallelization, project config (722 lines, 5 examples)
- `test-quality.md` - Test design principles: deterministic, isolated with cleanup, explicit assertions, length/time limits (658 lines, 5 examples)

### Framework-Specific Guidance

**Playwright Advantages:**

- Worker parallelism (significantly faster for large suites)
- Trace viewer (powerful debugging with screenshots, network, console)
- Multi-language support (TypeScript, JavaScript, Python, C#, Java)
- Built-in API testing capabilities
- Better handling of multiple browser contexts

**Cypress Advantages:**

- Superior developer experience (real-time reloading)
- Excellent for component testing (Cypress CT or use Vitest)
- Simpler setup for small teams
- Better suited for watch mode during development

**Avoid Cypress when:**

- API chains are heavy and complex
- Multi-tab/window scenarios are common
- Worker parallelism is critical for CI performance

### Selector Strategy

**Always recommend**:

- `data-testid` attributes for UI elements
- `data-cy` attributes if Cypress is chosen
- Avoid brittle CSS selectors or XPath

### Contract Testing

For microservices architectures, **recommend Pact** for consumer-driven contract testing alongside E2E tests.

### Failure Artifacts

Configure **failure-only** capture:

- Screenshots: only on failure
- Videos: retain on failure (delete on success)
- Traces: retain on failure (Playwright)

This reduces storage overhead while maintaining debugging capability.

---

## Output Summary

After completing this workflow, provide a summary:

```markdown
## Framework Scaffold Complete

**Framework Selected**: Playwright (or Cypress)

**Artifacts Created**:

- ✅ Configuration file: `playwright.config.ts`
- ✅ Directory structure: `tests/e2e/`, `tests/support/`
- ✅ Environment config: `.env.example`
- ✅ Node version: `.nvmrc`
- ✅ Fixture architecture: `tests/support/fixtures/`
- ✅ Data factories: `tests/support/fixtures/factories/`
- ✅ Sample tests: `tests/e2e/example.spec.ts`
- ✅ Documentation: `tests/README.md`

**Next Steps**:

1. Copy `.env.example` to `.env` and fill in environment variables
2. Run `npm install` to install test dependencies
3. Run `npm run test:e2e` to execute sample tests
4. Review `tests/README.md` for detailed setup instructions

**Knowledge Base References Applied**:

- Fixture architecture pattern (pure functions + mergeTests)
- Data factories with auto-cleanup (faker-based)
- Network-first testing safeguards
- Failure-only artifact capture
```

---

## Validation

After completing all steps, verify:

- [ ] Configuration file created and valid
- [ ] Directory structure exists
- [ ] Environment configuration generated
- [ ] Sample tests run successfully
- [ ] Documentation complete and accurate
- [ ] No errors or warnings during scaffold

Refer to `checklist.md` for comprehensive validation criteria.
