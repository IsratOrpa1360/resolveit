import { cache } from "react";
import { redirect } from "next/navigation";
import { isConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

// Every protected page and action calls this. cache() avoids repeat queries in one request.
export const requireUser = cache(async () => {
  if (!isConfigured) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("id", data.user.id)
    .single<Profile>();
  if (error || !profile) throw new Error("Your profile could not be loaded. Was supabase/schema.sql run?");
  return { supabase, profile };
});

export async function requireAdmin() {
  const session = await requireUser();
  if (session.profile.role !== "admin") redirect("/dashboard");
  return session;
}
