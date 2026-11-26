import Link from "next/link";
import { login } from "../auth-actions";

// Messages are chosen from this list, so the page never shows
// text typed into the address bar.
const errors: Record<string, string> = {
  invalid: "Wrong email or password.",
  confirm: "Please confirm your email first, then log in.",
};
const messages: Record<string, string> = {
  "check-email": "Account created. Check your email for the confirmation link.",
  confirmed: "Email confirmed. You can log in now.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="auth">
      <Link href="/" className="brand">ResolveIT</Link>

      <div className="card">
        <h1>Log in</h1>

        {error && errors[error] && <p className="message error">{errors[error]}</p>}
        {message && messages[message] && <p className="message success">{messages[message]}</p>}

        {/* action={login} sends the form to the login function on the server */}
        <form className="form" action={login}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>

          <label>
            Password
            <input name="password" type="password" required />
          </label>

          <button className="button">Log in</button>
        </form>

        <p className="muted">
          New here? <Link href="/register" className="link">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
