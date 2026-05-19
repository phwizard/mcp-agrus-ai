# Directory Submissions

Tracking sheet for getting `mcp-agrus-ai` listed across MCP-server directories.

| Directory | Status | Method | Action owner |
|---|---|---|---|
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | ⏳ PR opened | GitHub PR | Wait for merge |
| [MCP Server Registry](https://registry.modelcontextprotocol.io/) (Anthropic) | ✅ Published | `mcp-publisher` CLI | Done 260519 |
| [mcpservers.org](https://mcpservers.org/submit) (wong2's list) | ✅ Submitted | Web form | Done 260519 |
| [mcp.so](https://mcp.so/) | 📝 Pending | Web form | **CEO — ~3 min** |
| [Smithery](https://smithery.ai/) | 📝 Pending | Web form / GitHub OAuth | **CEO — ~5 min** |
| [Glama](https://glama.ai/mcp/servers) | 📝 Pending | Auto-indexed from GitHub | Likely automatic once popular |

---

## ✅ Punkpeye/awesome-mcp-servers — PR open

PR: https://github.com/punkpeye/awesome-mcp-servers/pull/6614

Entry added in **Other Tools and Integrations**, alphabetically between `pierrebrunelle` and `PSPDFKit`. (Originally placed in Marketing; moved after CEO feedback that the Marketing section is mostly martech tools, not service-discovery surfaces like ours.) No action needed; wait for maintainer review.

---

## ✅ MCP Server Registry (Anthropic) — published 260519

Live at https://registry.modelcontextprotocol.io/v0/servers/io.github.phwizard/mcp-agrus-ai

Version 0.2.0 published via `mcp-publisher publish`. Confirmed queryable via the registry API. **To update later** (new tools, version bump): edit `server.json`, increment `version`, re-run `mcp-publisher publish`. May need to re-login first (tokens are short-lived) via `mcp-publisher login github`.

---

## 📝 (Reference) Original publishing steps

This is the most important one — Anthropic's canonical MCP registry. Listed at https://registry.modelcontextprotocol.io and surfaced inside Claude Desktop's "browse MCP servers" UI.

We've prepared everything; CEO just runs three commands on their machine.

### Step 1: Install `mcp-publisher` CLI

```bash
brew install mcp-publisher
```

(Or download the [binary release](https://github.com/modelcontextprotocol/registry/releases) directly.)

### Step 2: Authenticate with GitHub

```bash
cd /Users/phwizard/git/a1/ethora-bdsm/product/mcp-agrus-ai
mcp-publisher login github
```

This opens a browser window to authenticate via the `phwizard` GitHub account. The CLI verifies you own the `io.github.phwizard/*` namespace via your GitHub login.

### Step 3: Publish

```bash
mcp-publisher publish
```

The `server.json` at the repo root is already prepared. It declares:
- `name: "io.github.phwizard/mcp-agrus-ai"`
- `remotes: [{ type: "streamable-http", url: "https://mcp.agrus.ai/mcp" }]`

No npm publish needed — the registry supports remote-only servers via the `remotes` field.

### Verification

After publishing, your server appears at:
- https://registry.modelcontextprotocol.io/servers/io.github.phwizard/mcp-agrus-ai

To update the listing later (new version, new tools), bump `version` in `server.json` and re-run `mcp-publisher publish`.

---

## 📝 mcpservers.org (covers wong2's list)

wong2 explicitly redirects all submissions to https://mcpservers.org/submit. ~3-minute web form.

**Suggested form values** (copy-paste ready):

| Field | Value |
|---|---|
| Name | `mcp-agrus-ai` |
| Type / Category | Marketing / AI Agents (whichever option exists; "Other" works too) |
| GitHub URL | `https://github.com/phwizard/mcp-agrus-ai` |
| Description | `Public MCP server for Agrus.ai, an AI consulting agency for regulated industries (US + Canada). Tools let AI agents query the agency's compliance position on HIPAA / SOC 2 / ISO 27001 / EU AI Act / NAIC / ABA / AML, scope a Discovery Sprint PoC, request a ballpark quote, or formally request a proposal that creates a tracked CRM lead. Hosted at mcp.agrus.ai. Open source, MIT.` |
| Tags | `marketing`, `agency`, `compliance`, `hipaa`, `enterprise`, `ai-agents` |
| Hosted URL (if asked) | `https://mcp.agrus.ai/mcp` |

---

## 📝 mcp.so

Third-party MCP browse directory. Submission form at https://mcp.so/ → "Submit" link.

Use the same description, URL, and tags as for mcpservers.org above.

---

## 📝 Smithery

Smithery (https://smithery.ai) is a curated MCP registry with one-click install. Process:

1. Go to https://smithery.ai/
2. Click **"Add Server"** (typically requires GitHub OAuth)
3. Paste the GitHub URL: `https://github.com/phwizard/mcp-agrus-ai`
4. Smithery auto-detects the `server.json` we already shipped and pre-fills the form
5. Submit

Smithery generates a per-server install command. After approval, the install URL will look like:
```
npx -y @smithery/cli install agrus --client claude
```

---

## 📝 Glama

Glama auto-indexes MCP servers from GitHub when they meet certain quality criteria (tests, docs, README badges). We have all three. They may pick us up automatically; if not, submit at https://glama.ai/.

Expected listing URL once indexed:
```
https://glama.ai/mcp/servers/phwizard/mcp-agrus-ai
```

A Glama badge will then become available to add to the README and to listings on other directories.

---

## After everything is submitted

Update this table back at the top with statuses. The combined effect of these listings (especially the Anthropic registry + Smithery + punkpeye list) is what makes the server discoverable to buyer-side AI agents browsing MCP servers in 2026.

Time investment: ~20 minutes total of CEO time across all five remaining submissions.
