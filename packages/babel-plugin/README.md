# @rn-debug-mcp/babel-plugin

> Babel plugin for automatic React Native component instrumentation.

Part of the [RN Debug MCP](https://github.com/mudra16bhandari/rn-debug-mcp) suite. This plugin automatically injects render tracking hooks into your functional components.

## 🚀 Comprehensive Setup

To use the full RN Debug MCP suite, you need three parts:

1.  **Babel Plugin (This package)**: `npm install @rn-debug-mcp/babel-plugin --save-dev`
2.  **Instrumentation**: `npm install @rn-debug-mcp/instrumentation` (required by the plugin)
3.  **MCP Server**: Run via `npx -y @rn-debug-mcp/server` (for Cursor/AI integration)

[View the Full Integration Guide](https://github.com/mudra16bhandari/rn-debug-mcp#quick-start)

## Setup

Add the plugin to your `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [...(process.env.NODE_ENV !== 'production' ? ['@rn-debug-mcp/babel-plugin'] : [])],
};
```

The plugin scans your source code for functional components and injects tracking hooks from `@rn-debug-mcp/instrumentation`:

1. `useRenderTracker`: Counts render frequency.
2. `useRenderCheck`: Compares props between renders to detect unnecessary updates.
3. `useContextTracker`: Injected into `Context.Provider` to track value changes.
4. `setCurrentScreen`: Automatically inferred from filenames to provide screen-aware debugging.

## License

MIT
