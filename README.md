# mcp-agrus-ai

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#requirements)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io)

A Model Context Protocol server for [Agrus.ai](https://agrus.ai) — the front-deployed AI agency for regulated industries.

This server lets AI agents (Claude, ChatGPT, Gemini, custom buyer-side agents) engage Agrus.ai programmatically. A CIO using her internal Claude assistant can ask *"find me a HIPAA-compliant AI consultancy that does self-hosted deployments and scope a 2-week PoC for clinical triage"* — and that assistant can complete most of the workflow through this MCP server.

Currently ships **5 read-only tools** (Phase 1). Write tools (book a call, request a proposal, request a quote) land in Phase 2 — see [Roadmap](#roadmap).

## Tools

| Tool | Description |
|---|---|
| `list_services` | Six service pillars + published pricing tiers (Scoping Call, Discovery Sprint $15-30K, Build T&M $200-280/hr, Managed SLA $4-15K/mo). |
| `list_verticals` | Seven year-one verticals (healthcare, insurance, legal, private equity, family offices, corporate intelligence, pro sports) with compliance pins and sequencing. |
| `query_compliance_position` | Agrus's documented position on a specific regulatory regime (HIPAA, SOC 2, ISO 27001, EU AI Act, NAIC, ABA Model Rules, AML/KYC) as it applies to a described AI use case. |
| `get_case_study` | NDA-protected case studies — customer names private, codenames + tech + outcomes open. |
| `scope_poc` | Drafts a full Discovery Sprint scope (3-week plan, team composition, price band, open questions, recommended services) from a use case description. |

All tools return structured JSON inside an MCP `text` content block. No authentication required for Phase 1 tools.

## Requirements

- Node.js **20+** (uses ES modules + `NodeNext` resolution)
- An MCP-compatible client (Claude Desktop, Continue.dev, Cursor, or anything that speaks the MCP stdio protocol)

## Install

### From source

```bash
git clone https://github.com/phwizard/mcp-agrus-ai.git
cd mcp-agrus-ai
npm install
npm run build
```

The built entry point is `dist/index.js` (executable, `#!/usr/bin/env node` shebang).

### From npm

Coming in Phase 2 (we'll publish as `@agrus/mcp-server`).

## Use with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "agrus": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-agrus-ai/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The five Agrus tools will be available in any conversation — try:

> *Use the agrus MCP to query Agrus's position on HIPAA for an AI agent that drafts clinical notes against a patient's EHR.*

> *Scope a Discovery Sprint with Agrus for an insurance carrier that wants AI-assisted claims triage with bias testing.*

> *List Agrus's verticals and tell me which one a fintech regulatory-reporting copilot would fall into.*

## Use with other MCP clients

Anything that speaks MCP stdio works. Point the client at `node /absolute/path/to/dist/index.js`. Tool discovery is automatic via `tools/list`.

## Test the server directly

Send raw MCP protocol messages over stdio:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.0.1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | node dist/index.js
```

You should see the protocol handshake and a JSON-RPC response listing all 7 tools (5 read + 2 write).

## Development

```bash
npm test            # run the full test suite once (~250ms, 86 tests)
npm run test:watch  # watch mode for active development
npm run typecheck   # strict TypeScript check across src/ + api/
npm run build       # compile to dist/
npm run verify      # typecheck + test + build, in that order
```

The suite covers content integrity (slug uniqueness, enum coverage),
each of the 7 tool handlers (happy paths + schema-rejection paths), the
HubSpot client (mocked `fetch` exercising the upsert POST → 409-fallback
GET → PATCH chain), and a full end-to-end MCP protocol handshake using
the SDK's `InMemoryTransport` (verifies the same code that runs over
stdio and over HTTP works in-process).

GitHub Actions runs `npm run verify` on every push to `main` and on
every PR — see `.github/workflows/test.yml`.

## Architecture

```
src/
├── index.ts                          ← Entry point. McpServer + stdio transport.
├── content/                          ← Source of truth for Agrus content.
│   ├── services.ts                   ← 6 service pillars + descriptions.
│   ├── verticals.ts                  ← 7 verticals + compliance pins.
│   ├── compliance-regimes.ts         ← 7 regulatory regimes + Agrus position.
│   ├── case-studies.ts               ← NDA-protected codenamed case studies.
│   └── pricing.ts                    ← Published pricing tiers.
└── tools/
    ├── index.ts                      ← Tool registration table.
    ├── list-services.ts
    ├── list-verticals.ts
    ├── query-compliance-position.ts
    ├── get-case-study.ts
    └── scope-poc.ts
```

Each tool defines a Zod `inputSchema` (a `ZodRawShape`) and a `handler` function returning MCP content. Tools are wired into the server via the registration table in `tools/index.ts` — adding a sixth tool means writing one new file + one entry in the registration table.

## Why this exists

In 2026, more buyer research is done by AI agents acting on behalf of humans. A CIO using her internal Claude assistant can ask *"find me three AI consultancies that do self-hosted HIPAA-compliant deployments and book intros."* If we are MCP-discoverable, we participate in that conversation. If we aren't, we're invisible to that buyer type.

This is also the deepest layer of Agrus's brand differentiation: we are an AI agency that has invested in being engageable by AI agents. The MCP server is what we point to when prospects ask *"are you AI-first or are you using the marketing term?"*

## Roadmap

### Phase 1 (this release)
- [x] 5 read-only tools (list_services, list_verticals, query_compliance_position, get_case_study, scope_poc)
- [x] Stdio transport for local MCP clients (Claude Desktop, Continue.dev, etc.)
- [x] Open-source MIT release

### Phase 2 (next)
- [ ] HTTP+SSE transport for hosting at `mcp.agrus.ai`
- [ ] Vercel deployment (matches the marketing-site stack)
- [ ] Well-known manifest at `/.well-known/mcp.json`
- [ ] Write tools with email-OTP verification:
  - `request_quote` — ballpark price band, no commitment
  - `request_proposal` — triggers formal proposal workflow + HubSpot lead with `agrus_lead_source=agrus_mcp`
  - `book_consultation` — Google Calendar handoff + HubSpot upsert + Slack alert
- [ ] Rate limiting (Upstash Redis)
- [ ] Submission to Anthropic MCP directory + `awesome-mcp` lists

### Phase 3 (later)
- [ ] Customer-scoped API-key authentication
- [ ] `check_engagement_status` for existing-customer AI agents
- [ ] npm package (`@agrus/mcp-server`)
- [ ] Open-sourced HTTP transport layer as a reference implementation

## Contributing

Issues and PRs welcome. The content modules (`src/content/*.ts`) are the easiest place to contribute — corrections, new compliance regimes, better case-study codenames. Larger changes (new tools, new transports) should open an issue first to discuss.

## Related

- **[Agrus.ai](https://agrus.ai)** — the agency website this server represents
- **[Ethora](https://ethora.com)** — our open chat + AI agent SDK; the Agrus site runs on it
- **[Model Context Protocol](https://modelcontextprotocol.io)** — the open protocol this server speaks
- **[@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)** — Anthropic's official TypeScript SDK we use

## License

MIT — see [LICENSE](./LICENSE). Copyright (c) 2026 Dappros Ltd.