import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase";

// The link in the confirmation email opens this address.
// It swaps the one-time "code" in the link for a login session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/dashboard");
  }
  redirect("/login?message=confirmed");
}
