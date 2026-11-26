import Link from "next/link";
import { requireUser } from "@/lib/auth";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default async function DashboardPage() {
  const { supabase, profile } = await requireUser();

  // RLS returns only the tickets this user is allowed to see.
  const { data } = await supabase
    .from("tickets")
    .select("id, title, category, priority, status, created_at")
    .order("created_at", { ascending: false });
  const tickets = data ?? [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome, {profile.full_name}</h1>
          <p className="muted">Here is what is happening with your tickets.</p>
        </div>
        {profile.role === "student" && (
          <Link href="/tickets/new" className="button">New ticket</Link>
        )}
      </div>

      {/* One card per status. filter() keeps only the tickets with that status. */}
      <div className="stats">
        {STATUSES.map((status) => (
          <div className="card" key={status}>
            <p className="muted">{status.replace("_", " ")}</p>
            <strong className="stat">
              {tickets.filter((ticket) => ticket.status === status).length}
            </strong>
          </div>
        ))}
      </div>

      <h2>My tickets</h2>

      {tickets.length === 0 ? (
        <div className="card empty">
          <h2>No tickets yet</h2>
          <p className="muted">Tickets you create will appear here.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td><Link href={`/tickets/${ticket.id}`} className="link">{ticket.title}</Link></td>
                  <td>{ticket.category}</td>
                  <td><span className={`badge ${ticket.priority}`}>{ticket.priority}</span></td>
                  <td><span className={`badge ${ticket.status}`}>{ticket.status.replace("_", " ")}</span></td>
                  <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
