import type { Connection, EventItem, Group, Post, Resource } from "../types";
import { daysAgo, daysFromNow } from "@/lib/utils/dates";

let c = 0;
const conn = (fromId: string, toId: string, status: Connection["status"], ago: number, message?: string): Connection => ({
  id: `con_${++c}`,
  fromId,
  toId,
  status,
  message,
  createdAt: daysAgo(ago),
  respondedAt: status === "pending" ? undefined : daysAgo(Math.max(0, ago - 1)),
});

export const seedConnections: Connection[] = [
  conn("u_maya", "u_marcus", "accepted", 200),
  conn("u_ben", "u_maya", "accepted", 150),
  conn("u_maya", "u_rachel", "accepted", 120),
  conn("u_grace", "u_maya", "accepted", 90),
  conn("u_jamal", "u_maya", "accepted", 60),
  conn("u_maya", "u_sofia", "accepted", 45),
  conn("u_maya", "u_daniel", "accepted", 30),
  conn("u_devon", "u_maya", "pending", 2, "Hi Maya — I'm in personal lines and hoping to move into small commercial. Would love to follow your posts on contractor coverage."),
  conn("u_maya", "u_claire", "pending", 5, "Loved your post on onboarding — would be great to connect."),
  conn("u_jordan", "u_luis", "accepted", 60),
  conn("u_aisha", "u_jordan", "accepted", 40),
  conn("u_jordan", "u_omar", "accepted", 20),
  conn("u_jordan", "u_renee", "accepted", 7),
  conn("u_tyler", "u_jordan", "pending", 1, "Fellow newly licensed producer here — let's compare notes on training programs."),
  conn("u_imani", "u_jordan", "pending", 3),
  conn("u_priya", "u_megan", "accepted", 14),
  conn("u_nina", "u_priya", "pending", 2, "Also a career changer — studying for P&C. Want to swap resources?"),
  conn("u_priya", "u_claire", "pending", 4),
  conn("u_tom", "u_megan", "accepted", 300),
  conn("u_grace", "u_jamal", "accepted", 250),
  conn("u_claire", "u_grace", "accepted", 220),
  conn("u_elena", "u_imani", "accepted", 100),
  conn("u_sofia", "u_rachel", "accepted", 180),
  conn("u_kwame", "u_ben", "accepted", 80),
  conn("u_daniel", "u_jamal", "accepted", 70),
];

export const seedGroups: Group[] = [
  { id: "grp_newly", slug: "newly-licensed-circle", name: "Newly Licensed Circle", description: "A peer group for producers in their first two years — questions welcome, no question too basic.", topic: "career_development", lines: ["life", "property-casualty", "accident-health"], memberIds: ["u_jordan", "u_hannah", "u_tyler", "u_omar", "u_devon", "u_nina", "u_priya", "u_claire"], createdAt: daysAgo(300) },
  { id: "grp_leaders", slug: "agency-leaders-roundtable", name: "Agency Leaders Roundtable", description: "Principals and sales leaders discussing hiring, onboarding, perpetuation and team culture.", topic: "agency_leadership", lines: ["agency-leadership"], memberIds: ["u_grace", "u_jamal", "u_claire", "u_daniel", "u_marcus", "u_renee"], createdAt: daysAgo(280) },
  { id: "grp_commercial", slug: "commercial-lines-practitioners", name: "Commercial Lines Practitioners", description: "Technical discussion for commercial producers and account managers. Never share client-identifying details.", topic: "producer_training", lines: ["commercial", "specialty"], memberIds: ["u_maya", "u_marcus", "u_ben", "u_rachel", "u_sofia", "u_daniel"], createdAt: daysAgo(260) },
  { id: "grp_benefits", slug: "benefits-and-health-professionals", name: "Benefits & Health Professionals", description: "Employee benefits, individual health and Medicare-related career conversations.", topic: "networking", lines: ["employee-benefits", "accident-health", "medicare"], memberIds: ["u_tom", "u_megan", "u_elena", "u_imani", "u_priya"], createdAt: daysAgo(240) },
  { id: "grp_mentors", slug: "mentorship-exchange", name: "Mentorship Exchange", description: "Experienced professionals offering office hours; newer members asking for guidance.", topic: "mentorship", lines: ["agency-leadership", "life", "commercial"], memberIds: ["u_claire", "u_grace", "u_maya", "u_jordan", "u_tyler"], createdAt: daysAgo(200) },
  { id: "grp_ind_captive", slug: "independent-or-captive", name: "Independent or Captive?", description: "Honest conversations about distribution models, trade-offs and transitions.", topic: "independent_vs_captive", lines: ["life", "personal-lines", "property-casualty"], memberIds: ["u_devon", "u_aisha", "u_luis", "u_jamal", "u_jordan"], createdAt: daysAgo(150) },
];

