import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORIES, formatDate, label, PRIORITIES, type Ticket } from "@/lib/types";

export function Badge({ value }: { value: string }) {
  return <span className={`badge ${value}`}>{label(value)}</span>;
}

export function PageHeader({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {text && <p className="muted">{text}</p>}
      </div>
      {children}
    </div>
  );
}

export function Stats({ items }: { items: { name: string; value: number }[] }) {
  return (
    <div className="stats">
      {items.map((i) => (
        <div className="card" key={i.name}>
          <p className="muted">{i.name}</p>
          <strong className="stat">{i.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Select({ name, text, options, value }: { name: string; text: string; options: readonly string[]; value?: string }) {
  return (
    <label>
      {text}
      <select name={name} defaultValue={value}>
        {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
      </select>
    </label>
  );
}

export function TicketFields({ ticket }: { ticket?: Ticket }) {
  return (
    <>
      <label>Title<input name="title" required minLength={5} maxLength={120} defaultValue={ticket?.title} /></label>
      <label>Description<textarea name="description" rows={7} required minLength={10} maxLength={5000} defaultValue={ticket?.description} /></label>
      <div className="row">
        <Select name="category" text="Category" options={CATEGORIES} value={ticket?.category ?? "portal"} />
        <Select name="priority" text="Priority" options={PRIORITIES} value={ticket?.priority ?? "medium"} />
      </div>
    </>
  );
}

export function TicketTable({ tickets, staff }: { tickets: Ticket[]; staff: boolean }) {
  if (!tickets.length) return <div className="card empty"><h2>No tickets found</h2><p className="muted">Tickets will appear here.</p></div>;
  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr><th>Title</th>{staff && <th>Submitted by</th>}<th>Category</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Created</th></tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td><Link className="link" href={`/tickets/${t.id}`}>{t.title}</Link></td>
              {staff && <td>{t.owner?.full_name ?? "Unknown"}</td>}
              <td>{label(t.category)}</td>
              <td><Badge value={t.priority} /></td>
              <td><Badge value={t.status} /></td>
              <td>{t.agent?.full_name ?? "Unassigned"}</td>
              <td>{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
