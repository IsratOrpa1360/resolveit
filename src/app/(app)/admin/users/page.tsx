import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { changeRole } from "../actions";

const errors: Record<string, string> = {
  invalid: "Choose a valid role.",
  self: "You cannot change your own role.",
  failed: "The role could not be changed.",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { supabase, user, profile } = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard"); // admins only

  const { error, saved } = await searchParams;
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>Users</h1>
      {error && errors[error] && <p className="message error">{errors[error]}</p>}
      {saved && <p className="message success">Role updated.</p>}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Change role</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td>
                  {u.id === user.id ? (
                    <span className="muted">You</span>
                  ) : (
                    <form className="inline-form" action={changeRole.bind(null, u.id)}>
                      <select name="role" defaultValue={u.role} style={{ width: "auto" }}>
                        <option value="student">Student</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button className="button secondary">Save</button>
                    </form>
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
