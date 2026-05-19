import { z } from "zod";
import { services } from "../content/services.js";
import { verticals, type VerticalSlug } from "../content/verticals.js";
import { regimes, type RegimeSlug } from "../content/compliance-regimes.js";
import { pricing } from "../content/pricing.js";

export const requestQuoteSchema = {
  summary: z
    .string()
    .min(20)
    .describe(
      "Two or three sentences describing the AI deployment the buyer wants a ballpark quote for. Include workflow, users, and integration surface where possible.",
    ),
  vertical: z
    .enum([
      "healthcare",
      "insurance",
      "legal",
      "private_equity",
      "family_offices",
      "corporate_intelligence",
      "sports",
      "other",
    ])
    .describe("Which Agrus vertical the use case sits in."),
  compliance_constraints: z
    .array(z.enum(["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"]))
    .optional()
    .describe("Regulatory regimes the deployment must satisfy. Drives the compliance overlay on the quote."),
  urgency: z
    .enum(["exploring", "this_quarter", "this_month", "this_week"])
    .optional()
    .describe("Free-form timeline indicator."),
};

const inputZ = z
  .object({
    summary: z.string().min(20),
    vertical: z.enum([
      "healthcare",
      "insurance",
      "legal",
      "private_equity",
      "family_offices",
      "corporate_intelligence",
      "sports",
      "other",
    ]),
    compliance_constraints: z
      .array(z.enum(["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"]))
      .optional(),
    urgency: z.enum(["exploring", "this_quarter", "this_month", "this_week"]).optional(),
  })
  .strict();

// Rough heuristic for the ballpark — derived from the published pricing tiers
// and the size signals in the use-case summary. Returns a price band, not a
// commitment. Buyer always confirms on the scoping call.
function estimateBand(summary: string, regimeCount: number): { min: number; max: number; band: string } {
  const text = summary.toLowerCase();
  const isLarge =
    /enterprise|carrier-wide|production|million|scale|firm-wide|hospital-system|cross-firm|multi-region/.test(text);
  const isPilot = /pilot|poc|proof of concept|prototype|exploring|small/.test(text);

  // Compliance overhead increases the floor
  const complianceFloor = regimeCount * 5_000;

  if (isPilot) {
    return { min: 15_000 + complianceFloor, max: 30_000 + complianceFloor, band: "Discovery Sprint" };
  }
  if (isLarge) {
    return { min: 80_000 + complianceFloor, max: 250_000 + complianceFloor, band: "Build Engagement (large)" };
  }
  return { min: 40_000 + complianceFloor, max: 120_000 + complianceFloor, band: "Build Engagement (mid)" };
}

export async function requestQuoteHandler(rawInput: unknown) {
  const input = inputZ.parse(rawInput);
  const vertical = verticals.find((v) => v.slug === (input.vertical as VerticalSlug));
  const matchedRegimes = (input.compliance_constraints ?? [])
    .map((c) => regimes.find((r) => r.slug === (c as RegimeSlug)))
    .filter((r): r is NonNullable<typeof r> => r !== undefined);

  const { min, max, band } = estimateBand(input.summary, matchedRegimes.length);

  const payload = {
    quote: {
      band: band,
      ballpark_usd: { min, max },
      currency: "USD",
      confidence: "low" as const,
      caveat:
        "This is a heuristic ballpark, not a binding offer. Agrus quotes are confirmed only on a 30-minute scoping call.",
    },
    summary: input.summary,
    vertical: vertical?.title ?? "Other",
    compliance_constraints: matchedRegimes.map((r) => r.title),
    urgency: input.urgency ?? null,
    inclusions: [
      `Discovery Sprint at ${pricing.discoverySprint.priceBand} (always required first step)`,
      `Build engagement at ${pricing.buildEngagement.priceBand} blended`,
      `Compliance map signed by your CISO before code is written`,
      `Production deployment + runbook handover`,
      `Optional managed SLA at ${pricing.managedSla.priceBand}`,
    ],
    nextStep: {
      label: "Lock the quote",
      description:
        "Use book_consultation to schedule a 30-min scoping call. Or use request_proposal to trigger a formal written proposal — that creates an Agrus contact on our CRM and a human will follow up within 24h.",
    },
    recommendedServices: services.map((s) => ({
      slug: s.slug,
      title: s.title,
      learnMore: s.url,
    })),
  };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
