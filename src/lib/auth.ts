import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

// Use this at the top of every private page and server action.
// It returns the logged-in user and their profile,
// or sends visitors who are not logged in to the login page.
export async function requireUser() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", data.user.id)
    .single();
  if (!profile) redirect("/login");

  return { supabase, user: data.user, profile };
}
