#!/usr/bin/env node
/**
 * Agrus.ai MCP server — stdio entry point.
 *
 * Exposes five read-only tools that let AI agents engage Agrus.ai
 * programmatically. Designed to be installed in a Claude Desktop (or other
 * MCP client) `mcpServers` configuration, or run as a hosted HTTP+SSE
 * service (Phase-2; see src/transports/http.ts when added).
 *
 * IMPORTANT (stdio transport): stdout carries MCP protocol traffic only.
 * All logging must go to stderr.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools/index.js";

const SERVER_NAME = "agrus";
const SERVER_VERSION = "0.1.0";

async function main(): Promise<void> {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
      },
    },
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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  process.stderr.write(
    `[${SERVER_NAME}] MCP server started — ${tools.length} tools registered (${tools
      .map((t) => t.name)
      .join(", ")})\n`,
  );

  // Graceful shutdown
  const shutdown = (signal: string) => {
    process.stderr.write(`[${SERVER_NAME}] ${signal} received, shutting down\n`);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  process.stderr.write(`[${SERVER_NAME}] Fatal error: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
