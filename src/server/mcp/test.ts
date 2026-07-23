import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

export async function handle(req: Request): Promise<Response> {
  try {
    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
    });

    const server = new McpServer({ name: 'test', version: '1.0' });

    const body = await req.json();
    if (body.method === 'initialize') {
      await server.connect(transport);
    }

    const resp = await transport.handleRequest(req);
    return resp;
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
