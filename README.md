![BMad Method](banner-bmad-method.png)

[![Version](https://img.shields.io/npm/v/bmad-fh?color=blue&label=version)](https://www.npmjs.com/package/bmad-fh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/gk8jAdXWmj)

**Breakthrough Method of Agile AI Driven Development** — An AI-driven agile development framework with 21 specialized agents, 50+ guided workflows, and scale-adaptive intelligence that adjusts from bug fixes to enterprise systems.

**100% free and open source.** No paywalls. No gated content. No gated Discord. We believe in empowering everyone, not just those who can pay.

## Why BMad?

Traditional AI tools do the thinking for you, producing average results. BMad agents and facilitated workflow act as expert collaborators who guide you through a structured process to bring out your best thinking in partnership with the AI.

- **AI Intelligent Help**: Brand new for beta - AI assisted help will guide you from the beginning to the end - just ask for `/bmad-help` after you have installed BMad to your project
- **Scale-Domain-Adaptive**: Automatically adjusts planning depth and needs based on project complexity, domain and type - a SaaS Mobile Dating App has different planning needs from a diagnostic medical system, BMad adapts and helps you along the way
- **Structured Workflows**: Grounded in agile best practices across analysis, planning, architecture, and implementation
- **Specialized Agents**: 12+ domain experts (PM, Architect, Developer, UX, Scrum Master, and more)
- **Party Mode**: Bring multiple agent personas into one session to plan, troubleshoot, or discuss your project collaboratively, multiple perspectives with maximum fun
- **Complete Lifecycle**: From brainstorming to deployment, BMad is there with you every step of the way

## Quick Start

**Prerequisites**: [Node.js](https://nodejs.org) v20+

```bash
npx bmad-fh install
```

Follow the installer prompts, then open your AI IDE (Claude Code, Cursor, Windsurf, etc.) in the project folder.

**Non-Interactive Installation**: For CI/CD pipelines or automated deployments, use command-line flags:

```bash
npx bmad-method install --directory /path/to/project --modules bmm --tools claude-code --yes
```

See [Non-Interactive Installation Guide](http://docs.bmad-method.org/how-to/non-interactive-installation/) for all available options.

> **Not sure what to do?** Run `/bmad-help` — it tells you exactly what's next and what's optional. You can also ask it questions like:

- `/bmad-help How should I build a web app for my TShirt Business that can scale to millions?`
- `/bmad-help I just finished the architecture, I am not sure what to do next`

And the amazing thing is BMad Help evolves depending on what modules you install also!

- `/bmad-help Im interested in really exploring creative ways to demo BMad at work, what do you recommend to help plan a great slide deck and compelling narrative?`, and if you have the Creative Intelligence Suite installed, it will offer you different or complimentary advice than if you just have BMad Method Module installed!

The workflows below show the fastest path to working code. You can also load agents directly for a more structured process, extensive planning, or to learn about agile development practices — the agents guide you with menus, explanations, and elicitation at each step.

### Simple Path (Quick Flow)

Bug fixes, small features, clear scope — 3 commands - 1 Optional Agent:

1. `/quick-spec` — analyzes your codebase and produces a tech-spec with stories
2. `/dev-story` — implements each story
3. `/code-review` — validates quality

### Full Planning Path (BMad Method)

Products, platforms, complex features — structured planning then build:

1. `/product-brief` — define problem, users, and MVP scope
2. `/create-prd` — full requirements with personas, metrics, and risks
3. `/create-architecture` — technical decisions and system design
4. `/create-epics-and-stories` — break work into prioritized stories
5. `/sprint-planning` — initialize sprint tracking
6. **Repeat per story:** `/create-story` → `/dev-story` → `/code-review`

Every step tells you what's next. Optional phases (brainstorming, research, UX design) are available when you need them — ask `/bmad-help` anytime. For a detailed walkthrough, see the [Getting Started Tutorial](http://docs.bmad-method.org/tutorials/getting-started/).

## Modules

BMad Method extends with official modules for specialized domains. Modules are available during installation and can be added to your project at any time. After the V6 beta period these will also be available as Plugins and Granular Skills.

| Module                                | GitHub                                                                                                                            | NPM                                                                                                | Purpose                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **BMad Method (BMM)**                 | [fairyhunter13/BMAD-METHOD](https://github.com/fairyhunter13/BMAD-METHOD)                                                         | [bmad-fh](https://www.npmjs.com/package/bmad-fh)                                                   | Core framework with 34+ workflows across 4 development phases         |
| **BMad Builder (BMB)**                | [bmad-code-org/bmad-builder](https://github.com/bmad-code-org/bmad-builder)                                                       | [bmad-builder](https://www.npmjs.com/package/bmad-builder)                                         | Create custom BMad agents, workflows, and domain-specific modules     |
| **Test Architect (TEA)** 🆕           | [bmad-code-org/tea](https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise)                                    | [tea](https://www.npmjs.com/package/bmad-method-test-architecture-enterprise)                      | Risk-based test strategy, automation, and release gates (8 workflows) |
| **Game Dev Studio (BMGD)**            | [bmad-code-org/bmad-module-game-dev-studio](https://github.com/bmad-code-org/bmad-module-game-dev-studio)                         | [bmad-game-dev-studio](https://www.npmjs.com/package/bmad-game-dev-studio)                         | Game development workflows for Unity, Unreal, and Godot               |
| **Creative Intelligence Suite (CIS)** | [bmad-code-org/bmad-module-creative-intelligence-suite](https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite) | [bmad-creative-intelligence-suite](https://www.npmjs.com/package/bmad-creative-intelligence-suite) | Innovation, brainstorming, design thinking, and problem-solving       |

- More modules are coming in the next 2 weeks from BMad Official, and a community marketplace for the installer also will be coming with the final V6 release!

## Testing Agents

BMad provides two testing options to fit your needs:

### Quinn (QA) - Built-in

**Quick test automation for rapid coverage**

- ✅ **Always available** in BMM module (no separate install)
- ✅ **Simple**: One workflow (`QA` - Automate)
- ✅ **Beginner-friendly**: Standard test framework patterns
- ✅ **Fast**: Generate tests and ship

**Use Quinn for:** Small projects, quick coverage, standard patterns

### Test Architect (TEA) - Optional Module

**Enterprise-grade test strategy and quality engineering**

- 🆕 **Standalone module** (install separately)
- 🏗️ **Comprehensive**: 8 workflows covering full test lifecycle
- 🎯 **Advanced**: Risk-based planning, quality gates, NFR assessment
- 📚 **Knowledge-driven**: 34 testing patterns and best practices
- 📖 [Test Architect Documentation](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)

**Use TEA for:** Enterprise projects, test strategy, compliance, release gates

---

## Documentation

**[BMad Documentation](http://docs.bmad-method.org)** — Tutorials, how-to guides, concepts, and reference
**[Test Architect Documentation](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)** — TEA standalone module documentation

- [Getting Started Tutorial](http://docs.bmad-method.org/tutorials/getting-started/)
- [Upgrading from Previous Versions](http://docs.bmad-method.org/how-to/upgrade-to-v6/)
- [Test Architect Migration Guide](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/migration/) — Upgrading from BMM-embedded TEA

### For v4 Users

- **[v4 Documentation](https://github.com/bmad-code-org/BMAD-METHOD/tree/V4/docs)**
- If you need to install V4, you can do this with `npx bmad-fh@4.44.3 install` - similar for any past version.

## Multi-Scope Parallel Development

BMad supports running multiple workflows in parallel across different terminal sessions with isolated artifacts. Perfect for:

- **Multi-team projects** — Each team works in their own scope
- **Parallel feature development** — Develop auth, payments, and catalog simultaneously
- **Microservices** — One scope per service with shared contracts
- **Experimentation** — Create isolated scopes for spikes and prototypes

### Quick Start

```bash
# Initialize scope system
npx bmad-fh scope init

# Create a scope (you'll be prompted to activate it)
npx bmad-fh scope create auth --name "Authentication Service"
# ✓ Scope 'auth' created successfully!
# ? Set 'auth' as your active scope for this session? (Y/n)

# Run workflows - artifacts now go to _bmad-output/auth/
# The active scope is stored in .bmad-scope file

# For parallel development, prefer PARALLEL-SAFE scope selection:
# Terminal 1:
export BMAD_SCOPE=auth
# Terminal 2:
export BMAD_SCOPE=payments
# Or pass inline scope per command/window (recommended): /workflow-prd --scope auth

# Optional: keep .bmad-scope but disable it (workflows ignore it)
npx bmad-fh scope file-disable
# Re-enable later
npx bmad-fh scope file-enable

# Share artifacts between scopes
npx bmad-fh scope sync-up auth       # Promote to shared layer
npx bmad-fh scope sync-down payments # Pull shared updates
```

> **Important:** Workflows only use scoped directories when a scope is active.
> For parallel work, prefer inline `--scope`, conversation `/scope <id>`, or `BMAD_SCOPE` env var.
> `.bmad-scope` is a shared file (NOT parallel-safe) and can be disabled with `npx bmad-fh scope file-disable`.

### CLI Reference

| Command                            | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `npx bmad-fh scope init`           | Initialize the scope system in your project |
| `npx bmad-fh scope list`           | List all scopes (alias: `ls`)               |
| `npx bmad-fh scope create <id>`    | Create a new scope (alias: `new`)           |
| `npx bmad-fh scope info <id>`      | Show scope details (alias: `show`)          |
| `npx bmad-fh scope set [id]`       | Set active scope for session (alias: `use`) |
| `npx bmad-fh scope unset`          | Clear active scope (alias: `clear`)         |
| `npx bmad-fh scope file-disable`   | Disable .bmad-scope without deleting it     |
| `npx bmad-fh scope file-enable`    | Re-enable .bmad-scope for resolution        |
| `npx bmad-fh scope remove <id>`    | Remove a scope (aliases: `rm`, `delete`)    |
| `npx bmad-fh scope archive <id>`   | Archive a completed scope                   |
| `npx bmad-fh scope activate <id>`  | Reactivate an archived scope                |
| `npx bmad-fh scope sync-up <id>`   | Promote artifacts to shared layer           |
| `npx bmad-fh scope sync-down <id>` | Pull shared updates into scope              |
| `npx bmad-fh scope help [cmd]`     | Show help (add command for detailed help)   |

### Create Options

```bash
npx bmad-fh scope create auth \
  --name "Authentication Service" \
  --description "User auth, SSO, and session management" \
  --deps users,notifications \
  --context  # Create scope-specific project-context.md
```

### Directory Structure

After initialization and scope creation:

```
project-root/
├── _bmad/
│   ├── _config/
│   │   └── scopes.yaml          # Scope registry and settings
│   └── _events/
│       ├── event-log.yaml       # Event history
│       └── subscriptions.yaml   # Cross-scope subscriptions
│
├── _bmad-output/
│   ├── _shared/                 # Shared knowledge layer
│   │   ├── project-context.md   # Global project context
│   │   ├── contracts/           # Integration contracts
│   │   └── principles/          # Architecture principles
│   │
│   ├── auth/                    # Auth scope artifacts
│   │   ├── planning-artifacts/
│   │   ├── implementation-artifacts/
│   │   └── tests/
│   │
│   └── payments/                # Payments scope artifacts
│       └── ...
│
└── .bmad-scope                  # Shared active scope marker (gitignored; can be disabled with enabled: false)
```

### Access Model

Scopes follow a "read-any, write-own" isolation model:

| Operation | Own Scope | Other Scopes | \_shared/   |
| --------- | --------- | ------------ | ----------- |
| **Read**  | Allowed   | Allowed      | Allowed     |
| **Write** | Allowed   | Blocked      | via sync-up |

### Workflow Integration

Workflows automatically detect scope context using this **priority order**:

| Priority | Source                    | Parallel-Safe | Example                            |
| -------- | ------------------------- | ------------- | ---------------------------------- |
| 1        | Inline `--scope` flag     | Yes           | `/workflow-prd --scope auth`       |
| 2        | Conversation memory       | Yes           | Earlier `/scope auth` in same chat |
| 3        | `BMAD_SCOPE` env var      | Yes           | `export BMAD_SCOPE=auth`           |
| 4        | `.bmad-scope` file        | **No**        | Set via `scope set auth`           |
| 5        | Prompt user (if required) | Yes           | Interactive selection              |

**For parallel development**, always use inline scope or set scope at conversation start:

```bash
# Parallel-safe: inline scope (recommended)
/workflow-prd --scope auth

# Parallel-safe: set at conversation start
/scope auth
/workflow-prd   # Uses auth from conversation memory

# NOT parallel-safe: shared file (single terminal only)
npx bmad-fh scope set auth

# Disable shared file without deleting it
npx bmad-fh scope file-disable
```

**Scope-aware path variables in workflows:**

- `{scope}` → Scope ID (e.g., "auth")
- `{scope_path}` → `_bmad-output/auth`
- `{scope_planning}` → `_bmad-output/auth/planning-artifacts`
- `{scope_implementation}` → `_bmad-output/auth/implementation-artifacts`
- `{scope_tests}` → `_bmad-output/auth/tests`

### Getting Help

```bash
# Show comprehensive help for all scope commands
npx bmad-fh scope help

# Get detailed help for a specific command
npx bmad-fh scope help create
npx bmad-fh scope help sync-up
```

See [Enhanced Workflow Scoping Guide](docs/enhanced-workflow-scoping-guide.md) for comprehensive technical documentation on parallel-safe scope resolution, architecture, and troubleshooting.

## Community

- [Discord](https://discord.gg/gk8jAdXWmj) — Get help, share ideas, collaborate
- [Subscribe on YouTube](https://www.youtube.com/@BMadCode) — Tutorials, master class, and podcast (launching Feb 2025)
- [GitHub Issues](https://github.com/bmad-code-org/BMAD-METHOD/issues) — Bug reports and feature requests
- [Discussions](https://github.com/bmad-code-org/BMAD-METHOD/discussions) — Community conversations

## Support BMad

BMad is free for everyone — and always will be. If you'd like to support development:

- ⭐ Please click the star project icon near the top right of this page
- ☕ [Buy Me a Coffee](https://buymeacoffee.com/bmad) — Fuel the development
- 🏢 Corporate sponsorship — DM on Discord
- 🎤 Speaking & Media — Available for conferences, podcasts, interviews (BM on Discord)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**BMad** and **BMAD-METHOD** are trademarks of BMad Code, LLC. See [TRADEMARK.md](TRADEMARK.md) for details.

[![Contributors](https://contrib.rocks/image?repo=bmad-code-org/BMAD-METHOD)](https://github.com/bmad-code-org/BMAD-METHOD/graphs/contributors)

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for contributor information.
