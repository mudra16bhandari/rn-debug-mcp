RN Debug MCP

**Complete Implementation Plan for IDE Agent**

This document is a step-by-step build plan for the React Native Runtime
Debugging MCP. It is written to be handed directly to an IDE agent
(Cursor, GitHub Copilot Workspace, etc.) as a prompt-ready
specification. Every step describes exactly what to create, what the
file should contain, and what the acceptance criteria are.

The agent should execute steps sequentially. Each step builds on the
last. Do not skip steps or reorder them.

  ---------------------- ------------------------------------------------
  **Project Name**       rn-debug-mcp

  **Language**           TypeScript (server), JavaScript (Babel plugin +
                         instrumentation)

  **Runtime**            Node.js 20+

  **Package Manager**    npm

  **Target App**         Any React Native 0.71+ app using Metro bundler

  **Phase 1 Scope**      Render tracking, unnecessary render detection,
                         JS thread blocking, network monitoring

  **Phase 2 Scope**      Render cascade detection, slow component
                         detection, screen analysis

  **Phase 3 Scope**      Architectural pattern detection, performance
                         regression, render graphs
  ---------------------- ------------------------------------------------

**1. Repository Structure**

Create the following monorepo structure from scratch. The agent should
create every file listed --- even if empty --- before writing any
implementation code. This establishes the skeleton that all subsequent
steps fill in.

  -------------------------------- ----------------------------------------
  **Path**                         **Purpose**

  rn-debug-mcp/                    Root of the project

  package.json                     Root package with workspaces

  tsconfig.base.json               Shared TypeScript config

  .gitignore                       Standard Node + TS ignores

  README.md                        Project overview

                                   

  packages/                        Monorepo packages

  packages/mcp-server/             The MCP server (Node.js, TypeScript)

  package.json                     

  tsconfig.json                    

  src/                             

  index.ts                         Entry point --- starts HTTP + WS + MCP
                                   servers

  collector/                       

  EventCollector.ts                Receives and stores events

  EventBuffer.ts                   Rolling window storage with eviction

  types.ts                         Shared event type definitions

  analysis/                        

  AnalysisEngine.ts                Orchestrates all analyzers

  RenderAnalyzer.ts                Render frequency + unnecessary render
                                   logic

  CascadeAnalyzer.ts               Render cascade chain detection

  NetworkAnalyzer.ts               Duplicate + slow request detection

  JSThreadAnalyzer.ts              JS blocking event analysis

  mcp/                             

  McpServer.ts                     MCP protocol handler

  tools/                           

  explainScreenPerformance.ts      MCP tool implementation

  detectUnnecessaryRenders.ts      MCP tool implementation

  detectRenderCascade.ts           MCP tool implementation

  getSlowComponents.ts             MCP tool implementation

  detectDuplicateNetworkCalls.ts   MCP tool implementation

  transport/                       

  WebSocketServer.ts               Accepts WS connections from RN app

  HttpServer.ts                    Fallback HTTP POST endpoint

                                   

  packages/instrumentation/        Library that runs inside the RN app

  package.json                     

  src/                             

  index.ts                         Public API --- exports all hooks and
                                   monitors

  transport/                       

  EventTransport.ts                WebSocket sender with reconnect

  EventBuffer.ts                   Client-side rolling buffer + dedup

  hooks/                           

  useRenderTracker.ts              Tracks component renders

  useRenderCheck.ts                Detects unnecessary renders

  monitors/                        

  JSThreadMonitor.ts               Interval-based JS blocking detector

  NetworkMonitor.ts                Global fetch wrapper

  config.ts                        Configurable buffer size, WS URL, dev
                                   guard

                                   

  packages/babel-plugin/           Babel plugin for auto-instrumentation

  package.json                     

  src/                             

  index.ts                         Plugin entry --- AST visitor

  visitors/                        

  FunctionComponent.ts             Wraps function components

  ArrowComponent.ts                Wraps arrow function components

  utils/                           

  isComponent.ts                   Heuristic: is this AST node a component?

  getDisplayName.ts                Extracts or infers component name

                                   

  example-app/                     Minimal RN app to test everything

  \... (standard React Native      
  project structure)               
  -------------------------------- ----------------------------------------

> **NOTE:** The agent should run: mkdir -p
> rn-debug-mcp/packages/{mcp-server/src/{collector,analysis,mcp/tools,transport},instrumentation/src/{transport,hooks,monitors},babel-plugin/src/{visitors,utils}}
> before writing files.

**2. Step-by-Step Build Instructions**

Each step below is a discrete, testable unit of work. The agent should
complete and verify each step before moving to the next. Steps are
ordered by dependency.

**Phase 0 --- Project Scaffolding**

> **STEP 1 Create root monorepo** \[Phase 0\]

**What to create**

-   rn-debug-mcp/package.json --- workspace root

-   rn-debug-mcp/tsconfig.base.json

-   rn-debug-mcp/.gitignore

**package.json content**

> {
>
> \"name\": \"rn-debug-mcp-root\",
>
> \"private\": true,
>
> \"workspaces\": \[\"packages/\*\"\],
>
> \"scripts\": {
>
> \"build\": \"npm run build \--workspaces\",
>
> \"dev:server\": \"cd packages/mcp-server && npm run dev\"
>
> }
>
> }

**tsconfig.base.json content**

> {
>
> \"compilerOptions\": {
>
> \"target\": \"ES2020\",
>
> \"module\": \"commonjs\",
>
> \"lib\": \[\"ES2020\"\],
>
> \"strict\": true,
>
> \"esModuleInterop\": true,
>
> \"skipLibCheck\": true,
>
> \"outDir\": \"dist\",
>
> \"rootDir\": \"src\",
>
> \"declaration\": true
>
> }
>
> }

**Acceptance criteria**

-   npm install runs without error from the root

-   tsconfig.base.json is valid JSON

> **STEP 2 Scaffold mcp-server package** \[Phase 0\]

**What to create: packages/mcp-server/package.json**

> {
>
> \"name\": \"@rn-debug-mcp/server\",
>
> \"version\": \"0.1.0\",
>
> \"main\": \"dist/index.js\",
>
> \"scripts\": {
>
> \"build\": \"tsc\",
>
> \"dev\": \"ts-node src/index.ts\"
>
> },
>
> \"dependencies\": {
>
> \"@modelcontextprotocol/sdk\": \"\^1.0.0\",
>
> \"ws\": \"\^8.16.0\",
>
> \"express\": \"\^4.18.0\",
>
> \"zod\": \"\^3.22.0\"
>
> },
>
> \"devDependencies\": {
>
> \"typescript\": \"\^5.3.0\",
>
> \"ts-node\": \"\^10.9.0\",
>
> \"@types/ws\": \"\^8.5.0\",
>
> \"@types/express\": \"\^4.17.0\",
>
> \"@types/node\": \"\^20.0.0\"
>
> }
>
> }

**What to create: packages/mcp-server/tsconfig.json**

> {
>
> \"extends\": \"../../tsconfig.base.json\",
>
> \"compilerOptions\": { \"outDir\": \"dist\", \"rootDir\": \"src\" },
>
> \"include\": \[\"src\"\]
>
> }

**Acceptance criteria**

-   npm install succeeds inside packages/mcp-server

