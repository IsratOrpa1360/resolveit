import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// The link in the confirmation email lands here.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && isConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/dashboard");
  }
  redirect("/login?confirmed=check");
}
