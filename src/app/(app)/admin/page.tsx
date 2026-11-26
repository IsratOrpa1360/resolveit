import type { Metadata } from "next";
import { PageHeader, Stats, TicketTable } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { TICKET_COLUMNS } from "@/lib/tickets";
import { CATEGORIES, label, PRIORITIES, STATUSES, type Ticket } from "@/lib/types";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const count = async (column: string, value: string) => {
    const result = await supabase.from("tickets").select("id", { count: "exact", head: true }).eq(column, value);
    return { name: label(value), value: result.count ?? 0 };
  };
  const [status, priority, category, users, recent] = await Promise.all([
    Promise.all(STATUSES.map((v) => count("status", v))),
    Promise.all(PRIORITIES.map((v) => count("priority", v))),
    Promise.all(CATEGORIES.map((v) => count("category", v))),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select(TICKET_COLUMNS).order("created_at", { ascending: false }).limit(5),
  ]);
  if (recent.error) throw new Error("Dashboard could not be loaded.");
  const total = status.reduce((sum, s) => sum + s.value, 0);
  return (
    <>
      <PageHeader title="Admin dashboard" text="Overview of all support activity." />
      <Stats items={[{ name: "All tickets", value: total }, ...status, { name: "Users", value: users.count ?? 0 }]} />
      <div className="stats">
        {[{ title: "By priority", rows: priority }, { title: "By category", rows: category }].map((group) => (
          <section className="card stack" key={group.title}>
            <h2>{group.title}</h2>
            {group.rows.map((r) => (
              <div key={r.name}>
                <div className="between"><span>{r.name}</span><span>{r.value}</span></div>
                <div className="bar"><span style={{ width: `${total ? (r.value / total) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </section>
        ))}
      </div>
      <h2>Recent tickets</h2>
      <TicketTable tickets={recent.data as unknown as Ticket[]} staff />
    </>
  );
}
