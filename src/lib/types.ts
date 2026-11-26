export const ROLES = ["student", "agent", "admin"] as const;
export const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const CATEGORIES = ["portal", "network", "facilities", "academic", "other"] as const;

export type Role = (typeof ROLES)[number];
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Category = (typeof CATEGORIES)[number];

export type Profile = { id: string; full_name: string; email: string; role: Role; created_at: string };
type Person = { full_name: string; email: string } | null;

export type Ticket = {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  user_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  owner: Person;
  agent: Person;
};

export type ActionState = { error?: string; success?: string };

// Checks that text from a form or URL is one of the allowed values.
export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

export function label(value: string) {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(
    new Date(value),
  );
}

// Owners can edit or delete only before support starts work.
export function isEditable(ticket: Pick<Ticket, "user_id" | "status" | "assigned_to">, userId: string) {
  return ticket.user_id === userId && ticket.status === "open" && !ticket.assigned_to;
}
