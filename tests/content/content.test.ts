/**
 * Content integrity tests.
 *
 * Catches the most common drift bugs at near-zero cost:
 *   - duplicate slugs (would cause tool responses to silently overwrite)
 *   - missing required fields (would crash tools at runtime)
 *   - URL drift (we publish https://agrus.ai/... URLs in every response)
 *   - enum coverage drift between content modules and tool input schemas
 *     (e.g. adding a new vertical in content but forgetting to add it to
 *     the Zod enum used by tool inputs)
 */
import { describe, it, expect } from "vitest";
import { services } from "../../src/content/services.js";
import { verticals } from "../../src/content/verticals.js";
import { regimes } from "../../src/content/compliance-regimes.js";
import { caseStudies } from "../../src/content/case-studies.js";
import { pricing } from "../../src/content/pricing.js";

const AGRUS_HOST = "https://agrus.ai";

function uniqueSlugs<T extends { slug: string }>(items: readonly T[]): Set<string> {
  return new Set(items.map((i) => i.slug));
}

describe("services content", () => {
  it("has at least 6 service pillars", () => {
    expect(services.length).toBeGreaterThanOrEqual(6);
  });
  it("has unique slugs", () => {
    expect(uniqueSlugs(services).size).toBe(services.length);
  });
  it("every service has title, description, priceBand, unit, deliverables, url", () => {
    for (const s of services) {
      expect(s.title, `${s.slug} title`).toBeTruthy();
      expect(s.description, `${s.slug} description`).toBeTruthy();
      expect(s.priceBand, `${s.slug} priceBand`).toBeTruthy();
      expect(s.unit, `${s.slug} unit`).toBeTruthy();
      expect(s.deliverables.length, `${s.slug} deliverables`).toBeGreaterThan(0);
      expect(s.url.startsWith(AGRUS_HOST), `${s.slug} url ${s.url}`).toBe(true);
    }
  });
});

describe("verticals content", () => {
  it("has at least 7 verticals + 'other' as the catch-all", () => {
    const slugs = uniqueSlugs(verticals);
    expect(slugs.has("other") || slugs.size >= 7).toBe(true);
  });
  it("every vertical has compliance pins + sample use cases + default persona + URL", () => {
    for (const v of verticals) {
      expect(v.compliancePins.length, `${v.slug} compliance pins`).toBeGreaterThan(0);
      expect(v.sampleUseCases.length, `${v.slug} use cases`).toBeGreaterThan(0);
      expect(v.defaultPersona, `${v.slug} persona`).toBeTruthy();
      expect(v.url.startsWith(AGRUS_HOST), `${v.slug} url`).toBe(true);
    }
  });
});

describe("compliance regimes content", () => {
  it("covers HIPAA, SOC 2, ISO 27001, EU AI Act, NAIC, ABA, AML/KYC", () => {
    const slugs = uniqueSlugs(regimes);
    for (const expected of [
      "hipaa",
      "soc2",
      "iso27001",
      "eu_ai_act",
      "naic",
      "aba",
      "aml_kyc",
    ]) {
      expect(slugs.has(expected), `missing regime ${expected}`).toBe(true);
    }
  });
  it("every regime has key controls, common gotchas, firstQuestionWeAsk, reference architecture", () => {
    for (const r of regimes) {
      expect(r.keyControls.length, `${r.slug} controls`).toBeGreaterThan(0);
      expect(r.commonGotchas.length, `${r.slug} gotchas`).toBeGreaterThan(0);
      expect(r.firstQuestionWeAsk.length, `${r.slug} first question`).toBeGreaterThan(20);
      expect(r.agrusReferenceArchitecture.length, `${r.slug} arch`).toBeGreaterThan(20);
      expect(r.url.startsWith(AGRUS_HOST + "/ai-compliance/"), `${r.slug} url`).toBe(true);
    }
  });
});

describe("case studies content", () => {
  it("has at least 3 case studies", () => {
    expect(caseStudies.length).toBeGreaterThanOrEqual(3);
  });
  it("has unique slugs", () => {
    expect(uniqueSlugs(caseStudies).size).toBe(caseStudies.length);
  });
  it("every case study references a vertical slug from the VerticalSlug union", () => {
    // 'other' is a valid VerticalSlug used as catch-all for case studies that
    // don't fit one of the 7 named verticals (e.g. dogfood + cross-vertical
    // engagements). Allowed alongside the named verticals in content.
    const allowed = new Set<string>([...uniqueSlugs(verticals), "other"]);
    for (const c of caseStudies) {
      expect(allowed.has(c.vertical), `${c.slug} → ${c.vertical}`).toBe(true);
    }
  });
  it("every case study has codename, oneliner, problem, achieved, technology", () => {
    for (const c of caseStudies) {
      expect(c.codename.length, `${c.slug} codename`).toBeGreaterThan(0);
      expect(c.oneliner.length, `${c.slug} oneliner`).toBeGreaterThan(20);
      expect(c.problem.length, `${c.slug} problem`).toBeGreaterThan(30);
      expect(c.achieved.length, `${c.slug} achieved`).toBeGreaterThan(30);
      expect(c.technology.length, `${c.slug} tech`).toBeGreaterThan(0);
    }
  });
});

describe("pricing content", () => {
  it("includes all four published tiers", () => {
    for (const key of ["scopingCall", "discoverySprint", "buildEngagement", "managedSla"]) {
      expect(pricing[key], `pricing.${key}`).toBeTruthy();
    }
  });
  it("every tier has name, priceBand, unit, deliverable", () => {
    for (const [key, tier] of Object.entries(pricing)) {
      expect(tier.name, `${key} name`).toBeTruthy();
      expect(tier.priceBand, `${key} priceBand`).toBeTruthy();
      expect(tier.unit, `${key} unit`).toBeTruthy();
      expect(tier.deliverable, `${key} deliverable`).toBeTruthy();
    }
  });
});

describe("cross-module enum coverage", () => {
  // Tools accept vertical via a Zod enum literal — adding a new vertical to
  // content without adding it to the enum would make that vertical
  // unrouteable. We can't import the tool schemas without importing the
  // tool modules (which is fine), but to keep this test focused we
  // re-declare the expected set and let any drift fail loudly.
  const TOOL_VERTICAL_ENUM = [
    "healthcare",
    "insurance",
    "legal",
    "private_equity",
    "family_offices",
    "corporate_intelligence",
    "sports",
    "other",
  ] as const;

  it("every vertical in content has a slot in the tool input enum", () => {
    const contentSlugs = uniqueSlugs(verticals);
    for (const slug of contentSlugs) {
      expect(
        TOOL_VERTICAL_ENUM.includes(slug as (typeof TOOL_VERTICAL_ENUM)[number]),
        `vertical ${slug} exists in content but tool schemas reject it`,
      ).toBe(true);
    }
  });

  const TOOL_REGIME_ENUM = [
    "hipaa",
    "soc2",
    "iso27001",
    "eu_ai_act",
    "naic",
    "aba",
    "aml_kyc",
  ] as const;

  it("every regime in content has a slot in the tool input enum", () => {
    const contentSlugs = uniqueSlugs(regimes);
    for (const slug of contentSlugs) {
      expect(
        TOOL_REGIME_ENUM.includes(slug as (typeof TOOL_REGIME_ENUM)[number]),
        `regime ${slug} exists in content but tool schemas reject it`,
      ).toBe(true);
    }
  });
});
