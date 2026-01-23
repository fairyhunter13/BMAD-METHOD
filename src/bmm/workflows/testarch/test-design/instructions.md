<!-- Powered by BMAD-CORE™ -->

# Test Design and Risk Assessment

**Workflow ID**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)

---

## Overview

Plans comprehensive test coverage strategy with risk assessment, priority classification, and execution ordering. This workflow operates in **two modes**:

- **System-Level Mode (Phase 3)**: Testability review of architecture before solutioning gate check
- **Epic-Level Mode (Phase 4)**: Per-epic test planning with risk assessment (current behavior)

The workflow auto-detects which mode to use based on project phase.

---

## Phase 0: Language Profile Loading (NEW - Language-Agnostic)

**Critical:** Load language profile for language-aware recommendations.

### Actions

1. **Check for Existing Language Profile**

   ```
   IF exists {project-root}/_bmad/testarch/language-profile.yaml:
     READ profile
     USE for framework recommendations
   ELSE:
     NOTE: Language inference not yet run
     RECOMMEND: Run *language-inference if generating test code later
   ```

2. **Cache Language Context**

   If profile exists, cache for later use in framework recommendations:

   ```yaml
   language:
     inferred_name: # e.g., "TypeScript", "Python", "Go"
   test_framework:
     detected: # e.g., "playwright", "pytest", "go-test"
     run_command: # e.g., "npx playwright test"
   ```

   This enables language-appropriate:
   - Test framework recommendations
   - Tool suggestions
   - CI configuration templates

---

## Preflight: Detect Mode and Load Context

**Critical:** Determine mode before proceeding.

### Mode Detection (Flexible for Standalone Use)

TEA test-design workflow supports TWO modes, detected automatically:

1. **Check User Intent Explicitly (Priority 1)**

   **Deterministic Rules:**
   - User provided **PRD+ADR only** (no Epic+Stories) → **System-Level Mode**
   - User provided **Epic+Stories only** (no PRD+ADR) → **Epic-Level Mode**
   - User provided **BOTH PRD+ADR AND Epic+Stories** → **Prefer System-Level Mode** (architecture review comes first in Phase 3, then epic planning in Phase 4). If mode preference is unclear, ask user: "Should I create (A) System-level test design (PRD + ADR → Architecture doc + QA doc) or (B) Epic-level test design (Epic → Single test plan)?"
   - If user intent is clear from context, use that mode regardless of file structure

2. **Fallback to File-Based Detection (Priority 2 - BMad-Integrated)**
   - Check for `{implementation_artifacts}/sprint-status.yaml`
   - If exists → **Epic-Level Mode** (Phase 4, single document output)
   - If NOT exists → **System-Level Mode** (Phase 3, TWO document outputs)

3. **If Ambiguous, ASK USER (Priority 3)**
   - "I see you have [PRD/ADR/Epic/Stories]. Should I create:
     - (A) System-level test design (PRD + ADR → Architecture doc + QA doc)?
     - (B) Epic-level test design (Epic → Single test plan)?"

**Mode Descriptions:**

**System-Level Mode (PRD + ADR Input)**

- **When to use:** Early in project (Phase 3 Solutioning), architecture being designed
- **Input:** PRD, ADR, architecture.md (optional)
- **Output:** TWO documents
  - `test-design-architecture.md` (for Architecture/Dev teams)
  - `test-design-qa.md` (for QA team)
- **Focus:** Testability assessment, ASRs, NFR requirements, Sprint 0 setup

**Epic-Level Mode (Epic + Stories Input)**

- **When to use:** During implementation (Phase 4), per-epic planning
- **Input:** Epic, Stories, tech-specs (optional)
- **Output:** ONE document
  - `test-design-epic-{N}.md` (combined risk assessment + test plan)
- **Focus:** Risk assessment, coverage plan, execution order, quality gates

**Key Insight: TEA Works Standalone OR Integrated**

**Standalone (No BMad artifacts):**

- User provides PRD + ADR → System-Level Mode
- User provides Epic description → Epic-Level Mode
- TEA doesn't mandate full BMad workflow

**BMad-Integrated (Full workflow):**

- BMad creates `sprint-status.yaml` → Automatic Epic-Level detection
- BMad creates PRD, ADR, architecture.md → Automatic System-Level detection
- TEA leverages BMad artifacts for richer context

**Message to User:**

> You don't need to follow full BMad methodology to use TEA test-design.
> Just provide PRD + ADR for system-level, or Epic for epic-level.
> TEA will auto-detect and produce appropriate documents.

**Halt Condition:** If mode cannot be determined AND user intent unclear AND required files missing, HALT and notify user:

- "Please provide either: (A) PRD + ADR for system-level test design, OR (B) Epic + Stories for epic-level test design"

---

## Step 1: Load Context (Mode-Aware)

**Mode-Specific Loading:**

### System-Level Mode (Phase 3)

1. **Read Architecture Documentation**
   - Load architecture.md or tech-spec (REQUIRED)
   - Load PRD.md for functional and non-functional requirements
   - Load epics.md for feature scope
   - Identify technology stack decisions (frameworks, databases, deployment targets)
   - Note integration points and external system dependencies
   - Extract NFR requirements (performance SLOs, security requirements, etc.)

2. **Check Playwright Utils Flag**

   Read `{config_source}` and check `config.tea_use_playwright_utils`.

   If true, note that `@seontechnologies/playwright-utils` provides utilities for test implementation. Reference in test design where relevant.

3. **Load Knowledge Base Fragments (System-Level)**

   **Critical:** Consult `src/bmm/testarch/tea-index.csv` to load:
   - `adr-quality-readiness-checklist.md` - 8-category 29-criteria NFR framework (testability, security, scalability, DR, QoS, deployability, etc.)
   - `test-levels-framework.md` - Test levels strategy guidance
   - `risk-governance.md` - Testability risk identification
   - `test-quality.md` - Quality standards and Definition of Done

