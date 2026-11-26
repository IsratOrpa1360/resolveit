import { redirect } from "next/navigation";
import { logout } from "../auth-actions";
import { createClient } from "@/lib/supabase";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Who is logged in? getUser() asks Supabase to verify the session.
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login"); // not logged in: go to the login page

  // 2. Read this user's profile. RLS only allows reading your own row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .single();

  return (
    <main className="content stack">
      <div className="page-header">
        <h1>Welcome, {profile?.full_name}</h1>
        <form action={logout}>
          <button className="button secondary">Log out</button>
        </form>
      </div>

      <div className="card">
        <p className="muted">You are logged in as</p>
        <p>{data.user.email}</p>
        <p>Role: {profile?.role}</p>
      </div>
    </main>
  );
}
