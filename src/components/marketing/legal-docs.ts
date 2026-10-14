/**
 * PLACEHOLDER legal document outlines.
 * These are illustrative drafts of intended topics ONLY. They are not legal
 * documents, are not in effect, and must be written and reviewed by qualified
 * legal counsel before any launch.
 */

export interface LegalSection {
  heading: string;
  points: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "The general rules for using the platform, for everyone.",
    audience: "All users",
    sections: [
      {
        heading: "About the platform",
        points: [
          "Describe the platform as an independent professional network and career marketplace for the insurance and financial services industries.",
          "State clearly that the platform is not an insurer, insurance agency, broker, recruiting or staffing firm, employer, or licensing authority.",
          "Clarify that the platform does not sell, quote, bind or recommend insurance products, and provides no investment, tax or legal advice.",
        ],
      },
      {
        heading: "Accounts and eligibility",
        points: [
          "Eligibility requirements, account accuracy and responsibility for account security.",
          "Organization accounts: authority to act on behalf of the organization.",
          "Suspension and termination for violations of these terms or other policies.",
        ],
      },
      {
        heading: "No guarantees of employment or earnings",
        points: [
          "The platform does not guarantee employment, affiliation, interviews, offers or any level of income.",
          "Compensation information is provided by organizations, shown as disclosed and not verified by the platform.",
          "Users are responsible for their own due diligence before accepting any role or contract.",
        ],
      },
      {
        heading: "User content",
        points: [
          "Ownership and license of content users post (profiles, posts, listings).",
          "Prohibition on posting client information, confidential data or protected health information.",
          "Reference to the Community Guidelines and moderation process.",
        ],
      },
      {
        heading: "Licensing information",
        points: [
          "License and securities registration details entered by members are self-reported and are not verified by the platform.",
          "Users should confirm licensing status with the applicable state department of insurance, and registration status with FINRA BrokerCheck or the SEC IAPD as applicable.",
        ],
      },
      {
        heading: "Disclaimers, liability and disputes",
        points: [
          "Service provided “as is”; limitation of liability (to be drafted by counsel).",
          "Governing law, dispute resolution and changes to the terms (to be determined).",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What information is collected, how it is used, and the choices members have.",
    audience: "All users",
    sections: [
      {
        heading: "Information we collect",
        points: [
          "Account and profile information members provide, including optional self-reported license details and NPN.",
          "Organization account and listing information.",
          "Usage information and device data (scope to be defined).",
        ],
      },
      {
        heading: "How information is used",
        points: [
          "Operating the network, marketplace and recruiting workspace.",
          "Transparent, rule-based opportunity recommendations.",
          "Trust, safety, moderation and fraud prevention.",
        ],
      },
      {
        heading: "Consent and data sharing",
        points: [
          "Producer information is not shared with organizations unless the member applies or explicitly opts in to recruiter contact.",
          "Per-application sharing choices (contact email, license records, NPN, experience) are recorded with each application.",
          "NPN is never displayed publicly.",
          "No sale of personal information (to be confirmed with counsel against applicable law).",
        ],
      },
      {
        heading: "Member controls",
        points: [
          "Directory visibility, recruiter contact and license display settings, changeable at any time.",
          "Access, correction and deletion requests; process and timelines to be defined.",
        ],
      },
      {
        heading: "Retention and security",
        points: [
          "Retention periods by data type (to be defined).",
          "Security safeguards, access controls and incident response (to be defined).",
        ],
      },
      {
        heading: "Jurisdiction-specific rights",
        points: ["State privacy law disclosures to be drafted by counsel as applicable."],
      },
    ],
  },
  {
    slug: "producer-consent",
    title: "Producer Consent",
    summary: "How members control what organizations can see and when they can be contacted.",
    audience: "Producers and aspiring producers",
    sections: [
      {
        heading: "Privacy by default",
        points: [
          "Recruiter contact is off unless the member turns it on.",
          "Members choose whether to appear in the member directory and talent discovery.",
        ],
      },
      {
        heading: "Consent when applying",
        points: [
          "Each application records exactly what the member chose to share with that organization.",
          "Organizations see only the shared fields for that application.",
          "Withdrawing an application and what happens to shared information (to be defined).",
        ],
      },
      {
        heading: "Recruiter outreach",
        points: [
          "Only members who opted in may receive introductions from organizations.",
          "Every introduction is logged; members may decline or report outreach.",
        ],
      },
      {
        heading: "Changing your choices",
        points: [
          "Consent settings can be changed at any time from Privacy & consent.",
          "Changes apply going forward; treatment of previously shared information to be defined.",
        ],
      },
    ],
  },
  {
    slug: "organization-terms",
    title: "Organization Terms",
    summary: "Listing standards and obligations for organizations recruiting on the platform.",
    audience: "Organizations",
    sections: [
      {
        heading: "Listing review",
        points: [
          "Organizations and opportunities are reviewed against platform standards before appearing publicly.",
          "Review is a content review only — it does not verify licenses, appointments, financial condition or claims made by the organization.",
          "The platform may request changes, decline, suspend or remove listings.",
        ],
      },
      {
        heading: "Prohibited income claims",
        points: [
          "No unsubstantiated earnings claims, income guarantees or projections.",
          "No presenting top-producer results as typical.",
          "Compensation must be described accurately by model; ranges are optional but must be truthful if disclosed.",
        ],
      },
      {
        heading: "Cost disclosure",
        points: [
          "All costs to producers — leads, E&O, technology, licensing, marketing, fees — must be disclosed in the listing.",
        ],
      },
      {
        heading: "Accurate classification",
        points: [
          "Opportunities must be accurately classified as W-2 employment or independent-contractor affiliation.",
          "Organizations remain responsible for compliance with employment, insurance and anti-discrimination law.",
        ],
      },
      {
        heading: "Use of candidate data",
        points: [
          "Candidate information may be used only for evaluating that candidate for the organization’s opportunities.",
          "No export, resale or use for marketing insurance products.",
          "Outreach limited to members who opted in, subject to logging and reporting.",
        ],
      },
      {
        heading: "Plans and fees",
        points: [
          "Subscription terms (to be defined). No commission sharing, premium-based fees or placement fees.",
        ],
      },
    ],
  },
  {
    slug: "advertising",
    title: "Advertising & Sponsored Placement Policy",
    summary: "How sponsored placements are labeled, reviewed and separated from organic results.",
    audience: "Organizations purchasing sponsored placements",
    sections: [
      {
        heading: "Labeling",
        points: [
          "All paid placements are labeled “Sponsored” on every surface where they appear.",
          "Sponsored content is displayed in a visually separate block from organic results.",
        ],
      },
      {
        heading: "Separation from organic ranking",
        points: [
          "Organic search and directory results are never influenced by payment or plan.",
          "Sponsored items are never inserted into organic ordering.",
        ],
      },
      {
        heading: "Review and content standards",
        points: [
          "Sponsored placements are reviewed before going live.",
          "The same listing standards apply — no income claims, full cost disclosure, accurate classification.",
          "The platform may pause or end placements that violate standards.",
        ],
      },
      {
        heading: "Commercial terms",
        points: ["Scheduling, pricing, cancellation and make-goods (to be defined by counsel and finance)."],
      },
    ],
  },
  {
    slug: "community-guidelines",
    title: "Community Guidelines",
    summary: "The standards of conduct for posts, comments, groups and messages.",
    audience: "All members and organizations",
    sections: [
      {
        heading: "Protect clients and confidential information",
        points: [
          "Never post client names, policy numbers, health information or other identifying details.",
          "Automated checks may block posts that appear to contain confidential information.",
        ],
      },
      {
        heading: "Content standards",
        points: [
          "Be professional and respectful; no harassment, discrimination or personal attacks.",
          "No spam, misleading content or impersonation.",
          "No soliciting, quoting or selling insurance products in the community.",
        ],
      },
      {
        heading: "No income claims or recruiting pitches",
        points: [
          "No earnings promises or unsubstantiated income claims in posts, comments or messages.",
          "Recruiting belongs in reviewed opportunity listings, not unsolicited messages or posts.",
        ],
      },
      {
        heading: "Reporting and moderation",
        points: [
          "Any member can report content; reports are reviewed by the trust team.",
          "Possible actions include hiding content, warnings, suspension or removal.",
          "Appeal process (to be defined).",
        ],
      },
    ],
  },
];

export function getLegalDoc(slug: string) {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
