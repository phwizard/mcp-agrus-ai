/**
 * End-to-end MCP protocol test using InMemoryTransport.
 *
 * Verifies the full stack as a unit:
 *   - McpServer construction from the tool registry
 *   - SDK protocol handshake (initialize)
 *   - tools/list returns all 7 tools with correct names
 *   - tools/call works for each tool (smoke test, not deep behavioural)
 *   - Tool errors surface correctly via MCP error responses
 *
 * The transport is in-process — no stdio, no HTTP — which means this catches
 * any regression in the SDK wiring without environmental noise. Critical for
 * the post-deploy QA story: if this test passes, the same code will work
 * over stdio AND over HTTP.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { tools } from "../../src/tools/index.js";

let server: McpServer;
let client: Client;

beforeAll(async () => {
  // Construct the server exactly like api/mcp.ts and src/index.ts do
  server = new McpServer(
    { name: "agrus", version: "0.2.0-test" },
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

  // Linked in-memory transports: one for the server, one for the client
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  client = new Client({ name: "agrus-e2e-test", version: "0.0.1" });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
  await server.close();
});

describe("MCP protocol handshake", () => {
  it("returns the negotiated protocol version + server info", async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe("agrus");
    expect(info?.version).toBe("0.2.0-test");
  });

  it("server capabilities include tools", () => {
    const caps = client.getServerCapabilities();
    expect(caps?.tools).toBeTruthy();
  });
});

describe("tools/list", () => {
  it("returns all 7 registered tools with no extras", async () => {
    const { tools: listed } = await client.listTools();
    expect(listed).toHaveLength(7);

    const names = listed.map((t) => t.name).sort();
    expect(names).toEqual([
      "get_case_study",
      "list_services",
      "list_verticals",
      "query_compliance_position",
      "request_proposal",
      "request_quote",
      "scope_poc",
    ]);
  });

  it("each tool has a description and an input schema", async () => {
    const { tools: listed } = await client.listTools();
    for (const t of listed) {
      expect(t.description, `${t.name} description`).toBeTruthy();
      expect(t.inputSchema, `${t.name} schema`).toBeTruthy();
      expect((t.inputSchema as Record<string, unknown>).type).toBe("object");
    }
  });
});

describe("tools/call — read tools (no side effects)", () => {
  it("list_services returns text content with the service catalog", async () => {
    const result = await client.callTool({ name: "list_services", arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].type).toBe("text");
    const payload = JSON.parse(content[0].text);
    expect((payload.services as unknown[]).length).toBeGreaterThanOrEqual(6);
  });

  it("list_verticals returns 7+ verticals", async () => {
    const result = await client.callTool({ name: "list_verticals", arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    const payload = JSON.parse(content[0].text);
    expect((payload.verticals as unknown[]).length).toBeGreaterThanOrEqual(7);
  });

  it("query_compliance_position works for each regime", async () => {
    for (const regime of ["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"]) {
      const result = await client.callTool({
        name: "query_compliance_position",
        arguments: {
          regime,
          use_case: "Generic AI deployment use case for end-to-end protocol testing.",
        },
      });
      const content = result.content as Array<{ type: string; text: string }>;
      const payload = JSON.parse(content[0].text);
      expect(
        ((payload.agrusPosition as Record<string, unknown>).keyControls as unknown[]).length,
      ).toBeGreaterThan(0);
    }
  });

  it("get_case_study returns case studies", async () => {
    const result = await client.callTool({ name: "get_case_study", arguments: {} });
    const content = result.content as Array<{ type: string; text: string }>;
    const payload = JSON.parse(content[0].text);
    expect((payload.caseStudies as unknown[]).length).toBeGreaterThanOrEqual(3);
  });

  it("scope_poc returns a 3-week sprint plan", async () => {
    const result = await client.callTool({
      name: "scope_poc",
      arguments: {
        use_case: "An AI agent for our small healthcare SaaS to triage patient messages.",
        vertical: "healthcare",
      },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const payload = JSON.parse(content[0].text);
    expect(
      ((payload.proposedEngagement as Record<string, unknown>).sprintPlan as unknown[]).length,
    ).toBe(3);
  });

  it("request_quote returns a ballpark band", async () => {
    const result = await client.callTool({
      name: "request_quote",
      arguments: {
        summary: "Production AI claims agent for a US insurance carrier with NAIC oversight.",
        vertical: "insurance",
        compliance_constraints: ["naic", "soc2"],
      },
    });
    const content = result.content as Array<{ type: string; text: string }>;
    const payload = JSON.parse(content[0].text);
    expect(payload.quote).toBeTruthy();
  });
});

describe("tools/call — request_proposal (write tool, HubSpot mocked)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("HUBSPOT_PRIVATE_APP_TOKEN", "pat-test-e2e");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("creates a proposal via the protocol", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "e2e-contact" }), { status: 201 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "e2e-note" }), { status: 201 }),
    );

    const result = await client.callTool({
      name: "request_proposal",
      arguments: {
        contact_email: "e2e@example.com",
        contact_name: "E2E Test",
        company: "Test Co",
        scope_summary:
          "End-to-end protocol test of the request_proposal tool through the SDK's InMemoryTransport.",
        vertical: "other",
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const payload = JSON.parse(content[0].text);
    expect(payload.ok).toBe(true);
    expect((payload.contact as Record<string, unknown>).id).toBe("e2e-contact");
  });
});

describe("tools/call — error paths", () => {
  // The SDK returns errors as a normal response with isError: true + a text
  // content block describing the error, rather than throwing. This gives
  // MCP clients structured error info — better contract than exceptions.
  it("returns isError:true for unknown tool name", async () => {
    const result = await client.callTool({ name: "nonexistent_tool", arguments: {} });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain("nonexistent_tool");
    expect(content[0].text.toLowerCase()).toContain("not found");
  });

  it("returns isError:true for invalid arguments (Zod validation surfaces in response)", async () => {
    const result = await client.callTool({
      name: "query_compliance_position",
      arguments: { regime: "not-a-real-regime", use_case: "needs to be valid here" },
    });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text.toLowerCase()).toContain("invalid");
  });
});
