import { NextRequest } from 'next/server';
import { createAdminClient } from '@/server/db/client';
import { executeTool, getToolDefinitions, getPromptDefinitions, getPrompt } from '@/server/services/mcp.service';

export const bodySizeLimit = '4mb';

// ---- Auth ----

function isApiKey(token: string): boolean {
  return token.startsWith('sk-');
}

async function authenticate(req: NextRequest): Promise<{ authorized: boolean; error?: Response }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { authorized: false, error: Response.json({ error: { code: -32001, message: 'Authentication required' } }, { status: 401 }) };
  }
  const scheme = authHeader.slice(0, authHeader.indexOf(' '));
  if (scheme.toLowerCase() !== 'bearer') {
    return { authorized: false, error: Response.json({ error: { code: -32001, message: 'Bearer token required' } }, { status: 401 }) };
  }
  const token = authHeader.slice(scheme.length + 1).trim();
  if (!token) {
    return { authorized: false, error: Response.json({ error: { code: -32001, message: 'Empty token' } }, { status: 401 }) };
  }
  if (isApiKey(token)) {
    const supabase = createAdminClient();
    const { data } = await supabase.from('site_config').select('value').eq('key', 'mcp_api_key').single();
    if (!data?.value || token !== data.value) {
      return { authorized: false, error: Response.json({ error: { code: -32001, message: 'Invalid API key' } }, { status: 401 }) };
    }
    return { authorized: true };
  }
  const supabase = createAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { authorized: false, error: Response.json({ error: { code: -32001, message: 'Invalid OAuth token' } }, { status: 401 }) };
  }
  return { authorized: true };
}

// ---- POST: Streamable HTTP (JSON responses) ----

export async function POST(req: NextRequest) {
  const { authorized, error } = await authenticate(req);
  if (!authorized) return error!;

  let body: any;
  try { body = await req.json(); } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 });
  }

  const { id, method, params } = body;

  if (id === undefined || id === null) {
    if (method === 'notifications/initialized') return new Response(null, { status: 202 });
    return new Response(null, { status: 202 });
  }

  try {
    switch (method) {
      case 'initialize':
        return Response.json({
          jsonrpc: '2.0', id,
          result: { protocolVersion: '2025-03-26', capabilities: { tools: {}, prompts: {} }, serverInfo: { name: 'quick-press_mcp', version: '0.1.0' } },
        });
      case 'tools/list':
        return Response.json({ jsonrpc: '2.0', id, result: { tools: getToolDefinitions() } });
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        if (!name) return Response.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing tool name' } }, { status: 400 });
        const toolResult = await executeTool(name, args || {});
        return Response.json({
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult) }] },
        });
      }
      case 'prompts/list':
        return Response.json({ jsonrpc: '2.0', id, result: { prompts: getPromptDefinitions() } });
      case 'prompts/get': {
        const { name, arguments: args } = params || {};
        if (!name) return Response.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing prompt name' } }, { status: 400 });
        const promptResult = getPrompt(name, args || {});
        if (!promptResult) return Response.json({ jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown prompt: ${name}` } }, { status: 404 });
        return Response.json({ jsonrpc: '2.0', id, result: promptResult });
      }
      default:
        return Response.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } }, { status: 404 });
    }
  } catch (e: any) {
    return Response.json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32603, message: e.message || 'Internal error' } }, { status: 500 });
  }
}

// ---- GET: Streamable HTTP server→client ----

export async function GET(req: NextRequest) {
  const { authorized, error } = await authenticate(req);
  if (!authorized) return error!;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(': connected\n\n'));
      const keepAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch {}
      }, 30000);
      req.signal.addEventListener('abort', () => { clearInterval(keepAlive); try { controller.close(); } catch {} });
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}

// ---- DELETE / OPTIONS ----

export async function DELETE(req: NextRequest) {
  const { authorized, error } = await authenticate(req);
  if (!authorized) return error!;
  return new Response(null, { status: 204 });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID, Accept',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    },
  });
}
