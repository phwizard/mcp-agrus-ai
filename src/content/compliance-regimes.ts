export type RegimeSlug =
  | "hipaa"
  | "soc2"
  | "iso27001"
  | "eu_ai_act"
  | "naic"
  | "aba"
  | "aml_kyc";

export interface ComplianceRegime {
  slug: RegimeSlug;
  title: string;
  description: string;
  applicableVerticals: string[];
  keyControls: string[];
  commonGotchas: string[];
  firstQuestionWeAsk: string;
  agrusReferenceArchitecture: string;
  url: string;
}

export const regimes: ComplianceRegime[] = [
  {
    slug: "hipaa",
    title: "HIPAA + HITECH",
    description:
      "US health-data privacy and security. Privacy Rule, Security Rule, Breach Notification Rule applied to AI agent and LLM deployments.",
    applicableVerticals: ["healthcare", "sports"],
    keyControls: [
      "BAAs with every AI sub-processor (model vendor, vector DB, observability)",
      "Minimum-necessary enforced at retrieval, not just at prompt template",
      "Audit logs: who, what PHI, what model, what decision, 6-year retention",
      "Breach notification readiness for prompt-injection exfiltration",
      "PHI scrubbing on input and output",
      "Per-user, per-patient authorization scopes",
    ],
    commonGotchas: [
      "Consumer AI endpoints (chatgpt.com, claude.ai) are never appropriate for PHI — enterprise tenancy required",
      "Multi-tenant logging that mixes PHI across customers is a Security Rule failure",
      "Forgetting BAAs with downstream sub-processors (vector DB, observability) creates a gap",
      "Prompt templates with vague 'and any other relevant information' fail minimum-necessary",
    ],
    firstQuestionWeAsk:
      "What kind of PHI would the AI touch, and what data minimization can we enforce at the retrieval stage?",
    agrusReferenceArchitecture:
      "Open-weights LLM (Llama 3.3 70B or Qwen 2.5 72B) in customer VPC, with Claude/GPT private tenancy for reasoning-heavy long-tail. Retrieval over Postgres+pgvector with per-patient scoping. OpenTelemetry audit pipeline into customer SIEM.",
    url: "https://agrus.ai/ai-compliance/hipaa/",
  },
  {
    slug: "soc2",
    title: "SOC 2",
    description:
      "Five Trust Services Criteria mapped to AI-specific controls. Most B2B AI vendors need SOC 2 Type II to win mid-market and enterprise.",
    applicableVerticals: ["healthcare", "insurance", "legal", "private_equity", "family_offices", "corporate_intelligence", "sports", "other"],
    keyControls: [
      "Security: model-update change management with eval re-run before promotion",
      "Availability: model fallback chains, GPU capacity reservation, multi-region for HA",
      "Processing Integrity: drift detection with documented thresholds, human-in-the-loop",
      "Confidentiality: prompt and output handling, multi-tenant carve-outs, training-data prohibitions",
      "Privacy: consent for AI processing, right-to-deletion across vector stores and logs",
    ],
    commonGotchas: [
      "Model upgrades treated like routine library upgrades — no eval re-run, no auditor-readable evidence",
      "Vendor sub-processor inventory missing AI vendors specifically (model, vector DB, observability)",
      "Drift detection running but no documented thresholds or escalation path",
      "Right-to-deletion implemented in primary DB but not in vector store",
    ],
    firstQuestionWeAsk:
      "Walk us through your current change-management process — does it cover model upgrades the same way it covers code releases?",
    agrusReferenceArchitecture:
      "Evidence pre-staged into customer's SIEM and artifact store as the system runs. Model-version pinning with risk-tiered promotion (auto / human review / full release gate). Auditor-readable evidence on every control before audit phase begins.",
    url: "https://agrus.ai/ai-compliance/soc2/",
  },
  {
    slug: "iso27001",
    title: "ISO 27001 / 27017 / 27018",
    description:
      "European and global enterprise standard. 2022 Annex A aligned with modern cloud and AI. 27017 (cloud) and 27018 (PII in cloud) add naturally.",
    applicableVerticals: ["healthcare", "insurance", "legal", "private_equity", "family_offices", "corporate_intelligence", "sports", "other"],
    keyControls: [
      "A.5.7 Threat intelligence — includes AI-specific (prompt injection, jailbreaks, data poisoning)",
      "A.5.19-23 Supplier relationships — AI model providers, vector DBs, observability with no-training and no-retention clauses",
      "A.8.2 Privileged access — model weights, inference infra, audit log destinations are privileged",
      "A.8.10 Information deletion — verified across vector stores and conversation history",
      "A.8.16 Monitoring — AI-specific events into SIEM",
      "A.8.24 Cryptography — model weights, inference traffic, conversation storage",
      "A.8.28 Secure coding — prompt-injection mitigations, output filtering, allowlisted tool destinations",
    ],
    commonGotchas: [
      "Annex A 2022 update missed — using pre-2022 control set leaves gaps on cloud and AI",
      "Cloud extensions (27017 / 27018) treated as separate audit instead of layered",
      "Supplier inventory missing AI-specific contractual expectations",
    ],
    firstQuestionWeAsk:
      "Are you certifying with a firm that's seen AI workloads before? Pick wrong and the audit triples in time.",
    agrusReferenceArchitecture:
      "Unified control set satisfying ISO 27001 + 27017 + 27018 with single evidence streams. Where customer also pursues SOC 2, control mapping deduplicates ~30-40% of standalone effort.",
    url: "https://agrus.ai/ai-compliance/iso-27001/",
  },
  {
    slug: "eu_ai_act",
    title: "EU AI Act",
    description:
      "Extraterritorial reach: applies to US/Canada companies serving EU subjects. High-risk classification triggers conformity assessment, documentation, post-market monitoring.",
    applicableVerticals: ["healthcare", "insurance", "legal", "private_equity", "family_offices", "corporate_intelligence", "sports", "other"],
    keyControls: [
      "Risk-tier classification (prohibited / high-risk / limited / minimal)",
      "Risk management system across AI lifecycle",
      "Data governance — training data review for relevance, representativeness, bias",
      "Technical documentation per Annex IV",
      "Record-keeping — automatic event logging for lifetime of high-risk system",
      "Transparency for users — information about capabilities, limitations, interpretation",
      "Human oversight — designed in, with specific override capabilities",
      "Accuracy, robustness, cybersecurity measures",
      "Conformity assessment (Annex VI self-assessment for most categories)",
    ],
    commonGotchas: [
      "Assuming the Act doesn't apply because the company is US-based — extraterritorial scope mirrors GDPR",
      "Confusing GPAI provider obligations (Anthropic, OpenAI) with application-level obligations (you)",
      "Building first, documenting after — Annex IV documentation is substantial and hard to retrofit",
    ],
    firstQuestionWeAsk:
      "Does your AI system process data of EU subjects, or could its output be used in the EU? If yes, the Act applies even if your servers are in Iowa.",
    agrusReferenceArchitecture:
      "Technical documentation produced during the build, not retrofitted. Human-oversight design baked into agent contract. Conformity assessment package ready before market entry.",
    url: "https://agrus.ai/ai-compliance/eu-ai-act/",
  },
  {
    slug: "naic",
    title: "NAIC AI Model Bulletin",
    description:
      "US state insurance regulators' AI governance expectations. Most states have adopted versions of the NAIC bulletin. OSFI E-23 is the parallel Canadian guideline.",
    applicableVerticals: ["insurance"],
    keyControls: [
      "Written AI governance program with board/management reporting",
      "Risk management framework with use-case tiering (high/medium/low)",
      "Validation and testing including bias testing across protected classes",
      "Vendor / third-party management with documented due diligence",
      "Consumer transparency on adverse decisions",
      "Model documentation per system: design, training data, validation, change history",
    ],
    commonGotchas: [
      "Bias testing as a one-off study instead of continuous program",
      "Underwriting and claims AI tested as one — they need distinct bias programs",
      "Adverse decisions missing the explanation documentation a DOI exam will demand",
      "Forgetting OSFI E-23 layer for Canadian carriers",
    ],
    firstQuestionWeAsk:
      "Which state DOIs regulate your book? Their adopted versions of the bulletin can vary in adverse-action documentation expectations.",
    agrusReferenceArchitecture:
      "Bias testing built into deployment as a continuous program. Decision-explanation generation tied to every model output. Audit fields supporting post-hoc class-impact analysis. Quarterly bias-testing reports auto-filed in customer's model-risk inventory.",
    url: "https://agrus.ai/ai-compliance/naic/",
  },
  {
    slug: "aba",
    title: "ABA Model Rules + state bar AI opinions",
    description:
      "Legal-profession ethics rules applied to AI. Rule 1.6 confidentiality, Rule 1.1 competence, ABA Formal Opinion 512, state bar opinions 2024-26.",
    applicableVerticals: ["legal"],
    keyControls: [
      "Rule 1.6: AI processing of confidential info must not constitute prohibited disclosure",
      "Rule 1.1: lawyer competence includes understanding AI tool capabilities and limitations",
      "Rule 1.4: client communication about AI use on matters where it plays substantive role (state-specific)",
      "Rule 1.5: fee billing transparency on AI-assisted work",
      "Rule 5.3: AI tools are non-lawyer assistance — firm supervision program must address them",
      "Single-tenant inference, no-training contract, no-retention beyond purpose",
    ],
    commonGotchas: [
      "Assuming consumer AI endpoints are fine if 'we don't put client names in the prompt' — content can still re-identify",
      "Missing state-specific notice-to-client triggers",
      "No firm AI-tool supervision policy alongside the technology deployment",
    ],
    firstQuestionWeAsk:
      "Which jurisdictions does your firm practice in? State bar opinions diverge on specifics like notice-to-client and fee-bill disclosure.",
    agrusReferenceArchitecture:
      "Open-weights model inside firm perimeter; frontier model only through dedicated tenancy with audited no-training. Per-matter access controls. Multi-jurisdiction unified control set designed to the strictest applicable opinion across firm footprint.",
    url: "https://agrus.ai/ai-compliance/aba-model-rules/",
  },
  {
    slug: "aml_kyc",
    title: "AML / KYC",
    description:
      "Financial-crime compliance. BSA / FinCEN in US, PCMLTFA in Canada, AMLD in EU, FATF Recommendations globally. SR 11-7 model risk management applies.",
    applicableVerticals: ["insurance", "private_equity", "family_offices", "corporate_intelligence"],
    keyControls: [
      "SR 11-7 model risk management: independent validation, ongoing monitoring, documentation",
      "Human review preserved on alerts above risk threshold (no AI-only adverse decisions)",
      "Sanctions screening with traceable match rationale; no auto-blocking that bypasses review",
      "Audit trail sufficient for OFAC inquiry or DOJ subpoena",
      "Model inventory with explicit risk tiering",
      "Periodic re-validation with documented rationale for changes",
    ],
    commonGotchas: [
      "AI as sole decision-maker on SAR filings — regulators expect human accountability",
      "Validation done once at deployment, not as continuous program",
      "Sanctions AI matches without preserved decision rationale",
    ],
    firstQuestionWeAsk:
      "What's your current model risk management framework — is SR 11-7 (or local equivalent) already applied to ML models in your shop?",
    agrusReferenceArchitecture:
      "AI generates ranked alerts and pre-drafted narratives; human analysts review every alert above threshold and sign filings. Audit trail records both layers (AI suggestion + human action + rationale).",
    url: "https://agrus.ai/ai-compliance/aml-kyc/",
  },
];
