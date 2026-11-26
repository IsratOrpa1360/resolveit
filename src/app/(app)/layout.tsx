import { logout } from "@/app/(auth)/actions";
import NavLinks from "@/components/NavLinks";
import { Badge } from "@/components/ui";
import { requireUser } from "@/lib/auth";

// Private pages must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireUser();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  const links = [
    profile.role === "admin" ? { href: "/admin", text: "Dashboard" } : { href: "/dashboard", text: "Dashboard" },
    { href: "/tickets", text: profile.role === "student" ? "My tickets" : profile.role === "agent" ? "Assigned tickets" : "All tickets" },
    ...(profile.role === "student" ? [{ href: "/tickets/new", text: "New ticket" }] : []),
    ...(profile.role === "admin" ? [{ href: "/admin/users", text: "Users" }] : []),
    { href: "/notifications", text: count ? `Notifications (${count})` : "Notifications" },
  ];
  return (
    <div className="shell">
      <aside className="sidebar">
        <span className="brand">ResolveIT</span>
        <NavLinks links={links} />
        <div className="account">
          <div><strong>{profile.full_name}</strong> <Badge value={profile.role} /></div>
          <form action={logout}><button className="button secondary">Log out</button></form>
        </div>
      </aside>
      <main className="content stack">{children}</main>
    </div>
  );
}
