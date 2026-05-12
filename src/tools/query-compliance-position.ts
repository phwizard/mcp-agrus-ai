import { z } from "zod";
import { regimes, type RegimeSlug } from "../content/compliance-regimes.js";

export const queryCompliancePositionSchema = {
  regime: z
    .enum(["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"])
    .describe("Which regulatory regime to query Agrus's position on."),
  use_case: z
    .string()
    .min(10)
    .describe(
      "One or two sentences describing the AI use case under consideration (e.g. 'an LLM-based prior-authorization drafting agent for a health insurance carrier').",
    ),
  data_types: z
    .array(z.string())
    .optional()
    .describe(
      "Optional list of data types the AI would touch (e.g. ['PHI', 'PII', 'claims data', 'underwriting decisions']).",
    ),
};

const inputZ = z
  .object({
    regime: z.enum(["hipaa", "soc2", "iso27001", "eu_ai_act", "naic", "aba", "aml_kyc"]),
    use_case: z.string().min(10),
    data_types: z.array(z.string()).optional(),
  })
  .strict();

export async function queryCompliancePositionHandler(rawInput: unknown) {
  const input = inputZ.parse(rawInput);
  const regime = regimes.find((r) => r.slug === (input.regime as RegimeSlug));
  if (!regime) {
    throw new Error(`Unknown regime: ${input.regime}`);
  }

  const payload = {
    regime: {
      slug: regime.slug,
      title: regime.title,
      description: regime.description,
      applicableVerticals: regime.applicableVerticals,
    },
    yourUseCase: input.use_case,
    yourDataTypes: input.data_types ?? null,
    agrusPosition: {
      keyControls: regime.keyControls,
      commonGotchas: regime.commonGotchas,
      firstQuestionWeAsk: regime.firstQuestionWeAsk,
      agrusReferenceArchitecture: regime.agrusReferenceArchitecture,
      learnMore: regime.url,
    },
    nextStep: {
      label: "Compliance map (Discovery Sprint deliverable)",
      description:
        "Agrus's standard answer is to produce a one-page compliance map for the specific use case before any code is written. This is included in every Discovery Sprint ($15-30K, 2-3 weeks, fixed). Use the scope_poc tool to draft a sprint, or book_consultation (Phase-2) for a 30-minute scoping call.",
    },
    disclaimer:
      "This tool returns Agrus's general position on the regime as it applies to AI deployments. It is not legal advice; specific situations require analysis by qualified counsel and (where applicable) registered auditors.",
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
