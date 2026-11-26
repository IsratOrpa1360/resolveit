import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import { PageHeader, TicketFields } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isEditable, type Ticket } from "@/lib/types";
import { editTicket } from "../../../actions";

export const metadata: Metadata = { title: "Edit ticket" };

export default async function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();
  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle<Ticket>();
  if (!ticket) notFound();
  if (!isEditable(ticket, profile.id)) redirect(`/tickets/${id}`);
  return (
    <>
      <PageHeader title="Edit ticket" />
      <div className="card"><ActionForm action={editTicket.bind(null, id)} submit="Save changes"><TicketFields ticket={ticket} /></ActionForm></div>
    </>
  );
}
