import { NextRequest } from 'next/server';
import * as configService from '@/server/services/site-config.service';
import { getToolDefinitions, executeTool } from '@/server/services/mcp.service';

interface JsonRpcRequest {
  jsonrpc: string;
  id?: number | string;
  method: string;
  params?: any;
}

async function authenticate(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  if (!token) return false;
  const storedKey = await configService.getSiteConfig('mcp_api_key');
  return token === storedKey && !!storedKey;
}

function jsonRpcError(id: number | string | null, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const authenticated = await authenticate(req);
  if (!authenticated) {
    return new Response(sseEvent(jsonRpcError(null, -32001, 'Unauthorized')), {
      status: 401,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(sseEvent(jsonRpcError(null, -32700, 'Parse error')), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const { id, method, params } = body;

  if (!id) {
    // Notification (no response expected)
    if (method === 'notifications/initialized') {
      return new Response(null, { status: 202 });
    }
    return new Response(null, { status: 202 });
  }

  try {
    switch (method) {
      case 'initialize':
        return new Response(sseEvent({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'quick-press_mcp',
              version: '0.1.0',
            },
          },
        }), {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });

      case 'tools/list':
        return new Response(sseEvent({
          jsonrpc: '2.0',
          id,
          result: { tools: getToolDefinitions() },
        }), {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });

      case 'tools/call': {
        const { name, arguments: args } = params || {};
        if (!name) {
          return new Response(sseEvent(jsonRpcError(id, -32602, 'Missing tool name')), {
            status: 400,
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
          });
        }
        const result = await executeTool(name, args || {});
        return new Response(sseEvent({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
              },
            ],
          },
        }), {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });
      }

      default:
        return new Response(sseEvent(jsonRpcError(id, -32601, `Method not found: ${method}`)), {
          status: 404,
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });
    }
  } catch (e: any) {
    return new Response(sseEvent(jsonRpcError(id, -32603, e.message || 'Internal error')), {
      status: 500,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }
}

// MCP clients may use OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
