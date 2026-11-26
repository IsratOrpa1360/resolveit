"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

const CATEGORIES = ["portal", "network", "facilities", "academic", "other"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];
// The shape of an id, e.g. 4046b533-6847-4904-a1c9-9166fcdfb8c1
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Agents and admins change status/priority; admins also assign.
// The database checks the same rules again (RLS + guard trigger).
export async function updateTicket(id: string, formData: FormData) {
  const { supabase, profile } = await requireUser();
  if (profile.role === "student") redirect(`/tickets/${id}`);

  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");
  if (!STATUSES.includes(status) || !PRIORITIES.includes(priority)) {
    redirect(`/tickets/${id}?error=invalid`);
  }

  const changes: { status: string; priority: string; assigned_to?: string | null } = { status, priority };
  if (profile.role === "admin") {
    const agent = String(formData.get("assigned_to") ?? "");
    if (agent && !UUID.test(agent)) redirect(`/tickets/${id}?error=invalid`);
    changes.assigned_to = agent || null; // "" means unassigned
  }

  // .select() returns the changed rows. If RLS blocked the change,
  // nothing is returned, so we know it failed.
  const { data, error } = await supabase.from("tickets").update(changes).eq("id", id).select("id");
  if (error || !data?.length) redirect(`/tickets/${id}?error=denied`);
  redirect(`/tickets/${id}?saved=1`);
}

export async function createTicket(formData: FormData) {
  // 1. Only logged-in students can create tickets.
  const { supabase, user, profile } = await requireUser();
  if (profile.role !== "student") redirect("/dashboard");

  // 2. Read the form.
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const priority = String(formData.get("priority") ?? "");

  // 3. Check everything on the server (never trust the browser).
  if (title.length < 5 || title.length > 120) redirect("/tickets/new?error=title");
  if (description.length < 10 || description.length > 5000) redirect("/tickets/new?error=description");
  if (!CATEGORIES.includes(category) || !PRIORITIES.includes(priority)) redirect("/tickets/new?error=choice");

  // 4. Save it. user_id comes from the server, not the form,
  //    so nobody can create a ticket in someone else's name.
  const { data, error } = await supabase
    .from("tickets")
    .insert({ title, description, category, priority, user_id: user.id })
    .select("id")
    .single();

  if (error) redirect("/tickets/new?error=failed");
  redirect(`/tickets/${data.id}`);
}
