import { z } from "zod";
import { services } from "../content/services.js";
import { pricing, pricingNote } from "../content/pricing.js";

export const listServicesSchema = {
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
    .describe("Filter services by vertical applicability. Currently all services apply to all verticals."),
};

const inputZ = z.object(listServicesSchema).strict();

export async function listServicesHandler(rawInput: unknown) {
  // Parse defensively — input may be undefined/null when no params given
  inputZ.parse(rawInput ?? {});

  const payload = {
    services: services.map((s) => ({
      slug: s.slug,
      title: s.title,
      description: s.description,
      priceBand: s.priceBand,
      unit: s.unit,
      deliverables: s.deliverables,
      learnMore: s.url,
    })),
    pricing: {
      tiers: Object.values(pricing).map((t) => ({
        name: t.name,
        priceBand: t.priceBand,
        unit: t.unit,
        deliverable: t.deliverable,
      })),
      note: pricingNote,
    },
    nextStep: {
      label: "Scoping call",
      description:
        "Free 30-min call with an engineer and our compliance lead. Use the book_consultation tool (Phase-2) or visit https://agrus.ai/book/ directly.",
    },
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
