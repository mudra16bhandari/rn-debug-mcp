#!/usr/bin/env node
import { EventBuffer } from './collector/EventBuffer';
import { EventCollector } from './collector/EventCollector';
import { AnalysisEngine } from './analysis/AnalysisEngine';
import { createWebSocketServer } from './transport/WebSocketServer';
import { createHttpServer } from './transport/HttpServer';
import { startMcpServer } from './mcp/McpServer';
import { logger } from './utils/logger';

const WS_PORT = parseInt(process.env.WS_PORT ?? '4567', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? '4568', 10);

const buffer = new EventBuffer({ maxSize: 5000, maxAgeMs: 5 * 60 * 1000 });
const collector = new EventCollector(buffer);
const engine = new AnalysisEngine(buffer);

// Start HTTP and WebSocket servers (for RN app connections)
createWebSocketServer(WS_PORT, collector);
createHttpServer(HTTP_PORT, collector);

// Start MCP server (for Cursor/stdio connections)
startMcpServer(engine).catch((err) => {
  logger.error('Failed to start MCP server', err);
  process.exit(1);
});

logger.info(`Server initialized. Listening for RN events on WS:${WS_PORT} and HTTP:${HTTP_PORT}`);