-   ts-node src/index.ts exits cleanly with a placeholder (stub the
    entry point as console.log(\'ok\'))

> **STEP 3 Scaffold instrumentation package** \[Phase 0\]

**What to create: packages/instrumentation/package.json**

> {
>
> \"name\": \"@rn-debug-mcp/instrumentation\",
>
> \"version\": \"0.1.0\",
>
> \"main\": \"src/index.ts\",
>
> \"peerDependencies\": {
>
> \"react\": \"\>=17.0.0\",
>
> \"react-native\": \"\>=0.71.0\"
>
> },
>
> \"devDependencies\": {
>
> \"typescript\": \"\^5.3.0\",
>
> \"@types/react\": \"\^18.0.0\"
>
> }
>
> }
>
> **NOTE:** This package ships source directly (not compiled) so Metro
> bundler can pick it up. Do not add a build step to this package.
>
> **STEP 4 Scaffold babel-plugin package** \[Phase 0\]

**What to create: packages/babel-plugin/package.json**

> {
>
> \"name\": \"babel-plugin-rn-debug-mcp\",
>
> \"version\": \"0.1.0\",
>
> \"main\": \"src/index.js\",
>
> \"dependencies\": {
>
> \"@babel/core\": \"\^7.23.0\",
>
> \"@babel/types\": \"\^7.23.0\",
>
> \"@babel/helper-plugin-utils\": \"\^7.22.0\"
>
> }
>
> }
>
> **NOTE:** The Babel plugin is plain JavaScript, not TypeScript,
> because it runs inside Metro\'s Babel pipeline and TypeScript adds
> friction there.

**Phase 1 --- Event Types and Shared Contracts**

Define all event shapes before writing any logic. Everything else
depends on these types.

> **STEP 5 Define all event types** \[Phase 1\]

**File: packages/mcp-server/src/collector/types.ts**

This file is the single source of truth for every event that flows
through the system.

> export type RenderEvent = {
>
> type: \'render\';
>
> component: string;
>
> screen?: string;
>
> timestamp: number;
>
> renderCount?: number;
>
> };
>
> export type RenderCheckEvent = {
>
> type: \'render_check\';
>
> component: string;
>
> propsChanged: boolean;
>
> timestamp: number;
>
> };
>
> export type RenderTimeEvent = {
>
> type: \'render_time\';
>
> component: string;
>
> duration: number; // milliseconds
>
> timestamp: number;
>
> };
>
> export type JSBlockEvent = {
>
> type: \'js_block\';
>
> delay: number; // ms over expected interval
>
> timestamp: number;
>
> };
>
> export type NetworkEvent = {
>
> type: \'network\';
>
> url: string;
>
> method: string;
>
> duration: number;
>
> status?: number;
>
> timestamp: number;
>
> };
>
> export type NavigationEvent = {
>
> type: \'navigation\';
>
> screen: string;
>
> action: \'focus\' \| \'blur\';
>
> timestamp: number;
>
> };
>
> export type RuntimeEvent =
>
> \| RenderEvent
>
> \| RenderCheckEvent
>
> \| RenderTimeEvent
>
> \| JSBlockEvent
>
> \| NetworkEvent
>
> \| NavigationEvent;

**Acceptance criteria**

-   File compiles with zero TypeScript errors

-   Every event has a type discriminator and a timestamp

> **STEP 6 Build EventBuffer (server-side)** \[Phase 1\]

**File: packages/mcp-server/src/collector/EventBuffer.ts**

A rolling in-memory store. Evicts events older than maxAgeMs or when
count exceeds maxSize.

> import { RuntimeEvent } from \'./types\';
>
> export interface BufferConfig {
>
> maxSize: number; // default 5000
>
> maxAgeMs: number; // default 5 \* 60 \* 1000 (5 min)
>
> }
>
> export class EventBuffer {
>
> private events: RuntimeEvent\[\] = \[\];
>
> private config: BufferConfig;
>
> constructor(config: Partial\<BufferConfig\> = {}) {
>
> this.config = {
>
> maxSize: config.maxSize ?? 5000,
>
> maxAgeMs: config.maxAgeMs ?? 5 \* 60 \* 1000,
>
> };
>
> }
>
> push(event: RuntimeEvent): void {
>
> this.evict();
>
> this.events.push(event);
>
> if (this.events.length \> this.config.maxSize) {
>
> this.events.shift(); // drop oldest
>
> }
>
> }
>
> getAll(): RuntimeEvent\[\] {
>
> this.evict();
>
> return \[\...this.events\];
>
> }
>
> getByType\<T extends RuntimeEvent\[\'type\'\]\>(
>
> type: T
>
> ): Extract\<RuntimeEvent, { type: T }\>\[\] {
>
> return this.getAll().filter(
>
> (e): e is Extract\<RuntimeEvent, { type: T }\> =\> e.type === type
>
> );
>
> }
>
> clear(): void { this.events = \[\]; }
>
> size(): number { return this.events.length; }
>
> private evict(): void {
>
> const cutoff = Date.now() - this.config.maxAgeMs;
>
> this.events = this.events.filter(e =\> e.timestamp \> cutoff);
>
> }
>
> }

**Acceptance criteria**

-   push() adds events and size() returns correct count

-   Events older than maxAgeMs are evicted on next push() or getAll()

-   When events exceed maxSize, oldest is dropped

-   getByType() returns narrowed TypeScript types without casting

> **STEP 7 Build EventCollector (HTTP + WebSocket receiver)** \[Phase
> 1\]

**File: packages/mcp-server/src/collector/EventCollector.ts**

Wraps the buffer and validates incoming JSON before storing. Shared by
both the HTTP endpoint and the WebSocket handler.

