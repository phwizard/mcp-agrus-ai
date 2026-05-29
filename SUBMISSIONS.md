# Directory Submissions

Tracking sheet for getting `mcp-agrus-ai` listed across MCP-server directories.

| Directory | Status | Method | Action owner |
|---|---|---|---|
| npm | 📝 Prepared | `npm publish` | **CEO, ~3 min** (unblocks Glama indexing + adds stdio install path) |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | ⏳ PR open, triage-nudge 260527 | GitHub PR | Needs Glama badge before merge |
| [MCP Server Registry](https://registry.modelcontextprotocol.io/) (Anthropic) | ✅ Published | `mcp-publisher` CLI | Done 260519; re-publish after npm to add `packages` block |
| [mcpservers.org](https://mcpservers.org/submit) (wong2's list) | ✅ Submitted | Web form | Done 260519 |
| [mcp.so](https://mcp.so/) | ✅ Submitted | Web form | Done 260519 |
| [Smithery](https://smithery.ai/) | ✅ Submitted | Web form / GitHub OAuth | Done 260519 (CEO) |
| [Glama](https://glama.ai/mcp/servers) | 📝 Pending | Auto-index, fallback web form | Auto-index not yet hit (260528, 404). npm publish should accelerate; failing that, manual submit |

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

## 📝 npm publish (unblocks Glama indexing)

`mcp-agrus-ai` is registered nowhere on npm yet but the unscoped name is free (verified 260519). Publishing as `mcp-agrus-ai` (unscoped) gives us:

1. A `npx -y mcp-agrus-ai` install path for Claude Desktop users who want stdio
2. A signal Glama uses to auto-index (their pipeline prefers npm-published or Dockerfile-bearing servers)
3. An eventual `packages` block in the registry `server.json` alongside the existing `remotes` block

### Prep (done by Claude on 260529)

- `package.json`: `mcpName: "io.github.phwizard/mcp-agrus-ai"` for Registry verification of the package
- `package.json`: `prepublishOnly: "npm run verify"` so the publish auto-runs typecheck + 86 tests + build first
- `package.json`: description rewritten to cover the full tool surface
- README: install section now shows three paths (hosted remote, npx stdio, source stdio)
- `npm pack --dry-run` confirms the tarball is 36 KB, 63 files, contains only `dist/` + README + LICENSE + package.json. No secrets, no test files.

### CEO publish steps (about 3 minutes)

```bash
cd /Users/phwizard/git/a1/ethora-bdsm/product/mcp-agrus-ai

# 1. Verify everything still builds and tests pass
npm run verify
# (this also runs automatically as prepublishOnly; running manually first is faster feedback)

# 2. Authenticate to npm
npm login
# Browser-based login; you may already be logged in

# 3. Publish (unscoped public package)
npm publish

# 4. Verify the listing
npm view mcp-agrus-ai
# Should show v0.2.0, the description, and the bin entry

# 5. Try the install path
npx -y mcp-agrus-ai
# Should start the stdio server. Ctrl-C to exit.
```

### Post-publish: update server.json with a packages block

Once `npm view mcp-agrus-ai` confirms the package is live, add it to `server.json` so the MCP Registry surfaces both paths:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.phwizard/mcp-agrus-ai",
  "title": "Agrus.ai — Enterprise AI Agency",
  "description": "AI consulting agency for regulated industries. Scope a PoC, query compliance, request a proposal.",
  "version": "0.2.0",
  "homepage": "https://agrus.ai",
  "repository": { "source": "github", "url": "https://github.com/phwizard/mcp-agrus-ai" },
  "remotes": [
    { "type": "streamable-http", "url": "https://mcp.agrus.ai/mcp" }
  ],
  "packages": [
    {
      "registry_name": "npm",
      "name": "mcp-agrus-ai",
      "version": "0.2.0",
      "runtime_hint": "npx"
    }
  ]
}
```

Then re-publish to the Registry:

```bash
mcp-publisher login github   # may have expired; re-login fast
mcp-publisher publish
```

### Post-publish: kick Glama

1. Open https://glama.ai/mcp/servers
2. Look for an "Add server" / "Submit" link (top right, usually)
3. Paste the GitHub URL `https://github.com/phwizard/mcp-agrus-ai`
4. Glama detects the npm package + `server.json` + README + CI badge and auto-fills

Glama's score badge URL becomes available within minutes of indexing:

```
https://glama.ai/mcp/servers/phwizard/mcp-agrus-ai/badges/score.svg
```

Once it 200s, add it to the punkpeye PR entry (the maintainer's triage-nudge on 260527 asked for exactly this). The edit to PR #6614 should use `gh api -X PATCH repos/punkpeye/awesome-mcp-servers/pulls/6614 -f body=...` rather than `gh pr edit --body`, which silently fails when Projects-classic GraphQL deprecation warnings interfere (see `feedback_gh_pr_edit_silent_fail`).

---

## Time budget

- npm publish + register: 3 minutes (CEO)
- Glama submit + indexing wait: 5 minutes active + auto
- PR badge edit: 2 minutes (Claude can do this once Glama indexes)

Total to clear the open submissions: about 10 minutes CEO time.