let p = 0;
const cm = (authorId: string, body: string, ago: number) => ({ id: `cmt_${++p}`, authorId, body, createdAt: daysAgo(ago, 18) });

export const seedPosts: Post[] = [
  {
    id: "post_1", authorId: "u_grace", topic: "agency_leadership", groupId: "grp_leaders", createdAt: daysAgo(0, 12),
    body: "Hiring lesson I keep relearning: the best predictor of a new producer's first year isn't sales experience — it's how they handle the second 'no.' We now include a short, honest role-play in every interview where the candidate hears a polite objection twice. It tells us more than any résumé line.",
    likes: ["u_jamal", "u_claire", "u_maya", "u_daniel", "u_renee"],
    comments: [cm("u_jamal", "We started doing something similar. Candidates appreciate seeing the real job instead of a highlight reel.", 0), cm("u_daniel", "Stealing this for our next round. How long do you keep the role-play?", 0)],
  },
  {
    id: "post_2", authorId: "u_jordan", topic: "career_development", groupId: "grp_newly", createdAt: daysAgo(1, 15),
    body: "Five months licensed. Biggest surprise so far: how much of the job is learning to explain things simply. My hospitality background is helping more than I expected. What helped you most in your first year?",
    likes: ["u_luis", "u_aisha", "u_tyler", "u_omar", "u_claire", "u_hannah"],
    comments: [cm("u_claire", "Write down every question a client asks you this year. That list becomes your best training material.", 1), cm("u_aisha", "Find one mentor whose calendar you can actually get on. Consistency beats prestige.", 1), cm("u_tyler", "Same boat — just licensed. Following this thread!", 0)],
  },
  {
    id: "post_3", authorId: "u_maya", topic: "producer_training", groupId: "grp_commercial", createdAt: daysAgo(2, 14),
    body: "A small habit that changed my renewals: I send a one-page 'what changed in your business this year?' questionnaire 120 days out. Contractors rarely volunteer new equipment, new subs or new states — but they'll answer five checkboxes. Happy to share a de-identified template.",
    likes: ["u_ben", "u_marcus", "u_rachel", "u_sofia", "u_devon", "u_daniel", "u_grace"],
    comments: [cm("u_ben", "120 days is the sweet spot. We do 90 and it's always a scramble.", 2), cm("u_devon", "Would love the template — trying to learn small commercial.", 1)],
  },
  {
    id: "post_4", authorId: "u_luis", topic: "independent_vs_captive", groupId: "grp_ind_captive", createdAt: daysAgo(3, 16),
    body: "Moved from a captive role to independent affiliation last year. The honest trade-offs: more product choice and ownership, but you are now running a business — E&O, marketing compliance, bookkeeping. Ask every organization for a written list of costs before you sign anything.",
    likes: ["u_jordan", "u_aisha", "u_devon", "u_jamal"],
    comments: [cm("u_jamal", "This should be pinned. Transparency on costs is the single best signal of a good partner.", 3)],
  },
  {
    id: "post_5", authorId: "u_claire", topic: "mentorship", groupId: "grp_mentors", createdAt: daysAgo(4, 13),
    body: "Opening two monthly office-hour slots for newer producers working on their first-year development plan. Bring a goal, leave with three concrete next steps. Reply here and I'll share times.",
    likes: ["u_jordan", "u_tyler", "u_maya", "u_priya"],
    comments: [cm("u_tyler", "I'd love a slot!", 4), cm("u_priya", "Would this be useful for someone still studying? Totally fine if not.", 3), cm("u_claire", "Absolutely, Priya — especially for planning your first 90 days.", 3)],
  },
  {
    id: "post_6", authorId: "u_tom", topic: "career_development", groupId: "grp_benefits", createdAt: daysAgo(5, 15),
    body: "For anyone considering benefits from another field: teachers, analysts and HR professionals often ramp fastest. The core skill is explaining trade-offs to people who'd rather not think about them.",
    likes: ["u_priya", "u_megan", "u_elena"],
    comments: [cm("u_priya", "As a former teacher, this is very encouraging. Thank you.", 5)],
  },
  {
    id: "post_7", authorId: "u_jamal", topic: "networking", createdAt: daysAgo(6, 17),
    body: "Recruiter's perspective: a profile that clearly states preferred work arrangement, licensed states and the kind of team you want saves everyone time. Specificity is a kindness.",
    likes: ["u_maya", "u_grace", "u_hannah", "u_devon", "u_luis"],
    comments: [],
  },
  {
    id: "post_8", authorId: "u_elena", topic: "producer_training", createdAt: daysAgo(8, 14),
    body: "Compliance reminder for senior-market folks heading into the busy season: re-read your scope-of-appointment and documentation requirements every single year. Rules change, and 'how we did it last year' is not a defense.",
    likes: ["u_imani", "u_omar", "u_tom"],
    comments: [cm("u_imani", "Saving this. The annual refresh is easy to skip when you're busy.", 7)],
  },
  {
    id: "post_9", authorId: "u_sofia", topic: "industry", createdAt: daysAgo(10, 16),
    body: "Wholesale tip for retail agents: the cleanest submissions get the best attention. Complete loss runs, current schedules and a two-paragraph narrative of the risk go a long way.",
    likes: ["u_maya", "u_rachel", "u_ben"],
    comments: [],
  },
  {
    id: "post_10", authorId: "u_renee", topic: "mentorship", createdAt: daysAgo(12, 15),
    body: "We redesigned onboarding so every new affiliate gets a written disclosure of every optional cost before their first call with us. Fewer surprises, better relationships. Curious how other organizations handle this.",
    likes: ["u_jordan", "u_luis", "u_grace", "u_jamal"],
    comments: [cm("u_grace", "Love this. Agencies could learn from it for hiring as well.", 11)],
  },
];

