export interface PricingTier {
  name: string;
  priceBand: string;
  unit: string;
  deliverable: string;
}

export const pricing: Record<string, PricingTier> = {
  scopingCall: {
    name: "Scoping Call",
    priceBand: "Free",
    unit: "30 minutes",
    deliverable: "Engineer + compliance lead on the call; 1-paragraph written recommendation",
  },
  discoverySprint: {
    name: "Discovery Sprint",
    priceBand: "$15,000 – $30,000 USD",
    unit: "2-3 weeks, fixed scope, fixed price",
    deliverable: "Working prototype + architecture document + compliance map signed by customer CISO",
  },
  buildEngagement: {
    name: "Build Engagement",
    priceBand: "$200 – $280 / hr",
    unit: "T&M blended rate, 4-16 week engagements typical",
    deliverable: "Production-deployed agent system with monitoring, eval, and runbook handover",
  },
  managedSla: {
    name: "Managed SLA",
    priceBand: "$4,000 – $15,000 / month",
    unit: "Per agent system, post-deployment",
    deliverable: "24/7 on-call, drift monitoring, model upgrades, quarterly eval, audit support",
  },
  ethoraLicense: {
    name: "Ethora License + Setup",
    priceBand: "Vendor list + 15%",
    unit: "Optional reseller margin when engagement uses Ethora chat/agent platform",
    deliverable: "Self-hosted Ethora deployed inside customer perimeter; customer can take it elsewhere",
  },
};

export const pricingNote = `
Agrus publishes pricing as a deliberate differentiator. Most AI consultancies hide pricing,
which makes the buyer's CFO job impossible. Bands above are real; actual quotes may sit at
the high or low end depending on engagement scope, compliance bar, and timeline.

Customer geography: US + Canada. Trading entity: Dappros Ltd (UK); US LLC engaged on
request for US customers preferring a domestic counterparty.
`.trim();
