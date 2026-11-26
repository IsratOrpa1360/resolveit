import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import { login } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmed?: string }> }) {
  const { confirmed } = await searchParams;
  return (
    <>
      <h1>Log in</h1>
      {confirmed && <p className="message">If you have confirmed your email, you can log in now.</p>}
      <ActionForm action={login} submit="Log in">
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
      </ActionForm>
      <p className="muted">New here? <Link className="link" href="/register">Create an account</Link></p>
    </>
  );
}