export const seedResources: Resource[] = [
  { id: "res_1", slug: "first-90-days-new-producer", title: "Your first 90 days as a newly licensed producer", kind: "guide", audience: "new", minutes: 9, author: "Producer Network Editorial (demo)", lines: ["life", "property-casualty", "accident-health"],
    summary: "A practical week-by-week framework for learning systems, building habits and finding a mentor.",
    body: ["The first 90 days are about habits, not production. Block time every day for product learning, shadowing and reflection.", "Ask your organization for a written onboarding plan with clear milestones.", "Track every client question you can't answer yet — then close the gap within a week.", "Find one experienced colleague willing to review your notes weekly."] },
  { id: "res_2", slug: "evaluating-recruiting-offers", title: "How to evaluate a recruiting or affiliation offer", kind: "checklist", audience: "all", minutes: 6, author: "Producer Network Editorial (demo)", lines: ["life", "annuities", "accident-health", "medicare", "property-casualty"],
    summary: "Questions to ask about training, costs, lead programs, contracts and expectations before you commit.",
    body: ["Ask for every cost in writing: E&O, technology, marketing, lead programs, licensing.", "Understand whether the role is W-2 employment or independent contracting — and what that means for taxes and benefits.", "Ask who owns client relationships if you leave.", "Be wary of income claims without documented basis. Results vary widely by individual.", "Talk to at least two current team members without a manager present."] },
  { id: "res_3", slug: "independent-vs-captive-primer", title: "Independent vs. captive distribution: a neutral primer", kind: "article", audience: "aspiring", minutes: 8, author: "Producer Network Editorial (demo)", lines: ["personal-lines", "life", "property-casualty"],
    summary: "How the models differ in product access, support, ownership and day-to-day work.",
    body: ["Captive producers represent one carrier family and often receive more structured support.", "Independent producers represent multiple carriers, with more product choice and more business-ownership responsibility.", "Neither model is universally better — fit depends on your goals, risk tolerance and preferred support."] },
  { id: "res_4", slug: "building-a-compliant-profile", title: "Building a strong profile without oversharing", kind: "guide", audience: "all", minutes: 5, author: "Producer Network Editorial (demo)", lines: ["life", "commercial", "employee-benefits"],
    summary: "Showcase expertise and accomplishments without disclosing client or confidential information.",
    body: ["Describe accomplishments in terms of skills and process, not client names or premiums.", "Never post policy details, client records or protected health information.", "License information you add is self-reported until a future verification process exists."] },
  { id: "res_5", slug: "career-changers-guide", title: "A career changer's map of the insurance industry", kind: "guide", audience: "aspiring", minutes: 12, author: "Producer Network Editorial (demo)", lines: ["employee-benefits", "claims-operations", "personal-lines", "life"],
    summary: "Which roles fit which backgrounds — teaching, hospitality, operations, finance and more.",
    body: ["Teachers often thrive in benefits and client education roles.", "Hospitality professionals bring service instincts valued in personal lines and health.", "Operations backgrounds translate well to claims and agency operations."] },
  { id: "res_6", slug: "interviewing-agencies-webinar", title: "Webinar replay: Interviewing the agency that's interviewing you", kind: "webinar", audience: "new", minutes: 42, author: "Producer Network Events (demo)", lines: ["property-casualty", "commercial", "personal-lines"],
    summary: "A panel of fictional agency leaders on the questions candidates should ask.",
    body: ["This is a placeholder for a recorded webinar in the prototype."] },
  { id: "res_7", slug: "onboarding-plan-template", title: "Template: 30-60-90 producer onboarding plan", kind: "template", audience: "leaders", minutes: 4, author: "Producer Network Editorial (demo)", lines: ["agency-leadership"],
    summary: "A starting template organizations can adapt for new producer onboarding.",
    body: ["30 days: systems, products, shadowing.", "60 days: supervised client conversations.", "90 days: independent work with weekly review."] },
  { id: "res_8", slug: "understanding-lines-of-authority", title: "Understanding lines of authority (general overview)", kind: "article", audience: "aspiring", minutes: 7, author: "Producer Network Editorial (demo)", lines: ["life", "accident-health", "property-casualty"],
    summary: "A general introduction — always confirm requirements with your state department of insurance.",
    body: ["States issue producer licenses with specific lines of authority.", "Requirements, exams and continuing education vary by state.", "This overview is educational and not legal or licensing advice."] },
];

