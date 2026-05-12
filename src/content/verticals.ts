export type VerticalSlug =
  | "healthcare"
  | "insurance"
  | "legal"
  | "private_equity"
  | "family_offices"
  | "corporate_intelligence"
  | "sports"
  | "other";

export interface Vertical {
  slug: VerticalSlug;
  title: string;
  description: string;
  compliancePins: string[];
  sampleUseCases: string[];
  defaultPersona: "sasha" | "olena" | "mark" | "drew" | "reese" | "kai";
  url: string;
}

export const verticals: Vertical[] = [
  {
    slug: "healthcare",
    title: "Healthcare",
    description:
      "HIPAA-bound clinical agents, EHR copilots, prior-auth automation, claims/revenue-cycle agents. Self-hosted by default.",
    compliancePins: ["HIPAA", "HITECH", "PIPEDA", "21 CFR Part 11", "state medical board AI guidance", "FDA SaMD"],
    sampleUseCases: [
      "Clinical decision support agents (RAG over clinical guidelines)",
      "Patient triage and intake (HIPAA-aware logging + escalation)",
      "EHR copilots (Epic, Cerner, Athena, custom EHRs)",
      "Prior-authorization automation",
      "Claims and revenue-cycle agents",
    ],
    defaultPersona: "olena",
    url: "https://agrus.ai/verticals/healthcare/",
  },
  {
    slug: "insurance",
    title: "Insurance",
    description:
      "Claims processing, underwriting copilots, fraud detection, broker assistants. NAIC AI model bulletin compliant. Bias testing designed in.",
    compliancePins: ["NAIC AI Model Bulletin", "State DOI rules", "OSFI E-23", "GLBA", "PIPEDA / Quebec privacy", "SOC 2", "fair lending principles"],
    sampleUseCases: [
      "FNOL triage and adjuster copilots",
      "Underwriting risk-factor extraction with bias testing",
      "Fraud detection RAG (investigative copilot, not autonomous)",
      "Conversational AI for insurance (broker- and customer-facing)",
      "Broker enablement copilots",
    ],
    defaultPersona: "olena",
    url: "https://agrus.ai/verticals/insurance/",
  },
  {
    slug: "legal",
    title: "Legal",
    description:
      "Privilege-safe contract review, e-discovery copilots, brief drafting, matter research, conflict checking. ABA Model Rules 1.6 and 1.1 architected in.",
    compliancePins: ["ABA Model Rule 1.6", "ABA Model Rule 1.1", "ABA Formal Opinion 512", "state bar AI opinions", "work-product doctrine", "GDPR / PIPEDA cross-border"],
    sampleUseCases: [
      "Contract review and abstraction (risk-clause identification)",
      "E-discovery first-pass review",
      "Brief and memo drafting (draft-only, verification-prompted)",
      "Matter research RAG across firm precedent",
      "Conflict checking and client intake",
    ],
    defaultPersona: "olena",
    url: "https://agrus.ai/verticals/legal/",
  },
  {
    slug: "private_equity",
    title: "Private Equity",
    description:
      "Deal sourcing, IC memo drafting, portfolio company analytics, AI due diligence, LP reporting. Self-hosted; deal data does not leave the firm perimeter.",
    compliancePins: ["SEC Investment Advisers Act / RIA", "LPA confidentiality", "AML / KYC", "SOC 2", "Canadian OSC / IIROC", "EU AI Act (where applicable)"],
    sampleUseCases: [
      "Deal sourcing and screening agents (continuous monitoring)",
      "IC memo and CIM drafting from financial models",
      "Portfolio company analytics and KPI normalization",
      "AI due diligence (technical) for AI-exposed targets",
      "LP reporting and IR copilot",
      "K-1 and tax workflow automation",
    ],
    defaultPersona: "drew",
    url: "https://agrus.ai/verticals/private-equity/",
  },
  {
    slug: "family_offices",
    title: "Family Offices",
    description:
      "Portfolio aggregation, wealth-planning copilots, document automation, principal-grade discretion. Single-family and multi-family.",
    compliancePins: ["Discretion-as-architecture", "UHNW data sensitivity", "cross-family isolation for MFOs", "SEC / Canadian RIA where applicable"],
    sampleUseCases: [
      "Portfolio aggregation across custodians and asset classes",
      "Wealth-planning copilots (tax-aware scenario modeling)",
      "Document automation (trust documents, family constitutions)",
      "Investment opportunity screening against family principles",
      "Family communication and IR copilot",
      "Decades of office records made searchable",
    ],
    defaultPersona: "drew",
    url: "https://agrus.ai/verticals/family-offices/",
  },
  {
    slug: "corporate_intelligence",
    title: "Corporate Intelligence",
    description:
      "OSINT aggregation, sanctions screening, KYC enrichment, due diligence copilots, source verification. Designed to strengthen source verification, not bypass it.",
    compliancePins: ["FCPA / UK Bribery Act", "OFAC / EU / UN sanctions", "BSA / AML", "SOC 2", "GDPR + PIPEDA cross-border", "attorney privilege when under counsel direction"],
    sampleUseCases: [
      "OSINT aggregation agents (multi-jurisdiction, multi-language)",
      "Sanctions screening and PEP matching (auditable)",
      "KYC / KYB enrichment with beneficial-ownership tracing",
      "Due diligence copilots producing first-pass packages",
      "Source verification and cross-checking",
      "Investigative timeline construction",
    ],
    defaultPersona: "olena",
    url: "https://agrus.ai/verticals/corporate-intelligence/",
  },
  {
    slug: "sports",
    title: "Pro Sports",
    description:
      "Scouting analytics, opponent prep, athlete medical/training data agents, fan/CRM copilots, content production. Built around league data rules and CBA constraints.",
    compliancePins: ["League-specific data rules (MLB/NBA/NFL/NHL/MLS/NCAA)", "CBA-protected biometric data", "HIPAA-equivalent for athlete medical data", "players' union expectations"],
    sampleUseCases: [
      "Scouting analytics agents (college, international, minor leagues)",
      "Opponent preparation copilots (video tagging, tendency extraction)",
      "Athlete medical and training data agents",
      "Front-office and contracts copilots",
      "Fan and CRM agents (multilingual)",
      "Content production agents (recaps, social, video tagging)",
    ],
    defaultPersona: "mark",
    url: "https://agrus.ai/verticals/sports/",
  },
];
