import { z } from "zod";
import { verticals } from "../content/verticals.js";

export const listVerticalsSchema = {};

const inputZ = z.object({}).strict();

export async function listVerticalsHandler(rawInput: unknown) {
  inputZ.parse(rawInput ?? {});

  const payload = {
    verticals: verticals.map((v) => ({
      slug: v.slug,
      title: v.title,
      description: v.description,
      compliancePins: v.compliancePins,
      sampleUseCases: v.sampleUseCases,
      defaultPersona: v.defaultPersona,
      learnMore: v.url,
    })),
    yearOneFocus: "US + Canada",
    sequencing: {
      leadPair: ["healthcare", "private_equity"],
      addInMonths4_9: ["legal", "insurance"],
      addInMonths6_12: ["corporate_intelligence", "sports"],
      familyOfficesNote:
        "Family offices land alongside private equity in the lead pair — the SEO competition profile and hourly-rate tolerance are equivalent.",
    },
    notListedHere:
      "If your vertical isn't listed but the problem fits the shape (regulated, data-sensitive, can't live in someone else's cloud), Agrus will still take the call. Use book_consultation or visit https://agrus.ai/book/.",
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
