"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { CATEGORIES, isOneOf, PRIORITIES, ROLES, STATUSES, type ActionState } from "@/lib/types";

// RLS checks every query below again in the database.
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const MAX_FILE = 3 * 1024 * 1024;

function text(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readTicket(form: FormData) {
  const title = text(form, "title");
  const description = text(form, "description");
  const category = form.get("category");
  const priority = form.get("priority");
  if (title.length < 5 || title.length > 120) return { error: "Title must be 5 to 120 characters." };
  if (description.length < 10 || description.length > 5000) return { error: "Description must be 10 to 5000 characters." };
  if (!isOneOf(CATEGORIES, category) || !isOneOf(PRIORITIES, priority)) return { error: "Choose a category and priority." };
  return { values: { title, description, category, priority } };
}

export async function createTicket(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "student") return { error: "Only students can create tickets." };
  const input = readTicket(form);
  if (!input.values) return { error: input.error };
  const { data, error } = await supabase.from("tickets").insert({ ...input.values, user_id: profile.id }).select("id").single();
  if (error) return { error: "The ticket could not be created. Please try again." };
  redirect(`/tickets/${data.id}`);
}

export async function editTicket(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser();
  const input = readTicket(form);
  if (!input.values) return { error: input.error };
  // An RLS-blocked update changes zero rows without an error, so count them.
  const { data, error } = await supabase
    .from("tickets")
    .update(input.values)
    .eq("id", id)
    .eq("user_id", profile.id)
    .eq("status", "open")
    .is("assigned_to", null)
    .select("id");
  if (error || !data?.length) return { error: "This ticket can no longer be edited." };
  redirect(`/tickets/${id}`);
}

export async function deleteTicket(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { data: files } = await supabase.from("attachments").select("file_path").eq("ticket_id", id);
  // Files go first: storage permission depends on the ticket still existing,
  // but only after confirming that the ticket may be deleted.
  const { data: ticket } = await supabase.from("tickets").select("user_id, status, assigned_to").eq("id", id).maybeSingle();
  const { profile } = await requireUser();
  const allowed = ticket && (profile.role === "admin" || (ticket.user_id === profile.id && ticket.status === "open" && !ticket.assigned_to));
  if (!allowed) return { error: "This ticket can no longer be deleted." };
  if (files?.length) {
    const { error } = await supabase.storage.from("attachments").remove(files.map((f) => f.file_path as string));
    if (error) return { error: "The ticket's files could not be deleted. Please try again." };
  }
  const { data, error } = await supabase.from("tickets").delete().eq("id", id).select("id");
  if (error || !data?.length) return { error: "The ticket could not be deleted." };
  redirect("/tickets");
}

export async function manageTicket(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser();
  if (profile.role === "student") return { error: "You cannot manage tickets." };
  const status = form.get("status");
  const priority = form.get("priority");
  if (!isOneOf(STATUSES, status) || !isOneOf(PRIORITIES, priority)) return { error: "Choose a valid status and priority." };
  const changes: Record<string, string | null> = { status, priority };
  if (profile.role === "admin") {
    const agent = text(form, "assigned_to");
    if (agent && !UUID.test(agent)) return { error: "Choose a valid agent." };
    changes.assigned_to = agent || null;
  }
  const { data, error } = await supabase.from("tickets").update(changes).eq("id", id).select("id");
  if (error || !data?.length) return { error: "You do not have permission to make this change." };
  revalidatePath("/", "layout");
  return { success: "Ticket updated." };
}

export async function addComment(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser();
  const message = text(form, "message");
  if (!message || message.length > 2000) return { error: "Write a comment of up to 2000 characters." };
  const { error } = await supabase.from("comments").insert({ ticket_id: id, user_id: profile.id, message });
  if (error) return { error: "The comment could not be added." };
  revalidatePath(`/tickets/${id}`);
  return { success: "Comment added." };
}

// Checks the file's first bytes, because names and browser-sent types can be faked.
function detectType(bytes: Uint8Array) {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { type: "image/png", ext: "png" };
  if (starts(0xff, 0xd8, 0xff)) return { type: "image/jpeg", ext: "jpg" };
  if (starts(0x25, 0x50, 0x44, 0x46)) return { type: "application/pdf", ext: "pdf" };
  return null;
}

export async function uploadAttachment(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser();
  if (!UUID.test(id)) return { error: "Invalid ticket." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };
  if (file.size > MAX_FILE) return { error: "Files can be up to 3 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectType(bytes);
  if (!kind) return { error: "Only PNG, JPEG and PDF files are allowed." };
  const path = `${id}/${randomUUID()}.${kind.ext}`;
  const bucket = supabase.storage.from("attachments");
  const upload = await bucket.upload(path, bytes, { contentType: kind.type });
  if (upload.error) return { error: "The file could not be uploaded." };
  const { error } = await supabase
    .from("attachments")
    .insert({ ticket_id: id, file_path: path, file_name: file.name.slice(0, 200), uploaded_by: profile.id });
  if (error) {
    await bucket.remove([path]);
    return { error: "The file could not be saved." };
  }
  revalidatePath(`/tickets/${id}`);
  return { success: "File uploaded." };
}

export async function changeRole(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireAdmin();
  const role = form.get("role");
  if (!isOneOf(ROLES, role)) return { error: "Choose a valid role." };
  if (id === profile.id) return { error: "You cannot change your own role." };
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "The role could not be changed." };
  revalidatePath("/admin/users");
  return { success: "Saved." };
}

export async function markAllRead() {
  const { supabase, profile } = await requireUser();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.id).is("read_at", null);
  revalidatePath("/", "layout");
}