4. **Analyze Existing Test Setup (if brownfield)**
   - Search for existing test directories
   - Identify current test framework (if any)
   - Note testability concerns in existing codebase

### Epic-Level Mode (Phase 4)

1. **Read Requirements Documentation**
   - Load PRD.md for high-level product requirements
   - Read epics.md or specific epic for feature scope
   - Read story markdown for detailed acceptance criteria
   - Identify all testable requirements

2. **Load Architecture Context**
   - Read architecture.md for system design
   - Read tech-spec for implementation details
   - Read test-design-architecture.md and test-design-qa.md (if exist from Phase 3 system-level test design)
   - Identify technical constraints and dependencies
   - Note integration points and external systems

3. **Analyze Existing Test Coverage**
   - Search for existing test files in `{test_dir}`
   - Identify coverage gaps
   - Note areas with insufficient testing
   - Check for flaky or outdated tests

4. **Load Knowledge Base Fragments (Epic-Level)**

   **Critical:** Consult `src/bmm/testarch/tea-index.csv` to load:
   - `risk-governance.md` - Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS), automated scoring, gate decision engine, owner tracking (625 lines, 4 examples)
   - `probability-impact.md` - Risk scoring methodology (probability × impact matrix, automated classification, dynamic re-assessment, gate integration, 604 lines, 4 examples)
   - `test-levels-framework.md` - Test level selection guidance (E2E vs API vs Component vs Unit with decision matrix, characteristics, when to use each, 467 lines, 4 examples)
   - `test-priorities-matrix.md` - P0-P3 prioritization criteria (automated priority calculation, risk-based mapping, tagging strategy, time budgets, 389 lines, 2 examples)

**Halt Condition (Epic-Level only):** If story data or acceptance criteria are missing, check if brownfield exploration is needed. If neither requirements NOR exploration possible, HALT with message: "Epic-level test design requires clear requirements, acceptance criteria, or brownfield app URL for exploration"

---

## Step 1.5: System-Level Testability Review (Phase 3 Only)

**Skip this step if Epic-Level Mode.** This step only executes in System-Level Mode.

### Actions

