# Setup Guide

This guide covers the installation and configuration of RN Debug MCP.

## Prerequisites

- Node.js (v18 or higher)
- A React Native project
- Cursor IDE (optional, for MCP integration)

## Installation

### 1. Root Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-repo/rn-debug-mcp.git
cd rn-debug-mcp
npm install
npm run build
```

### 2. Integration into your React Native App

#### Install the instrumentation package:

```bash
npm install @rn-debug-mcp/instrumentation
```

#### Add the Babel plugin to `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ...(process.env.NODE_ENV !== 'production'
      ? ['babel-plugin-rn-debug-mcp']
      : []),
  ],
};
```

#### Initialize in your app entry point (e.g., `index.js` or `App.tsx`):

```javascript
import { initDebugMCP } from '@rn-debug-mcp/instrumentation';

if (__DEV__) {
  initDebugMCP({ wsUrl: 'ws://localhost:4567' });
}
```

## Cursor Integration

To use the AI-powered performance analysis, you need to register the MCP server in Cursor.

1. Locate your Cursor MCP settings (usually in Project Settings or global Cursor settings).
2. Add a new MCP server:
   - **Name**: `rn-debug-mcp`
   - **Type**: `stdio`
   - **Command**: `node`
   - **Arguments**: `["/absolute/path/to/rn-debug-mcp/packages/mcp-server/dist/index.js"]`

## Configuration

The server can be configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `WS_PORT` | Port for the WebSocket server (app connection) | `4567` |
| `HTTP_PORT` | Port for the HTTP server (event fallback) | `4568` |
| `MAX_BUFFER_SIZE` | Maximum number of events to store | `5000` |
| `MAX_EVENT_AGE_MS` | TTL for events in the buffer | `300000` (5 mins) |
