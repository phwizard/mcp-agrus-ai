/**
 * request_proposal — the only write tool.
 *
 * Three paths to cover:
 *   1. Happy path: HubSpot token present, fetch succeeds → returns ok:true
 *      with proposal_request_id + contact id. Note attach happens but is
 *      non-fatal if it fails.
 *   2. Note attach failure path: contact lands fine, note 4xx-errors —
 *      should NOT bubble; ok:true still returned. Stderr warning is OK.
 *   3. Missing-token graceful failure: when HUBSPOT_PRIVATE_APP_TOKEN env
 *      var is unset, returns ok:false with isError:true and a fallback
 *      message pointing the agent at hello@agrus.ai.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { requestProposalHandler } from "../../src/tools/request-proposal.js";

function mockResponse(opts: { status: number; body?: unknown }): Response {
  return new Response(JSON.stringify(opts.body ?? {}), {
    status: opts.status,
    headers: { "Content-Type": "application/json" },
  });
}

function parsePayload(result: unknown): Record<string, unknown> {
  const r = result as { content: Array<{ type: string; text: string }>; isError?: boolean };
  return JSON.parse(r.content[0].text);
}

const VALID_INPUT = {
  contact_email: "buyer@example.com",
  contact_name: "Jane Doe",
  company: "Example Corp",
  role: "CIO",
  scope_summary:
    "We want an AI agent that triages incoming patient messages and routes them to the right clinical specialty. HIPAA-bound deployment in our existing AWS VPC.",
  vertical: "healthcare" as const,
  compliance_constraints: ["hipaa"] as const,
  urgency: "this_month" as const,
};

describe("request_proposal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("HUBSPOT_PRIVATE_APP_TOKEN", "pat-test-fake-token");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("creates a HubSpot contact + attaches a note + returns the proposal request id", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    // POST contact → 201
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "new-contact-id" } }));
    // POST note → 201
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "note-id" } }));

    const result = await requestProposalHandler(VALID_INPUT);
    const payload = parsePayload(result);

    expect(payload.ok).toBe(true);
    expect(payload.proposal_request_id).toMatch(/^PROP-/);
    const contact = payload.contact as Record<string, unknown>;
    expect(contact.id).toBe("new-contact-id");
    expect(contact.created).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sets agrus_lead_source=agrus_mcp on the contact properties", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "1" } }));
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "note" } }));

    await requestProposalHandler(VALID_INPUT);

    const contactCall = fetchMock.mock.calls[0];
    const body = JSON.parse((contactCall[1] as { body: string }).body);
    expect(body.properties.agrus_lead_source).toBe("agrus_mcp");
    expect(body.properties.agrus_vertical).toBe("healthcare");
    expect(body.properties.agrus_urgency).toBe("this_month");
    expect(body.properties.agrus_compliance_bar).toBe("hipaa");
  });

  it("splits contact_name into firstname/lastname", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "1" } }));
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "note" } }));

    await requestProposalHandler({ ...VALID_INPUT, contact_name: "Jane Marie Doe" });

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.properties.firstname).toBe("Jane");
    expect(body.properties.lastname).toBe("Marie Doe");
  });

  it("handles single-word name (uses '(unspecified)' for lastname)", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "1" } }));
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "note" } }));

    await requestProposalHandler({ ...VALID_INPUT, contact_name: "Cher" });

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.properties.firstname).toBe("Cher");
    expect(body.properties.lastname).toBe("(unspecified)");
  });

  it("non-fatal: contact lands even if note attach fails", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "contact-ok" } }));
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 400, body: { error: "bad note" } }));

    const result = await requestProposalHandler(VALID_INPUT);
    const payload = parsePayload(result);
    expect(payload.ok).toBe(true);
    expect((payload.contact as { id: string }).id).toBe("contact-ok");
  });

  it("returns ok:false + isError:true when HUBSPOT_PRIVATE_APP_TOKEN is missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("HUBSPOT_PRIVATE_APP_TOKEN", "");

    const result = await requestProposalHandler(VALID_INPUT);
    const r = result as { isError?: boolean; content: Array<{ text: string }> };
    expect(r.isError).toBe(true);
    const payload = JSON.parse(r.content[0].text);
    expect(payload.ok).toBe(false);
    expect(String(payload.error)).toContain("HubSpot");
  });

  it("returns ok:false when contact upsert hits a non-409 HubSpot error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ status: 401, body: { message: "unauthorized" } }),
    );

    const result = await requestProposalHandler(VALID_INPUT);
    const r = result as { isError?: boolean; content: Array<{ text: string }> };
    expect(r.isError).toBe(true);
    const payload = JSON.parse(r.content[0].text);
    expect(payload.ok).toBe(false);
    expect(String(payload.fallback).toLowerCase()).toContain("hello@agrus.ai");
  });

  it("rejects missing required fields (Zod schema)", async () => {
    await expect(
      requestProposalHandler({
        contact_email: "x@y.com",
        // missing contact_name, company, scope_summary, vertical
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid email format", async () => {
    await expect(
      requestProposalHandler({ ...VALID_INPUT, contact_email: "not-an-email" }),
    ).rejects.toThrow();
  });
});
