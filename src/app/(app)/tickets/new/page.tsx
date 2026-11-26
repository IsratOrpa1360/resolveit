import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createTicket } from "../actions";

const errors: Record<string, string> = {
  title: "The title must be 5 to 120 characters.",
  description: "The description must be 10 to 5000 characters.",
  choice: "Choose a category and a priority.",
  failed: "The ticket could not be saved. Please try again.",
};

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await requireUser();
  if (profile.role !== "student") redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <>
      <Link href="/dashboard" className="link">← Back to dashboard</Link>
      <h1>New ticket</h1>

      <div className="card">
        {error && errors[error] && <p className="message error">{errors[error]}</p>}

        <form className="form" action={createTicket}>
          <label>
            Title
            <input name="title" required minLength={5} maxLength={120} />
          </label>

          <label>
            Description
            <textarea name="description" rows={6} required minLength={10} maxLength={5000} />
          </label>

          <label>
            Category
            <select name="category" defaultValue="portal">
              <option value="portal">Portal</option>
              <option value="network">Network</option>
              <option value="facilities">Facilities</option>
              <option value="academic">Academic</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Priority
            <select name="priority" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>

          <button className="button">Create ticket</button>
        </form>
      </div>
    </>
  );
}