1. **Review Architecture for Testability**

   **STRUCTURE PRINCIPLE: CONCERNS FIRST, PASSING ITEMS LAST**

   Evaluate architecture against these criteria and structure output as:
   1. **Testability Concerns** (ACTIONABLE - what's broken/missing)
   2. **Testability Assessment Summary** (FYI - what works well)

   **Testability Criteria:**

   **Controllability:**
   - Can we control system state for testing? (API seeding, factories, database reset)
   - Are external dependencies mockable? (interfaces, dependency injection)
   - Can we trigger error conditions? (chaos engineering, fault injection)

   **Observability:**
   - Can we inspect system state? (logging, metrics, traces)
   - Are test results deterministic? (no race conditions, clear success/failure)
   - Can we validate NFRs? (performance metrics, security audit logs)

   **Reliability:**
   - Are tests isolated? (parallel-safe, stateless, cleanup discipline)
   - Can we reproduce failures? (deterministic waits, HAR capture, seed data)
   - Are components loosely coupled? (mockable, testable boundaries)

   **In Architecture Doc Output:**
   - **Section A: Testability Concerns** (TOP) - List what's BROKEN or MISSING
     - Example: "No API for test data seeding → Cannot parallelize tests"
     - Example: "Hardcoded DB connection → Cannot test in CI"
   - **Section B: Testability Assessment Summary** (BOTTOM) - List what PASSES
     - Example: "✅ API-first design supports test isolation"
     - Only include if worth mentioning; otherwise omit this section entirely

2. **Identify Architecturally Significant Requirements (ASRs)**

   **CRITICAL: ASRs must indicate if ACTIONABLE or FYI**

   From PRD NFRs and architecture decisions, identify quality requirements that:
   - Drive architecture decisions (e.g., "Must handle 10K concurrent users" → caching architecture)
   - Pose testability challenges (e.g., "Sub-second response time" → performance test infrastructure)
   - Require special test environments (e.g., "Multi-region deployment" → regional test instances)

   Score each ASR using risk matrix (probability × impact).

   **In Architecture Doc, categorize ASRs:**
   - **ACTIONABLE ASRs** (require architecture changes): Include in "Quick Guide" 🚨 or ⚠️ sections
   - **FYI ASRs** (already satisfied by architecture): Include in "Quick Guide" 📋 section OR omit if obvious

   **Example:**
   - ASR-001 (Score 9): "Multi-region deployment requires region-specific test infrastructure" → **ACTIONABLE** (goes in 🚨 BLOCKERS)
   - ASR-002 (Score 4): "OAuth 2.1 authentication already implemented in ADR-5" → **FYI** (goes in 📋 INFO ONLY or omit)

   **Structure Principle:** Actionable ASRs at TOP, FYI ASRs at BOTTOM (or omit)

3. **Define Test Levels Strategy (Language-Aware)**

   Based on architecture (mobile, web, API, microservices, monolith) AND language profile:

   **Test Level Split Recommendations:**
   - API-heavy backends: 70/20/10 (unit/integration/E2E)
   - UI-heavy frontends: 40/30/30 (unit/component/E2E)
   - Full-stack applications: 50/30/20 (unit/integration/E2E)

   **Framework Recommendations by Language:**

   | Language          | Unit Tests   | Integration/API   | E2E (Web)            | E2E (Mobile)     | Performance     |
   | ----------------- | ------------ | ----------------- | -------------------- | ---------------- | --------------- |
   | **TypeScript/JS** | Vitest, Jest | Playwright API    | Playwright           | Detox, Appium    | k6, Artillery   |
   | **Python**        | pytest       | pytest + requests | pytest-playwright    | Appium           | Locust, k6      |
   | **Go**            | go-test      | go-test + testify | rod, chromedp        | gomobile         | k6, hey         |
   | **Rust**          | cargo-test   | cargo-test        | headless-chrome      | --               | criterion       |
   | **Java/Kotlin**   | JUnit 5      | RestAssured       | Selenium, Playwright | Espresso, Appium | Gatling, JMeter |
   | **C#/.NET**       | xUnit, NUnit | RestSharp         | Playwright           | Xamarin.UITest   | NBomber         |

   **If language profile exists:** Use `language_profile.test_framework.detected` as primary recommendation.

   **Test Environment Needs:**
   - Local: Docker Compose, test containers
   - Staging: Ephemeral environments, feature branches
   - Production-like: Scaled infrastructure, realistic data

   **In Architecture doc:** Only mention test level split if it's an ACTIONABLE concern
   - Example: "API response time <100ms requires load testing infrastructure" (concern)
   - DO NOT include full test level strategy table in Architecture doc

4. **Assess NFR Requirements (MINIMAL in Architecture Doc)**

   **CRITICAL: NFR testing approach is a RECIPE - belongs in QA doc ONLY**

   **In Architecture Doc:**
   - Only mention NFRs if they create testability CONCERNS
   - Focus on WHAT architecture must provide, not HOW to test
   - Keep it brief - 1-2 sentences per NFR category at most

   **Example - Security NFR in Architecture doc (if there's a concern):**
   ✅ CORRECT (concern-focused, brief, WHAT/WHY only):
   - "System must prevent cross-customer data access (GDPR requirement). Requires test infrastructure for multi-tenant isolation in Sprint 0."
   - "OAuth tokens must expire after 1 hour (ADR-5). Requires test harness for token expiration validation."

   ❌ INCORRECT (too detailed, belongs in QA doc):
   - Full table of security test scenarios
   - Test scripts with code examples
   - Detailed test procedures
   - Tool selection (e.g., "use Playwright E2E + OWASP ZAP")
   - Specific test approaches (e.g., "Test approach: Playwright E2E for auth/authz")

   **In QA Doc (full NFR testing approach):**
   - **Security**: Full test scenarios, tooling (Playwright + OWASP ZAP), test procedures
   - **Performance**: Load/stress/spike test scenarios, k6 scripts, SLO thresholds
   - **Reliability**: Error handling tests, retry logic validation, circuit breaker tests
   - **Maintainability**: Coverage targets, code quality gates, observability validation

   **Rule of Thumb:**
   - Architecture doc: "What NFRs exist and what concerns they create" (1-2 sentences)
   - QA doc: "How to test those NFRs" (full sections with tables, code, procedures)

5. **Flag Testability Concerns**

   Identify architecture decisions that harm testability:
   - ❌ Tight coupling (no interfaces, hard dependencies)
   - ❌ No dependency injection (can't mock external services)
   - ❌ Hardcoded configurations (can't test different envs)
   - ❌ Missing observability (can't validate NFRs)
   - ❌ Stateful designs (can't parallelize tests)

   **Critical:** If testability concerns are blockers (e.g., "Architecture makes performance testing impossible"), document as CONCERNS or FAIL recommendation for gate check.

6. **Output System-Level Test Design (TWO Documents)**

   **IMPORTANT:** System-level mode produces TWO documents instead of one:

   **Document 1: test-design-architecture.md** (for Architecture/Dev teams)
   - Purpose: Architectural concerns, testability gaps, NFR requirements
   - Audience: Architects, Backend Devs, Frontend Devs, DevOps, Security Engineers
   - Focus: What architecture must deliver for testability
   - Template: `test-design-architecture-template.md`

   **Document 2: test-design-qa.md** (for QA team)
   - Purpose: Test execution recipe, coverage plan, Sprint 0 setup
   - Audience: QA Engineers, Test Automation Engineers, QA Leads
   - Focus: How QA will execute tests
   - Template: `test-design-qa-template.md`

   **Standard Structures (REQUIRED):**

   **test-design-architecture.md sections (in this order):**

   **STRUCTURE PRINCIPLE: Actionable items FIRST, FYI items LAST**
   1. Executive Summary (scope, business context, architecture, risk summary)
   2. Quick Guide (🚨 BLOCKERS / ⚠️ HIGH PRIORITY / 📋 INFO ONLY)
   3. Risk Assessment (high/medium/low-priority risks with scoring) - **ACTIONABLE**
   4. Testability Concerns and Architectural Gaps - **ACTIONABLE** (what arch team must do)
      - Sub-section: Blockers to Fast Feedback (ACTIONABLE - concerns FIRST)
      - Sub-section: Architectural Improvements Needed (ACTIONABLE)
      - Sub-section: Testability Assessment Summary (FYI - passing items LAST, only if worth mentioning)
   5. Risk Mitigation Plans (detailed for high-priority risks ≥6) - **ACTIONABLE**
   6. Assumptions and Dependencies - **FYI**

   **SECTIONS THAT DO NOT BELONG IN ARCHITECTURE DOC:**
   - ❌ Test Levels Strategy (unit/integration/E2E split) - This is a RECIPE, belongs in QA doc ONLY
   - ❌ NFR Testing Approach with test examples - This is a RECIPE, belongs in QA doc ONLY
   - ❌ Test Environment Requirements - This is a RECIPE, belongs in QA doc ONLY
   - ❌ Recommendations for Sprint 0 (test framework setup, factories) - This is a RECIPE, belongs in QA doc ONLY
   - ❌ Quality Gate Criteria (pass rates, coverage targets) - This is a RECIPE, belongs in QA doc ONLY
   - ❌ Tool Selection (Playwright, k6, etc.) - This is a RECIPE, belongs in QA doc ONLY

   **WHAT BELONGS IN ARCHITECTURE DOC:**
   - ✅ Testability CONCERNS (what makes it hard to test)
   - ✅ Architecture GAPS (what's missing for testability)
   - ✅ What architecture team must DO (blockers, improvements)
   - ✅ Risks and mitigation plans
   - ✅ ASRs (Architecturally Significant Requirements) - but clarify if FYI or actionable

   **test-design-qa.md sections (in this order):**
   1. Executive Summary (risk summary, coverage summary)
   2. **Dependencies & Test Blockers** (CRITICAL: RIGHT AFTER SUMMARY - what QA needs from other teams)
   3. Risk Assessment (scored risks with categories - reference Arch doc, don't duplicate)
   4. Test Coverage Plan (P0/P1/P2/P3 with detailed scenarios + checkboxes)
   5. **Execution Strategy** (SIMPLE: Organized by TOOL TYPE: PR (Playwright) / Nightly (k6) / Weekly (chaos/manual))
   6. QA Effort Estimate (QA effort ONLY - no DevOps, Data Eng, Finance, Backend)
   7. Appendices (code examples with playwright-utils, tagging strategy, knowledge base refs)

   **SECTIONS TO EXCLUDE FROM QA DOC:**
   - ❌ Quality Gate Criteria (pass/fail thresholds - teams decide for themselves)
   - ❌ Follow-on Workflows (bloat - BMAD commands are self-explanatory)
   - ❌ Approval section (unnecessary formality)
   - ❌ Test Environment Requirements (remove as separate section - integrate into Dependencies if needed)
   - ❌ NFR Readiness Summary (bloat - covered in Risk Assessment)
   - ❌ Testability Assessment (bloat - covered in Dependencies)
   - ❌ Test Levels Strategy (bloat - obvious from test scenarios)
   - ❌ Sprint breakdowns (too prescriptive)
   - ❌ Infrastructure/DevOps/Data Eng effort tables (out of scope)
   - ❌ Mitigation plans for non-QA work (belongs in Arch doc)

   **Content Guidelines:**

   **Architecture doc (DO):**
   - ✅ Risk scoring visible (Probability × Impact = Score)
   - ✅ Clear ownership (each blocker/ASR has owner + timeline)
   - ✅ Testability requirements (what architecture must support)
   - ✅ Mitigation plans (for each high-risk item ≥6)
   - ✅ Brief conceptual examples ONLY if needed to clarify architecture concerns (5-10 lines max)
   - ✅ **Target length**: ~150-200 lines max (focus on actionable concerns only)
   - ✅ **Professional tone**: Avoid AI slop (excessive ✅/❌ emojis, "absolutely", "excellent", overly enthusiastic language)

   **Architecture doc (DON'T) - CRITICAL:**
   - ❌ NO test scripts or test implementation code AT ALL - This is a communication doc for architects, not a testing guide
   - ❌ NO Playwright test examples (e.g., test('...', async ({ request }) => ...))
   - ❌ NO assertion logic (e.g., expect(...).toBe(...))
   - ❌ NO test scenario checklists with checkboxes (belongs in QA doc)
   - ❌ NO implementation details about HOW QA will test
   - ❌ Focus on CONCERNS, not IMPLEMENTATION

   **QA doc (DO):**
   - ✅ Test scenario recipes (clear P0/P1/P2/P3 with checkboxes)
   - ✅ Full test implementation code samples when helpful
   - ✅ **IMPORTANT: If config.tea_use_playwright_utils is true, ALL code samples MUST use @seontechnologies/playwright-utils fixtures and utilities**
   - ✅ Import test fixtures from '@seontechnologies/playwright-utils/api-request/fixtures'
   - ✅ Import expect from '@playwright/test' (playwright-utils does not re-export expect)
   - ✅ Use apiRequest fixture with schema validation, retry logic, and structured responses
   - ✅ Dependencies & Test Blockers section RIGHT AFTER Executive Summary (what QA needs from other teams)
   - ✅ **QA effort estimates ONLY** (no DevOps, Data Eng, Finance, Backend effort - out of scope)
   - ✅ Cross-references to Architecture doc (not duplication)
   - ✅ **Professional tone**: Avoid AI slop (excessive ✅/❌ emojis, "absolutely", "excellent", overly enthusiastic language)

   **QA doc (DON'T):**
   - ❌ NO architectural theory (just reference Architecture doc)
   - ❌ NO ASR explanations (link to Architecture doc instead)
   - ❌ NO duplicate risk assessments (reference Architecture doc)
   - ❌ NO Quality Gate Criteria section (teams decide pass/fail thresholds for themselves)
   - ❌ NO Follow-on Workflows section (bloat - BMAD commands are self-explanatory)
   - ❌ NO Approval section (unnecessary formality)
   - ❌ NO effort estimates for other teams (DevOps, Backend, Data Eng, Finance - out of scope, QA effort only)
   - ❌ NO Sprint breakdowns (too prescriptive - e.g., "Sprint 0: 40 hours, Sprint 1: 48 hours")
   - ❌ NO mitigation plans for Backend/Arch/DevOps work (those belong in Architecture doc)
   - ❌ NO architectural assumptions or debates (those belong in Architecture doc)

   **Anti-Patterns to Avoid (Cross-Document Redundancy):**

   **CRITICAL: NO BLOAT, NO REPETITION, NO OVERINFO**

   ❌ **DON'T duplicate OAuth requirements:**
   - Architecture doc: Explain OAuth 2.1 flow in detail
   - QA doc: Re-explain why OAuth 2.1 is required

   ✅ **DO cross-reference instead:**
   - Architecture doc: "ASR-1: OAuth 2.1 required (see QA doc for 12 test scenarios)"
   - QA doc: "OAuth tests: 12 P0 scenarios (see Architecture doc R-001 for risk details)"

   ❌ **DON'T repeat the same note 10+ times:**
   - Example: "Timing is pessimistic until R-005 is fixed" repeated on every P0, P1, P2 section
   - This creates bloat and makes docs hard to read

   ✅ **DO consolidate repeated information:**
   - Write once at the top: "**Note**: All timing estimates are pessimistic pending R-005 resolution"
   - Reference briefly if needed: "(pessimistic timing)"

   ❌ **DON'T include excessive detail that doesn't add value:**
   - Long explanations of obvious concepts
   - Redundant examples showing the same pattern
   - Over-documentation of standard practices

   ✅ **DO focus on what's unique or critical:**
   - Document only what's different from standard practice
   - Highlight critical decisions and risks
   - Keep explanations concise and actionable

   **Markdown Cross-Reference Syntax Examples:**

   ```markdown
   # In test-design-architecture.md

   ### 🚨 R-001: Multi-Tenant Isolation (Score: 9)

   **Test Coverage:** 8 P0 tests (see [QA doc - Multi-Tenant Isolation](test-design-qa.md#multi-tenant-isolation-8-tests-security-critical) for detailed scenarios)

   ---

   # In test-design-qa.md

   ## Testability Assessment

   **Prerequisites from Architecture Doc:**

   - [ ] R-001: Multi-tenant isolation validated (see [Architecture doc R-001](test-design-architecture.md#r-001-multi-tenant-isolation-score-9) for mitigation plan)
   - [ ] R-002: Test customer provisioned (see [Architecture doc 🚨 BLOCKERS](test-design-architecture.md#blockers---team-must-decide-cant-proceed-without))

   ## Sprint 0 Setup Requirements

   **Source:** See [Architecture doc "Quick Guide"](test-design-architecture.md#quick-guide) for detailed mitigation plans
   ```

   **Key Points:**
   - Use relative links: `[Link Text](test-design-qa.md#section-anchor)`
   - Anchor format: lowercase, hyphens for spaces, remove emojis/special chars
   - Example anchor: `### 🚨 R-001: Title` → `#r-001-title`

   ❌ **DON'T put long code examples in Architecture doc:**
   - Example: 50+ lines of test implementation

   ✅ **DO keep examples SHORT in Architecture doc:**
   - Example: 5-10 lines max showing what architecture must support
   - Full implementation goes in QA doc

   ❌ **DON'T repeat same note 10+ times:**
   - Example: "Pessimistic timing until R-005 fixed" on every P0/P1/P2 section

   ✅ **DO consolidate repeated notes:**
   - Single timing note at top
   - Reference briefly throughout: "(pessimistic)"

   **Write Both Documents:**
   - Use `test-design-architecture-template.md` for Architecture doc
   - Use `test-design-qa-template.md` for QA doc
   - Follow standard structures defined above
   - Cross-reference between docs (no duplication)
   - Validate against checklist.md (System-Level Mode section)

**Common Over-Engineering to Avoid:**

**In QA Doc:**

1.  ❌ Quality gate thresholds ("P0 must be 100%, P1 ≥95%") - Let teams decide for themselves
2.  ❌ Effort estimates for other teams - QA doc should only estimate QA effort
3.  ❌ Sprint breakdowns ("Sprint 0: 40 hours, Sprint 1: 48 hours") - Too prescriptive
4.  ❌ Approval sections - Unnecessary formality
5.  ❌ Assumptions about architecture (SLO targets, replication lag) - These are architectural concerns, belong in Arch doc
6.  ❌ Mitigation plans for Backend/Arch/DevOps - Those belong in Arch doc
7.  ❌ Follow-on workflows section - Bloat, BMAD commands are self-explanatory
8.  ❌ NFR Readiness Summary - Bloat, covered in Risk Assessment

**Test Coverage Numbers Reality Check:**

- With Playwright parallelization, running ALL Playwright tests is as fast as running just P0
- Don't split Playwright tests by priority into different CI gates - it adds no value
- Tool type matters, not priority labels
- Defer based on infrastructure cost, not importance

**After System-Level Mode:** Workflow COMPLETE. System-level outputs (test-design-architecture.md + test-design-qa.md) are written in this step. Steps 2-4 are epic-level only - do NOT execute them in system-level mode.

---

## Step 1.6: Exploratory Mode Selection (Epic-Level Only)

### Actions

1. **Detect Planning Mode**

   Determine mode based on context:

   **Requirements-Based Mode (DEFAULT)**:
   - Have clear story/PRD with acceptance criteria
   - Uses: Existing workflow (Steps 2-4)
   - Appropriate for: Documented features, greenfield projects

   **Exploratory Mode (OPTIONAL - Brownfield)**:
   - Missing/incomplete requirements AND brownfield application exists
   - Uses: UI exploration to discover functionality
   - Appropriate for: Undocumented brownfield apps, legacy systems

2. **Requirements-Based Mode (DEFAULT - Skip to Step 2)**

   If requirements are clear:
   - Continue with existing workflow (Step 2: Assess and Classify Risks)
   - Use loaded requirements from Step 1
   - Proceed with risk assessment based on documented requirements

3. **Exploratory Mode (OPTIONAL - Brownfield Apps)**

   If exploring brownfield application:

   **A. Check MCP Availability**

   If config.tea_use_mcp_enhancements is true AND Playwright MCP tools available:
   - Use MCP-assisted exploration (Step 3.B)

   If MCP unavailable OR config.tea_use_mcp_enhancements is false:
   - Use manual exploration fallback (Step 3.C)

   **B. MCP-Assisted Exploration (If MCP Tools Available)**

   Use Playwright MCP browser tools to explore UI:

   **Setup:**

   ```
   1. Use planner_setup_page to initialize browser
   2. Navigate to {exploration_url}
   3. Capture initial state with browser_snapshot
   ```

   **Exploration Process:**

   ```
   4. Use browser_navigate to explore different pages
   5. Use browser_click to interact with buttons, links, forms
   6. Use browser_hover to reveal hidden menus/tooltips
   7. Capture browser_snapshot at each significant state
   8. Take browser_screenshot for documentation
   9. Monitor browser_console_messages for JavaScript errors
   10. Track browser_network_requests to identify API calls
   11. Map user flows and interactive elements
   12. Document discovered functionality
   ```

   **Discovery Documentation:**
   - Create list of discovered features (pages, workflows, forms)
   - Identify user journeys (navigation paths)
   - Map API endpoints (from network requests)
   - Note error states (from console messages)
   - Capture screenshots for visual reference

   **Convert to Test Scenarios:**
   - Transform discoveries into testable requirements
   - Prioritize based on user flow criticality
   - Identify risks from discovered functionality
   - Continue with Step 2 (Assess and Classify Risks) using discovered requirements

   **C. Manual Exploration Fallback (If MCP Unavailable)**

   If Playwright MCP is not available:

   **Notify User:**

   ```markdown
   Exploratory mode enabled but Playwright MCP unavailable.

   **Manual exploration required:**

   1. Open application at: {exploration_url}
   2. Explore all pages, workflows, and features
   3. Document findings in markdown:
      - List of pages/features discovered
      - User journeys identified
      - API endpoints observed (DevTools Network tab)
      - JavaScript errors noted (DevTools Console)
      - Critical workflows mapped

   4. Provide exploration findings to continue workflow

   **Alternative:** Disable exploratory_mode and provide requirements documentation
   ```

   Wait for user to provide exploration findings, then:
   - Parse user-provided discovery documentation
   - Convert to testable requirements
   - Continue with Step 2 (risk assessment)

4. **Proceed to Risk Assessment**

   After mode selection (Requirements-Based OR Exploratory):
   - Continue to Step 2: Assess and Classify Risks
   - Use requirements from documentation (Requirements-Based) OR discoveries (Exploratory)

---

## Step 2: Assess and Classify Risks

### Actions

1. **Identify Genuine Risks**

   Filter requirements to isolate actual risks (not just features):
   - Unresolved technical gaps
   - Security vulnerabilities
   - Performance bottlenecks
   - Data loss or corruption potential
   - Business impact failures
   - Operational deployment issues

2. **Classify Risks by Category**

   Use these standard risk categories:

   **TECH** (Technical/Architecture):
   - Architecture flaws
   - Integration failures
   - Scalability issues
   - Technical debt

   **SEC** (Security):
   - Missing access controls
   - Authentication bypass
   - Data exposure
   - Injection vulnerabilities

   **PERF** (Performance):
   - SLA violations
   - Response time degradation
   - Resource exhaustion
   - Scalability limits

   **DATA** (Data Integrity):
   - Data loss
   - Data corruption
   - Inconsistent state
   - Migration failures

   **BUS** (Business Impact):
   - User experience degradation
   - Business logic errors
   - Revenue impact
   - Compliance violations

   **OPS** (Operations):
   - Deployment failures
   - Configuration errors
   - Monitoring gaps
   - Rollback issues

3. **Score Risk Probability**

   Rate likelihood (1-3):
   - **1 (Unlikely)**: <10% chance, edge case
   - **2 (Possible)**: 10-50% chance, known scenario
   - **3 (Likely)**: >50% chance, common occurrence

4. **Score Risk Impact**

   Rate severity (1-3):
   - **1 (Minor)**: Cosmetic, workaround exists, limited users
   - **2 (Degraded)**: Feature impaired, workaround difficult, affects many users
   - **3 (Critical)**: System failure, data loss, no workaround, blocks usage

5. **Calculate Risk Score**

   ```
   Risk Score = Probability × Impact

   Scores:
   1-2: Low risk (monitor)
   3-4: Medium risk (plan mitigation)
   6-9: High risk (immediate mitigation required)
   ```

6. **Highlight High-Priority Risks**

   Flag all risks with score ≥6 for immediate attention.

7. **Request Clarification**

   If evidence is missing or assumptions required:
   - Document assumptions clearly
   - Request user clarification
   - Do NOT speculate on business impact

8. **Plan Mitigations**

   **CRITICAL: Mitigation placement depends on WHO does the work**

   For each high-priority risk:
   - Define mitigation strategy
   - Assign owner (dev, QA, ops)
   - Set timeline
   - Update residual risk expectation

   **Mitigation Plan Placement:**

   **Architecture Doc:**
   - Mitigations owned by Backend, DevOps, Architecture, Security, Data Eng
   - Example: "Add authorization layer for customer-scoped access" (Backend work)
   - Example: "Configure AWS Fault Injection Simulator" (DevOps work)
   - Example: "Define CloudWatch log schema for backfill events" (Architecture work)

   **QA Doc:**
   - Mitigations owned by QA (test development work)
   - Example: "Create factories for test data with randomization" (QA work)
   - Example: "Implement polling with retry for async validation" (QA test code)
   - Brief reference to Architecture doc mitigations (don't duplicate)

   **Rule of Thumb:**
   - If mitigation requires production code changes → Architecture doc
   - If mitigation is test infrastructure/code → QA doc
   - If mitigation involves multiple teams → Architecture doc with QA validation approach

   **Assumptions Placement:**

   **Architecture Doc:**
   - Architectural assumptions (SLO targets, replication lag, system design assumptions)
   - Example: "P95 <500ms inferred from <2s timeout (requires Product approval)"
   - Example: "Multi-region replication lag <1s assumed (ADR doesn't specify SLA)"
   - Example: "Recent Cache hit ratio >80% assumed (not in PRD/ADR)"

   **QA Doc:**
   - Test execution assumptions (test infrastructure readiness, test data availability)
   - Example: "Assumes test factories already created"
   - Example: "Assumes CI/CD pipeline configured"
   - Brief reference to Architecture doc for architectural assumptions

   **Rule of Thumb:**
   - If assumption is about system architecture/design → Architecture doc
   - If assumption is about test infrastructure/execution → QA doc

---

## Step 3: Design Test Coverage

### Actions

1. **Break Down Acceptance Criteria**

   Convert each acceptance criterion into atomic test scenarios:
   - One scenario per testable behavior
   - Scenarios are independent
   - Scenarios are repeatable
   - Scenarios tie back to risk mitigations

2. **Select Appropriate Test Levels**

   **Knowledge Base Reference**: `test-levels-framework.md`

   Map requirements to optimal test levels (avoid duplication):

   **E2E (End-to-End)**:
   - Critical user journeys
   - Multi-system integration
   - Production-like environment
   - Highest confidence, slowest execution

   **API (Integration)**:
   - Service contracts
   - Business logic validation
   - Fast feedback
   - Good for complex scenarios

   **Component**:
   - UI component behavior
   - Interaction testing
   - Visual regression
   - Fast, isolated

   **Unit**:
   - Business logic
   - Edge cases
   - Error handling
   - Fastest, most granular

   **Avoid duplicate coverage**: Don't test same behavior at multiple levels unless necessary.

3. **Assign Priority Levels**

   **CRITICAL: P0/P1/P2/P3 indicates priority and risk level, NOT execution timing**

   **Knowledge Base Reference**: `test-priorities-matrix.md`

   **P0 (Critical)**:
   - Blocks core user journey
   - High-risk areas (score ≥6)
   - Revenue-impacting
   - Security-critical
   - No workaround exists
   - Affects majority of users

   **P1 (High)**:
   - Important user features
   - Medium-risk areas (score 3-4)
   - Common workflows
   - Workaround exists but difficult

   **P2 (Medium)**:
   - Secondary features
   - Low-risk areas (score 1-2)
   - Edge cases
   - Regression prevention

   **P3 (Low)**:
   - Nice-to-have
   - Exploratory
   - Performance benchmarks
   - Documentation validation

   **NOTE:** Priority classification is separate from execution timing. A P1 test might run in PRs if it's fast, or nightly if it requires expensive infrastructure (e.g., k6 performance test). See "Execution Strategy" section for timing guidance.

4. **Outline Data and Tooling Prerequisites**

   For each test scenario, identify:
   - Test data requirements (factories, fixtures)
   - External services (mocks, stubs)
   - Environment setup
   - Tools and dependencies

5. **Define Execution Strategy** (Keep It Simple)

   **IMPORTANT: Avoid over-engineering execution order**

   **Default Philosophy:**
   - Run **everything** in PRs if total duration <15 minutes
   - Playwright is fast with parallelization (100s of tests in ~10-15 min)
   - Only defer to nightly/weekly if there's significant overhead:
     - Performance tests (k6, load testing) - expensive infrastructure
     - Chaos engineering - requires special setup (AWS FIS)
     - Long-running tests - endurance (4+ hours), disaster recovery
     - Manual tests - require human intervention

   **Simple Execution Strategy (Organized by TOOL TYPE):**

   ```markdown
   ## Execution Strategy

   **Philosophy**: Run everything in PRs unless significant infrastructure overhead.
   Playwright with parallelization is extremely fast (100s of tests in ~10-15 min).

   **Organized by TOOL TYPE:**

   ### Every PR: Playwright Tests (~10-15 min)

   All functional tests (from any priority level):

   - All E2E, API, integration, unit tests using Playwright
   - Parallelized across {N} shards
   - Total: ~{N} tests (includes P0, P1, P2, P3)

   ### Nightly: k6 Performance Tests (~30-60 min)

   All performance tests (from any priority level):

   - Load, stress, spike, endurance
   - Reason: Expensive infrastructure, long-running (10-40 min per test)

   ### Weekly: Chaos & Long-Running (~hours)

   Special infrastructure tests (from any priority level):

   - Multi-region failover, disaster recovery, endurance
   - Reason: Very expensive, very long (4+ hours)
   ```

   **KEY INSIGHT: Organize by TOOL TYPE, not priority**
   - Playwright (fast, cheap) → PR
   - k6 (expensive, long) → Nightly
   - Chaos/Manual (very expensive, very long) → Weekly

   **Avoid:**
   - ❌ Don't organize by priority (smoke → P0 → P1 → P2 → P3)
   - ❌ Don't say "P1 runs on PR to main" (some P1 are Playwright/PR, some are k6/Nightly)
   - ❌ Don't create artificial tiers - organize by tool type and infrastructure overhead

---

## Step 4: Generate Deliverables

### Actions

1. **Create Risk Assessment Matrix**

   Use template structure:

   ```markdown
   | Risk ID | Category | Description | Probability | Impact | Score | Mitigation      |
   | ------- | -------- | ----------- | ----------- | ------ | ----- | --------------- |
   | R-001   | SEC      | Auth bypass | 2           | 3      | 6     | Add authz check |
   ```

2. **Create Coverage Matrix**

   ```markdown
   | Requirement | Test Level | Priority | Risk Link | Test Count | Owner |
   | ----------- | ---------- | -------- | --------- | ---------- | ----- |
   | Login flow  | E2E        | P0       | R-001     | 3          | QA    |
   ```

3. **Document Execution Strategy** (Simple, Not Redundant)

   **IMPORTANT: Keep execution strategy simple and avoid redundancy**

   ```markdown
   ## Execution Strategy

   **Default: Run all functional tests in PRs (~10-15 min)**

   - All Playwright tests (parallelized across 4 shards)
   - Includes E2E, API, integration, unit tests
   - Total: ~{N} tests

   **Nightly: Performance & Infrastructure tests**

   - k6 load/stress/spike tests (~30-60 min)
   - Reason: Expensive infrastructure, long-running

   **Weekly: Chaos & Disaster Recovery**

   - Endurance tests (4+ hours)
   - Multi-region failover (requires AWS FIS)
   - Backup restore validation
   - Reason: Special infrastructure, very long-running
   ```

   **DO NOT:**
   - ❌ Create redundant smoke/P0/P1/P2/P3 tier structure
   - ❌ List all tests again in execution order (already in coverage plan)
   - ❌ Split tests by priority unless there's infrastructure overhead

4. **Include Resource Estimates**

   **IMPORTANT: Use intervals/ranges, not exact numbers**

   Provide rough estimates with intervals to avoid false precision:

   ```markdown
   ### Test Effort Estimates

   - P0 scenarios: 15 tests (~1.5-2.5 hours each) = **~25-40 hours**
   - P1 scenarios: 25 tests (~0.75-1.5 hours each) = **~20-35 hours**
   - P2 scenarios: 40 tests (~0.25-0.75 hours each) = **~10-30 hours**
   - **Total:** **~55-105 hours** (~1.5-3 weeks with 1 QA engineer)
   ```

   **Why intervals:**
   - Avoids false precision (estimates are never exact)
   - Provides flexibility for complexity variations
   - Accounts for unknowns and dependencies
   - More realistic and less prescriptive

   **Guidelines:**
   - P0 tests: 1.5-2.5 hours each (complex setup, security, performance)
   - P1 tests: 0.75-1.5 hours each (standard integration, API tests)
   - P2 tests: 0.25-0.75 hours each (edge cases, simple validation)
   - P3 tests: 0.1-0.5 hours each (exploratory, documentation)

   **Express totals as:**
   - Hour ranges: "~55-105 hours"
   - Week ranges: "~1.5-3 weeks"
   - Avoid: Exact numbers like "75 hours" or "11 days"

5. **Add Gate Criteria**

   ```markdown
   ### Quality Gate Criteria

   - All P0 tests pass (100%)
   - P1 tests pass rate ≥95%
   - No high-risk (score ≥6) items unmitigated
   - Test coverage ≥80% for critical paths
   ```

6. **Write to Output File**

   Save to `{output_folder}/test-design-epic-{epic_num}.md` using template structure.

---

## Important Notes

### Risk Category Definitions

**TECH** (Technical/Architecture):

- Architecture flaws or technical debt
- Integration complexity
- Scalability concerns

**SEC** (Security):

- Missing security controls
- Authentication/authorization gaps
- Data exposure risks

**PERF** (Performance):

- SLA risk or performance degradation
- Resource constraints
- Scalability bottlenecks

**DATA** (Data Integrity):

- Data loss or corruption potential
- State consistency issues
- Migration risks

**BUS** (Business Impact):

- User experience harm
- Business logic errors
- Revenue or compliance impact

**OPS** (Operations):

- Deployment or runtime failures
- Configuration issues
- Monitoring/observability gaps

### Risk Scoring Methodology

**Probability × Impact = Risk Score**

Examples:

- High likelihood (3) × Critical impact (3) = **Score 9** (highest priority)
- Possible (2) × Critical (3) = **Score 6** (high priority threshold)
- Unlikely (1) × Minor (1) = **Score 1** (low priority)

**Threshold**: Scores ≥6 require immediate mitigation.

### Test Level Selection Strategy

**Avoid duplication:**

- Don't test same behavior at E2E and API level
- Use E2E for critical paths only
- Use API tests for complex business logic
- Use unit tests for edge cases

**Tradeoffs:**

- E2E: High confidence, slow execution, brittle
- API: Good balance, fast, stable
- Unit: Fastest feedback, narrow scope

### Priority Assignment Guidelines

**P0 criteria** (all must be true):

- Blocks core functionality
- High-risk (score ≥6)
- No workaround exists
- Affects majority of users

**P1 criteria**:

- Important feature
- Medium risk (score 3-5)
- Workaround exists but difficult

**P2/P3**: Everything else, prioritized by value

### Knowledge Base Integration

**Core Fragments (Auto-loaded in Step 1):**

- `risk-governance.md` - Risk classification (6 categories), automated scoring, gate decision engine, coverage traceability, owner tracking (625 lines, 4 examples)
- `probability-impact.md` - Probability × impact matrix, automated classification thresholds, dynamic re-assessment, gate integration (604 lines, 4 examples)
- `test-levels-framework.md` - E2E vs API vs Component vs Unit decision framework with characteristics matrix (467 lines, 4 examples)
- `test-priorities-matrix.md` - P0-P3 automated priority calculation, risk-based mapping, tagging strategy, time budgets (389 lines, 2 examples)

**Reference for Test Planning:**

- `selective-testing.md` - Execution strategy: tag-based, spec filters, diff-based selection, promotion rules (727 lines, 4 examples)
- `fixture-architecture.md` - Data setup patterns: pure function → fixture → mergeTests, auto-cleanup (406 lines, 5 examples)

**Manual Reference (Optional):**

- Use `tea-index.csv` to find additional specialized fragments as needed

### Evidence-Based Assessment

**Critical principle:** Base risk assessment on evidence, not speculation.

**Evidence sources:**

- PRD and user research
- Architecture documentation
- Historical bug data
- User feedback
- Security audit results

**Avoid:**

- Guessing business impact
- Assuming user behavior
- Inventing requirements

**When uncertain:** Document assumptions and request clarification from user.

---

## Output Summary

After completing this workflow, provide a summary:

```markdown
## Test Design Complete

**Epic**: {epic_num}
**Scope**: {design_level}

**Risk Assessment**:

- Total risks identified: {count}
- High-priority risks (≥6): {high_count}
- Categories: {categories}

**Coverage Plan**:

- P0 scenarios: {p0_count} ({p0_hours} hours)
- P1 scenarios: {p1_count} ({p1_hours} hours)
- P2/P3 scenarios: {p2p3_count} ({p2p3_hours} hours)
- **Total effort**: {total_hours} hours (~{total_days} days)

**Test Levels**:

- E2E: {e2e_count}
- API: {api_count}
- Component: {component_count}
- Unit: {unit_count}

**Quality Gate Criteria**:

- P0 pass rate: 100%
- P1 pass rate: ≥95%
- High-risk mitigations: 100%
- Coverage: ≥80%

**Output File**: {output_file}

**Next Steps**:

1. Review risk assessment with team
2. Prioritize mitigation for high-risk items (score ≥6)
3. Run `*atdd` to generate failing tests for P0 scenarios (separate workflow; not auto-run by `*test-design`)
4. Allocate resources per effort estimates
5. Set up test data factories and fixtures
```

---

## Validation

After completing all steps, verify:

- [ ] Risk assessment complete with all categories
- [ ] All risks scored (probability × impact)
- [ ] High-priority risks (≥6) flagged
- [ ] Coverage matrix maps requirements to test levels
- [ ] Priority levels assigned (P0-P3)
- [ ] Execution order defined
- [ ] Resource estimates provided
- [ ] Quality gate criteria defined
- [ ] Output file created and formatted correctly

Refer to `checklist.md` for comprehensive validation criteria.
