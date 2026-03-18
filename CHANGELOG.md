# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-03-18

### Added

- **Linux support** — 23 safe categories (npm, Yarn, pnpm, pip, Gradle, Maven, Cargo, Go, Composer, Ruby Gems, TypeScript, Playwright, Electron, Docker, Chrome, Firefox, Thumbnails, Trash, Journal Logs, APT, Snap, Flatpak, VS Code), 2 selective (Android SDK/AVDs), 1 display-only (Downloads). Supports Ubuntu, Fedora, Arch, Debian, and derivatives.
- **Update checker** — auto-checks for new versions on startup, plus an "Update" option in the menu to update in-place.
- **GitHub Pages** landing page at [stashit](https://iamB0ody.github.io/stashit).
- **GitHub Releases** with automated release workflow.
- **npm README** — the npm package page now shows full documentation.

### Changed

- Updated README to reflect full cross-platform support (macOS, Windows, Linux).
- Updated roadmap to show completed milestones.

## [0.2.1] - 2026-03-18

### Fixed

- Version displayed in CLI now matches the published package version.
- Cleaned bin path in package.json to suppress npm publish warnings.

## [0.2.0] - 2026-03-18

### Added

- **Action logger** — all cleanup operations are now logged to `~/.stashit/history.json` (macOS/Linux) or `%APPDATA%/stashit/history.json` (Windows).
- **History view** — new "History" option in the main menu shows past actions with timestamps, categories, and freed space.
- **Full Windows support** — 20 safe categories (npm, Yarn, pnpm, pip, NuGet, Gradle, Maven, Cargo, Go, Composer, TypeScript, Playwright, Electron, Windows Temp, Docker, Chrome, Edge, Visual Studio, VS Code), 2 selective (Android SDK/AVDs), 2 display-only (Downloads, Recycle Bin). Disk scanning via PowerShell with wmic fallback.
- **6 new macOS categories** — Xcode Archives, Cargo Registry Cache, Go Module Cache, Composer Cache, Ruby Gems Cache, Swift Package Manager Cache (25 total).
- Cross-platform utility support — `getDirectorySize` and `runCommand` now work on Windows via PowerShell.

## [0.1.1] - 2026-03-17

### Fixed

- Minor branding and documentation updates.

## [0.1.0] - 2026-03-17

### Added

- Initial release.
- **macOS support** — 14 safe categories, 3 selective, 2 display-only.
- Interactive CLI with Quick Clean, Select & Clean, and Dev Tools Manager.
- APFS-aware disk scanning for accurate storage numbers.
- iOS Simulator, Android SDK, and Android Emulator management.
- Published as `stashitnow` on npm.
