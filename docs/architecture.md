# Architecture

RN Debug MCP follows a three-tier architecture to provide real-time debugging capabilities for React Native applications.

## Component Overview

### 1. Instrumentation Layer (@rn-debug-mcp/instrumentation)
This package runs inside the React Native application. It is responsible for:
- Intercepting network requests (fetch API).
- Monitoring the JS thread for blocking operations.
- Providing hooks for component render tracking.
- Buffering events and sending them to the server via WebSocket or HTTP.

### 2. Transformation Layer (babel-plugin-rn-debug-mcp)
A Babel plugin that automatically injects instrumentation hooks into React components. It identifies functional components and adds `useRenderTracker` and `useRenderCheck` calls, ensuring developers don't have to manually instrument every component.

### 3. Analysis & Interface Layer (@rn-debug-mcp/server)
A Node.js server that acts as the central hub. It features:
- **Event Collector**: Receives and buffers events from the app.
- **Analysis Engine**: Processes buffered events to detect performance patterns like render cascades, slow renders, and duplicate network calls.
- **MCP Server**: Implements the Model Context Protocol to expose analysis tools to AI-powered IDEs like Cursor.

## Data Flow

1. **Babel Transformation**: During the build process, components are instrumented.
2. **Event Generation**: At runtime, actions like renders and network calls generate events.
3. **Transport**: Events are sent to the MCP Server's WebSocket endpoint.
4. **Buffer & Analyze**: The server stores recent events in a sliding-window buffer.
5. **Tool Call**: When a developer asks an AI about performance, the AI calls an MCP tool.
6. **Insight**: The Analysis Engine queries the buffer and returns structured findings.

## Design Principles

- **Minimal Overhead**: Instrumentation is designed to be lightweight.
- **Dev-Only**: Plugins and hooks are stripped or disabled in production builds.
- **Language Agnostic Analysis**: The server processes raw event data, allowing for complex analysis independently of the UI.
