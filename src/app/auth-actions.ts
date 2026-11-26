"use server";
// "use server" = these functions run ON THE SERVER, never in the browser.
// A form calls them with: <form action={login}>

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

export async function register(formData: FormData) {
  // 1. Read the form. String(...) makes sure we have text.
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // 2. Check it again on the server. Browser checks can be skipped by attackers.
  if (fullName.length < 1 || fullName.length > 100) redirect("/register?error=name");
  if (!email.includes("@")) redirect("/register?error=email");
  if (password.length < 8) redirect("/register?error=password");

  // 3. Create the account. We send only the name, NEVER a role.
  //    The database trigger always makes new users students.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) redirect("/register?error=failed");
  if (data.session) redirect("/dashboard"); // email confirmation is turned off
  redirect("/login?message=check-email"); // email confirmation is turned on
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for a wrong email or a wrong password, so attackers
    // cannot find out which emails have accounts.
    redirect(error.code === "email_not_confirmed" ? "/login?error=confirm" : "/login?error=invalid");
  }
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
