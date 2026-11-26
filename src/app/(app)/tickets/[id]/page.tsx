import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { updateTicket } from "../actions";

const errors: Record<string, string> = {
  invalid: "Choose a valid status, priority and agent.",
  denied: "You are not allowed to make this change.",
};

// [id] in the folder name means this part of the address can change.
// For /tickets/abc-123, params.id is "abc-123".
export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const { supabase, user, profile } = await requireUser();

  // RLS returns the ticket ONLY if you are allowed to see it.
  const { data: ticket } = await supabase
    .from("tickets")
    .select("title, description, category, priority, status, assigned_to, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!ticket) notFound();

  // Who may manage this ticket? Admins, or the agent it is assigned to.
  const canManage =
    profile.role === "admin" || (profile.role === "agent" && ticket.assigned_to === user.id);

  // Admins need the list of agents for the "Assign to" menu.
  let agents: { id: string; full_name: string }[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase.from("profiles").select("id, full_name").eq("role", "agent").order("full_name");
    agents = data ?? [];
  }

  // bind() fixes the first argument, so the form only sends formData.
  const updateThisTicket = updateTicket.bind(null, id);

  return (
    <>
      <Link href="/dashboard" className="link">← Back to dashboard</Link>
      <h1>{ticket.title}</h1>

      <div className="card stack">
        <p>
          <span className={`badge ${ticket.status}`}>{ticket.status.replace("_", " ")}</span>{" "}
          <span className={`badge ${ticket.priority}`}>{ticket.priority}</span>
        </p>
        <p className="prewrap">{ticket.description}</p>
        <p className="muted">
          Category: {ticket.category} · Created: {new Date(ticket.created_at).toLocaleString()} ·{" "}
          {ticket.assigned_to ? "Assigned to support" : "Not assigned yet"}
        </p>
      </div>

      {canManage && (
        <div className="card stack">
          <h2>Manage ticket</h2>
          {error && errors[error] && <p className="message error">{errors[error]}</p>}
          {saved && <p className="message success">Ticket updated.</p>}

          <form className="form" action={updateThisTicket}>
            <label>
              Status
              <select name="status" defaultValue={ticket.status}>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>

            <label>
              Priority
              <select name="priority" defaultValue={ticket.priority}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            {profile.role === "admin" && (
              <label>
                Assign to
                <select name="assigned_to" defaultValue={ticket.assigned_to ?? ""}>
                  <option value="">Not assigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                  ))}
                </select>
              </label>
            )}

            <button className="button">Save changes</button>
          </form>
        </div>
      )}
    </>
  );
}
