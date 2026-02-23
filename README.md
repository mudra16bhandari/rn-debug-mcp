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

### 1. Build the project
```bash
npm install
npm run build
```

### 2. Configure Cursor
Add the following to your Cursor MCP settings:
- Command: `node`
- Args: `["/path/to/rn-debug-mcp/packages/mcp-server/dist/index.js"]`

### 3. Initialize in your RN App
```javascript
import { initDebugMCP } from '@rn-debug-mcp/instrumentation';

if (__DEV__) {
  initDebugMCP({ wsUrl: 'ws://localhost:4567' });
}
```

## Available Analysis Tools

- `explainScreenPerformance`: Comprehensive analysis of a specific screen.
- `detectUnnecessaryRenders`: Identifies components rendering with identical props.
- `detectRenderCascade`: Finds chains of renders triggered in quick succession.
- `getSlowComponents`: Lists components with high average render times.
- `detectDuplicateNetworkCalls`: Identifies redundant API requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
