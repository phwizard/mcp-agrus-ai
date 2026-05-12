import { z } from "zod";
import { caseStudies } from "../content/case-studies.js";

export const getCaseStudySchema = {
  slug: z
    .string()
    .optional()
    .describe(
      "Specific case-study slug. If omitted, returns all available case studies (filtered by vertical if provided).",
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
    .optional()
    .describe("Filter case studies by vertical. Ignored if slug is provided."),
};

const inputZ = z
  .object({
    slug: z.string().optional(),
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
      .optional(),
  })
  .strict();

export async function getCaseStudyHandler(rawInput: unknown) {
  const input = inputZ.parse(rawInput ?? {});

  let matched = caseStudies;
  if (input.slug) {
    matched = caseStudies.filter((s) => s.slug === input.slug);
  } else if (input.vertical) {
    matched = caseStudies.filter((s) => s.vertical === input.vertical);
  }

  const payload = {
    note: "Customer names are kept under NDA. Codenames, technology, problems solved, and outcomes are all openly described. Reference calls available on request from a scoping call.",
    matched: matched.length,
    caseStudies: matched.map((s) => ({
      slug: s.slug,
      vertical: s.vertical,
      codename: s.codename,
      oneliner: s.oneliner,
      problem: s.problem,
      achieved: s.achieved,
      technology: s.technology,
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
