import type { Metadata } from "next";
import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import { register } from "../actions";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <h1>Create account</h1>
      <ActionForm action={register} submit="Create account">
        <label>Full name<input name="full_name" required maxLength={100} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
      </ActionForm>
      <p className="muted">Already registered? <Link className="link" href="/login">Log in</Link></p>
    </>
  );
}
