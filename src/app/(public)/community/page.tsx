import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Handshake, Layers, MessagesSquare, Rocket, ShieldCheck, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/page";
import { CheckList, CtaBand, FeatureItem, MarketingHero, Section } from "@/components/marketing/section";
import { CommunityEvents, CommunityGroups, CommunityPosts } from "./community-live";

export const metadata: Metadata = {
  title: "Community",
  description: "Connections, discussion, groups, mentorship and events for insurance and financial services professionals — and the people about to become one.",
};

export default function CommunityPage() {
  return (
    <>
      <MarketingHero
        eyebrow="The professional network"
        title={<>The conversations that <span className="italic text-ink-3">build careers</span> happen here.</>}
        lede="A professional community for producers, account managers, agency leaders, recruiters and people exploring the industry. Ask honest questions, share what’s working, and meet the people you’ll learn from for years."
        actions={
          <>
            <ButtonLink href="/join" size="lg">Join the Network <ArrowRight className="h-4 w-4" /></ButtonLink>
            <ButtonLink href="/network" variant="secondary" size="lg">Open the feed (members)</ButtonLink>
          </>
        }
      />

      <Section>
        <SectionHeading eyebrow="What members do" title="Five ways to be part of it" />
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          <FeatureItem icon={<Handshake className="h-5 w-5" strokeWidth={1.75} />} title="Connect">
            Build a network of peers, mentors and leaders — every connection is a mutual choice.
          </FeatureItem>
          <FeatureItem icon={<MessagesSquare className="h-5 w-5" strokeWidth={1.75} />} title="Discuss">
            A topic-organized feed for career development, training, leadership and the independent-versus-captive question.
          </FeatureItem>
          <FeatureItem icon={<Layers className="h-5 w-5" strokeWidth={1.75} />} title="Join groups">
            Smaller rooms for specific practices and stages — commercial lines, benefits, the newly licensed.
          </FeatureItem>
          <FeatureItem icon={<Sprout className="h-5 w-5" strokeWidth={1.75} />} title="Find mentorship">
            Experienced members host office hours; newer members bring real questions and leave with next steps.
          </FeatureItem>
          <FeatureItem icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />} title="Attend events">
            Roundtables, info sessions and regional meetups, hosted by groups and the editorial team.
          </FeatureItem>
        </div>
        <Link href="/launch" className="group mt-14 flex flex-col gap-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-6 transition hover:border-gold sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-gold-ink ring-1 ring-gold-200"><Rocket className="h-5 w-5" strokeWidth={1.75} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-semibold text-ink">Newly licensed? Start with the New Producer Portal</span>
            <span className="mt-0.5 block text-[14px] text-ink-3">Curated first roles, training-forward organizations and peers at the same stage.</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </Link>
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow="From the feed"
          title="Recent conversations"
          description="A read-only preview. Members are fictional people in this prototype; join to reply, react and post."
          action={<ButtonLink href="/network" variant="secondary">Open the feed <ArrowRight className="h-4 w-4" /></ButtonLink>}
        />
        <CommunityPosts />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Groups"
          title="Find your room"
          description="Peer groups organized by practice, stage and topic."
          action={<ButtonLink href="/network/groups" variant="secondary">Browse groups</ButtonLink>}
        />
        <CommunityGroups />
      </Section>

      <Section tone="subtle">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="eyebrow mb-3">Upcoming</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">Events this month</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
              Most sessions are virtual and open to every member. Times are shown in UTC in this prototype.
            </p>
            <ButtonLink href="/network/events" variant="secondary" className="mt-6">All events</ButtonLink>
          </div>
          <CommunityEvents />
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="eyebrow mb-3 flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Community guidelines</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">Professional by default.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
              The community works because members treat it like a room full of colleagues. A short summary of the standards we hold
              everyone to — organizations included:
            </p>
            <Link href="/legal/community-guidelines" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy">
              Read the full guidelines (placeholder) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <CheckList
            items={[
              <><span className="font-medium text-ink">Never share client information.</span> No names, policy numbers, health details or anything that identifies a client.</>,
              <><span className="font-medium text-ink">No income claims or recruiting pitches.</span> Share experience, not promises. Recruiting belongs in reviewed listings.</>,
              <><span className="font-medium text-ink">No product solicitation.</span> This is a career community, not a place to sell or quote insurance.</>,
              <><span className="font-medium text-ink">Respect, always.</span> Disagree with ideas, not people. Harassment results in removal.</>,
              <><span className="font-medium text-ink">Report what doesn’t belong.</span> Every report is reviewed by a person on our trust team.</>,
            ]}
          />
        </div>
      </Section>

      <Section className="pt-0 sm:pt-0">
        <CtaBand
          eyebrow="Membership is free"
          title="Bring your questions. Bring your expertise."
          body="Create a member profile in a few minutes. You decide what’s visible and whether organizations may contact you."
          actions={
            <>
              <ButtonLink href="/join" size="lg" className="bg-white text-ink hover:bg-canvas">Join the Network</ButtonLink>
              <ButtonLink href="/join?step=persona" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">Try a demo persona</ButtonLink>
            </>
          }
        />
      </Section>
    </>
  );
}
