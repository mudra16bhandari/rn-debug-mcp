// Example: Add this to your app's index.js or App.tsx
// This initializes the debug MCP system

import { initDebugMCP } from '@rn-debug-mcp/instrumentation';

if (__DEV__) {
  initDebugMCP({ wsUrl: 'ws://localhost:4567' });
}
