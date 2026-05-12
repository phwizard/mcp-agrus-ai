import { z } from "zod";
import { services } from "../content/services.js";
import { verticals, type VerticalSlug } from "../content/verticals.js";
import { regimes, type RegimeSlug } from "../content/compliance-regimes.js";
import { pricing } from "../content/pricing.js";

export const scopePocSchema = {
  use_case: z
    .string()
    .min(20)
    .describe(
      "One or two paragraphs describing the AI use case the buyer wants to scope. Be specific about workflow, users, and integration surface where possible.",
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
  data_types: z
    .array(z.string())
    .optional()
    .describe(
      "Data the AI would touch (e.g. ['PHI', 'patient demographics', 'EHR notes']).",
    ),
  compliance_constraints: z
    .array(z.enum(["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"]))
    .optional()
    .describe(
      "Regulatory regimes the deployment must satisfy. Drives compliance overlay in the scope.",
    ),
  target_outcomes: z
    .array(z.string())
    .optional()
    .describe(
      "What success looks like (e.g. ['reduce adjuster review time by 50%', 'production pilot with 3 clinicians by Q3']).",
    ),
  timeline_hint: z
    .string()
    .optional()
    .describe(
      "Free-form timeline (e.g. 'exploring', 'this quarter', 'production by Q4', 'this is blocking board commitment').",
    ),
};

const inputZ = z
  .object({
    use_case: z.string().min(20),
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
    data_types: z.array(z.string()).optional(),
    compliance_constraints: z
      .array(z.enum(["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"]))
      .optional(),
    target_outcomes: z.array(z.string()).optional(),
    timeline_hint: z.string().optional(),
  })
  .strict();

export async function scopePocHandler(rawInput: unknown) {
  const input = inputZ.parse(rawInput);

  const vertical = verticals.find((v) => v.slug === (input.vertical as VerticalSlug));
  const matchedRegimes = (input.compliance_constraints ?? [])
    .map((c) => regimes.find((r) => r.slug === (c as RegimeSlug)))
    .filter((r): r is NonNullable<typeof r> => r !== undefined);

  // Default Agrus Discovery Sprint structure
  const sprintWeeks = [
    {
      week: 1,
      title: "Discovery + compliance scoping",
      activities: [
        "Stakeholder kickoff (customer team + Agrus engineer + Agrus compliance lead)",
        "Data flow mapping (where does the data live, who can see it, what regulators care)",
        ...(matchedRegimes.length > 0
          ? [
              `Compliance regime inventory: ${matchedRegimes.map((r) => r.title).join(", ")}`,
              `Map AI-specific controls for: ${matchedRegimes.map((r) => r.title).join(", ")}`,
            ]
          : ["Compliance regime inventory (we discover what applies)"]),
        "Model selection rationale (open-weights vs dedicated frontier tenancy)",
      ],
      deliverable: "Compliance map draft (5-column: regime/scope/design/evidence/owner)",
    },
    {
      week: 2,
      title: "Architecture + prototype",
      activities: [
        "Reference architecture for the deployment shape (VPC / dedicated cloud / on-prem)",
        "Retrieval pipeline scaffold over a representative slice of customer data",
        "Working prototype (single agent or initial multi-agent shape)",
        "Eval harness against real workflow examples",
        "Cost model: per-month all-in for the production shape",
      ],
      deliverable: "Working prototype + architecture document",
    },
    {
      week: 3,
      title: "Sign-off + handover or build plan",
      activities: [
        "Walk-through with customer CISO; revisions until compliance map is signable",
        "Build engagement scope: timeline, team composition, T&M estimate range",
        "Optional: handover briefing if customer wants to take the artifacts and build internally",
      ],
      deliverable:
        "Signed compliance map + production build plan (or clean stop with sprint artifacts)",
    },
  ];

  const recommendedServices = [
    services.find((s) => s.slug === "compliance-audit"),
    services.find((s) => s.slug === "ai-agent-development"),
    services.find((s) => s.slug === "rag-llm-ops"),
    services.find((s) => s.slug === "dedicated-deployment"),
  ].filter((s): s is NonNullable<typeof s> => s !== undefined);

  const payload = {
    scopeSummary: {
      use_case: input.use_case,
      vertical: vertical?.title ?? "Other",
      data_types: input.data_types ?? null,
      compliance_constraints: matchedRegimes.map((r) => ({ slug: r.slug, title: r.title })),
      target_outcomes: input.target_outcomes ?? null,
      timeline_hint: input.timeline_hint ?? null,
    },
    proposedEngagement: {
      stage: "Discovery Sprint",
      duration: "2-3 weeks",
      pricing: pricing.discoverySprint.priceBand,
      pricingUnit: pricing.discoverySprint.unit,
      fixedScope: true,
      sprintPlan: sprintWeeks,
      teamComposition: {
        agrusEngineer: 1,
        agrusComplianceLead: "15-25% allocation, full-time during week 1",
        agrusDeliveryManager: "10% allocation",
        customerSide: [
          "Project sponsor (decision-maker)",
          "Technical lead (data + infra context)",
          "Compliance / security stakeholder",
          ...(vertical && ["healthcare", "insurance", "legal"].includes(vertical.slug)
            ? ["Domain SME (clinician / underwriter / partner)"]
            : []),
        ],
      },
    },
    afterDiscoverySprint: {
      stage: "Build Engagement (optional)",
      pricing: pricing.buildEngagement.priceBand,
      durationEstimate: "8-16 weeks typical for a single agent system",
      deliverable: pricing.buildEngagement.deliverable,
    },
    openQuestionsWeWouldAsk: [
      "What's the existing AI stack (if any) — are we adding to a brownfield deployment or starting clean?",
      "Where does the data physically live today, and what's the data-residency expectation?",
      "Who's the named owner of this AI system inside the customer organization?",
      ...(matchedRegimes.length > 0
        ? matchedRegimes.map((r) => `(${r.title}) ${r.firstQuestionWeAsk}`)
        : ["What's the strictest compliance regime that touches this workflow?"]),
      "What does 'success in production' look like for the IC / board / GP?",
    ],
    recommendedServicesInOrder: recommendedServices.map((s) => ({
      slug: s.slug,
      title: s.title,
      learnMore: s.url,
    })),
    nextStep: {
      label: "Confirm scope or ask for a quote",
      description:
        "If this scope shape looks right, use request_quote (Phase-2) for a confirmed price band, or book_consultation (Phase-2) for a 30-min call. Or visit https://agrus.ai/book/ to submit a contact directly.",
    },
    disclaimer:
      "This is a draft scope generated from the inputs you provided. Agrus signs final scopes only after a 30-minute scoping call.",
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
