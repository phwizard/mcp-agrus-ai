/**
 * Vercel serverless entry for the Agrus MCP server.
 *
 * Bridges Vercel's Node-style (req, res) signature to the SDK's
 * WebStandardStreamableHTTPServerTransport, which speaks Web Request/Response.
 *
 * We avoid Edge runtime because the MCP SDK currently uses Node-only modules
 * that the Edge bundler rejects. Node runtime gives us full SDK access plus
 * env vars (HUBSPOT_PRIVATE_APP_TOKEN) that the write tools need.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { tools } from "../src/tools/index.js";

export const config = {
  runtime: "nodejs",
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

// Build a Web `Request` from a Node IncomingMessage. We buffer the body
// upfront — fine for JSON-RPC payloads which are small.
async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const host = (req.headers.host as string | undefined) ?? "mcp.agrus.ai";
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const fullUrl = `${proto}://${host}${req.url ?? "/"}`;

  // Collect Node headers into a Web Headers
  const webHeaders = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) webHeaders.append(k, String(item));
    } else {
      webHeaders.set(k, String(v));
    }
  }

  const init: RequestInit = { method: req.method ?? "GET", headers: webHeaders };
  if (req.method && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
    }
    init.body = Buffer.concat(chunks);
    // @ts-expect-error -- duplex is required when sending a body with Web fetch in Node
    init.duplex = "half";
  }

  return new Request(fullUrl, init);
}

// Pipe a Web Response back to the Node ServerResponse.
async function sendWebResponse(webRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    // Skip headers Node will set itself or that are SSE-incompatible
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });

  if (!webRes.body) {
    res.end();
    return;
  }

  const reader = webRes.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

function corsHeaders(originHeader: string | string[] | undefined): Record<string, string> {
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const origin = req.headers.origin as string | undefined;
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    res.statusCode = 204;
    res.end();
    return;
  }

  // Friendly GET on the root tells humans + scrapers what this is.
  // Real MCP clients always send Mcp-Protocol-Version + Accept: text/event-stream.
  const accept = (req.headers.accept as string | undefined) ?? "";
  if (
    req.method === "GET" &&
    !req.headers["mcp-protocol-version"] &&
    !accept.includes("text/event-stream")
  ) {
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify(
        {
          name: SERVER_NAME,
          version: SERVER_VERSION,
          description: "Agrus.ai MCP server — public, 6 read tools + 1 write tool.",
          protocol: "MCP Streamable HTTP (2024-11-05)",
          tools: tools.map((t) => t.name),
          manifest: "https://mcp.agrus.ai/.well-known/mcp.json",
          docs: "https://github.com/phwizard/mcp-agrus-ai",
          site: "https://agrus.ai",
        },
        null,
        2,
      ),
    );
    return;
  }

  try {
    const server = await buildServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);

    const webRequest = await toWebRequest(req);
    const webResponse = await transport.handleRequest(webRequest);

    // Layer CORS onto the SDK response
    for (const [k, v] of Object.entries(cors)) {
      if (!webResponse.headers.has(k)) webResponse.headers.set(k, v);
    }
    await sendWebResponse(webResponse, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[agrus mcp] handler error:", err);
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data: err instanceof Error ? err.message : String(err),
        },
        id: null,
      }),
    );
  }
}
