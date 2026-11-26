import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Connects to Supabase AS the logged-in user.
// The login session is stored in browser cookies, so we pass them along.
// Because it acts as the user, the database's RLS rules always apply.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Pages cannot save cookies. That is fine: src/proxy.ts does it.
          }
        },
      },
    },
  );
}
