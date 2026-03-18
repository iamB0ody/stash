# stashitnow

**Your disk is full of junk. Let's fix that.**

One command to reclaim gigabytes of disk space by cleaning developer caches, build artifacts, and unused tools.

## Install

```bash
# Run directly — no install needed
npx stashitnow

# Or install globally
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

## What it cleans

### Safe (auto-clean, zero risk)

npm, pnpm, Yarn, pip, Homebrew, Xcode Derived Data, Xcode Archives, TypeScript, Playwright, Electron, CocoaPods, Gradle, Maven, Cargo (Rust), Go Modules, Composer (PHP), Ruby Gems, Swift PM, NuGet, Docker, Chrome, Edge, Firefox, VS Code, Visual Studio, Windows Temp, APT Cache, Snap, Flatpak, Journal Logs, Thumbnails, Trash

### Selective (you choose)

iOS Simulators, Android SDK versions, Android Emulators

### Display only (awareness)

Downloads, Screen Recordings, Recycle Bin

## Features

- **One command** — `npx stashitnow` and you're scanning
- **Cross-platform** — macOS, Windows, and Linux
- **Safe by default** — only deletes caches that re-download automatically
- **Interactive** — multi-select what to clean with size previews
- **Quick Clean** — one-click nuke for all safe caches
- **Dev Tools Manager** — manage iOS Simulators, Android SDK & Emulators
- **Action History** — every cleanup is logged with timestamps and freed space
- **Auto-update** — checks for new versions and updates in-place

## Update

```bash
# Update to latest
npm i -g stashitnow@latest

# Or use the built-in updater from the menu
```

## Links

- **Homepage**: [stashit](https://iamB0ody.github.io/stashit)
- **GitHub**: [iamB0ody/stashit](https://github.com/iamB0ody/stashit)
- **Changelog**: [CHANGELOG.md](https://github.com/iamB0ody/stashit/blob/main/CHANGELOG.md)
- **Issues**: [Report a bug](https://github.com/iamB0ody/stashit/issues)

## License

MIT
