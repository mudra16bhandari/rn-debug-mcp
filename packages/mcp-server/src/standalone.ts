/**
 * Standalone server mode for testing
 * Runs only HTTP and WebSocket servers (no stdio MCP)
 * Use this for testing before integrating with Cursor
 */

import { EventBuffer } from './collector/EventBuffer';
import { EventCollector } from './collector/EventCollector';
import { createWebSocketServer } from './transport/WebSocketServer';
import { createHttpServer } from './transport/HttpServer';

const WS_PORT = parseInt(process.env.WS_PORT ?? '4567');
const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? '4568');

const buffer = new EventBuffer({ maxSize: 5000, maxAgeMs: 5 * 60 * 1000 });
const collector = new EventCollector(buffer);

// Start HTTP and WebSocket servers
createWebSocketServer(WS_PORT, collector);
createHttpServer(HTTP_PORT, collector);

console.log(`[RN Debug MCP] Standalone mode - Ready. WS:${WS_PORT} HTTP:${HTTP_PORT}`);
console.log('[RN Debug MCP] Server is ready to receive events from React Native app');
console.log('[RN Debug MCP] Press Ctrl+C to stop');
