import type { VerticalSlug } from "./verticals.js";

export interface CaseStudy {
  slug: string;
  vertical: VerticalSlug;
  codename: string;
  oneliner: string;
  problem: string;
  achieved: string;
  technology: string[];
  url: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "healthcare-app-messaging-ai",
    vertical: "healthcare",
    codename: "Healthcare app messaging + AI integration",
    oneliner:
      "Compliant in-app patient messaging with AI triage layer for a North-American healthcare platform.",
    problem:
      "Patient-clinician messaging needed both real-time chat and an AI triage layer, all under HIPAA, with provincial Canadian data-residency requirements. SaaS AI tools failed the InfoSec review.",
    achieved:
      "Production deployment with zero PHI flowing to public AI vendors. Signed HIPAA + provincial compliance map. Audit log delivery into the customer's existing SIEM. Sub-1-second triage response latency.",
    technology: [
      "Ethora chat SDK",
      "Dedicated cloud tenancy",
      "Open-weights LLM (Llama 3.3 70B class)",
      "HIPAA BAA chain across all sub-processors",
    ],
    url: "https://agrus.ai/case-studies/",
  },
  {
    slug: "workers-comp-document-processing",
    vertical: "insurance",
    codename: "Workers-comp insurance document processing pipeline",
    oneliner:
      "AI-driven claims-document extraction and adjuster copilot for a workers-compensation carrier.",
    problem:
      "Manual document review on first-notice-of-loss was the bottleneck. Existing OCR was inaccurate. Adjuster-side analysis required policy-specific RAG with adverse-action audit trail.",
    achieved:
      "60%+ reduction in document-handling time. NAIC-aligned governance package signed by Chief Underwriting Officer. Bias-testing program covering protected classes. Fair-discrimination defensibility documented end-to-end.",
    technology: [
      "Multi-agent orchestration",
      "RAG over policy library",
      "Bias-tested adverse-action logging",
      "NAIC-aligned governance package",
    ],
    url: "https://agrus.ai/case-studies/",
  },
  {
    slug: "blockchain-sdk-compliance-layer",
    vertical: "other",
    codename: "Regulated blockchain platform — self-hosted chat + agent SDK",
    oneliner:
      "Compliant chat and AI-assistant layer embedded into a regulated digital-assets platform's SDK.",
    problem:
      "Platform needed messaging and an embedded AI co-pilot inside its developer SDK without giving up auditability or violating regulator-mandated record-keeping requirements.",
    achieved:
      "SDK shipped to customers with a compliant chat + AI layer. AML hooks active from day one. SOC 2 evidence collection automated and audit-ready. Zero customer data crossing into third-party model logs.",
    technology: [
      "Ethora SDK",
      "Self-hosted XMPP + agent runtime",
      "AML hook integration",
      "SOC 2 evidence pipeline",
    ],
    url: "https://agrus.ai/case-studies/",
  },
  {
    slug: "agrus-self-built",
    vertical: "other",
    codename: "The Agrus website (agrus.ai) — built on Ethora",
    oneliner:
      "An AI-first agency website running on the same stack we ship to customers.",
    problem:
      "The marketing site needed to demonstrate, not just describe, our AI-first delivery model. Visitors needed real personas, AI agents needed a programmatic engagement path, and the whole experience had to be a credible Ethora deployment.",
    achieved:
      "Live persona-led site (Phase 1), this public MCP server, every visitor's experience is a working Ethora deployment, every conversation a working agent build.",
    technology: [
      "Next.js 15 / React 19 / TypeScript",
      "Ethora chat backend (Phase 1)",
      "Anthropic Claude personas",
      "Public MCP server (this one)",
    ],
    url: "https://agrus.ai/case-studies/",
  },
];
