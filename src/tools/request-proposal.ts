import { z } from "zod";
import { upsertContact, addNoteToContact, HubspotError } from "../lib/hubspot.js";

export const requestProposalSchema = {
  contact_email: z
    .string()
    .email()
    .describe("Work email of the buyer (or buyer's assistant) who should receive the formal proposal."),
  contact_name: z
    .string()
    .min(2)
    .describe("Full name of the contact. Example: 'Jane Doe'."),
  company: z
    .string()
    .min(2)
    .describe("Company / organization name."),
  role: z
    .string()
    .optional()
    .describe("Buyer's role at the company (e.g. 'CIO', 'Head of AI', 'Managing Partner')."),
  scope_summary: z
    .string()
    .min(30)
    .describe(
      "One to three paragraphs describing the proposed AI deployment: workflow, users, data, integration surface, success criteria.",
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
    .describe("Regulatory regimes the deployment must satisfy."),
  urgency: z
    .enum(["exploring", "this_quarter", "this_month", "this_week"])
    .optional()
    .describe("How quickly the buyer wants to move."),
  persona_context: z
    .string()
    .optional()
    .describe(
      "Optional context about how this request was scoped (e.g. 'Scoped via the scope_poc tool on 2026-05-19, agent was Claude Sonnet 4.x acting for the CIO of <company>').",
    ),
};

const inputZ = z
  .object({
    contact_email: z.string().email(),
    contact_name: z.string().min(2),
    company: z.string().min(2),
    role: z.string().optional(),
    scope_summary: z.string().min(30),
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
    persona_context: z.string().optional(),
  })
  .strict();

function splitName(full: string): { firstname: string; lastname: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: "(unspecified)" };
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

export async function requestProposalHandler(rawInput: unknown) {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              ok: false,
              error: "Server-side HubSpot token missing — Agrus cannot record the request right now. Please email hello@agrus.ai with the details directly.",
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  const input = inputZ.parse(rawInput);
  const { firstname, lastname } = splitName(input.contact_name);

  const proposalId = `PROP-${Date.now().toString(36).toUpperCase()}`;

  try {
    const upsert = await upsertContact(token, {
      email: input.contact_email,
      firstname,
      lastname,
      company: input.company,
      agrus_lead_source: "agrus_mcp",
      agrus_vertical: input.vertical,
      agrus_use_case: input.scope_summary,
      agrus_compliance_bar:
        input.compliance_constraints && input.compliance_constraints.length > 0
          ? input.compliance_constraints.join(", ")
          : undefined,
      agrus_urgency: input.urgency ?? "exploring",
    });

    // Attach a richer note with the full payload — gives the CEO the verbatim
    // text the AI agent submitted on the contact timeline.
    const noteBody = [
      `[Agrus MCP proposal request — ${proposalId}]`,
      ``,
      `Source: agrus_mcp (MCP server tool: request_proposal)`,
      `Role: ${input.role ?? "(unspecified)"}`,
      input.persona_context ? `Persona/agent context: ${input.persona_context}` : null,
      ``,
      `Scope summary:`,
      input.scope_summary,
      ``,
      `Vertical: ${input.vertical}`,
      `Compliance: ${input.compliance_constraints?.join(", ") ?? "(unspecified)"}`,
      `Urgency: ${input.urgency ?? "exploring"}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await addNoteToContact(token, upsert.contactId, noteBody);
    } catch (noteErr) {
      // Note failure isn't fatal — the contact + structured properties already landed.
      // Log to stderr and continue.
      process.stderr.write(
        `[agrus mcp] note attach failed for contact ${upsert.contactId}: ${noteErr instanceof Error ? noteErr.message : String(noteErr)}\n`,
      );
    }

    const payload = {
      ok: true,
      proposal_request_id: proposalId,
      contact: {
        id: upsert.contactId,
        created: upsert.created,
      },
      expectations: {
        first_response_within: "24 hours (business days)",
        first_response_format: "Email reply with a one-paragraph engagement recommendation and a calendar option for a 30-min scoping call",
        no_drip_emails: true,
        no_sdr_pipeline: true,
      },
      nextStep: {
        label: "Optionally book the call directly",
        description:
          "Use book_consultation to pre-pick a time. Otherwise Agrus will reach out by email within 24h.",
      },
      privacy:
        "Your submission lands in our HubSpot CRM under the agrus_mcp lead source. Used to reply to your request. No list sales. Delete on request via hello@agrus.ai.",
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    };
  } catch (err) {
    const message =
      err instanceof HubspotError
        ? `HubSpot ${err.status}: ${err.body.slice(0, 200)}`
        : err instanceof Error
          ? err.message
          : "unknown";
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              ok: false,
              error: "Failed to record the proposal request.",
              detail: message,
              fallback: "Email hello@agrus.ai with the scope and Agrus will follow up.",
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
}
