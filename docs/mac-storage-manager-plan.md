# Mac Storage Manager - CLI Tool

## Background
Mac devices fill up fast, especially for software engineers. Analysis of a typical Mac Mini (460GB) found ~145GB in ~/Library alone:

| Item | Size | Risk |
|------|------|------|
| Yarn Cache | 17 GB | Safe |
| iOS Simulators | 19 GB | Safe (rebuilds) |
| Xcode Derived Data | 8.4 GB | Safe (rebuilds) |
| Screen Recordings | 22 GB | User review only |
| Android SDK | 25 GB | Partial (select versions) |
| pnpm Cache | 4.9 GB | Safe |
| Homebrew Cache | 3.6 GB | Safe |
| Google/Chrome Cache | 2.9 GB | Safe |
| Playwright Cache | 520 MB | Safe |
| Electron Cache | 418 MB | Safe |
| TypeScript Cache | 380 MB | Safe |
| pip Cache | 371 MB | Safe |
| Downloads | 5.6 GB | User review only |

## What We're Building
A CLI tool for macOS that scans, visualizes, and safely cleans dev-related storage bloat. Built for software engineers but useful for any Mac user.

## Tech Stack
- Node.js + TypeScript
- `chalk` — colored output
- `ora` — spinners for scan/clean progress
- `inquirer` — interactive prompts for selective cleanup
- `cli-table3` — formatted tables for size breakdown

## Features

### 1. Scan & Report
- Disk usage overview (used vs free)
- Category breakdown table with sizes
- Color-coded risk levels: green (safe), yellow (review needed), gray (display only)
- Shows which items exist on the current machine (skips what's not installed)

### 2. Safe Cleanup (Green — one command each)
Items that can be cleaned with no risk. User confirms, then it runs.

| Item | Command |
|------|---------|
| Yarn Cache | `yarn cache clean` |
| pnpm Cache | `pnpm store prune` |
| Homebrew Cache | `brew cleanup --prune=all` |
| pip Cache | `pip cache purge` |
| Xcode Derived Data | `rm -rf ~/Library/Developer/Xcode/DerivedData/*` |
| TypeScript Cache | `rm -rf ~/Library/Caches/typescript/*` |
| Playwright Cache | `rm -rf ~/Library/Caches/ms-playwright/*` |
| Electron Cache | `rm -rf ~/Library/Caches/electron/*` |
| npm Cache | `npm cache clean --force` |
| CocoaPods Cache | `pod cache clean --all` |
| Gradle Cache | `rm -rf ~/.gradle/caches/*` |
| Maven Cache | `rm -rf ~/.m2/repository/*` |
| Docker (dangling) | `docker system prune -f` |

### 3. Selective Cleanup (Yellow — list & pick)
Items where the user chooses what to delete.

| Item | Action |
|------|--------|
| iOS Simulators | List simulators, user picks which to delete (`xcrun simctl delete <id>`) |
| Xcode Platforms | List platforms with sizes, user removes old ones |
| Android SDK versions | List installed versions, user removes unused |
| Android Emulator images | List AVDs with sizes, user deletes unused |

### 4. Display Only (Gray — no delete)
Shown for awareness, no action taken:
- Screen Recordings
- Downloads folder

### 5. CLI Interface

```
Usage: mac-storage-manager [command]

Commands:
  scan          Scan and display storage usage report
  clean         Interactive cleanup — pick what to clean
  clean --all   Clean all safe (green) items with confirmation
  clean <item>  Clean a specific item (e.g., clean yarn)
```

## Architecture

Nx monorepo with pnpm workspaces. Platform-agnostic core with pluggable platform implementations.

```
CLI  ──┐
MCP  ──┤──→  @stash/engine  ──→  @stash/platform-mac
VSC  ──┘                    ──→  @stash/platform-windows
                            ──→  @stash/platform-linux
```

## Project Structure

```
stash/
├── nx.json                          # Nx workspace config
├── package.json                     # Root — scripts, devDeps
├── pnpm-workspace.yaml              # pnpm workspace definition
├── tsconfig.base.json               # Shared TypeScript config
├── tsconfig.json                    # Project references root
├── .editorconfig / .prettierrc      # Code style
├── .nvmrc / .npmrc                  # Environment
│
├── packages/
│   ├── core/                        # @stash/core
│   │   └── src/
│   │       ├── types.ts             # Shared types (Category, ScanResult, etc.)
│   │       ├── platform.ts          # Platform interface (abstract contract)
│   │       ├── utils.ts             # Shared utils (formatBytes, runCommand)
│   │       └── index.ts             # Public API barrel
│   │
│   ├── platform-mac/                # @stash/platform-mac
│   │   └── src/
│   │       ├── categories.ts        # macOS categories (Homebrew, Xcode, etc.)
│   │       ├── scanner.ts           # macOS disk scanning
│   │       ├── cleaner.ts           # macOS cleanup execution
│   │       ├── devtools.ts          # iOS Sims, Android SDK management
│   │       └── index.ts             # MacPlatform class (implements Platform)
│   │
│   ├── platform-windows/            # @stash/platform-windows (placeholder)
│   ├── platform-linux/              # @stash/platform-linux (placeholder)
│   │
│   └── engine/                      # @stash/engine
│       └── src/
│           └── index.ts             # Auto-detects OS, returns correct Platform
│
├── apps/
│   ├── cli/                         # @stash/cli — Interactive TUI
│   │   └── src/
│   │       ├── main.ts              # Entry point, menu loop
│   │       └── display.ts           # Formatted output (tables, boxes)
│   │
│   └── mcp/                         # @stash/mcp — MCP server (placeholder)
│       └── src/
│           └── index.ts
│
└── docs/
    └── mac-storage-manager-plan.md
```

## Tech Stack

- **Monorepo**: Nx + pnpm workspaces + TypeScript project references
- **Runtime**: Node.js 22 LTS, ESM
- **CLI UI**: @clack/prompts, chalk, ora, boxen, figures, log-symbols, cli-table3
- **Platforms**: macOS (implemented), Windows & Linux (placeholders)
- **Channels**: CLI (implemented), MCP server (placeholder)

## Key Design Decisions

1. **Platform abstraction**: Every platform implements the `Platform` interface from `@stash/core`. The engine auto-detects the OS and delegates.
2. **Detection first**: Only show items that exist on the user's machine.
3. **No surprises**: Every destructive action requires explicit confirmation.
4. **User files are sacred**: Screen Recordings, Downloads, etc. are display-only.
5. **Independent cleanup**: Each item cleans on its own. Failure of one doesn't block others.
6. **Re-scan after clean**: Show before/after sizes so user sees the impact.
7. **Channel-agnostic**: Core logic is separate from UI. CLI, MCP, VSCode extensions all use the same engine.

## Implementation Status

- [x] Scaffold Nx monorepo with pnpm workspaces
- [x] Core package — types, platform interface, utils
- [x] macOS platform — categories, scanner, cleaner, devtools
- [x] Engine — auto-detect platform
- [x] CLI app — interactive TUI with clack prompts
- [ ] Windows platform
- [ ] Linux platform
- [ ] MCP server for AI tools
- [ ] VSCode extension
- [ ] Tests
- [ ] CI/CD (GitHub Actions)
- [ ] npm publishing
