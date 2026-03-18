
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/logo-light.svg">
  <img alt="STASH IT" src="docs/logo-dark.svg" width="460">
</picture>

<br>

**Your disk is full of junk. Let's fix that.**

[![npm](https://img.shields.io/badge/npx-stashitnow-f472b6?logo=npm&logoColor=white)](https://www.npmjs.com/package/stashitnow)
[![Node.js](https://img.shields.io/badge/Node.js-≥22-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Quick Start](#quick-start) · [What It Nukes](#what-it-nukes) · [How It Works](#how-it-works) · [Changelog](CHANGELOG.md) · [Contributing](#contributing)

<br>

<img alt="Stash It — CLI Screenshot" src="docs/screenshot.png" width="620">

<br>

</div>

---

## TL;DR

```bash
npx stashitnow
```

That's it. One command. Watch the gigabytes come back.

## Why?

You've got **gigs of crap** sitting on your machine right now:

- `node_modules` caches from 47 abandoned side projects
- Xcode Derived Data from that one time you tried SwiftUI
- iOS Simulators for iOS versions that don't exist anymore
- Docker images you pulled once and forgot about
- Gradle, Maven, CocoaPods, pip — all hoarding downloads

You could hunt them down manually. Or you could just **stash it**.

## Quick Start

```bash
# Just run it. No install needed.
npx stashitnow

# Or install globally if you're a frequent cleaner
npm i -g stashitnow
stashitnow
```

> Requires **Node.js 22+**

## Platforms

| Platform | Categories | Highlights |
|----------|-----------|------------|
| **macOS** | 25 | APFS-aware disk scanning, Xcode/CocoaPods/Swift PM, iOS Simulators |
| **Windows** | 24 | PowerShell-based, NuGet/VS/Edge, Windows Temp cleanup |
| **Linux** | 26 | XDG-aware, APT/Snap/Flatpak, Journal logs, Firefox |

## What It Nukes

### 🟢 Safe — just send it

These are caches. They re-download automatically. Zero risk.

| Target | What's hiding there |
|--------|-------------------|
| **npm / pnpm / Yarn** | Package manager download caches |
| **Homebrew** | Old bottles and logs |
| **pip** | Python package cache |
| **Xcode Derived Data & Archives** | Build artifacts that rebuild on open |
| **TypeScript / Playwright / Electron** | Compiler and browser caches |
| **CocoaPods / Gradle / Maven** | Dependency caches |
| **Cargo / Go / Composer / Ruby Gems** | Language-specific caches |
| **Swift PM** | Swift Package Manager resolved packages |
| **NuGet** | .NET package cache |
| **Docker** | Dangling images, stopped containers, build cache |
| **Chrome / Edge / Firefox** | Browser caches |
| **VS Code / Visual Studio** | Editor caches |
| **APT / Snap / Flatpak** | Linux package manager caches |
| **Journal Logs** | Systemd journal log accumulation |
| **Windows Temp / Trash / Thumbnails** | System caches |

### 🟡 Selective — you pick what goes

These need your attention. Stash shows you what's there, you choose what to axe.

| Target | What you're choosing |
|--------|---------------------|
| **iOS Simulators** | Which simulator devices to delete |
| **Android SDK** | Which platform versions to remove |
| **Android Emulators** | Which AVDs to trash |

### ⚪ Display Only — just so you know

Not touching these. Just showing you the damage.

| Target | Why it's here |
|--------|--------------|
| **Downloads** | You know what's in there. We both know. |
| **Screen Recordings** | That 4GB screen recording from last Tuesday. |
| **Recycle Bin** | What's lurking in there. |

## Features

- **One command** — `npx stashitnow` and you're scanning
- **Smart detection** — only shows tools you actually have installed
- **Cross-platform** — full macOS, Windows, and Linux support
- **APFS-aware** — accurate disk numbers on macOS, not the lies `df` tells
- **Safe by default** — won't delete anything risky without asking
- **Interactive** — pick exactly what to clean with multi-select
- **Quick Clean** — one-click nuke for all safe caches
- **Dev Tools Manager** — manage iOS Simulators, Android SDK & Emulators
- **Action History** — every cleanup is logged with timestamps and freed space
- **Auto-update** — checks for new versions on startup, updates in-place from the menu

## How It Works

```
stashit
├── packages/
│   ├── core/               Types, utilities, logger, updater
│   ├── engine/             Platform detection
│   ├── platform-mac/       macOS (25 categories)
│   ├── platform-windows/   Windows (24 categories)
│   └── platform-linux/     Linux (26 categories)
├── apps/
│   ├── cli/                The interactive CLI
│   └── mcp/                AI assistant integration (coming soon)
└── docs/                   Landing page & assets
```

Every OS implements one interface. The engine picks the right one. The CLI just talks to the engine. Clean separation, works everywhere.

## Contributing

```bash
# Clone it
git clone https://github.com/iamB0ody/stashit.git
cd stashit

# Install
pnpm install

# Run in dev mode
pnpm dev

# Other commands
pnpm build            # Build everything
pnpm typecheck        # Type-check
pnpm test             # Run tests
pnpm lint             # Lint
pnpm format           # Prettier
pnpm graph            # Nx dependency graph
```

### Project Map

| Package | What it does |
|---------|-------------|
| `@stash/core` | Types, interfaces, shared utils, logger, updater |
| `@stash/engine` | Detects your OS, returns the right platform |
| `@stash/platform-mac` | macOS support — 25 scan categories + dev tools |
| `@stash/platform-windows` | Windows support — 24 scan categories + dev tools |
| `@stash/platform-linux` | Linux support — 26 scan categories + dev tools |
| `@stash/cli` | The interactive CLI you see above |
| `@stash/mcp` | MCP server for AI coding assistants (placeholder) |

## Roadmap

- [x] macOS support (25 categories)
- [x] Windows support (24 categories)
- [x] Linux support (26 categories)
- [x] Interactive CLI with Quick Clean & Select Clean
- [x] Dev Tools manager (iOS Sims, Android SDK, AVDs)
- [x] Action history & logging
- [x] Auto-update checker
- [x] `npx stashitnow` — published on npm
- [x] GitHub Pages landing page
- [x] GitHub Releases with changelog
- [ ] MCP server (Claude Code, Cline, Continue, Codex)
- [ ] CI/CD pipeline
- [ ] VSCode extension

## License

MIT — do whatever you want with it.

---

<div align="center">

**Your disk called. It said stash it.**

</div>
