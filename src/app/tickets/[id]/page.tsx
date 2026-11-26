import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

// [id] in the folder name means this part of the address can change.
// For /tickets/abc-123, params.id is "abc-123".
export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();

  // RLS returns the ticket ONLY if you are allowed to see it.
  // Someone else's ticket id gives nothing, so we show "not found".
  const { data: ticket } = await supabase
    .from("tickets")
    .select("title, description, category, priority, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();

  return (
    <main className="content stack">
      <Link href="/dashboard" className="link">← Back to dashboard</Link>
      <h1>{ticket.title}</h1>

      <div className="card stack">
        <p>
          <span className={`badge ${ticket.status}`}>{ticket.status}</span>{" "}
          <span className={`badge ${ticket.priority}`}>{ticket.priority}</span>
        </p>
        <p className="prewrap">{ticket.description}</p>
        <p className="muted">
          Category: {ticket.category} · Created: {new Date(ticket.created_at).toLocaleString()}
        </p>
      </div>
    </main>
  );
}
