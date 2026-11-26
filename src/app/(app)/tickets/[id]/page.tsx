import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import DeleteButton from "@/components/DeleteButton";
import { Badge, PageHeader, Select } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { TICKET_COLUMNS } from "@/lib/tickets";
import { formatDate, isEditable, label, PRIORITIES, STATUSES, type Ticket } from "@/lib/types";
import { addComment, deleteTicket, manageTicket, uploadAttachment } from "../../actions";

export const metadata: Metadata = { title: "Ticket details" };

type Comment = { id: string; message: string; created_at: string; author: { full_name: string; role: string } | null };
type Attachment = { id: string; file_path: string; file_name: string };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();
  const { data } = await supabase.from("tickets").select(TICKET_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const ticket = data as unknown as Ticket;

  const [commentRows, fileRows, agentRows] = await Promise.all([
    supabase.from("comments").select("id, message, created_at, author:profiles(full_name, role)").eq("ticket_id", id).order("created_at"),
    supabase.from("attachments").select("id, file_path, file_name").eq("ticket_id", id).order("created_at"),
    profile.role === "admin" ? supabase.from("profiles").select("id, full_name").eq("role", "agent").order("full_name") : null,
  ]);
  if (commentRows.error || fileRows.error || agentRows?.error) throw new Error("Ticket could not be loaded.");
  const comments = commentRows.data as unknown as Comment[];
  const agents = (agentRows?.data ?? []) as { id: string; full_name: string }[];
  // The bucket is private, so each download link is signed and expires in an hour.
  const files = await Promise.all(
    (fileRows.data as Attachment[]).map(async (f) => {
      const signed = await supabase.storage.from("attachments").createSignedUrl(f.file_path, 3600, { download: f.file_name });
      return { ...f, url: signed.data?.signedUrl };
    }),
  );

  const editable = isEditable(ticket, profile.id);
  const canManage = profile.role === "admin" || (profile.role === "agent" && ticket.assigned_to === profile.id);
  const closed = ticket.status === "closed";

  return (
    <>
      <PageHeader title={ticket.title} text={`Created ${formatDate(ticket.created_at)}`}>
        <div className="row">
          {editable && <Link className="button secondary" href={`/tickets/${id}/edit`}>Edit</Link>}
          {(editable || profile.role === "admin") && <DeleteButton action={deleteTicket.bind(null, id)} />}
        </div>
      </PageHeader>
      <div className="detail">
        <div className="stack">
          <section className="card stack"><h2>Description</h2><p className="prewrap">{ticket.description}</p></section>
          <section className="card stack">
            <h2>Comments</h2>
            {comments.length ? (
              <ul className="list">
                {comments.map((c) => (
                  <li key={c.id}>
                    <div className="between"><span><strong>{c.author?.full_name ?? "User"}</strong> {c.author && <Badge value={c.author.role} />}</span><small className="muted">{formatDate(c.created_at)}</small></div>
                    <p className="prewrap">{c.message}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No comments yet.</p>}
            {closed ? <p className="muted">This ticket is closed.</p> : (
              <ActionForm action={addComment.bind(null, id)} submit="Add comment" resetOnSuccess>
                <label>Your comment<textarea name="message" rows={3} required maxLength={2000} /></label>
              </ActionForm>
            )}
          </section>
        </div>
        <div className="stack">
          <section className="card">
            <dl>
              <div><dt>Status</dt><dd><Badge value={ticket.status} /></dd></div>
              <div><dt>Priority</dt><dd><Badge value={ticket.priority} /></dd></div>
              <div><dt>Category</dt><dd>{label(ticket.category)}</dd></div>
              <div><dt>Submitted by</dt><dd>{ticket.owner?.full_name ?? "Unknown"}</dd></div>
              <div><dt>Assigned to</dt><dd>{ticket.agent?.full_name ?? "Unassigned"}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDate(ticket.updated_at)}</dd></div>
            </dl>
          </section>
          {canManage && (
            <section className="card stack">
              <h2>Manage ticket</h2>
              <ActionForm key={ticket.updated_at} action={manageTicket.bind(null, id)} submit="Save">
                <Select name="status" text="Status" options={STATUSES} value={ticket.status} />
                <Select name="priority" text="Priority" options={PRIORITIES} value={ticket.priority} />
                {profile.role === "admin" && (
                  <label>
                    Assigned to
                    <select name="assigned_to" defaultValue={ticket.assigned_to ?? ""}>
                      <option value="">Unassigned</option>
                      {ticket.assigned_to && !agents.some((a) => a.id === ticket.assigned_to) && <option value={ticket.assigned_to}>{ticket.agent?.full_name ?? "Former agent"} (not an agent)</option>}
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                  </label>
                )}
              </ActionForm>
            </section>
          )}
          <section className="card stack">
            <h2>Attachments</h2>
            {files.length ? (
              <ul className="list">
                {files.map((f) => <li key={f.id} className="prewrap">{f.url ? <a className="link" href={f.url}>{f.file_name}</a> : `${f.file_name} (unavailable)`}</li>)}
              </ul>
            ) : <p className="muted">No files attached.</p>}
            {!closed && (
              <ActionForm action={uploadAttachment.bind(null, id)} submit="Upload" resetOnSuccess>
                <label>PNG, JPEG or PDF, up to 3 MB<input name="file" type="file" required accept="image/png,image/jpeg,application/pdf" /></label>
              </ActionForm>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
