# @rn-debug-mcp/instrumentation

> React Native runtime instrumentation for RN Debug MCP.

Part of the [RN Debug MCP](https://github.com/mudra16bhandari/rn-debug-mcp) suite. This package runs inside your React Native application to collect performance data.

## 🚀 Comprehensive Setup

To use the full RN Debug MCP suite, you need three parts:

1.  **Instrumentation (This package)**: `npm install @rn-debug-mcp/instrumentation`
2.  **Babel Plugin**: `npm install @rn-debug-mcp/babel-plugin --save-dev` (for automatic tracking)
3.  **MCP Server**: Run via `npx -y @rn-debug-mcp/server` (for Cursor/AI integration)

[View the Full Integration Guide](https://github.com/mudra16bhandari/rn-debug-mcp#quick-start)

## Usage

Initialize the instrumentation in your app entry point (e.g., `index.js` or `App.tsx`):

```javascript
import { initDebugMCP } from '@rn-debug-mcp/instrumentation';

if (__DEV__) {
  initDebugMCP({ 
    wsUrl: 'ws://localhost:4567',
    logToConsole: false 
  });
}
```

## Features

- **Component Tracking**: Works with `@rn-debug-mcp/babel-plugin` to track component renders.
- **Network Monitoring**: Automatically intercepts and logs `fetch` calls.
- **JS Thread Monitoring**: Detects long-running tasks that block the main thread.

## License

MIT
