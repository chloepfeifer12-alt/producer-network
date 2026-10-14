-- =====================================================================
-- Producer Network — PostgreSQL schema (production target, NOT in use)
--
-- The prototype runs on synthetic data in the browser (src/lib/store).
-- This file documents the intended relational model so the service layer
-- (src/lib/services/*) can be re-pointed at an API backed by PostgreSQL.
-- Row-level-security (RLS) policies below are SKETCHES that must be
-- reviewed by security engineering before use.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------
create type user_kind            as enum ('producer','aspiring','organization','admin');
create type account_status       as enum ('active','suspended','pending');
create type org_member_role      as enum ('owner','recruiter');
create type admin_role           as enum ('superadmin','moderator','support');
create type work_arrangement     as enum ('remote','hybrid','in_person');
create type engagement_type      as enum ('w2','independent_contractor');
create type opportunity_kind     as enum ('employment','contracting');
create type experience_level     as enum ('no_license','newly_licensed','early','mid','senior','leadership');
create type compensation_model   as enum ('salary','salary_plus_incentive','hourly','commission_only','draw_against_commission');
create type leads_policy         as enum ('provided','available_at_cost','not_provided');
create type license_requirement  as enum ('required','required_within_90_days','not_required','licensing_support_available');
create type opportunity_status   as enum ('draft','pending_review','published','changes_requested','rejected','archived');
create type org_listing_status   as enum ('pending','approved','changes_requested','rejected','suspended');
create type pipeline_stage       as enum ('new','under_review','interview','offer','hired','closed');
create type profile_visibility   as enum ('public','members','private');
create type availability         as enum ('actively_looking','open','not_looking');
-- Verification is intentionally limited. A new value may only be added once an
-- authorized verification provider + consent flow exists.
create type license_verification as enum ('self_reported_unverified');
create type plan_id              as enum ('directory','growth','premier');

-- ---------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------
create table insurance_lines (
  slug        text primary key,           -- 'life', 'property-casualty', ...
  name        text not null,
  short_name  text not null,
  summary     text not null,
  description text not null
);

-- ---------------------------------------------------------------------
-- Identity (auth handled by an external IdP; this is the app profile)
-- ---------------------------------------------------------------------
create table users (
  id             uuid primary key default gen_random_uuid(),
  idp_subject    text unique not null,      -- OIDC subject from identity provider
  kind           user_kind not null,
  name           text not null,
  email          citext unique not null,
  status         account_status not null default 'active',
  admin_role     admin_role,
  created_at     timestamptz not null default now(),
  last_active_at timestamptz,
  check ((kind = 'admin') = (admin_role is not null))
);

create table organizations (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  category              text not null,
  tagline               text not null,
  about                 text not null,
  founded               int,
  hq_city               text,
  hq_state              char(2),
  footprint             text not null,
  states_served         text[] not null default '{}',   -- USPS codes or {'ALL'}
  arrangements          work_arrangement[] not null default '{}',
  engagement_types      engagement_type[] not null default '{}',
  team_size             text,
  training_available    boolean not null default false,
  mentorship            jsonb not null default '{}',
  lead_program          jsonb not null default '{}',
  compensation_approach text not null default '',
  culture               jsonb not null default '{}',
  recruiting_status     text not null,
  recruiting_contact    jsonb not null default '{}',
  brand                 jsonb not null default '{}',
  listing_status        org_listing_status not null default 'pending',
  listing_note          text,
  plan                  plan_id not null default 'directory',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table organization_lines (org_id uuid references organizations on delete cascade, line text references insurance_lines, primary key (org_id, line));
create table organization_members (
  org_id  uuid references organizations on delete cascade,
  user_id uuid references users on delete cascade,
  role    org_member_role not null,
  primary key (org_id, user_id)
);
create table organization_leaders (id uuid primary key default gen_random_uuid(), org_id uuid references organizations on delete cascade, name text, title text, bio text, position int);
create table training_programs   (id uuid primary key default gen_random_uuid(), org_id uuid references organizations on delete cascade, name text, format text, duration text, description text);

-- ---------------------------------------------------------------------
-- Producer profiles
-- ---------------------------------------------------------------------
create table producer_profiles (
  user_id            uuid primary key references users on delete cascade,
  headline           text not null default '',
  city               text,
  state              char(2),
  bio                text not null default '',
  experience_level   experience_level not null,
  years_in_industry  int not null default 0 check (years_in_industry between 0 and 60),
  arrangement_prefs  work_arrangement[] not null default '{}',
  engagement_prefs   engagement_type[] not null default '{}',
  npn_encrypted      bytea,                -- encrypted at rest; never exposed publicly
  career_interests   text[] not null default '{}',
  expertise          text[] not null default '{}',
  availability       availability not null default 'open',
  visibility         profile_visibility not null default 'members',
  aspiring           jsonb,
  updated_at         timestamptz not null default now()
);
create table profile_specialties (user_id uuid references producer_profiles on delete cascade, line text references insurance_lines, primary key (user_id, line));

create table license_records (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references producer_profiles on delete cascade,
  state               char(2) not null,
  residency           text not null check (residency in ('resident','non_resident')),
  lines_of_authority  text[] not null,
  status              text not null,
  expires_on          date,
  verification        license_verification not null default 'self_reported_unverified'
);

create table profile_entries (           -- experience, education, certifications, awards, accomplishments
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references producer_profiles on delete cascade,
  kind       text not null check (kind in ('experience','education','certification','award','accomplishment')),
  data       jsonb not null,
  position   int not null default 0
);

-- Consent is versioned: every change inserts a row (latest row wins).
create table consent_records (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users on delete cascade,
  recruiter_contact  boolean not null,
  show_in_directory  boolean not null,
  show_licenses      boolean not null,
  share_npn_on_apply boolean not null,
  policy_version     text not null,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Opportunities & applications
-- ---------------------------------------------------------------------
create table opportunities (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  org_id               uuid not null references organizations on delete cascade,
  title                text not null,
  kind                 opportunity_kind not null,
  engagement           engagement_type not null,
  category             text not null,
  arrangement          work_arrangement not null,
  city                 text,
  state                text not null,          -- USPS or 'US'
  eligible_states      text[] not null default '{}',
  experience_level     experience_level not null,
  license_requirement  license_requirement not null,
  licenses_needed      text[] not null default '{}',
  training_provided    boolean not null,
  training_summary     text,
  leads                leads_policy not null,
  leads_notes          text,
  compensation         jsonb not null,         -- {model, disclosed, min, max, period, notes}
  summary              text not null,
  description          text not null,
  responsibilities     text[] not null default '{}',
  requirements         text[] not null default '{}',
  support              text[] not null default '{}',
  status               opportunity_status not null default 'draft',
  moderation           jsonb,
  posted_at            timestamptz,
  views                bigint not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check ((kind = 'employment' and engagement = 'w2') or (kind = 'contracting' and engagement = 'independent_contractor'))
);
create table opportunity_lines (opportunity_id uuid references opportunities on delete cascade, line text references insurance_lines, primary key (opportunity_id, line));
create index on opportunities (status, posted_at desc);
create index on opportunities using gin (eligible_states);

create table applications (
  id                      uuid primary key default gen_random_uuid(),
  opportunity_id          uuid not null references opportunities,
  org_id                  uuid not null references organizations,
  applicant_id            uuid not null references users,
  stage                   pipeline_stage not null default 'new',
  cover_note              text not null,
  preferred_start_window  text,
  share                   jsonb not null,        -- explicit per-field consent snapshot
  consent_record_id       uuid references consent_records,
  withdrawn               boolean not null default false,
  interview               jsonb,
  submitted_at            timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (opportunity_id, applicant_id)
);
create table application_notes    (id uuid primary key default gen_random_uuid(), application_id uuid references applications on delete cascade, author_id uuid references users, body text not null, created_at timestamptz default now()); -- org-private
create table application_messages (id uuid primary key default gen_random_uuid(), application_id uuid references applications on delete cascade, author_id uuid references users, body text not null, created_at timestamptz default now());
create table application_activity (id uuid primary key default gen_random_uuid(), application_id uuid references applications on delete cascade, actor_id uuid references users, message text not null, at timestamptz default now());

create table saved_items (user_id uuid references users on delete cascade, target_type text, target_id uuid, saved_at timestamptz default now(), primary key (user_id, target_type, target_id));
create table introductions (id uuid primary key default gen_random_uuid(), org_id uuid references organizations, sender_id uuid references users, user_id uuid references users, opportunity_id uuid references opportunities, message text not null, status text not null default 'sent', created_at timestamptz default now());

-- ---------------------------------------------------------------------
-- Networking
-- ---------------------------------------------------------------------
create table connections (id uuid primary key default gen_random_uuid(), from_id uuid references users, to_id uuid references users, status text not null, message text, created_at timestamptz default now(), responded_at timestamptz, unique (from_id, to_id));
create table groups (id uuid primary key default gen_random_uuid(), slug text unique, name text, description text, topic text, created_at timestamptz default now());
create table group_members (group_id uuid references groups on delete cascade, user_id uuid references users on delete cascade, primary key (group_id, user_id));
create table posts (id uuid primary key default gen_random_uuid(), author_id uuid references users, group_id uuid references groups, topic text, body text not null, hidden boolean default false, created_at timestamptz default now());
create table post_likes (post_id uuid references posts on delete cascade, user_id uuid references users on delete cascade, primary key (post_id, user_id));
create table post_comments (id uuid primary key default gen_random_uuid(), post_id uuid references posts on delete cascade, author_id uuid references users, body text not null, created_at timestamptz default now());
create table events (id uuid primary key default gen_random_uuid(), title text, starts_at timestamptz, format text, location text, host text, description text);
create table event_rsvps (event_id uuid references events on delete cascade, user_id uuid references users on delete cascade, primary key (event_id, user_id));
create table resources (id uuid primary key default gen_random_uuid(), slug text unique, title text, kind text, summary text, body text, audience text, minutes int, author text);

-- ---------------------------------------------------------------------
-- Monetization (billing provider integration TBD — no payments in prototype)
-- ---------------------------------------------------------------------
create table plans (id plan_id primary key, name text, price_monthly_cents int, price_annual_cents int, limits jsonb, features text[]);
create table subscriptions (org_id uuid primary key references organizations, plan plan_id references plans, status text, provider_customer_id text, current_period_end timestamptz);
create table sponsored_placements (id uuid primary key default gen_random_uuid(), org_id uuid references organizations, opportunity_id uuid references opportunities, surface text not null, status text not null, starts_on timestamptz, ends_on timestamptz, created_at timestamptz default now());

-- ---------------------------------------------------------------------
-- Trust & safety, audit
-- ---------------------------------------------------------------------
create table reports (id uuid primary key default gen_random_uuid(), target_type text, target_id uuid, reason text, details text, reporter_id uuid references users, status text default 'open', resolution text, created_at timestamptz default now(), resolved_at timestamptz);
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid references users on delete cascade, title text, body text, href text, read boolean default false, created_at timestamptz default now());
-- Append-only: revoke UPDATE/DELETE from the application role.
create table audit_events (id bigserial primary key, at timestamptz not null default now(), actor_id uuid references users, action text not null, target_type text, target_id text, detail text);

-- =====================================================================
-- Row-level security sketches
-- The application sets: set local app.user_id = '<uuid>'; per request.
-- =====================================================================
create or replace function app_user() returns uuid language sql stable as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;
create or replace function is_admin() returns boolean language sql stable as $$ select exists(select 1 from users where id = app_user() and kind = 'admin' and status = 'active') $$;
create or replace function is_org_member(o uuid) returns boolean language sql stable as $$ select exists(select 1 from organization_members where org_id = o and user_id = app_user()) $$;

alter table applications enable row level security;
create policy app_applicant_read on applications for select using (applicant_id = app_user());
create policy app_org_read       on applications for select using (is_org_member(org_id));
create policy app_applicant_ins  on applications for insert with check (applicant_id = app_user());
create policy app_org_update     on applications for update using (is_org_member(org_id));

alter table application_notes enable row level security;   -- never visible to applicants
create policy notes_org on application_notes using (exists (select 1 from applications a where a.id = application_id and is_org_member(a.org_id)));

alter table opportunities enable row level security;
create policy opp_public_read on opportunities for select using (status = 'published' and exists (select 1 from organizations o where o.id = org_id and o.listing_status = 'approved'));
create policy opp_org_all     on opportunities using (is_org_member(org_id));
create policy opp_admin_all   on opportunities using (is_admin());

alter table license_records enable row level security;
create policy lic_self on license_records using (user_id = app_user());
-- Organizations read license records only via a SECURITY DEFINER view that joins
-- applications.share->>'licenses' = 'true' for their own org.

alter table producer_profiles enable row level security;
create policy profile_self on producer_profiles using (user_id = app_user());
create policy profile_public_read on producer_profiles for select using (visibility = 'public' or (visibility = 'members' and app_user() is not null));
-- npn_encrypted must additionally be excluded from these policies via column privileges / views.
