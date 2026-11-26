import Link from "next/link";
import { register } from "../auth-actions";

const errors: Record<string, string> = {
  name: "Enter your full name (up to 100 characters).",
  email: "Enter a valid email address.",
  password: "Use at least 8 characters for your password.",
  failed: "Could not create the account. Try a different email or try again later.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth">
      <Link href="/" className="brand">ResolveIT</Link>

      <div className="card">
        <h1>Create account</h1>

        {error && errors[error] && <p className="message error">{errors[error]}</p>}

        <form className="form" action={register}>
          <label>
            Full name
            <input name="full_name" type="text" required maxLength={100} />
          </label>

          <label>
            Email
            <input name="email" type="email" required />
          </label>

          <label>
            Password
            <input name="password" type="password" required minLength={8} />
          </label>

          <button className="button">Create account</button>
        </form>

        <p className="muted">
          Already registered? <Link href="/login" className="link">Log in</Link>
        </p>
      </div>
    </main>
  );
}
