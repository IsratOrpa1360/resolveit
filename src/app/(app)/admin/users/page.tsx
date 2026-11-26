import type { Metadata } from "next";
import ActionForm from "@/components/ActionForm";
import { Badge, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDate, label, ROLES, type Profile } from "@/lib/types";
import { changeRole } from "../../actions";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const { supabase, profile } = await requireAdmin();
  const { data, error } = await supabase.from("profiles").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error("Users could not be loaded.");
  return (
    <>
      <PageHeader title="Users" text="The 200 newest accounts. You cannot change your own role." />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Change role</th></tr></thead>
          <tbody>
            {(data as Profile[]).map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td><td>{u.email}</td><td><Badge value={u.role} /></td><td>{formatDate(u.created_at)}</td>
                <td>
                  {u.id === profile.id ? <span className="muted">You</span> : (
                    <ActionForm key={u.role} action={changeRole.bind(null, u.id)} submit="Save" className="inline-form">
                      <select name="role" aria-label={`Role for ${u.full_name}`} defaultValue={u.role} style={{ width: "auto" }}>
                        {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
                      </select>
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
