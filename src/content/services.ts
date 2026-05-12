export interface Service {
  slug: string;
  title: string;
  description: string;
  priceBand: string;
  unit: string;
  deliverables: string[];
  url: string;
}

export const services: Service[] = [
  {
    slug: "ai-agent-development",
    title: "AI Agent Development",
    description:
      "Custom agent design, multi-agent orchestration, tool use, hand-off logic, evaluation pipelines. Built to ship in production in regulated environments.",
    priceBand: "$15,000 – $200,000",
    unit: "Discovery Sprint fixed; Build engagement T&M",
    deliverables: [
      "Agent contract document (decision scope + escalation triggers)",
      "Architecture diagrams (tool graph, hand-off graph, integration surface)",
      "Production codebase (IaC, CI/CD, tests, runbook)",
      "Evaluation harness over real workflow examples",
      "Audit trail specification",
      "Team handover documentation",
    ],
    url: "https://agrus.ai/services/ai-agent-development/",
  },
  {
    slug: "rag-llm-ops",
    title: "RAG & LLM Ops",
    description:
      "Private RAG on your data, fine-tuning where it earns its cost, model selection across open-source and frontier, hybrid routing, inference infra, drift monitoring.",
    priceBand: "$15,000 – $200,000",
    unit: "Discovery Sprint fixed; ongoing operation T&M or SLA",
    deliverables: [
      "Retrieval pipeline (chunking, embedding, hybrid search, reranking)",
      "Model selection rationale (tested on your data, not benchmarks)",
      "Inference infrastructure (vLLM/TGI/llama.cpp/SGLang as fits)",
      "Hybrid routing across open-weights and frontier-in-tenancy",
      "Fine-tuning where it pays (LoRA / QLoRA / continual pretraining)",
      "Evaluation harness with drift detection",
    ],
    url: "https://agrus.ai/services/rag-llm-ops/",
  },
  {
    slug: "compliance-audit",
    title: "Compliance Audit",
    description:
      "The map your CISO signs before code is written. One page, five columns, every regulatory control tied to a specific design decision.",
    priceBand: "$10,000 – $45,000",
    unit: "Standalone, or included free in any Discovery Sprint",
    deliverables: [
      "Regulatory regime inventory for the use case",
      "Unified control set deduplicated across regimes",
      "Architecture mapping (which design decision satisfies which control)",
      "Evidence design (log schemas, attestations, document outputs)",
      "Sign-off document signed by customer CISO",
    ],
    url: "https://agrus.ai/services/compliance-audit/",
  },
  {
    slug: "dedicated-deployment",
    title: "Dedicated Deployment",
    description:
      "On-prem, VPC, or dedicated cloud tenancy. Your data, your weights, your audit trail. We own the operational complexity; you keep the keys.",
    priceBand: "$15,000 – $200,000",
    unit: "Discovery Sprint fixed; deployment build T&M",
    deliverables: [
      "Reference architecture and IaC modules (Terraform/CDK/Pulumi)",
      "Inference layer wrapper + OpenTelemetry observability",
      "Runbook authoring (you can take over operation if you want)",
      "Hardware sizing if on-prem (vendor-agnostic)",
      "GPU and concurrency planning with 30-40% headroom",
    ],
    url: "https://agrus.ai/services/dedicated-deployment/",
  },
  {
    slug: "integration-embedding",
    title: "Integration & Embedding",
    description:
      "Embed AI agents into the systems your team already uses: Epic, Cerner, Guidewire, NetDocuments, Dynamo, Salesforce, Synergy, Hudl. Plus Ethora chat for conversational interfaces.",
    priceBand: "$15,000 – $150,000",
    unit: "Discovery Sprint fixed; integration build T&M",
    deliverables: [
      "Integration architecture per target system",
      "SSO (Okta, Azure AD, Google Workspace) and per-user authorization",
      "Audit logging into customer's existing SIEM",
      "Accessibility compliance for user-facing embeds",
      "Compliance map covering the integration surface",
    ],
    url: "https://agrus.ai/services/integration-embedding/",
  },
  {
    slug: "managed-sla",
    title: "Managed SLA",
    description:
      "We operate your AI agent system after launch. 24/7 on-call, drift monitoring, model upgrades, quarterly evaluation, audit support.",
    priceBand: "$4,000 – $15,000 / month",
    unit: "Per agent system, monthly recurring",
    deliverables: [
      "24/7 on-call with tier-based response SLO (30 / 15 minute)",
      "Continuous drift monitoring against eval harness",
      "Model-upgrade testing and roll-out (before promotion to prod)",
      "Dependency upgrades (RAG, vector DB, embedding model, agent framework)",
      "Audit evidence pre-staged for SOC 2 / HIPAA / ISO 27001 reviews",
      "Quarterly re-evaluation report with recommendations",
    ],
    url: "https://agrus.ai/services/managed-sla/",
  },
];
