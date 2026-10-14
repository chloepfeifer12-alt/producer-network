"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Handshake, Inbox, MessageSquare, Send, UserMinus, X } from "lucide-react";
import type { Connection } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { connectionsOf, mutualCount, pendingIncoming, pendingOutgoing, respondToConnection, withdrawConnection } from "@/lib/services/network";
import { PageHeader } from "@/components/ui/page";
import { Tabs } from "@/components/ui/tabs";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { toast, toastResult } from "@/components/ui/toast";
import { PersonLine } from "@/components/network/person";
import { personInfo, relativeTime } from "@/components/network/people";
import { MessagePlaceholderDialog } from "@/components/network/message-dialog";
import { formatDate } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";

type Tab = "connections" | "received" | "sent";
const TABS: Tab[] = ["connections", "received", "sent"];

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ConnectionsView />
    </Suspense>
  );
}

function ConnectionsView() {
  const db = useDb();
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = params.get("tab") as Tab | null;
  const tab: Tab = fromUrl && TABS.includes(fromUrl) ? fromUrl : "connections";
  const setTab = (t: Tab) => router.replace(t === "connections" ? pathname : `${pathname}?tab=${t}`, { scroll: false });

  const connections = useMemo(
    () => (user ? connectionsOf(db, user.id).sort((a, b) => (b.connection.respondedAt ?? b.connection.createdAt).localeCompare(a.connection.respondedAt ?? a.connection.createdAt)) : []),
    [db, user],
  );
  const received = useMemo(() => (user ? pendingIncoming(db, user.id) : []), [db, user]);
  const sent = useMemo(() => (user ? pendingOutgoing(db, user.id) : []), [db, user]);

  const [messageTo, setMessageTo] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const closeMessage = useCallback(() => setMessageTo(null), []);
  const closeRemove = useCallback(() => setRemoving(null), []);

  if (!user) return <PageSkeleton />;

  const remove = () => {
    if (!removing) return;
    const r = withdrawConnection(user, removing.id);
    if (r.ok) toast("Connection removed", { body: `${removing.name} won't be notified.`, tone: "info" });
    else toastResult(r, "");
    setRemoving(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Professional network"
        title="Connections"
        description="The people you trade notes with. Connecting never shares license records, NPN or contact details."
        actions={<ButtonLink href="/network/members" variant="secondary" size="sm">Find members</ButtonLink>}
      />

      <Tabs<Tab>
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "connections", label: "Connections", count: connections.length },
          { value: "received", label: "Received", count: received.length },
          { value: "sent", label: "Sent", count: sent.length },
        ]}
      />

      <div role="tabpanel" aria-label={tab}>
        {tab === "connections" &&
          (connections.length === 0 ? (
            <EmptyState
              icon={<Handshake className="h-5 w-5" strokeWidth={1.75} />}
              title="No connections yet"
              description="Browse the directory to find peers in your line of business, or join a group to meet people first."
              action={<ButtonLink href="/network/members" variant="secondary" size="sm">Browse members</ButtonLink>}
            />
          ) : (
            <Card>
              <ul className="divide-y divide-line">
                {connections.map(({ connection, otherId }) => {
                  const p = personInfo(db, otherId);
                  const mutual = mutualCount(db, user.id, otherId);
                  return (
                    <li key={connection.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                      <PersonLine
                        person={p}
                        size={44}
                        className="flex-1"
                        meta={<span className="text-xs font-normal text-ink-4">Connected {formatDate(connection.respondedAt ?? connection.createdAt, { month: "short", year: "numeric" })}</span>}
                      />
                      <div className="flex shrink-0 items-center gap-2 pl-14 sm:pl-0">
                        {mutual > 0 && <span className="mr-2 hidden text-xs text-ink-4 md:inline">{pluralize(mutual, "mutual")}</span>}
                        <Button variant="secondary" size="sm" onClick={() => setMessageTo(p.name)}>
                          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> Message
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRemoving({ id: connection.id, name: p.name })} aria-label={`Remove connection with ${p.name}`}>
                          <UserMinus className="h-3.5 w-3.5" strokeWidth={1.75} />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}

        {tab === "received" &&
          (received.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-5 w-5" strokeWidth={1.75} />}
              title="No pending requests"
              description="When someone asks to connect, you'll see their note here and can accept or decline."
            />
          ) : (
            <div className="space-y-3">
              {received.map((c) => (
                <RequestRow key={c.id} connection={c} direction="received" />
              ))}
            </div>
          ))}

        {tab === "sent" &&
          (sent.length === 0 ? (
            <EmptyState
              icon={<Send className="h-5 w-5" strokeWidth={1.75} />}
              title="No sent requests"
              description="Requests you send stay here until the other member responds."
              action={<ButtonLink href="/network/members" variant="secondary" size="sm">Find people to connect with</ButtonLink>}
            />
          ) : (
            <div className="space-y-3">
              {sent.map((c) => (
                <RequestRow key={c.id} connection={c} direction="sent" />
              ))}
            </div>
          ))}
      </div>

      <MessagePlaceholderDialog open={!!messageTo} onClose={closeMessage} name={messageTo ?? ""} />
      <Dialog
        open={!!removing}
        onClose={closeRemove}
        size="sm"
        title="Remove connection?"
        description={removing ? `You and ${removing.name} will no longer be connected. You can send a new request later.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Remove connection</Button>
          </>
        }
      />
    </>
  );
}

function RequestRow({ connection, direction }: { connection: Connection; direction: "received" | "sent" }) {
  const db = useDb();
  const user = useCurrentUser();
  const otherId = direction === "received" ? connection.fromId : connection.toId;
  const p = useMemo(() => personInfo(db, otherId), [db, otherId]);
  const mutual = useMemo(() => (user ? mutualCount(db, user.id, otherId) : 0), [db, user, otherId]);
  const first = p.name.split(" ")[0];
  if (!user) return null;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <PersonLine
          person={p}
          size={44}
          className="flex-1"
          meta={<span className="text-xs font-normal text-ink-4">{direction === "received" ? "Received" : "Sent"} · {relativeTime(connection.createdAt)}</span>}
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2 pl-14 sm:pl-0">
          {direction === "received" ? (
            <>
              <Button variant="accent" size="sm" onClick={() => toastResult(respondToConnection(user, connection.id, true), `You're now connected with ${first}`)}>
                <Check className="h-4 w-4" strokeWidth={2} /> Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const r = respondToConnection(user, connection.id, false);
                  if (r.ok) toast("Request declined", { body: `${first} won't be notified.`, tone: "info" });
                  else toastResult(r, "");
                }}
              >
                <X className="h-4 w-4" strokeWidth={2} /> Decline
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => toastResult(withdrawConnection(user, connection.id), "Request withdrawn")}>
              Withdraw
            </Button>
          )}
        </div>
      </div>
      {connection.message ? (
        <blockquote className="mt-4 rounded-xl border border-line bg-subtle/60 px-4 py-3 text-[13.5px] leading-relaxed text-ink-2 sm:ml-14">
          <span className="sr-only">{direction === "received" ? `Note from ${first}:` : "Your note:"} </span>
          &ldquo;{connection.message}&rdquo;
        </blockquote>
      ) : (
        <p className="mt-3 text-xs text-ink-4 sm:ml-14">{direction === "received" ? "No note included." : "Sent without a note."}</p>
      )}
      {mutual > 0 && <p className="mt-3 text-xs text-ink-3 sm:ml-14">{pluralize(mutual, "mutual connection")}</p>}
    </Card>
  );
}
