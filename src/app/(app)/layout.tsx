import { logout } from "@/app/auth-actions";
import NavLinks from "@/components/NavLinks";
import { requireUser } from "@/lib/auth";

// This layout wraps EVERY page inside the (app) folder.
// {children} is replaced by the page that is open (dashboard, new ticket...).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Checking here protects all pages in (app) at once.
  const { profile } = await requireUser();

  const links = [{ href: "/dashboard", text: "Dashboard" }];
  if (profile.role === "student") {
    links.push({ href: "/tickets/new", text: "New ticket" });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <span className="brand">ResolveIT</span>
        <NavLinks links={links} />

        <div className="account">
          <div>
            <strong>{profile.full_name}</strong>{" "}
            <span className={`badge ${profile.role}`}>{profile.role}</span>
          </div>
          <form action={logout}>
            <button className="button secondary">Log out</button>
          </form>
        </div>
      </aside>

      <main className="content stack">{children}</main>
    </div>
  );
}