> import { EventBuffer } from \'./EventBuffer\';
>
> import { RuntimeEvent } from \'./types\';
>
> export class EventCollector {
>
> constructor(private buffer: EventBuffer) {}
>
> // Call this from WS and HTTP handlers
>
> receive(raw: unknown): { ok: true } \| { ok: false; error: string } {
>
> if (!raw \|\| typeof raw !== \'object\') {
>
> return { ok: false, error: \'Event must be an object\' };
>
> }
>
> const event = raw as Record\<string, unknown\>;
>
> if (!event.type \|\| !event.timestamp) {
>
> return { ok: false, error: \'Missing type or timestamp\' };
>
> }
>
> const validTypes = \[
>
> \'render\',\'render_check\',\'render_time\',
>
> \'js_block\',\'network\',\'navigation\'
>
> \];
>
> if (!validTypes.includes(event.type as string)) {
>
> return { ok: false, error: \`Unknown event type: \${event.type}\` };
>
> }
>
> this.buffer.push(raw as RuntimeEvent);
>
> return { ok: true };
>
> }
>
> getBuffer(): EventBuffer { return this.buffer; }
>
> }

**Phase 2 --- Transport Layer**

> **STEP 8 Build WebSocket server** \[Phase 2\]

**File: packages/mcp-server/src/transport/WebSocketServer.ts**

Accepts WebSocket connections from the RN instrumentation library.
Parses incoming messages and forwards to EventCollector.

> import { WebSocketServer as WSSServer, WebSocket } from \'ws\';
>
> import { EventCollector } from \'../collector/EventCollector\';
>
> export function createWebSocketServer(
>
> port: number,
>
> collector: EventCollector
>
> ): WSSServer {
>
> const wss = new WSSServer({ port });
>
> wss.on(\'connection\', (ws: WebSocket) =\> {
>
> console.log(\'\[WS\] Client connected\');
>
> ws.on(\'message\', (data) =\> {
>
> try {
>
> const parsed = JSON.parse(data.toString());
>
> // Handle both single events and batches
>
> const events = Array.isArray(parsed) ? parsed : \[parsed\];
>
> events.forEach(e =\> {
>
> const result = collector.receive(e);
>
> if (!result.ok) {
>
> console.warn(\'\[WS\] Rejected event:\', result.error);
>
> }
>
> });
>
> } catch (err) {
>
> console.warn(\'\[WS\] Failed to parse message:\', err);
>
> }
>
> });
>
> ws.on(\'close\', () =\> console.log(\'\[WS\] Client disconnected\'));
>
> });
>
> console.log(\`\[WS\] Listening on ws://localhost:\${port}\`);
>
> return wss;
>
> }

**Acceptance criteria**

-   WebSocket server starts on the specified port without error

-   A JSON message sent via wscat or a test client appears in the buffer

-   Malformed JSON is caught and logged --- server does not crash

-   Both single events { \... } and batched events \[{ \... }, { \...
    }\] are accepted

> **STEP 9 Build HTTP fallback endpoint** \[Phase 2\]

**File: packages/mcp-server/src/transport/HttpServer.ts**

Provides POST /events as a fallback. Also exposes GET /health and GET
/status for debugging.

> import express from \'express\';
>
> import { EventCollector } from \'../collector/EventCollector\';
>
> export function createHttpServer(
>
> port: number,
>
> collector: EventCollector
>
> ): express.Application {
>
> const app = express();
>
> app.use(express.json({ limit: \'1mb\' }));
>
> app.post(\'/events\', (req, res) =\> {
>
> const events = Array.isArray(req.body) ? req.body : \[req.body\];
>
> const results = events.map(e =\> collector.receive(e));
>
> const failed = results.filter(r =\> !r.ok);
>
> if (failed.length \> 0) {
>
> return res.status(400).json({ errors: failed });
>
> }
>
> res.json({ ok: true, received: events.length });
>
> });
>
> app.get(\'/health\', (\_req, res) =\> res.json({ ok: true }));
>
> app.get(\'/status\', (\_req, res) =\> {
>
> res.json({
>
> bufferedEvents: collector.getBuffer().size(),
>
> });
>
> });
>
> app.listen(port, () =\>
>
> console.log(\`\[HTTP\] Listening on http://localhost:\${port}\`)
>
> );
>
> return app;
>
> }

**Acceptance criteria**

-   GET /health returns 200 { ok: true }

-   POST /events with valid JSON stores the event and returns { ok:
    true, received: 1 }

-   POST /events with invalid JSON returns 400 with error details

-   GET /status returns the current buffer size

> **STEP 10 Build client-side EventTransport (instrumentation)** \[Phase
> 2\]

**File: packages/instrumentation/src/transport/EventTransport.ts**

The WebSocket sender that runs inside the React Native app. Buffers
events when disconnected and flushes on reconnect. Uses exponential
backoff for reconnection.

> import { getConfig } from \'../config\';
>
> type AnyEvent = Record\<string, unknown\>;
>
> class EventTransport {
>
> private ws: WebSocket \| null = null;
>
> private queue: AnyEvent\[\] = \[\];
>
> private retryDelay = 1000;
>
> private connected = false;
>
> connect(): void {
>
> const cfg = getConfig();
>
> if (!cfg.enabled) return;
>
> try {
>
> this.ws = new WebSocket(cfg.wsUrl);
>
> this.ws.onopen = () =\> {
>
> this.connected = true;
>
> this.retryDelay = 1000;
>
> this.flush();
>
> };
>
> this.ws.onclose = () =\> {
>
> this.connected = false;
>
> setTimeout(() =\> this.connect(), this.retryDelay);
>
> this.retryDelay = Math.min(this.retryDelay \* 2, 30000);
>
> };
>
> this.ws.onerror = () =\> {
>
> // Silently ignore --- onclose will handle retry
>
> };
>
> } catch {
>
> // WebSocket not available in this environment
>
> }
>
> }
>
> send(event: AnyEvent): void {
>
> if (!getConfig().enabled) return;
>
> if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
>
> this.ws.send(JSON.stringify(event));
>
> } else {
>
> this.queue.push(event);
>
> if (this.queue.length \> 200) this.queue.shift(); // cap queue
>
> }
>
> }
>
> private flush(): void {
>
> const batch = this.queue.splice(0);
>
> if (batch.length === 0) return;
>
> this.ws?.send(JSON.stringify(batch));
>
> }
>
> }
>
> export const transport = new EventTransport();

**Acceptance criteria**

-   transport.send() queues events when WS is not connected

-   On connect, queued events are flushed as a batch

-   Reconnect retries with exponential backoff up to 30 seconds

-   When cfg.enabled is false, nothing happens (dev guard works)

> **STEP 11 Build client-side EventBuffer with deduplication** \[Phase
> 2\]

**File: packages/instrumentation/src/transport/EventBuffer.ts**

Deduplicates render events that occur in the same 16ms frame (one
animation frame) before they reach the transport. This prevents event
floods during rapid re-renders.

> import { transport } from \'./EventTransport\';
>
> const DEDUP_WINDOW_MS = 16;
>
> // Track last emit time per component for render dedup
>
> const lastRenderTime = new Map\<string, number\>();
>
> export function sendRenderEvent(component: string, screen?: string):
> void {
>
> const now = Date.now();
>
> const last = lastRenderTime.get(component) ?? 0;
>
> if (now - last \< DEDUP_WINDOW_MS) return; // drop --- same frame
>
> lastRenderTime.set(component, now);
>
> transport.send({ type: \'render\', component, screen, timestamp: now
> });
>
> }
>
> // Non-deduplicated senders
>
> export function sendEvent(event: Record\<string, unknown\>): void {
>
> transport.send({ \...event, timestamp: Date.now() });
>
> }
>
> **NOTE:** The 16ms dedup window aligns with one animation frame at
> 60fps. This means at most 60 render events per second per component
> reach the server, regardless of actual render frequency.

**Phase 3 --- Instrumentation Hooks and Monitors**

> **STEP 12 Build config module** \[Phase 3\]

**File: packages/instrumentation/src/config.ts**

Central configuration. Dev guard lives here --- nothing in the
instrumentation library emits events in production.

> export interface DebugConfig {
>
> enabled: boolean;
>
> wsUrl: string;
>
> bufferSize: number;
>
> logToConsole: boolean;
>
> }
>
> let config: DebugConfig = {
>
> enabled: typeof \_\_DEV\_\_ !== \'undefined\' && \_\_DEV\_\_,
>
> wsUrl: \'ws://localhost:4567\',
>
> bufferSize: 200,
>
> logToConsole: false,
>
> };
>
> export function configure(overrides: Partial\<DebugConfig\>): void {
>
> config = { \...config, \...overrides };
>
> }
>
> export function getConfig(): DebugConfig { return config; }

**Acceptance criteria**

-   enabled is false when \_\_DEV\_\_ is false or undefined

-   configure() merges partial overrides without replacing unspecified
    fields

> **STEP 13 Build useRenderTracker hook** \[Phase 3\]

**File: packages/instrumentation/src/hooks/useRenderTracker.ts**

> import { useRef } from \'react\';
>
> import { sendRenderEvent } from \'../transport/EventBuffer\';
>
> export function useRenderTracker(
>
> componentName: string,
>
> screen?: string
>
> ): void {
>
> const renderCount = useRef(0);
>
> renderCount.current++;
>
> sendRenderEvent(componentName, screen);
>
> }

**Acceptance criteria**

-   Hook can be added to any function component without breaking it

-   Each component render increments the counter

-   Events are deduplicated within 16ms windows (via EventBuffer)

> **STEP 14 Build useRenderCheck hook** \[Phase 3\]

**File: packages/instrumentation/src/hooks/useRenderCheck.ts**

Compares props with a shallow diff to detect renders where nothing
changed. This hook has a per-render cost, so it should only be used on
components already identified as render-heavy.

> import { useRef } from \'react\';
>
> import { sendEvent } from \'../transport/EventBuffer\';
>
> function shallowDiff(
>
> prev: Record\<string, unknown\>,
>
> next: Record\<string, unknown\>
>
> ): boolean {
>
> const prevKeys = Object.keys(prev);
>
> const nextKeys = Object.keys(next);
>
> if (prevKeys.length !== nextKeys.length) return true;
>
> return prevKeys.some(k =\> prev\[k\] !== next\[k\]);
>
> }
>
> export function useRenderCheck(
>
> componentName: string,
>
> props: Record\<string, unknown\>
>
> ): void {
>
> const prevProps = useRef\<Record\<string, unknown\>\>(props);
>
> const changed = shallowDiff(prevProps.current, props);
>
> prevProps.current = props;
>
> sendEvent({
>
> type: \'render_check\',
>
> component: componentName,
>
> propsChanged: changed,
>
> });
>
> }
>
> **RISK:** Calling shallowDiff on every render adds overhead. Only
> apply to components flagged by render frequency analysis, not by
> default.
>
> **STEP 15 Build JSThreadMonitor** \[Phase 3\]

**File: packages/instrumentation/src/monitors/JSThreadMonitor.ts**

> import { sendEvent } from \'../transport/EventBuffer\';
>
> import { getConfig } from \'../config\';
>
> const INTERVAL_MS = 100;
>
> const BLOCK_THRESHOLD_MS = 50;
>
> let intervalId: ReturnType\<typeof setInterval\> \| null = null;
>
> let last = Date.now();
>
> export function startJSThreadMonitor(): void {
>
> if (!getConfig().enabled) return;
>
> if (intervalId !== null) return; // already running
>
> last = Date.now();
>
> intervalId = setInterval(() =\> {
>
> const now = Date.now();
>
> const delay = now - last - INTERVAL_MS;
>
> if (delay \> BLOCK_THRESHOLD_MS) {
>
> sendEvent({ type: \'js_block\', delay });
>
> }
>
> last = now;
>
> }, INTERVAL_MS);
>
> }
>
> export function stopJSThreadMonitor(): void {
>
> if (intervalId !== null) {
>
> clearInterval(intervalId);
>
> intervalId = null;
>
> }
>
> }

**Acceptance criteria**

-   startJSThreadMonitor() is idempotent --- calling twice does not
    create two intervals

-   Blocking the JS thread for 200ms in a test causes a js_block event
    with delay \>= 100

-   stopJSThreadMonitor() cleanly cancels the interval

> **STEP 16 Build NetworkMonitor** \[Phase 3\]

**File: packages/instrumentation/src/monitors/NetworkMonitor.ts**

> import { sendEvent } from \'../transport/EventBuffer\';
>
> import { getConfig } from \'../config\';
>
> let patched = false;
>
> export function startNetworkMonitor(): void {
>
> if (!getConfig().enabled) return;
>
> if (patched) return;
>
> patched = true;
>
> const originalFetch = global.fetch;
>
> global.fetch = async (\...args: Parameters\<typeof fetch\>) =\> {
>
> const start = Date.now();
>
> const url = typeof args\[0\] === \'string\' ? args\[0\] :
> String(args\[0\]);
>
> const method = (args\[1\]?.method ?? \'GET\').toUpperCase();
>
> try {
>
> const response = await originalFetch(\...args);
>
> sendEvent({
>
> type: \'network\',
>
> url,
>
> method,
>
> duration: Date.now() - start,
>
> status: response.status,
>
> });
>
> return response;
>
> } catch (err) {
>
> sendEvent({
>
> type: \'network\',
>
> url,
>
> method,
>
> duration: Date.now() - start,
>
> status: 0,
>
> });
>
> throw err;
>
> }
>
> };
>
> }

**Acceptance criteria**

-   Patching is idempotent --- calling startNetworkMonitor() twice does
    not double-wrap fetch

-   A fetch to any URL produces a network event with the correct URL,
    method, duration, and status

-   A failed fetch (network error) still produces a network event with
    status: 0

> **STEP 17 Build public index.ts for instrumentation** \[Phase 3\]

**File: packages/instrumentation/src/index.ts**

> export { configure } from \'./config\';
>
> export { useRenderTracker } from \'./hooks/useRenderTracker\';
>
> export { useRenderCheck } from \'./hooks/useRenderCheck\';
>
> export { startJSThreadMonitor, stopJSThreadMonitor } from
> \'./monitors/JSThreadMonitor\';
>
> export { startNetworkMonitor } from \'./monitors/NetworkMonitor\';
>
> export { transport } from \'./transport/EventTransport\';
>
> // Convenience: start all monitors at once
>
> import { transport as \_transport } from
> \'./transport/EventTransport\';
>
> import { startJSThreadMonitor as \_jsm } from
> \'./monitors/JSThreadMonitor\';
>
> import { startNetworkMonitor as \_nm } from
> \'./monitors/NetworkMonitor\';
>
> export function initDebugMCP(overrides?: Parameters\<typeof
> import(\'./config\').configure\>\[0\]): void {
>
> if (overrides) {
>
> const { configure } = require(\'./config\');
>
> configure(overrides);
>
> }
>
> \_transport.connect();
>
> \_jsm();
>
> \_nm();
>
> }

Developers call initDebugMCP() once in their app entry point (e.g.
App.tsx) and the entire system starts.

**Phase 4 --- Analysis Engine**

The analysis engine is the core value layer. Each analyzer takes events
from the buffer and returns structured findings. The AnalysisEngine
orchestrates all analyzers.

> **STEP 18 Define analysis result types** \[Phase 4\]

**Add to packages/mcp-server/src/collector/types.ts**

> // ── Analysis Result Types ──────────────────────────────────
>
> export type Severity = \'info\' \| \'warning\' \| \'critical\';
>
> export interface Finding {
>
> severity: Severity;
>
> component?: string;
>
> screen?: string;
>
> title: string;
>
> description: string;
>
> suggestion: string;
>
> data?: Record\<string, unknown\>;
>
> }
>
> export interface ScreenReport {
>
> screen: string;
>
> analysisWindowMs: number;
>
> findings: Finding\[\];
>
> summary: string;
>
> }
>
> **STEP 19 Build RenderAnalyzer** \[Phase 4\]

**File: packages/mcp-server/src/analysis/RenderAnalyzer.ts**

Detects two patterns: components with excessive render frequency, and
components with high render count but low prop-change ratio (unnecessary
renders).

> import { EventBuffer } from \'../collector/EventBuffer\';
>
> import { Finding } from \'../collector/types\';
>
> const HIGH_RENDER_THRESHOLD = 20; // renders in analysis window
>
> const UNNECESSARY_RATIO_THRESHOLD = 0.2; // \<20% prop changes =
> suspicious
>
> export class RenderAnalyzer {
>
> constructor(private buffer: EventBuffer) {}
>
> analyzeFrequency(screen?: string): Finding\[\] {
>
> const renders = this.buffer.getByType(\'render\');
>
> const filtered = screen
>
> ? renders.filter(e =\> e.screen === screen)
>
> : renders;
>
> const countByComponent = new Map\<string, number\>();
>
> filtered.forEach(e =\> {
>
> countByComponent.set(e.component,
>
> (countByComponent.get(e.component) ?? 0) + 1);
>
> });
>
> const findings: Finding\[\] = \[\];
>
> countByComponent.forEach((count, component) =\> {
>
> if (count \>= HIGH_RENDER_THRESHOLD) {
>
> findings.push({
>
> severity: count \> 50 ? \'critical\' : \'warning\',
>
> component,
>
> screen,
>
> title: \`\${component} has high render frequency\`,
>
> description: \`\${component} rendered \${count} times in the analysis
> window.\`,
>
> suggestion: \'Check for unnecessary context subscriptions or unstable
> prop references.\',
>
> data: { renderCount: count },
>
> });
>
> }
>
> });
>
> return findings;
>
> }
>
> analyzeUnnecessaryRenders(componentName?: string): Finding\[\] {
>
> const checks = this.buffer.getByType(\'render_check\');
>
> const filtered = componentName
>
> ? checks.filter(e =\> e.component === componentName)
>
> : checks;
>
> const findings: Finding\[\] = \[\];
>
> const components = \[\...new Set(filtered.map(e =\> e.component))\];
>
> components.forEach(component =\> {
>
> const compChecks = filtered.filter(e =\> e.component === component);
>
> const total = compChecks.length;
>
> const changed = compChecks.filter(e =\> e.propsChanged).length;
>
> const ratio = total \> 0 ? changed / total : 1;
>
> if (total \>= 10 && ratio \< UNNECESSARY_RATIO_THRESHOLD) {
>
> findings.push({
>
> severity: \'warning\',
>
> component,
>
> title: \`\${component} has unnecessary renders\`,
>
> description: \`\${component} rendered \${total} times but props
> changed only \${changed} times (\${Math.round(ratio \* 100)}%).\`,
>
> suggestion: \`Wrap \${component} with React.memo() to prevent renders
> when props are unchanged.\`,
>
> data: { total, changed, unchangedRatio: 1 - ratio },
>
> });
>
> }
>
> });
>
> return findings;
>
> }
>
> }
>
> **STEP 20 Build CascadeAnalyzer** \[Phase 4\]

**File: packages/mcp-server/src/analysis/CascadeAnalyzer.ts**

Detects render cascades by finding clusters of render events that occur
within a tight time window (50ms) and involve 3 or more different
components. Infers that the first component in the cluster is the
trigger.

> import { EventBuffer } from \'../collector/EventBuffer\';
>
> import { Finding } from \'../collector/types\';
>
> const CASCADE_WINDOW_MS = 50;
>
> const CASCADE_MIN_COMPONENTS = 3;
>
> export class CascadeAnalyzer {
>
> constructor(private buffer: EventBuffer) {}
>
> detectCascades(screen?: string): Finding\[\] {
>
> const renders = this.buffer.getByType(\'render\');
>
> const filtered = screen
>
> ? renders.filter(e =\> e.screen === screen)
>
> : renders;
>
> if (filtered.length \< CASCADE_MIN_COMPONENTS) return \[\];
>
> const sorted = \[\...filtered\].sort((a, b) =\> a.timestamp -
> b.timestamp);
>
> const findings: Finding\[\] = \[\];
>
> let i = 0;
>
> while (i \< sorted.length) {
>
> const window: typeof sorted = \[\];
>
> const start = sorted\[i\].timestamp;
>
> let j = i;
>
> while (j \< sorted.length && sorted\[j\].timestamp - start \<=
> CASCADE_WINDOW_MS) {
>
> window.push(sorted\[j\]);
>
> j++;
>
> }
>
> const unique = new Set(window.map(e =\> e.component));
>
> if (unique.size \>= CASCADE_MIN_COMPONENTS) {
>
> const chain = \[\...unique\].join(\' → \');
>
> findings.push({
>
> severity: unique.size \> 5 ? \'critical\' : \'warning\',
>
> screen,
>
> title: \'Render cascade detected\',
>
> description: \`\${unique.size} components rendered within
> \${CASCADE_WINDOW_MS}ms: \${chain}\`,
>
> suggestion: \'Check if the first component in the chain is triggering
> unnecessary context updates.\',
>
> data: { chain: \[\...unique\], windowMs: CASCADE_WINDOW_MS,
> componentCount: unique.size },
>
> });
>
> i = j; // skip past this cascade
>
> } else {
>
> i++;
>
> }
>
> }
>
> return findings;
>
> }
>
> }
>
> **STEP 21 Build NetworkAnalyzer** \[Phase 4\]

**File: packages/mcp-server/src/analysis/NetworkAnalyzer.ts**

> import { EventBuffer } from \'../collector/EventBuffer\';
>
> import { Finding } from \'../collector/types\';
>
> const SLOW_REQUEST_THRESHOLD_MS = 1000;
>
> const DUPLICATE_WINDOW_MS = 2000;
>
> export class NetworkAnalyzer {
>
> constructor(private buffer: EventBuffer) {}
>
> detectDuplicates(): Finding\[\] {
>
> const events = this.buffer.getByType(\'network\');
>
> const findings: Finding\[\] = \[\];
>
> // Group by URL + method
>
> const groups = new Map\<string, typeof events\>();
>
> events.forEach(e =\> {
>
> const key = \`\${e.method}:\${e.url}\`;
>
> if (!groups.has(key)) groups.set(key, \[\]);
>
> groups.get(key)!.push(e);
>
> });
>
> groups.forEach((calls, key) =\> {
>
> const sorted = \[\...calls\].sort((a, b) =\> a.timestamp -
> b.timestamp);
>
> // Find calls within DUPLICATE_WINDOW_MS of each other
>
> for (let i = 0; i \< sorted.length - 1; i++) {
>
> const gap = sorted\[i + 1\].timestamp - sorted\[i\].timestamp;
>
> if (gap \< DUPLICATE_WINDOW_MS) {
>
> findings.push({
>
> severity: \'warning\',
>
> title: \'Duplicate network call detected\',
>
> description: \`\${key} was called \${calls.length} times, with calls
> \${gap}ms apart.\`,
>
> suggestion: \'Add request deduplication, caching, or check for
> duplicate useEffect dependencies.\',
>
> data: { url: sorted\[0\].url, callCount: calls.length, gapMs: gap },
>
> });
>
> break; // one finding per URL
>
> }
>
> }
>
> });
>
> return findings;
>
> }
>
> detectSlowRequests(): Finding\[\] {
>
> const events = this.buffer.getByType(\'network\');
>
> return events
>
> .filter(e =\> e.duration \> SLOW_REQUEST_THRESHOLD_MS)
>
> .map(e =\> ({
>
> severity: \'warning\' as const,
>
> title: \'Slow network request\',
>
> description: \`\${e.method} \${e.url} took \${e.duration}ms.\`,
>
> suggestion: \'Consider adding a loading state, caching the result, or
> paginating the response.\',
>
> data: { url: e.url, duration: e.duration },
>
> }));
>
> }
>
> }
>
> **STEP 22 Build JSThreadAnalyzer** \[Phase 4\]

**File: packages/mcp-server/src/analysis/JSThreadAnalyzer.ts**

> import { EventBuffer } from \'../collector/EventBuffer\';
>
> import { Finding } from \'../collector/types\';
>
> const CRITICAL_BLOCK_MS = 200;
>
> export class JSThreadAnalyzer {
>
> constructor(private buffer: EventBuffer) {}
>
> analyze(): Finding\[\] {
>
> const events = this.buffer.getByType(\'js_block\');
>
> if (events.length === 0) return \[\];
>
> const maxDelay = Math.max(\...events.map(e =\> e.delay));
>
> const avgDelay = events.reduce((s, e) =\> s + e.delay, 0) /
> events.length;
>
> return \[{
>
> severity: maxDelay \> CRITICAL_BLOCK_MS ? \'critical\' : \'warning\',
>
> title: \'JS thread blocking detected\',
>
> description: \`JS thread blocked \${events.length} times. Max delay:
> \${maxDelay}ms. Average: \${Math.round(avgDelay)}ms.\`,
>
> suggestion: \'Move heavy computations to useMemo, useCallback, or run
> them off the main thread using
> InteractionManager.runAfterInteractions().\',
>
> data: { count: events.length, maxDelay, avgDelay },
>
> }\];
>
> }
>
> }
>
> **STEP 23 Build AnalysisEngine orchestrator** \[Phase 4\]

**File: packages/mcp-server/src/analysis/AnalysisEngine.ts**

> import { EventBuffer } from \'../collector/EventBuffer\';
>
> import { Finding, ScreenReport } from \'../collector/types\';
>
> import { RenderAnalyzer } from \'./RenderAnalyzer\';
>
> import { CascadeAnalyzer } from \'./CascadeAnalyzer\';
>
> import { NetworkAnalyzer } from \'./NetworkAnalyzer\';
>
> import { JSThreadAnalyzer } from \'./JSThreadAnalyzer\';
>
> export class AnalysisEngine {
>
> private render: RenderAnalyzer;
>
> private cascade: CascadeAnalyzer;
>
> private network: NetworkAnalyzer;
>
> private jsThread: JSThreadAnalyzer;
>
> constructor(private buffer: EventBuffer) {
>
> this.render = new RenderAnalyzer(buffer);
>
> this.cascade = new CascadeAnalyzer(buffer);
>
> this.network = new NetworkAnalyzer(buffer);
>
> this.jsThread = new JSThreadAnalyzer(buffer);
>
> }
>
> explainScreen(screen: string): ScreenReport {
>
> const findings: Finding\[\] = \[
>
> \...this.render.analyzeFrequency(screen),
>
> \...this.cascade.detectCascades(screen),
>
> \...this.jsThread.analyze(),
>
> \];
>
> findings.sort((a, b) =\> {
>
> const order = { critical: 0, warning: 1, info: 2 };
>
> return order\[a.severity\] - order\[b.severity\];
>
> });
>
> return {
>
> screen,
>
> analysisWindowMs: this.buffer\[\'config\'\]?.maxAgeMs ?? 300000,
>
> findings,
>
> summary: this.buildSummary(screen, findings),
>
> };
>
> }
>
> detectUnnecessaryRenders(component?: string): Finding\[\] {
>
> return this.render.analyzeUnnecessaryRenders(component);
>
> }
>
> detectCascades(screen?: string): Finding\[\] {
>
> return this.cascade.detectCascades(screen);
>
> }
>
> getSlowComponents(): Finding\[\] {
>
> const times = this.buffer.getByType(\'render_time\');
>
> const byComponent = new Map\<string, number\[\]\>();
>
> times.forEach(e =\> {
>
> if (!byComponent.has(e.component)) byComponent.set(e.component, \[\]);
>
> byComponent.get(e.component)!.push(e.duration);
>
> });
>
> const findings: Finding\[\] = \[\];
>
> byComponent.forEach((durations, component) =\> {
>
> const avg = durations.reduce((s, d) =\> s + d, 0) / durations.length;
>
> if (avg \> 16) {
>
> findings.push({
>
> severity: avg \> 50 ? \'critical\' : \'warning\',
>
> component,
>
> title: \`\${component} renders slowly\`,
>
> description: \`Average render duration: \${Math.round(avg)}ms over
> \${durations.length} renders.\`,
>
> suggestion: \'Profile the component internals. Look for expensive
> computations that can be moved to useMemo.\',
>
> data: { avgMs: avg, samples: durations.length },
>
> });
>
> }
>
> });
>
> return findings.sort((a, b) =\>
>
> (b.data?.avgMs as number ?? 0) - (a.data?.avgMs as number ?? 0)
>
> );
>
> }
>
> detectDuplicateNetworkCalls(): Finding\[\] {
>
> return this.network.detectDuplicates();
>
> }
>
> private buildSummary(screen: string, findings: Finding\[\]): string {
>
> if (findings.length === 0) {
>
> return \`\${screen}: No significant performance issues detected.\`;
>
> }
>
> const critical = findings.filter(f =\> f.severity ===
> \'critical\').length;
>
> const warnings = findings.filter(f =\> f.severity ===
> \'warning\').length;
>
> return \`\${screen}: \${critical} critical issue(s), \${warnings}
> warning(s). Top issue: \${findings\[0\].title}.\`;
>
> }
>
> }

**Phase 5 --- MCP Server and Tools**

> **STEP 24 Build MCP tool implementations** \[Phase 5\]

**File: packages/mcp-server/src/mcp/tools/explainScreenPerformance.ts**

> import { z } from \'zod\';
>
> import { AnalysisEngine } from \'../../analysis/AnalysisEngine\';
>
> export const explainScreenPerformanceSchema = z.object({
>
> screen: z.string().describe(\'The screen name to analyze (e.g.
> \"ProductScreen\")\'),
>
> });
>
> export function explainScreenPerformance(
>
> engine: AnalysisEngine,
>
> input: z.infer\<typeof explainScreenPerformanceSchema\>
>
> ): string {
>
> const report = engine.explainScreen(input.screen);
>
> if (report.findings.length === 0) {
>
> return \`No performance issues detected for \${input.screen} in the
> current analysis window.\`;
>
> }
>
> const lines = \[report.summary, \'\'\];
>
> report.findings.forEach((f, i) =\> {
>
> lines.push(\`\[\${f.severity.toUpperCase()}\] \${i + 1}.
> \${f.title}\`);
>
> lines.push(\` \${f.description}\`);
>
> lines.push(\` Suggestion: \${f.suggestion}\`);
>
> lines.push(\'\');
>
> });
>
> return lines.join(\'\\n\');
>
> }

Create the same pattern for each remaining tool. Each tool file exports:
a Zod schema for input validation, and a function that takes (engine,
input) and returns a formatted string.

**File: packages/mcp-server/src/mcp/tools/detectUnnecessaryRenders.ts**

-   Schema: { component: z.string().optional() }

-   Calls engine.detectUnnecessaryRenders(input.component)

-   Returns formatted findings or \'No unnecessary renders detected\'

**File: packages/mcp-server/src/mcp/tools/detectRenderCascade.ts**

-   Schema: { screen: z.string().optional() }

-   Calls engine.detectCascades(input.screen)

**File: packages/mcp-server/src/mcp/tools/getSlowComponents.ts**

-   Schema: {} (no input)

-   Calls engine.getSlowComponents()

**File:
packages/mcp-server/src/mcp/tools/detectDuplicateNetworkCalls.ts**

-   Schema: {} (no input)

-   Calls engine.detectDuplicateNetworkCalls()

> **STEP 25 Build McpServer** \[Phase 5\]

**File: packages/mcp-server/src/mcp/McpServer.ts**

Wires all tools into the MCP SDK. Each tool is registered with its
schema and handler function.

> import { McpServer as BaseMcpServer } from
> \'@modelcontextprotocol/sdk/server/mcp.js\';
>
> import { StdioServerTransport } from
> \'@modelcontextprotocol/sdk/server/stdio.js\';
>
> import { AnalysisEngine } from \'../analysis/AnalysisEngine\';
>
> import {
>
> explainScreenPerformanceSchema,
>
> explainScreenPerformance,
>
> } from \'./tools/explainScreenPerformance\';
>
> import {
>
> detectUnnecessaryRendersSchema,
>
> detectUnnecessaryRenders,
>
> } from \'./tools/detectUnnecessaryRenders\';
>
> // \... import remaining tools
>
> export async function startMcpServer(engine: AnalysisEngine):
> Promise\<void\> {
>
> const server = new BaseMcpServer({
>
> name: \'rn-debug-mcp\',
>
> version: \'0.1.0\',
>
> });
>
> server.tool(
>
> \'explainScreenPerformance\',
>
> \'Explains why a React Native screen may be performing poorly.\',
>
> explainScreenPerformanceSchema.shape,
>
> async ({ screen }) =\> ({
>
> content: \[{ type: \'text\', text: explainScreenPerformance(engine, {
> screen }) }\]
>
> })
>
> );
>
> server.tool(
>
> \'detectUnnecessaryRenders\',
>
> \'Detects components that re-render when props have not changed.\',
>
> detectUnnecessaryRendersSchema.shape,
>
> async ({ component }) =\> ({
>
> content: \[{ type: \'text\', text: detectUnnecessaryRenders(engine, {
> component }) }\]
>
> })
>
> );
>
> // Register detectRenderCascade, getSlowComponents,
> detectDuplicateNetworkCalls
>
> // using the same pattern
>
> const transport = new StdioServerTransport();
>
> await server.connect(transport);
>
> console.error(\'\[MCP\] Server running on stdio\');
>
> }
>
> **STEP 26 Build main entry point** \[Phase 5\]

**File: packages/mcp-server/src/index.ts**

> import { EventBuffer } from \'./collector/EventBuffer\';
>
> import { EventCollector } from \'./collector/EventCollector\';
>
> import { AnalysisEngine } from \'./analysis/AnalysisEngine\';
>
> import { createWebSocketServer } from \'./transport/WebSocketServer\';
>
> import { createHttpServer } from \'./transport/HttpServer\';
>
> import { startMcpServer } from \'./mcp/McpServer\';
>
> const WS_PORT = parseInt(process.env.WS_PORT ?? \'4567\');
>
> const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? \'4568\');
>
> const buffer = new EventBuffer({ maxSize: 5000, maxAgeMs: 5 \* 60 \*
> 1000 });
>
> const collector = new EventCollector(buffer);
>
> const engine = new AnalysisEngine(buffer);
>
> createWebSocketServer(WS_PORT, collector);
>
> createHttpServer(HTTP_PORT, collector);
>
> startMcpServer(engine);
>
> console.error(\`\[RN Debug MCP\] Ready. WS:\${WS_PORT}
> HTTP:\${HTTP_PORT}\`);

**Acceptance criteria**

-   Server starts without errors

-   WS server is listening on port 4567

-   HTTP server returns 200 on GET /health at port 4568

-   MCP tools are accessible via stdio from Cursor

**Phase 6 --- Babel Auto-Instrumentation Plugin**

> **RISK:** This is the highest-risk phase. Scope v1 carefully. The
> plugin only needs to handle standard function components. Skip HOCs,
> forwardRef, and memo-wrapped components for now.
>
> **STEP 27 Build isComponent utility** \[Phase 6\]

**File: packages/babel-plugin/src/utils/isComponent.js**

A function component in React must: have a name starting with an
uppercase letter, and return JSX (or null). This heuristic is good
enough for v1.

> const t = require(\'@babel/types\');
>
> function isComponent(node, name) {
>
> // Must have a name starting with uppercase
>
> if (!name \|\| !/\^\[A-Z\]/.test(name)) return false;
>
> // Must be a function
>
> if (
>
> !t.isFunctionDeclaration(node) &&
>
> !t.isFunctionExpression(node) &&
>
> !t.isArrowFunctionExpression(node)
>
> ) return false;
>
> // Skip if it has no body (expression arrow with no JSX check
> possible)
>
> if (!node.body) return false;
>
> return true;
>
> }
>
> module.exports = { isComponent };
>
> **STEP 28 Build plugin entry point** \[Phase 6\]

**File: packages/babel-plugin/src/index.js**

The plugin visits every function declaration and arrow function. For
those that match the isComponent heuristic, it injects a
useRenderTracker() call at the top of the function body.

> const { declare } = require(\'@babel/helper-plugin-utils\');
>
> const t = require(\'@babel/types\');
>
> const { isComponent } = require(\'./utils/isComponent\');
>
> module.exports = declare((api) =\> {
>
> api.assertVersion(7);
>
> return {
>
> name: \'rn-debug-mcp\',
>
> visitor: {
>
> // Named function declarations: function ProductList() { \... }
>
> FunctionDeclaration(path) {
>
> const name = path.node.id?.name;
>
> if (!isComponent(path.node, name)) return;
>
> injectTracker(path.get(\'body\'), name);
>
> },
>
> // Variable declarations: const ProductList = () =\> { \... }
>
> VariableDeclarator(path) {
>
> const name = path.node.id?.name;
>
> const init = path.node.init;
>
> if (!init) return;
>
> if (!isComponent(init, name)) return;
>
> const body = t.isBlockStatement(init.body)
>
> ? path.get(\'init.body\')
>
> : null;
>
> if (body) injectTracker(body, name);
>
> },
>
> },
>
> };
>
> });
>
> function injectTracker(bodyPath, componentName) {
>
> // Avoid double-injection
>
> const first = bodyPath.node.body\[0\];
>
> if (
>
> first &&
>
> t.isExpressionStatement(first) &&
>
> t.isCallExpression(first.expression) &&
>
> first.expression.callee.name === \'useRenderTracker\'
>
> ) return;
>
> const trackerCall = t.expressionStatement(
>
> t.callExpression(t.identifier(\'useRenderTracker\'), \[
>
> t.stringLiteral(componentName),
>
> \])
>
> );
>
> bodyPath.unshiftContainer(\'body\', trackerCall);
>
> }

**Acceptance criteria**

-   A file containing function ProductList() {} is transformed to have
    useRenderTracker(\'ProductList\') as the first line of the body

-   A file with const Nav = () =\> {} is also instrumented

-   Lowercase functions like function helper() {} are NOT instrumented

-   Running the plugin twice on the same file does not inject the
    tracker twice

> **STEP 29 Wire Babel plugin into example-app** \[Phase 6\]

**File: example-app/babel.config.js**

> module.exports = {
>
> presets: \[\'module:@react-native/babel-preset\'\],
>
> plugins: \[
>
> // Only active in dev mode
>
> \...(process.env.NODE_ENV !== \'production\'
>
> ? \[\'babel-plugin-rn-debug-mcp\'\]
>
> : \[\]),
>
> \],
>
> };

**File: example-app/index.js (or App.tsx) --- add at the top**

> import { initDebugMCP } from \'@rn-debug-mcp/instrumentation\';
>
> if (\_\_DEV\_\_) {
>
> initDebugMCP({ wsUrl: \'ws://localhost:4567\' });
>
> }

**Phase 7 --- Cursor Integration**

> **STEP 30 Create MCP configuration for Cursor** \[Phase 7\]

**File: .cursor/mcp.json (at repo root)**

> {
>
> \"mcpServers\": {
>
> \"rn-debug-mcp\": {
>
> \"command\": \"node\",
>
> \"args\": \[\"packages/mcp-server/dist/index.js\"\],
>
> \"description\": \"React Native runtime debugging assistant\"
>
> }
>
> }
>
> }

After building the project (npm run build from root), restart Cursor.
The five MCP tools will appear in the tools panel.

**Acceptance criteria**

-   Cursor shows rn-debug-mcp in the MCP tools list

-   Calling explainScreenPerformance with a screen name returns a
    formatted string (even if empty, when no events have been collected)

-   Starting the RN app and navigating around populates the event
    buffer, and subsequent tool calls return real findings

**3. Testing Strategy**

Each layer should be testable in isolation. Use Jest for the server-side
packages.

**Unit Tests --- EventBuffer**

> // Test: eviction by age
>
> const buf = new EventBuffer({ maxAgeMs: 100 });
>
> buf.push({ type: \'render\', component: \'A\', timestamp: Date.now() -
> 200 });
>
> expect(buf.getAll()).toHaveLength(0); // evicted
>
> // Test: eviction by size
>
> const buf2 = new EventBuffer({ maxSize: 2 });
>
> buf2.push({ type: \'render\', component: \'A\', timestamp: Date.now()
> });
>
> buf2.push({ type: \'render\', component: \'B\', timestamp: Date.now()
> });
>
> buf2.push({ type: \'render\', component: \'C\', timestamp: Date.now()
> });
>
> expect(buf2.size()).toBe(2); // oldest dropped

**Unit Tests --- RenderAnalyzer**

> // Test: high frequency detection
>
> const buf = new EventBuffer();
>
> for (let i = 0; i \< 25; i++) {
>
> buf.push({ type: \'render\', component: \'ProductList\', timestamp:
> Date.now() });
>
> }
>
> const analyzer = new RenderAnalyzer(buf);
>
> const findings = analyzer.analyzeFrequency();
>
> expect(findings).toHaveLength(1);
>
> expect(findings\[0\].component).toBe(\'ProductList\');
>
> // Test: unnecessary render detection
>
> for (let i = 0; i \< 15; i++) {
>
> buf.push({ type: \'render_check\', component: \'Item\',
>
> propsChanged: i \< 2, timestamp: Date.now() });
>
> }
>
> const unnecessary = analyzer.analyzeUnnecessaryRenders(\'Item\');
>
> expect(unnecessary\[0\].suggestion).toContain(\'React.memo\');

**Integration Test --- End to End**

Write a test that: starts the MCP server, connects a mock WebSocket
client, sends a batch of render events, calls the
explainScreenPerformance tool via the HTTP debug endpoint, and asserts
the response contains at least one finding.

> // pseudocode --- implement with Jest + ws client
>
> const ws = new WebSocket(\'ws://localhost:4567\');
>
> ws.onopen = () =\> {
>
> for (let i = 0; i \< 25; i++) {
>
> ws.send(JSON.stringify({
>
> type: \'render\',
>
> component: \'ProductList\',
>
> screen: \'HomeScreen\',
>
> timestamp: Date.now()
>
> }));
>
> }
>
> };
>
> // Then call MCP tool and assert findings

**4. Phase 2 and Phase 3 Additions**

After Phase 1 is complete and tested, the following features can be
added without restructuring the existing code.

**Phase 2 Additions**

-   Add render_time events to the Babel plugin by wrapping the component
    body with performance.now() calls

-   Add screen tracking --- emit a navigation event when React
    Navigation focus/blur fires

-   Expose getSlowComponents tool (already implemented in
    AnalysisEngine, just needs to be confirmed working with real
    render_time data)

-   Add a getRenderGraph tool that returns the cascade chain as a JSON
    adjacency list for visualization

**Phase 3 Additions**

-   Add a baseline snapshot tool that saves current render counts as a
    baseline

-   Add a compareToBaseline tool that compares current counts against
    the saved baseline (regression detection)

-   Add architectural lint rules --- e.g. flag components with more than
    10 direct children, or context providers with more than 5 consumers

-   Add a getScreenTimeline tool that returns a chronological list of
    all events for a screen, formatted as a readable trace

**5. Known Risks and Mitigations**

  -------------------------- --------------------------------------------
  **Risk**                   **Mitigation**

  Babel plugin breaks        Scope v1 to function declarations and arrow
  unusual component patterns functions with block bodies only. Add an
                             opt-out comment: /\* rn-debug-mcp-ignore \*/

  Event volume saturates the 16ms client-side dedup + 200-event client
  WebSocket                  queue cap. Batch send instead of one message
                             per event.

  useRenderCheck adds        Do not inject useRenderCheck via Babel. Only
  overhead on every render   use it manually on components already
                             flagged by render frequency analysis.

  Instrumentation ships to   All code is gated behind \_\_DEV\_\_ check
  production                 in config.ts. Babel plugin is conditionally
                             applied only when NODE_ENV !==
                             \'production\'.

  MCP server port conflicts  Make both WS_PORT and HTTP_PORT configurable
                             via environment variables. Default
                             4567/4568.
  -------------------------- --------------------------------------------

**6. Prompt for Your IDE Agent**

Copy the text below and paste it directly into your IDE agent as the
opening prompt:

> *You are going to build the rn-debug-mcp project from scratch. This is
> a monorepo with three packages: \@rn-debug-mcp/mcp-server
> (Node.js/TypeScript), \@rn-debug-mcp/instrumentation (React Native
> library), and babel-plugin-rn-debug-mcp (Babel AST plugin). Follow the
> implementation plan exactly, working through each numbered step
> sequentially. Before starting any step, state which step you are on
> and its acceptance criteria. After completing each step, verify
> acceptance criteria explicitly before proceeding. Do not skip steps or
> refactor prematurely. Order: types first (Step 5), server buffer and
> collector (Steps 6-7), transport (Steps 8-10), client instrumentation
> (Steps 11-17), analysis engine (Steps 18-23), MCP tools (Steps 24-26),
> Babel plugin (Steps 27-29), Cursor integration (Step 30). Ask for
> clarification if any step is ambiguous before writing code.*

rn-debug-mcp Implementation Plan • v1.0 • 30 Steps across 7 Phases
