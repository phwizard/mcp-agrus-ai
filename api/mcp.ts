/**
 * Vercel serverless entry for the Agrus MCP server.
 *
 * Uses the SDK's WebStandardStreamableHTTPServerTransport which speaks
 * fetch-style Request/Response — same shape Vercel's serverless platform
 * uses for non-Next.js projects. Runs on Node 22 so we have full Web APIs
 * plus access to env vars (HUBSPOT_PRIVATE_APP_TOKEN) that the write
 * tools need.
 *
 * Each HTTP request creates a fresh McpServer + stateless transport.
 * Stateless mode keeps things serverless-friendly: no session state to
 * persist between function invocations. Cost: clients can't use the
 * resumable SSE features, which we don't need for our read-mostly tool set.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { tools } from "../src/tools/index.js";

export const config = {
  runtime: "nodejs22.x",
  maxDuration: 30,
};

const SERVER_NAME = "agrus";
const SERVER_VERSION = "0.2.0";

async function buildServer(): Promise<McpServer> {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Parameters<typeof server.registerTool>[1]["inputSchema"],
      },
      tool.handler as Parameters<typeof server.registerTool>[2],
    );
  }

  return server;
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  // Friendly GET on the root tells humans + scrapers what this is.
  // Real MCP clients always send Mcp-Protocol-Version + Accept: text/event-stream.
  const url = new URL(req.url);
  const accept = req.headers.get("accept") ?? "";
  if (
    req.method === "GET" &&
    !req.headers.has("Mcp-Protocol-Version") &&
    !accept.includes("text/event-stream") &&
    (url.pathname === "/mcp" || url.pathname === "/api/mcp")
  ) {
    return Response.json(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: "Agrus.ai MCP server — public, read-only + 2 write tools.",
        protocol: "MCP Streamable HTTP",
        tools: tools.map((t) => t.name),
        manifest: "https://mcp.agrus.ai/.well-known/mcp.json",
        docs: "https://github.com/phwizard/mcp-agrus-ai",
        site: "https://agrus.ai",
      },
      { headers: corsHeaders(req) },
    );
  }

  try {
    const server = await buildServer();
    // Stateless mode: no session ID — each request fully self-contained.
    // sessionIdGenerator: undefined → stateless per SDK docs.
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    const response = await transport.handleRequest(req);

    // Merge CORS onto the SDK response
    const merged = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders(req))) {
      merged.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: merged,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[agrus mcp] handler error:", err);
    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data: err instanceof Error ? err.message : String(err),
        },
        id: null,
      },
      { status: 500, headers: corsHeaders(req) },
    );
  }
}
