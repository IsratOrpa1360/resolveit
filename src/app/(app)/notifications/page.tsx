import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/types";
import { markAllRead } from "../actions";

export const metadata: Metadata = { title: "Notifications" };

type Notification = { id: string; ticket_id: string; message: string; read_at: string | null; created_at: string };

export default async function NotificationsPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("notifications").select("id, ticket_id, message, read_at, created_at").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error("Notifications could not be loaded.");
  const items = data as Notification[];
  return (
    <>
      <PageHeader title="Notifications">
        {items.some((n) => !n.read_at) && <form action={markAllRead}><button className="button secondary">Mark all as read</button></form>}
      </PageHeader>
      {items.length ? (
        <div className="card">
          <ul className="list">
            {items.map((n) => (
              <li key={n.id} className="between">
                <Link className={n.read_at ? "muted" : "link"} href={`/tickets/${n.ticket_id}`}>{n.message}</Link>
                <small className="muted">{n.read_at ? "" : "New · "}{formatDate(n.created_at)}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : <div className="card empty"><h2>No notifications</h2><p className="muted">Ticket updates will appear here.</p></div>}
    </>
  );
}
