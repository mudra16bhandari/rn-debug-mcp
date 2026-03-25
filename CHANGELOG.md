# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-03-25

### Fixed
- Fixed babel plugin falsely instrumenting non-UI element classes (e.g., `NetworkService`) that do not return JSX.
- Fixed a bug where anonymous components explicitly or implicitly exported would throw Babel AST errors during compilation due to undefined `componentName`.
- Removed strict uppercase requirement for tracked components, extending tracking to correctly detect localized lowercase UI nodes seamlessly.

## [1.0.0] - 2026-02-23

### Added
- Initial production release of RN Debug MCP.
- Comprehensive Model Context Protocol support for React Native performance analysis.
- Automatic instrumentation via Babel plugin.
- Real-time render tracking, network monitoring, and JS thread blocking detection.
- Analysis tools: `explainScreenPerformance`, `detectUnnecessaryRenders`, `detectRenderCascade`, `getSlowComponents`, `detectDuplicateNetworkCalls`.
- Unit tests for analysis engine and event collector.
- GitHub Actions CI/CD pipeline.
- Professional documentation suite: Architecture, Setup, and Tool Reference.
- MCP Server structured logging.

### Fixed
- Fixed render check logic to properly identify re-renders.
- Improved WebSocket connection stability with exponential backoff on the client.
- Standardized package metadata across the monorepo.
