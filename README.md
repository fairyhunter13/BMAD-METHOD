![BMad Method](banner-bmad-method.png)

[![Version](https://img.shields.io/npm/v/bmad-fh?color=blue&label=version)](https://www.npmjs.com/package/bmad-fh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/gk8jAdXWmj)

**Breakthrough Method of Agile AI Driven Development** — An AI-driven agile development module for the BMad Method Module Ecosystem, the best and most comprehensive Agile AI Driven Development framework that has true scale-adaptive intelligence that adjusts from bug fixes to enterprise systems.

**100% free and open source.** No paywalls. No gated content. No gated Discord. We believe in empowering everyone, not just those who can pay for a gated community or courses.

## Why the BMad Method?

Traditional AI tools do the thinking for you, producing average results. BMad agents and facilitated workflows act as expert collaborators who guide you through a structured process to bring out your best thinking in partnership with the AI.

- **AI Intelligent Help** — Ask `/bmad-help` anytime for guidance on what's next
- **Scale-Domain-Adaptive** — Automatically adjusts planning depth based on project complexity
- **Structured Workflows** — Grounded in agile best practices across analysis, planning, architecture, and implementation
- **Specialized Agents** — 12+ domain experts (PM, Architect, Developer, UX, Scrum Master, and more)
- **Party Mode** — Bring multiple agent personas into one session to collaborate and discuss
- **Complete Lifecycle** — From brainstorming to deployment

[Learn more at **docs.bmad-method.org**](http://docs.bmad-method.org)

## Quick Start

**Prerequisites**: [Node.js](https://nodejs.org) v20+

```bash
npx bmad-fh install
```

> If you are getting a stale version, use: `npx bmad-fh@latest install`

Follow the installer prompts, then open your AI IDE (Claude Code, Codex, Windsurf, etc.) in your project folder.

**Non-Interactive Installation** (for CI/CD):

```bash
npx bmad-fh install --directory /path/to/project --modules bmm --tools claude-code --yes
```

[See all installation options](http://docs.bmad-method.org/how-to/non-interactive-installation/)

> **Not sure what to do?** Run `/bmad-help` — it tells you exactly what's next and what's optional. You can also ask questions like `/bmad-help I just finished the architecture, what do I do next?`

## Modules

BMad Method extends with official modules for specialized domains. Available during installation or anytime after.

| Module                                                                                                            | Purpose                                           |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **[BMad Method (BMM)](https://github.com/fairyhunter13/BMAD-METHOD)**                                             | Core framework with 34+ workflows                 |
| **[BMad Builder (BMB)](https://github.com/bmad-code-org/bmad-builder)**                                           | Create custom BMad agents and workflows           |
| **[Test Architect (TEA)](https://github.com/bmad-code-org/tea)**                                                  | Risk-based test strategy and automation           |
| **[Game Dev Studio (BMGD)](https://github.com/bmad-code-org/bmad-module-game-dev-studio)**                        | Game development workflows (Unity, Unreal, Godot) |
| **[Creative Intelligence Suite (CIS)](https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite)** | Innovation, brainstorming, design thinking        |

## Documentation

[BMad Method Docs Site](http://docs.bmad-method.org) — Tutorials, guides, concepts, and reference

**Quick links:**

- [Getting Started Tutorial](http://docs.bmad-method.org/tutorials/getting-started/)
- [Upgrading from Previous Versions](http://docs.bmad-method.org/how-to/upgrade-to-v6/)
- [Test Architect Documentation](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)

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

| Operation | Own Scope | Other Scopes | _shared/   |
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
- `{planning_artifacts}` → `_bmad-output/auth/planning-artifacts`
- `{implementation_artifacts}` → `_bmad-output/auth/implementation-artifacts`
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
