# Stash It — Roadmap

## Overview

This document tracks upcoming features and improvements for Stash It. Items are ordered by priority within each phase.

---

## Phase 1: Foundation (Testing & CI/CD)

Before adding new features, establish a solid foundation with tests and automated pipelines.

### 1.1 Testing Setup

**Framework:** Vitest (fast, native ESM/TypeScript, works well with Nx)

**What to test and where:**

| Layer               | What to test                                                                                                                   | Priority |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `@stash/core`       | `formatBytes()`, `logger` (read/write/clear history), `updater` (mock fetch), type validations                                 | High     |
| `@stash/engine`     | `detectPlatform()` returns correct platform for each OS, `createEngine()` factory                                              | High     |
| `@stash/platform-*` | Category definitions (valid structure, no duplicates, correct risk levels), scanner output parsing, cleaner command generation | High     |
| `@stash/cli`        | `formatBytesSimple()`, `renderDiskBar()`, display formatting functions only                                                    | Low      |
| `@stash/mcp`        | Tool handlers, response formatting (when built)                                                                                | Later    |

**Testing strategy:**

- Unit tests for pure functions and utilities
- Mock `child_process.exec` for commands that touch the filesystem
- Mock `fs` for logger tests
- No need to test interactive prompts (clack) — that's UI glue
- Each package gets its own `vitest.config.ts` and `__tests__/` directory

**Estimated structure:**

```
packages/core/src/__tests__/
  utils.test.ts          # formatBytes, getDirectorySize, isToolAvailable
  logger.test.ts         # logAction, getHistory, clearHistory
  updater.test.ts        # checkForUpdate with mocked fetch

packages/engine/src/__tests__/
  engine.test.ts         # detectPlatform, createEngine

packages/platform-mac/src/__tests__/
  categories.test.ts     # validate category definitions
  scanner.test.ts        # APFS output parsing
  cleaner.test.ts        # clean command generation

packages/platform-windows/src/__tests__/
  categories.test.ts
  scanner.test.ts        # PowerShell output parsing
  cleaner.test.ts

packages/platform-linux/src/__tests__/
  categories.test.ts
  scanner.test.ts
  cleaner.test.ts

apps/cli/src/__tests__/
  display.test.ts        # formatting functions only
```

### 1.2 CI/CD Pipeline

**Current state:** Only a release workflow (tag → GitHub Release). Missing everything else.

**What to add:**

| Workflow               | Trigger             | What it does                                  |
| ---------------------- | ------------------- | --------------------------------------------- |
| **PR Checks**          | Push to PR branches | Typecheck, lint, test, format check           |
| **Test Matrix**        | Same as PR checks   | Run tests on ubuntu, macos, windows (Node 22) |
| **npm Publish**        | Tag push (v\*)      | Build, bundle, publish `stashitnow` to npm    |
| **Release** (existing) | Tag push (v\*)      | Create GitHub Release with changelog notes    |

**File structure:**

```
.github/workflows/
  ci.yml              # PR checks + test matrix
  release.yml         # Existing — GitHub Release
  publish.yml         # npm publish on tag
```

### 1.3 ESLint Setup

- Add `@typescript-eslint` with recommended rules
- Configure Nx to run lint per package
- Make `pnpm lint` actually work (currently a dead script)

---

## Phase 2: MCP Server

Build the MCP (Model Context Protocol) server so AI coding assistants can use Stash It as a tool.

### 2.1 What is the MCP server?

An MCP server exposes Stash It's functionality as tools that AI assistants (Claude Code, Cline, Continue, Codex, etc.) can call. Instead of the user running the CLI manually, the AI can scan and clean on their behalf.

### 2.2 Tools to expose

| Tool                | Description                          | Input           | Output                  |
| ------------------- | ------------------------------------ | --------------- | ----------------------- |
| `scan_storage`      | Scan all categories and return sizes | None            | Array of ScanResult     |
| `scan_category`     | Scan a specific category             | `categoryId`    | ScanResult              |
| `get_disk_overview` | Show disk usage                      | None            | StorageOverview         |
| `clean_safe`        | Clean all safe caches                | `confirm: true` | Array of CleanResult    |
| `clean_category`    | Clean a specific category            | `categoryId`    | CleanResult             |
| `list_categories`   | List all available categories        | None            | Array of Category       |
| `get_history`       | Show cleanup history                 | `limit?`        | Array of ActionLogEntry |

### 2.3 Architecture

```
apps/mcp/src/
  index.ts            # MCP server entry point
  server.ts           # Server setup and tool registration
  handlers/
    scan.ts           # scan_storage, scan_category, get_disk_overview
    clean.ts          # clean_safe, clean_category
    info.ts           # list_categories, get_history
```

### 2.4 Key decisions

- Uses the `@modelcontextprotocol/sdk` package
- Reuses `@stash/engine` — same platform detection and scan/clean logic
- Requires explicit `confirm: true` for any destructive operations
- Returns structured JSON, not formatted text
- Published as part of the `stashitnow` npm package (or separate `stashit-mcp` package — TBD)

### 2.5 Testing

- Test each handler with mocked engine
- Test tool registration and schema validation
- Test error handling (unknown category, scan failure, etc.)

---

## Phase 3: CLI Enhancements

### 3.1 Dry-run mode

```bash
npx stashitnow --dry-run
```

- Scans everything but doesn't delete anything
- Shows exactly what would be cleaned and how much space would be freed
- Builds trust with new users
- Implementation: Add `dryRun` flag to `cleanItem()` and `cleanAllSafe()` in the Platform interface

### 3.2 Non-interactive CLI flags

```bash
# Quick clean without prompts
npx stashitnow --quick --yes

# Scan only, output to stdout (JSON)
npx stashitnow scan --json

# Clean specific categories
npx stashitnow clean npm docker pip

# Show history
npx stashitnow history
```

- Makes Stash It scriptable and usable in CI/cron
- Use `yargs` or `commander` for argument parsing
- Keep the default (no args) as the interactive menu

### 3.3 Config file

```json
// ~/.stashit/config.json
{
  "exclude": ["docker", "downloads"],
  "include": [],
  "autoUpdate": true,
  "historyLimit": 500
}
```

- Let users permanently exclude categories they don't want scanned
- Respect config in both CLI and MCP modes

---

## Phase 4: VSCode Extension

### 4.1 What it does

- Status bar item showing total reclaimable space
- Command palette: "Stash It: Scan", "Stash It: Quick Clean"
- Tree view in sidebar showing categories and sizes
- Notifications when reclaimable space exceeds a threshold

### 4.2 Architecture

- Reuses `@stash/engine` for all scanning/cleaning logic
- VSCode extension API for UI integration
- Published to VS Code Marketplace

### 4.3 Testing

- VSCode extension test runner (`@vscode/test-electron`)
- Unit tests for data transformations
- Integration tests for command handlers

---

## Phase 5: Nice-to-haves

### 5.1 Space-over-time tracking

- Track total freed space per day/week/month
- `npx stashitnow stats` — show trends
- Sparkline chart in terminal

### 5.2 Scheduled cleanup

- `npx stashitnow schedule` — set up a cron/launchd/Task Scheduler job
- Runs quick clean on a schedule (daily/weekly)
- Logs results to history

### 5.3 Plugin system

- Let users add custom categories via config
- Define path, detect command, clean command
- Useful for project-specific caches

---

## Verification checklist

Before each release:

- [ ] All tests pass on macOS, Windows, Linux
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Category counts in README match code
- [ ] npm README, repo README, and landing page are consistent
- [ ] CHANGELOG.md updated
- [ ] Version bumped in apps/stashit/package.json
