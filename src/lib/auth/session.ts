"use client";

/**
 * DEMO SESSION — NOT AUTHENTICATION.
 *
 * The prototype lets anyone "become" a fictional persona via the role
 * switcher. There are no passwords, tokens or server sessions. Production
 * must replace this module with a real identity provider (e.g. OIDC/SAML,
 * passkeys, MFA for organization and admin accounts) and server-validated
 * sessions. Never ship this switcher to production.
 */
import { useMemo } from "react";
import { useDb, useSessionUserId, setSessionUser } from "@/lib/store/db-store";
import type { User } from "@/lib/data/types";

export interface DemoPersona {
  userId: string;
  label: string;
  description: string;
  home: string;
}

/** The personas exposed in the demo role switcher. */
export const DEMO_PERSONAS: DemoPersona[] = [
  { userId: "u_maya", label: "Experienced producer", description: "Maya Okafor · Commercial lines, 9 yrs · Charlotte, NC", home: "/me" },
  { userId: "u_jordan", label: "Newly licensed producer", description: "Jordan Reyes · Life & health, 5 months · Phoenix, AZ", home: "/me" },
  { userId: "u_priya", label: "Aspiring producer", description: "Priya Natarajan · Career changer, studying · Columbus, OH", home: "/me" },
  { userId: "u_daniel", label: "Independent agency", description: "Daniel Whitfield · Kestrelwood Insurance Partners", home: "/org" },
  { userId: "u_renee", label: "IMO", description: "Renée Castillo · Lanternway Financial Group", home: "/org" },
  { userId: "u_admin", label: "Platform administrator", description: "Morgan Ellery · Producer Network trust & operations", home: "/admin" },
];

export function homeFor(user: User | null | undefined): string {
  if (!user) return "/";
  if (user.kind === "organization") return "/org";
  if (user.kind === "admin") return "/admin";
  return "/me";
}

export function useCurrentUser(): User | null {
  const db = useDb();
  const id = useSessionUserId();
  return useMemo(() => (id ? db.users.find((u) => u.id === id) ?? null : null), [db, id]);
}

export function signInAsDemo(userId: string) {
  setSessionUser(userId);
}

export function signOutDemo() {
  setSessionUser(null);
}
