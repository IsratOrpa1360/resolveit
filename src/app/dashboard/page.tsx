import Link from "next/link";
import { logout } from "../auth-actions";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  // Not logged in? requireUser() sends the visitor to /login.
  const { supabase, user, profile } = await requireUser();

  // RLS returns only the tickets this user is allowed to see.
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, title, category, priority, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="content stack">
      <div className="page-header">
        <div>
          <h1>Welcome, {profile.full_name}</h1>
          <p className="muted">{user.email} · Role: {profile.role}</p>
        </div>
        <form action={logout}>
          <button className="button secondary">Log out</button>
        </form>
      </div>

      <div className="page-header">
        <h2>My tickets</h2>
        {profile.role === "student" && (
          <Link href="/tickets/new" className="button">New ticket</Link>
        )}
      </div>

      {!tickets || tickets.length === 0 ? (
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
              {/* .map() turns each ticket into one table row */}
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td><Link href={`/tickets/${ticket.id}`} className="link">{ticket.title}</Link></td>
                  <td>{ticket.category}</td>
                  <td><span className={`badge ${ticket.priority}`}>{ticket.priority}</span></td>
                  <td><span className={`badge ${ticket.status}`}>{ticket.status}</span></td>
                  <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
