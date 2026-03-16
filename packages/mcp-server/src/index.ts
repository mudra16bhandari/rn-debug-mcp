#!/usr/bin/env node
import { EventBuffer } from './collector/EventBuffer';
import { EventCollector } from './collector/EventCollector';
import { AnalysisEngine } from './analysis/AnalysisEngine';
import { createWebSocketServer } from './transport/WebSocketServer';
import { createHttpServer } from './transport/HttpServer';
import { startMcpServer } from './mcp/McpServer';
import { logger } from './utils/logger';
import { freePorts, isServerHealthy } from './utils/port';
import { RemoteEventBuffer } from './collector/RemoteEventBuffer';

const WS_PORT = parseInt(process.env.WS_PORT ?? '4567', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? '4568', 10);
const PROJECT_ID = process.env.PROJECT_ID ?? process.cwd().split('/').pop() ?? 'default-project';

async function main() {
  const isHealthy = await isServerHealthy(HTTP_PORT);

  let buffer: EventBuffer;

  if (isHealthy) {
    logger.info(`Healthy instance found on port ${HTTP_PORT}. Joining as secondary instance.`);
    buffer = new RemoteEventBuffer(`http://localhost:${HTTP_PORT}/events/export`);
  } else {
    // If something is on the port but not healthy, kill it
    await freePorts([WS_PORT, HTTP_PORT]);

    buffer = new EventBuffer({ maxSize: 5000, maxAgeMs: 5 * 60 * 1000 });
    const collector = new EventCollector(buffer);

    // Start HTTP and WebSocket servers (for RN app connections)
    createWebSocketServer(WS_PORT, collector);
    createHttpServer(HTTP_PORT, collector);

    logger.info(`Primary server initialized. Listening for RN events on WS:${WS_PORT} and HTTP:${HTTP_PORT}`);
  }

  const engine = new AnalysisEngine(buffer, PROJECT_ID);

  // Start MCP server (for Cursor/stdio connections)
  startMcpServer(engine).catch((err) => {
    logger.error('Failed to start MCP server', err);
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error('Fatal error during startup', err);
  process.exit(1);
});
