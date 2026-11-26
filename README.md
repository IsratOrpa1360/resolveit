# ResolveIT

Issue and complaint management for universities. Students report problems, agents resolve them, and admins manage the work.

**Stack:** TypeScript, Next.js (App Router), Supabase (PostgreSQL, Auth, Storage), CSS.

## Features

- **Students:** create and track tickets; edit or delete them until support starts work
- **Agents:** see assigned tickets, update status and priority, reply
- **Admins:** assign tickets, manage users and roles, view statistics
- Comments, private attachments, notifications, search and filters

## Setup

1. Install [Node.js LTS](https://nodejs.org), then run `npm install`.
2. Create a project at [supabase.com](https://supabase.com).
3. In **SQL Editor**, paste all of `supabase/schema.sql` and run it once.
4. Copy `.env.example` to `.env.local`. Fill in the project URL and the **publishable** key. Never use the secret or service-role key.
5. In **Authentication > URL Configuration**, set Site URL to `http://localhost:3000` and add the redirect URL `http://localhost:3000/auth/callback`.
6. Run `npm run dev` and register at `http://localhost:3000/register`.
7. Make yourself the first admin in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```

## Security

- Row Level Security on every table decides which rows each role can access.
- Column privileges and triggers stop users changing protected fields, such as their own role.
- Server Actions check the session and validate input. The proxy only redirects early.
- Files are private, limited to 3 MB, and checked by content (PNG, JPEG, PDF).

## Database

`profiles` 1—many `tickets` (as owner, and as assigned agent); `tickets` 1—many `comments`, `attachments` and `notifications`. Deleting a ticket deletes its related rows.

## Deployment (Vercel)

Import the GitHub repository and add the three variables from `.env.example`, setting `NEXT_PUBLIC_SITE_URL` to the deployed address. Add `<that address>/auth/callback` to Supabase's redirect URLs and update its Site URL.
