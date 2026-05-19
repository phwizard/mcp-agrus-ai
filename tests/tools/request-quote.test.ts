/**
 * request_quote test surface.
 *
 * The interesting logic is the ballpark heuristic in estimateBand():
 *   - keyword "pilot" / "PoC" → Discovery Sprint band ($15-30K + compliance overhead)
 *   - keyword "enterprise" / "production" / "million" → Build (large) band
 *   - default → Build (mid) band
 *   - compliance regime count adds $5K to the floor per regime
 *
 * We don't assert exact numbers (heuristic, intentionally rough) — we
 * assert the band classifications and that compliance overhead increases.
 */
import { describe, it, expect } from "vitest";
import { requestQuoteHandler } from "../../src/tools/request-quote.js";

function parsePayload(result: unknown): Record<string, unknown> {
  const r = result as { content: Array<{ type: string; text: string }> };
  return JSON.parse(r.content[0].text);
}

function getBallpark(payload: Record<string, unknown>): { min: number; max: number; band: string } {
  const quote = payload.quote as Record<string, unknown>;
  const ball = quote.ballpark_usd as { min: number; max: number };
  return { min: ball.min, max: ball.max, band: quote.band as string };
}

describe("request_quote", () => {
  it("returns a low-confidence ballpark, not a binding offer", async () => {
    const result = await requestQuoteHandler({
      summary: "Exploratory pilot for a small healthcare app — internal team only.",
      vertical: "healthcare",
    });
    const payload = parsePayload(result);
    const quote = payload.quote as Record<string, unknown>;
    expect(quote.confidence).toBe("low");
    expect(String(quote.caveat).toLowerCase()).toContain("not a binding offer");
  });

  it("pilot keyword routes to Discovery Sprint band", async () => {
    const result = await requestQuoteHandler({
      summary: "An exploratory pilot for AI-assisted underwriting at a small insurance carrier.",
      vertical: "insurance",
    });
    const { band, min, max } = getBallpark(parsePayload(result));
    expect(band).toBe("Discovery Sprint");
    expect(min).toBeGreaterThanOrEqual(15_000);
    expect(max).toBeLessThanOrEqual(50_000); // 30K base + room for compliance overhead
  });

  it("enterprise-scale keyword routes to Build (large) band", async () => {
    const result = await requestQuoteHandler({
      summary:
        "Enterprise-wide production deployment serving million daily queries across a regulated health system.",
      vertical: "healthcare",
    });
    const { band, min } = getBallpark(parsePayload(result));
    expect(band).toContain("large");
    expect(min).toBeGreaterThanOrEqual(80_000);
  });

  it("mid-sized work without pilot/enterprise keywords routes to Build (mid) band", async () => {
    const result = await requestQuoteHandler({
      summary:
        "Build an AI agent for our claims-processing team that reads first-notice-of-loss documents and drafts initial assessments for adjusters.",
      vertical: "insurance",
    });
    const { band, min } = getBallpark(parsePayload(result));
    expect(band).toContain("mid");
    expect(min).toBeGreaterThanOrEqual(40_000);
  });

  it("compliance regime count increases the floor (5K per regime)", async () => {
    const noRegime = parsePayload(
      await requestQuoteHandler({
        summary: "Build mid-size agent for internal use at a corporate intelligence firm.",
        vertical: "corporate_intelligence",
      }),
    );
    const threeRegimes = parsePayload(
      await requestQuoteHandler({
        summary: "Build mid-size agent for internal use at a corporate intelligence firm.",
        vertical: "corporate_intelligence",
        compliance_constraints: ["soc2", "aml_kyc", "iso27001"],
      }),
    );
    const a = getBallpark(noRegime);
    const b = getBallpark(threeRegimes);
    // 3 regimes × $5K = $15K overhead added to both min + max
    expect(b.min - a.min).toBe(15_000);
    expect(b.max - a.max).toBe(15_000);
  });

  it("includes pricing inclusions list referencing Discovery Sprint + Build + SLA", async () => {
    const result = await requestQuoteHandler({
      summary: "AI agent for our private equity firm to draft IC memos.",
      vertical: "private_equity",
    });
    const payload = parsePayload(result);
    const incl = (payload.inclusions as string[]).join(" ");
    expect(incl.toLowerCase()).toContain("discovery sprint");
    expect(incl.toLowerCase()).toContain("build engagement");
    expect(incl.toLowerCase()).toContain("managed sla");
  });

  it("rejects too-short summary (must be at least 20 chars)", async () => {
    await expect(
      requestQuoteHandler({ summary: "short", vertical: "healthcare" }),
    ).rejects.toThrow();
  });

  it("rejects invalid vertical", async () => {
    await expect(
      requestQuoteHandler({
        summary: "A perfectly reasonable summary of a project for an unknown vertical.",
        vertical: "agriculture",
      }),
    ).rejects.toThrow();
  });

  it("rejects unknown compliance regime", async () => {
    await expect(
      requestQuoteHandler({
        summary: "A perfectly reasonable summary of a project description for testing.",
        vertical: "healthcare",
        compliance_constraints: ["ccpa"],
      }),
    ).rejects.toThrow();
  });
});
