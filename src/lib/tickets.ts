// Two foreign keys point to profiles, so each join names the one it uses.
export const TICKET_COLUMNS =
  "*, owner:profiles!tickets_user_id_fkey(full_name, email), agent:profiles!tickets_assigned_to_fkey(full_name, email)";
