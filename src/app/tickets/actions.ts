"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

const CATEGORIES = ["portal", "network", "facilities", "academic", "other"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

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
