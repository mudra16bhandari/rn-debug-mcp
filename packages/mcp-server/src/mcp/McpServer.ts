import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AnalysisEngine } from '../analysis/AnalysisEngine';
import {
  explainScreenPerformanceSchema,
  explainScreenPerformance,
} from './tools/explainScreenPerformance';
import {
  detectUnnecessaryRendersSchema,
  detectUnnecessaryRenders,
} from './tools/detectUnnecessaryRenders';
import {
  detectRenderCascadeSchema,
  detectRenderCascade,
} from './tools/detectRenderCascade';
import {
  getSlowComponentsSchema,
  getSlowComponents,
} from './tools/getSlowComponents';
import {
  detectDuplicateNetworkCallsSchema,
  detectDuplicateNetworkCalls,
} from './tools/detectDuplicateNetworkCalls';

export async function startMcpServer(engine: AnalysisEngine): Promise<void> {
  const server = new Server(
    {
      name: 'rn-debug-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define tools
  const tools = [
    {
      name: 'explainScreenPerformance',
      description: 'Explains why a React Native screen may be performing poorly.',
      inputSchema: explainScreenPerformanceSchema.shape as any,
    },
    {
      name: 'detectUnnecessaryRenders',
      description: 'Detects components that re-render when props have not changed.',
      inputSchema: detectUnnecessaryRendersSchema.shape as any,
    },
    {
      name: 'detectRenderCascade',
      description: 'Detects render cascades where multiple components render in quick succession.',
      inputSchema: detectRenderCascadeSchema.shape as any,
    },
    {
      name: 'getSlowComponents',
      description: 'Identifies components with slow render times.',
      inputSchema: getSlowComponentsSchema.shape as any,
    },
    {
      name: 'detectDuplicateNetworkCalls',
      description: 'Detects duplicate network requests made within a short time window.',
      inputSchema: detectDuplicateNetworkCallsSchema.shape as any,
    },
  ];

  // Register tools/list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Register tools/call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'explainScreenPerformance': {
        const input = explainScreenPerformanceSchema.parse(args);
        const result = explainScreenPerformance(engine, input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }
      case 'detectUnnecessaryRenders': {
        const input = detectUnnecessaryRendersSchema.parse(args || {});
        const result = detectUnnecessaryRenders(engine, input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }
      case 'detectRenderCascade': {
        const input = detectRenderCascadeSchema.parse(args || {});
        const result = detectRenderCascade(engine, input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }
      case 'getSlowComponents': {
        const input = getSlowComponentsSchema.parse(args || {});
        const result = getSlowComponents(engine, input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }
      case 'detectDuplicateNetworkCalls': {
        const input = detectDuplicateNetworkCallsSchema.parse(args || {});
        const result = detectDuplicateNetworkCalls(engine, input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[MCP] Server running on stdio');
}

