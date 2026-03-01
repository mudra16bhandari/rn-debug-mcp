# @rn-debug-mcp/server

> Model Context Protocol (MCP) server for React Native runtime debugging.

This is the central server for [RN Debug MCP](https://github.com/mudra16bhandari/rn-debug-mcp). It receives performance data from your React Native app and provides analysis tools to AI-powered IDEs like Cursor via the Model Context Protocol.

## 🚀 Comprehensive Setup

This server is the "brain" that analyzes data from your app. To use it, you need:

1.  **MCP Server (This package)**: Run via `npx -y @rn-debug-mcp/server` in Cursor.
2.  **Instrumentation**: `npm install @rn-debug-mcp/instrumentation` (inside your app).
3.  **Babel Plugin**: `npm install @rn-debug-mcp/babel-plugin --save-dev` (for auto-tracking).

[View the Full Integration Guide](https://github.com/mudra16bhandari/rn-debug-mcp#quick-start)

## Usage with Cursor

1. Open Cursor Settings.
2. Go to **MCP** section.
3. Click **Add New MCP Server**.
4. Set **Name** to `RN Debug`.
5. Set **Type** to `command`.
6. Set **Command** to:
   ```bash
   npx -y @rn-debug-mcp/server
   ```

## Features

Exposes several tools to your AI assistant:

- `explainScreenPerformance`: Get a high-level overview of why a screen is slow.
- `detectUnnecessaryRenders`: Find components re-rendering with identical props.
- `getSlowComponents`: List components with the highest render times.
- `detectRenderCascade`: Identify chains of expensive renders.
- `detectDuplicateNetworkCalls`: Find duplicate network calls.
- `readNativeLogs`: Fetch and filter native logs (Android logcat / iOS simctl).

## License

MIT
