# Tool Reference

RN Debug MCP exposes several tools via the Model Context Protocol. These tools can be called by AI assistants (like Cursor) to analyze the performance of your React Native application.

## `explainScreenPerformance`

Analyzes all events associated with a specific screen within the analysis window.

- **Arguments**: 
  - `screen` (string): The name of the screen to analyze.
- **Returns**: A structured report including critical findings, warnings, and a summary.
- **Use Case**: Best used when a specific screen feels "janky" or slow.

## `detectUnnecessaryRenders`

Identifies components that are re-rendering even though their props haven't changed.

- **Arguments**: 
  - `component` (optional string): Filter by a specific component name.
- **Returns**: A list of components and the number of unnecessary renders detected.
- **Use Case**: Use this to find missing `React.memo` or suboptimal prop passing.

## `detectRenderCascade`

Detects patterns where one component's render triggers several others in a short timeframe (render cascade).

- **Arguments**: 
  - `screen` (optional string): Filter by screen.
- **Returns**: A list of groups that rendered together.
- **Use Case**: Useful for finding state synchronization issues or "prop drilling" side effects.

## `getSlowComponents`

Calculates the average render duration for all components.

- **Arguments**: None.
- **Returns**: A list of components with average render times exceeding 16ms (standard frame budget).
- **Use Case**: Identifying heavy components that need optimization or logic offloading.

## `detectDuplicateNetworkCalls`

Finds identical network requests made within a short window (default 1s).

- **Arguments**: None.
- **Returns**: A list of duplicate URLs and the frequency of calls.
- **Use Case**: Identifying redundant API calls that can be cached or debounced.
