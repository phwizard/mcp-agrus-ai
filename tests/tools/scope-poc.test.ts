/**
 * scope_poc test surface.
 *
 * scope_poc has the most logic of any tool: it composes services + verticals
 * + regimes into a 3-week Discovery Sprint scope with team composition, open
 * questions, and recommended services. Worth its own focused test file.
 */
import { describe, it, expect } from "vitest";
import { scopePocHandler } from "../../src/tools/scope-poc.js";

function parsePayload(result: unknown): Record<string, unknown> {
  const r = result as { content: Array<{ type: string; text: string }> };
  return JSON.parse(r.content[0].text);
}

const HEALTHCARE_USE_CASE = {
  use_case:
    "A US Medicare Advantage carrier wants an AI agent that drafts prior-authorization requests against payer policies. The agent reads incoming PA requests, looks up the relevant payer policy, drafts a structured response, and surfaces the draft to the clinical reviewer.",
  vertical: "healthcare" as const,
  data_types: ["PHI", "payer policy text", "clinician notes"],
  compliance_constraints: ["hipaa", "naic"] as const,
  target_outcomes: [
    "reduce per-PA drafting time by 50%",
    "production pilot with 5 reviewers by Q3",
  ],
  timeline_hint: "this quarter",
};

describe("scope_poc", () => {
  it("returns a 3-week sprint plan with team composition + pricing band", async () => {
    const result = await scopePocHandler(HEALTHCARE_USE_CASE);
    const payload = parsePayload(result);

    const eng = payload.proposedEngagement as Record<string, unknown>;
    expect(eng.stage).toBe("Discovery Sprint");
    expect((eng.sprintPlan as unknown[]).length).toBe(3); // 3 weeks
    expect(eng.pricing).toMatch(/\$/); // contains dollar sign

    const team = eng.teamComposition as Record<string, unknown>;
    expect(team.agrusEngineer).toBe(1);
    expect(team.agrusComplianceLead).toBeTruthy();
  });

  it("includes regime-specific 'firstQuestionWeAsk' for each declared regime", async () => {
    const result = await scopePocHandler(HEALTHCARE_USE_CASE);
    const payload = parsePayload(result);
    const questions = payload.openQuestionsWeWouldAsk as string[];
    // HIPAA + NAIC declared → both regime titles appear in open questions
    expect(questions.some((q) => q.includes("HIPAA"))).toBe(true);
    expect(questions.some((q) => q.includes("NAIC"))).toBe(true);
  });

  it("recommends compliance-audit + agent-development services for compliance-heavy work", async () => {
    const result = await scopePocHandler(HEALTHCARE_USE_CASE);
    const payload = parsePayload(result);
    const recs = payload.recommendedServicesInOrder as Array<{ slug: string }>;
    const slugs = recs.map((r) => r.slug);
    expect(slugs).toContain("compliance-audit");
    expect(slugs).toContain("ai-agent-development");
  });

  it("adds a domain SME to customerSide for healthcare / insurance / legal", async () => {
    const result = await scopePocHandler(HEALTHCARE_USE_CASE);
    const payload = parsePayload(result);
    const team = (payload.proposedEngagement as Record<string, unknown>).teamComposition as Record<
      string,
      unknown
    >;
    const customerSide = team.customerSide as string[];
    expect(customerSide.some((c) => c.toLowerCase().includes("clinician"))).toBe(true);
  });

  it("does NOT add a domain SME for non-clinical verticals (e.g. sports)", async () => {
    const result = await scopePocHandler({
      ...HEALTHCARE_USE_CASE,
      vertical: "sports",
      compliance_constraints: undefined,
    });
    const payload = parsePayload(result);
    const team = (payload.proposedEngagement as Record<string, unknown>).teamComposition as Record<
      string,
      unknown
    >;
    const customerSide = (team.customerSide as string[]).join(" ").toLowerCase();
    // No clinician / underwriter / partner SME mention for sports
    expect(customerSide).not.toContain("clinician");
    expect(customerSide).not.toContain("underwriter");
  });

  it("handles use cases with no compliance constraints", async () => {
    const result = await scopePocHandler({
      use_case: "Internal team copilot for code review at a software company. No PII involved.",
      vertical: "other",
    });
    const payload = parsePayload(result);
    const eng = payload.proposedEngagement as Record<string, unknown>;
    expect((eng.sprintPlan as unknown[]).length).toBe(3);

    // Open questions should still include a "what's the strictest regime" probe
    const questions = payload.openQuestionsWeWouldAsk as string[];
    expect(questions.some((q) => q.toLowerCase().includes("strictest compliance"))).toBe(true);
  });

  it("rejects too-short use_case (must be at least 20 chars)", async () => {
    await expect(
      scopePocHandler({ use_case: "too short", vertical: "healthcare" }),
    ).rejects.toThrow();
  });

  it("rejects invalid vertical", async () => {
    await expect(
      scopePocHandler({
        use_case: HEALTHCARE_USE_CASE.use_case,
        vertical: "agriculture",
      }),
    ).rejects.toThrow();
  });

  it("includes a 'this is a draft' disclaimer", async () => {
    const result = await scopePocHandler(HEALTHCARE_USE_CASE);
    const payload = parsePayload(result);
    expect(String(payload.disclaimer).toLowerCase()).toContain("draft");
  });
});
