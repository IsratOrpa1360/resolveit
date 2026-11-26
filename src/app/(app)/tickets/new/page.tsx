import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import { PageHeader, TicketFields } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createTicket } from "../../actions";

export const metadata: Metadata = { title: "New ticket" };

export default async function NewTicketPage() {
  const { profile } = await requireUser();
  if (profile.role !== "student") redirect("/tickets");
  return (
    <>
      <PageHeader title="New ticket" text="You can attach files after creating it." />
      <div className="card"><ActionForm action={createTicket} submit="Create ticket"><TicketFields /></ActionForm></div>
    </>
  );
}
