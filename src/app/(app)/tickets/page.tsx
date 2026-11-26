import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, TicketTable } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { TICKET_COLUMNS } from "@/lib/tickets";
import { CATEGORIES, isOneOf, label, PRIORITIES, STATUSES, type Ticket } from "@/lib/types";

export const metadata: Metadata = { title: "Tickets" };
const PAGE_SIZE = 20;
const FILTERS = { status: STATUSES, priority: PRIORITIES, category: CATEGORIES } as const;

export default async function TicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, profile } = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const page = Math.min(1000, Math.max(1, Math.floor(Number(params.page)) || 1));
  const keep = new URLSearchParams();
  if (q) keep.set("q", q);

  let query = supabase.from("tickets").select(TICKET_COLUMNS).order("created_at", { ascending: false }).order("id");
  // % _ and \ have special meaning in LIKE searches, so escape them.
  if (q) query = query.ilike("title", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  for (const [name, allowed] of Object.entries(FILTERS)) {
    const value = params[name];
    if (isOneOf<string>(allowed, value)) {
      query = query.eq(name, value);
      keep.set(name, value);
    }
  }
  // One extra row tells us whether there is a next page.
  const { data, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (error) throw new Error("Tickets could not be loaded.");
  const tickets = data as unknown as Ticket[];
  const link = (n: number) => `/tickets?${new URLSearchParams([...keep, ["page", String(n)]])}`;

  return (
    <>
      <PageHeader title={profile.role === "student" ? "My tickets" : profile.role === "agent" ? "Assigned tickets" : "All tickets"}>
        {profile.role === "student" && <Link className="button" href="/tickets/new">New ticket</Link>}
      </PageHeader>
      <form className="row" key={keep.toString()}>
        <label>Search titles<input name="q" type="search" defaultValue={q} maxLength={100} /></label>
        {Object.entries(FILTERS).map(([name, options]) => (
          <label key={name}>
            {label(name)}
            <select name={name} defaultValue={keep.get(name) ?? ""}>
              <option value="">All</option>
              {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
            </select>
          </label>
        ))}
        <button className="button">Apply</button>
        <Link className="button secondary" href="/tickets">Clear</Link>
      </form>
      <TicketTable tickets={tickets.slice(0, PAGE_SIZE)} staff={profile.role !== "student"} />
      <div className="row">
        {page > 1 && <Link className="button secondary" href={link(page - 1)}>Previous</Link>}
        {tickets.length > PAGE_SIZE && <Link className="button secondary" href={link(page + 1)}>Next</Link>}
      </div>
    </>
  );
}
