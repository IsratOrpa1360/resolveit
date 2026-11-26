"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

const ROLES = ["student", "agent", "admin"];

export async function changeRole(userId: string, formData: FormData) {
  // Only admins. The database checks this again with RLS.
  const { supabase, user, profile } = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard");

  const role = String(formData.get("role") ?? "");
  if (!ROLES.includes(role)) redirect("/admin/users?error=invalid");
  if (userId === user.id) redirect("/admin/users?error=self");

  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select("id");
  if (error || !data?.length) redirect("/admin/users?error=failed");
  redirect("/admin/users?saved=1");
}
