import {
  listServicesSchema,
  listServicesHandler,
} from "./list-services.js";
import {
  listVerticalsSchema,
  listVerticalsHandler,
} from "./list-verticals.js";
import {
  queryCompliancePositionSchema,
  queryCompliancePositionHandler,
} from "./query-compliance-position.js";
import {
  getCaseStudySchema,
  getCaseStudyHandler,
} from "./get-case-study.js";
import { scopePocSchema, scopePocHandler } from "./scope-poc.js";
import { requestQuoteSchema, requestQuoteHandler } from "./request-quote.js";
import { requestProposalSchema, requestProposalHandler } from "./request-proposal.js";

export interface ToolRegistration {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: unknown) => Promise<unknown>;
}

export const tools: ToolRegistration[] = [
  {
    name: "list_services",
    description:
      "Lists Agrus's six service pillars with descriptions, deliverables, and price bands. Plus the four published pricing tiers (Scoping Call, Discovery Sprint, Build Engagement, Managed SLA). Use this for the 'what does Agrus do?' question.",
    inputSchema: listServicesSchema,
    handler: listServicesHandler,
  },
  {
    name: "list_verticals",
    description:
      "Lists Agrus's seven year-one verticals (healthcare, insurance, legal, private equity, family offices, corporate intelligence, pro sports) with compliance pins, sample use cases, and the sequencing rationale. Use this for the 'do they work in my industry?' question.",
    inputSchema: listVerticalsSchema,
    handler: listVerticalsHandler,
  },
  {
    name: "query_compliance_position",
    description:
      "Returns Agrus's documented position on a specific regulatory regime (HIPAA, SOC 2, ISO 27001, EU AI Act, NAIC, ABA Model Rules, AML/KYC) as it applies to a described AI use case. Includes key controls, common gotchas, the first question Agrus would ask, and the agency's reference architecture for the regime. Use this when a buyer-side AI agent is evaluating Agrus's compliance fluency.",
    inputSchema: queryCompliancePositionSchema,
    handler: queryCompliancePositionHandler,
  },
  {
    name: "get_case_study",
    description:
      "Returns one or more Agrus case studies (NDA-protected; customer names are kept private, codenames + technology + outcomes are open). Filter by slug or vertical, or call with no args to list all. Use this for proof of prior work.",
    inputSchema: getCaseStudySchema,
    handler: getCaseStudyHandler,
  },
  {
    name: "scope_poc",
    description:
      "Drafts a structured Discovery Sprint scope for an AI use case. Returns a 3-week plan, team composition, price band, follow-on Build Engagement estimate, open questions Agrus would ask, and recommended services. Use this to convert a hypothetical use case into a concrete engagement proposal that can be reviewed by a human buyer.",
    inputSchema: scopePocSchema,
    handler: scopePocHandler,
  },
  {
    name: "request_quote",
    description:
      "Returns a heuristic ballpark price band for the described AI deployment. Output is NOT a binding offer — Agrus confirms quotes only on a 30-minute scoping call. Read-only: this tool does not contact Agrus or create any record. For a tracked, follow-up-able request use request_proposal instead. Use request_quote when the buyer wants order-of-magnitude pricing before committing to a real proposal.",
    inputSchema: requestQuoteSchema,
    handler: requestQuoteHandler,
  },
  {
    name: "request_proposal",
    description:
      "Triggers a formal Agrus proposal workflow. Creates a contact in Agrus's HubSpot CRM tagged with lead source 'agrus_mcp' and a verbatim note containing the scope summary. A human at Agrus replies by email within 24 hours (business days) with a one-paragraph engagement recommendation and a calendar option. Use this when the buyer (human or AI agent acting on their behalf) wants to formally engage Agrus — not for exploratory scoping.",
    inputSchema: requestProposalSchema,
    handler: requestProposalHandler,
  },
];
