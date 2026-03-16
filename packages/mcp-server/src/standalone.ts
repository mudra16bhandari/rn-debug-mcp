/**
 * Standalone server mode for testing
 * Runs only HTTP and WebSocket servers (no stdio MCP)
 * Use this for testing before integrating with Cursor
 */

import { EventBuffer } from './collector/EventBuffer';
import { EventCollector } from './collector/EventCollector';
import { createWebSocketServer } from './transport/WebSocketServer';
import { createHttpServer } from './transport/HttpServer';
import { freePorts, isServerHealthy } from './utils/port';
import { RemoteEventBuffer } from './collector/RemoteEventBuffer';

const WS_PORT = parseInt(process.env.WS_PORT ?? '4567');
const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? '4568');

async function main() {
    const isHealthy = await isServerHealthy(HTTP_PORT);

    if (isHealthy) {
        console.error(`[RN Debug MCP] Healthy instance found on port ${HTTP_PORT}. Joining as secondary observer.`);
        const buffer = new RemoteEventBuffer(`http://localhost:${HTTP_PORT}/events/export`);

        // In standalone mode, there's no stdio MCP, so we just loop and show sync status
        console.error('[RN Debug MCP] Syncing logs from primary instance...');
        await buffer.sync();
        console.error(`[RN Debug MCP] Synced ${buffer.size()} events.`);
        return;
    }

    // If something is on the port but not healthy, kill it
    await freePorts([WS_PORT, HTTP_PORT]);

    const buffer = new EventBuffer({ maxSize: 5000, maxAgeMs: 5 * 60 * 1000 });
    const collector = new EventCollector(buffer);

    // Start HTTP and WebSocket servers
    createWebSocketServer(WS_PORT, collector);
    createHttpServer(HTTP_PORT, collector);

    console.error(`[RN Debug MCP] Standalone mode (Primary) - Ready. WS:${WS_PORT} HTTP:${HTTP_PORT}`);
    console.error('[RN Debug MCP] Server is ready to receive events from React Native app');
    console.error('[RN Debug MCP] Press Ctrl+C to stop');
}

main().catch((err) => {
    console.error('[RN Debug MCP] Fatal error during startup:', err);
    process.exit(1);
});
