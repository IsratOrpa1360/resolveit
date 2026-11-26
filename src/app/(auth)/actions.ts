"use server";

import { redirect } from "next/navigation";
import { isConfigured, siteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const NOT_READY = "Supabase is not connected yet. Follow the setup steps in README.md.";

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  if (!isConfigured) return { error: NOT_READY };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.code === "email_not_confirmed" ? "Confirm your email first, then log in." : "Could not log in. Check your email and password." };
  }
  redirect("/dashboard");
}

export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  if (!isConfigured) return { error: NOT_READY };
  const fullName = String(form.get("full_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!fullName || fullName.length > 100) return { error: "Enter your name (up to 100 characters)." };
  if (!email.includes("@")) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Use at least 8 characters for the password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/dashboard");
  return { success: "Check your email for a confirmation link, then log in." };
}

export async function logout() {
  if (isConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/login");
}
