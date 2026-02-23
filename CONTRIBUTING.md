# Contributing to RN Debug MCP

Thank you for your interest in contributing! This project aims to make React Native performance debugging seamless and AI-accessible.

## Development Workflow

### 1. Repository Structure

This is a monorepo managed with npm workspaces:
- `packages/mcp-server`: The Node.js MCP server.
- `packages/instrumentation`: The RN client library.
- `packages/babel-plugin`: The transformation plugin.

### 2. Setting Up for Development

1. Fork and clone the repo.
2. Install dependencies: `npm install`.
3. Build all packages: `npm run build`.
4. Run tests: `npm test`.

### 3. How to Contribute

1. **Pick an issue** or propose a new feature via an Issue.
2. **Create a branch**: `git checkout -b feature/my-new-feature`.
3. **Write tests**: We value high test coverage for the analysis logic.
4. **Implement your changes**.
5. **Run linting**: `npm run lint`.
6. **Submit a Pull Request**.

## Coding Standards

- Use TypeScript for all new code.
- Follow the existing architectural patterns (analyzers in `mcp-server`, monitors in `instrumentation`).
- Keep the instrumentation layer as lean as possible.
- Document any new tools or analysis logic.

## Testing

For `mcp-server`, use Jest to test the `AnalysisEngine` and individual analyzers. 
For `babel-plugin`, ensure you test with various component patterns (memo, arrow functions, class components).

## Pull Request Guidelines

- Ensure the build passes.
- Include a clear description of the change.
- Reference any related issues.
- Add/update documentation if necessary.
