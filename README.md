# RN Debug MCP

> A Model Context Protocol server for real-time React Native performance analysis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

RN Debug MCP provides runtime debugging capabilities for React Native apps through the Model Context Protocol (MCP). It tracks component renders, network calls, and JS thread blocking, providing AI-driven analysis tools accessible via Cursor or other MCP-compatible clients.

## Key Features

- **🚀 Automatic Instrumentation**: Babel plugin automatically tracks component renders without manual code changes.
- **🔍 AI-Powered Insights**: Uses MCP tools to explain performance issues, detect render cascades, and identify slow components.
- **🌐 Network Monitoring**: Intercepts fetch calls to detect duplicates and timing issues.
- **🧵 Thread Tracking**: Monitors the JS thread for blocking operations (>16ms).
- **🛡️ Production Safe**: All instrumentation is disabled or stripped in production builds.

## Documentation

- [Architecture](./docs/architecture.md) - How the system works under the hood.
- [Setup Guide](./docs/setup.md) - How to install and integrate into your project.
- [Tool Reference](./docs/tools.md) - Detailed explanation of available analysis tools.
- [Contributing](./CONTRIBUTING.md) - How to help improve the project.

## Quick Start

### 1. Install dependencies in your React Native app
```bash
npm install @rn-debug-mcp/instrumentation @rn-debug-mcp/babel-plugin --save-dev
```

### 2. Configure Babel
Add `@rn-debug-mcp/babel-plugin` to your `babel.config.js`:
```javascript
module.exports = {
  // ...
  plugins: ['@rn-debug-mcp/babel-plugin'],
};
```

### 3. Initialize in your App
```javascript
import { initDebugMCP } from '@rn-debug-mcp/instrumentation';

if (__DEV__) {
  initDebugMCP({ wsUrl: 'ws://localhost:4567' });
}
```

### 4. Configure Cursor
Add the following to your Cursor MCP settings:
- **Name**: `RN Debug`
- **Type**: `command`
- **Command**: `npx -y @rn-debug-mcp/server`

## Available Analysis Tools

- `explainScreenPerformance`: Comprehensive analysis of a specific screen.
- `detectUnnecessaryRenders`: Identifies components rendering with identical props.
- `detectRenderCascade`: Finds chains of renders triggered in quick succession.
- `getSlowComponents`: Lists components with high average render times.
- `detectDuplicateNetworkCalls`: Identifies redundant API requests.
- `readNativeLogs`: Fetch and filter native logs (Android logcat / iOS simctl).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
