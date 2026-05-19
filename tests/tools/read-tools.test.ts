/**
 * Tests for the four read-only tools that don't have side effects:
 * list_services, list_verticals, query_compliance_position, get_case_study.
 *
 * Pattern per tool: invoke handler → parse the JSON payload from the MCP
 * content[0].text → assert key fields. We don't snapshot the entire payload
 * (too brittle); we assert the contract.
 */
import { describe, it, expect } from "vitest";
import { listServicesHandler } from "../../src/tools/list-services.js";
import { listVerticalsHandler } from "../../src/tools/list-verticals.js";
import { queryCompliancePositionHandler } from "../../src/tools/query-compliance-position.js";
import { getCaseStudyHandler } from "../../src/tools/get-case-study.js";

// Tool handlers return { content: [{ type: "text", text: "<json>" }] }
// This helper parses the text back to a structured object for assertions.
function parsePayload(result: unknown): Record<string, unknown> {
  const r = result as { content: Array<{ type: string; text: string }> };
  const block = r.content[0];
  expect(block.type).toBe("text");
  return JSON.parse(block.text);
}

describe("list_services", () => {
  it("returns the full service catalog + pricing tiers + a next-step CTA", async () => {
    const result = await listServicesHandler({});
    const payload = parsePayload(result);
    expect((payload.services as unknown[]).length).toBeGreaterThanOrEqual(6);
    expect(payload.pricing).toBeTruthy();
    expect((payload.pricing as { tiers: unknown[] }).tiers.length).toBeGreaterThanOrEqual(4);
    expect(payload.nextStep).toBeTruthy();
  });

  it("rejects invalid vertical enum", async () => {
    await expect(listServicesHandler({ vertical: "manufacturing" })).rejects.toThrow();
  });
});

describe("list_verticals", () => {
  it("returns 7 named verticals + sequencing rationale + 'not listed' fallback", async () => {
    const result = await listVerticalsHandler({});
    const payload = parsePayload(result);
    expect((payload.verticals as unknown[]).length).toBeGreaterThanOrEqual(7);
    expect(payload.sequencing).toBeTruthy();
    expect(payload.notListedHere).toBeTruthy();
  });

  it("rejects unknown input properties (strict mode)", async () => {
    await expect(listVerticalsHandler({ unexpectedField: true })).rejects.toThrow();
  });
});

describe("query_compliance_position", () => {
  const VALID = {
    regime: "hipaa",
    use_case: "An AI agent that drafts prior-authorization requests for a US Medicare Advantage carrier.",
  };

  it("returns Agrus's position with key controls, common gotchas, first question, reference architecture", async () => {
    const result = await queryCompliancePositionHandler(VALID);
    const payload = parsePayload(result);
    const pos = payload.agrusPosition as Record<string, unknown>;
    expect((pos.keyControls as unknown[]).length).toBeGreaterThan(0);
    expect((pos.commonGotchas as unknown[]).length).toBeGreaterThan(0);
    expect(pos.firstQuestionWeAsk).toBeTruthy();
    expect(pos.agrusReferenceArchitecture).toBeTruthy();
    expect(pos.learnMore).toMatch(/^https:\/\/agrus\.ai\/ai-compliance\//);
  });

  it("includes the disclaimer that the response is not legal advice", async () => {
    const result = await queryCompliancePositionHandler(VALID);
    const payload = parsePayload(result);
    expect(String(payload.disclaimer).toLowerCase()).toContain("legal advice");
  });

  it("echoes the buyer's use_case and optional data_types in the response", async () => {
    const result = await queryCompliancePositionHandler({
      ...VALID,
      data_types: ["PHI", "PII"],
    });
    const payload = parsePayload(result);
    expect(payload.yourUseCase).toBe(VALID.use_case);
    expect(payload.yourDataTypes).toEqual(["PHI", "PII"]);
  });

  it("rejects unknown regime", async () => {
    await expect(
      queryCompliancePositionHandler({ regime: "ccpa", use_case: VALID.use_case }),
    ).rejects.toThrow();
  });

  it("rejects too-short use_case (must be at least 10 chars)", async () => {
    await expect(
      queryCompliancePositionHandler({ regime: "hipaa", use_case: "short" }),
    ).rejects.toThrow();
  });

  it("rejects missing required fields", async () => {
    await expect(queryCompliancePositionHandler({ regime: "hipaa" })).rejects.toThrow();
  });

  it.each(["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"])(
    "%s returns a populated position object",
    async (regime) => {
      const result = await queryCompliancePositionHandler({
        regime,
        use_case: "Generic compliance-aware AI deployment use case for testing.",
      });
      const payload = parsePayload(result);
      const pos = payload.agrusPosition as Record<string, unknown>;
      expect((pos.keyControls as unknown[]).length).toBeGreaterThan(0);
    },
  );
});

describe("get_case_study", () => {
  it("returns all studies when called with no args", async () => {
    const result = await getCaseStudyHandler({});
    const payload = parsePayload(result);
    const cs = payload.caseStudies as unknown[];
    expect(cs.length).toBeGreaterThanOrEqual(3);
    expect(payload.matched).toBe(cs.length);
  });

  it("filters by exact slug when slug is provided", async () => {
    const result = await getCaseStudyHandler({ slug: "healthcare-app-messaging-ai" });
    const payload = parsePayload(result);
    const cs = payload.caseStudies as Array<{ slug: string }>;
    expect(cs).toHaveLength(1);
    expect(cs[0].slug).toBe("healthcare-app-messaging-ai");
  });

  it("returns empty array for unknown slug", async () => {
    const result = await getCaseStudyHandler({ slug: "nonexistent-case-2099" });
    const payload = parsePayload(result);
    expect((payload.caseStudies as unknown[]).length).toBe(0);
    expect(payload.matched).toBe(0);
  });

  it("filters by vertical when no slug given", async () => {
    const result = await getCaseStudyHandler({ vertical: "healthcare" });
    const payload = parsePayload(result);
    const cs = payload.caseStudies as Array<{ vertical: string }>;
    expect(cs.length).toBeGreaterThan(0);
    for (const c of cs) {
      expect(c.vertical).toBe("healthcare");
    }
  });

  it("slug takes precedence over vertical filter", async () => {
    // Even though the slug doesn't match the vertical filter, slug wins
    const result = await getCaseStudyHandler({
      slug: "healthcare-app-messaging-ai",
      vertical: "insurance",
    });
    const payload = parsePayload(result);
    expect((payload.caseStudies as unknown[]).length).toBe(1);
  });

  it("includes the NDA framing note in every response", async () => {
    const result = await getCaseStudyHandler({});
    const payload = parsePayload(result);
    expect(String(payload.note).toLowerCase()).toContain("nda");
  });
});
