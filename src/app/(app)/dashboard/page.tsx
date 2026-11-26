import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Stats, TicketTable } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { TICKET_COLUMNS } from "@/lib/tickets";
import { label, STATUSES, type Ticket } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, profile } = await requireUser();
  if (profile.role === "admin") redirect("/admin");
  // RLS returns a student's own tickets, or an agent's assigned ones.
  const [recent, ...counts] = await Promise.all([
    supabase.from("tickets").select(TICKET_COLUMNS).order("created_at", { ascending: false }).limit(5),
    ...STATUSES.map((s) => supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);
  if (recent.error) throw new Error("Tickets could not be loaded.");
  return (
    <>
      <PageHeader title={`Welcome, ${profile.full_name}`} text="Here is what is happening with your tickets.">
        {profile.role === "student" && <Link className="button" href="/tickets/new">New ticket</Link>}
      </PageHeader>
      <Stats items={STATUSES.map((s, i) => ({ name: label(s), value: counts[i].count ?? 0 }))} />
      <h2>Recent tickets</h2>
      <TicketTable tickets={recent.data as unknown as Ticket[]} staff={profile.role !== "student"} />
    </>
  );
}