export const seedEvents: EventItem[] = [
  { id: "evt_1", title: "Newly Licensed Circle: Monthly Q&A", startsAt: daysFromNow(3, 23), format: "virtual", location: "Online (demo)", host: "Newly Licensed Circle", description: "Open Q&A with experienced producers.", lines: ["life", "property-casualty"], attendees: ["u_jordan", "u_tyler"] },
  { id: "evt_2", title: "Commercial Lines Roundtable: Contractors", startsAt: daysFromNow(6, 18), format: "virtual", location: "Online (demo)", host: "Commercial Lines Practitioners", description: "A technical discussion of contractor exposures.", lines: ["commercial"], attendees: ["u_maya", "u_ben"] },
  { id: "evt_3", title: "Career Changers Info Session", startsAt: daysFromNow(8, 22), format: "virtual", location: "Online (demo)", host: "Producer Network Events", description: "How people from other industries found their path.", lines: ["employee-benefits", "personal-lines"], attendees: ["u_priya", "u_nina"] },
  { id: "evt_4", title: "Southeast Agency Leaders Breakfast", startsAt: daysFromNow(12, 13), format: "in_person", location: "Charlotte, NC (fictional venue)", host: "Agency Leaders Roundtable", description: "In-person networking for agency principals and sales leaders.", lines: ["agency-leadership"], attendees: ["u_grace", "u_daniel"] },
  { id: "evt_5", title: "Benefits Renewal Season Prep", startsAt: daysFromNow(15, 17), format: "virtual", location: "Online (demo)", host: "Benefits & Health Professionals", description: "Planning, communication and analytics for renewal season.", lines: ["employee-benefits"], attendees: ["u_tom", "u_megan"] },
  { id: "evt_6", title: "Mentorship Exchange: Office Hours", startsAt: daysFromNow(20, 21), format: "virtual", location: "Online (demo)", host: "Mentorship Exchange", description: "Drop-in office hours with experienced mentors.", lines: ["agency-leadership", "life"], attendees: ["u_claire"] },
];
