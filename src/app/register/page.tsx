import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth">
      <Link href="/" className="brand">ResolveIT</Link>

      <div className="card">
        <h1>Create account</h1>

        {/* method="post" keeps the password out of the address bar */}
        <form className="form" method="post">
          <label>
            Full name
            <input name="full_name" type="text" required />
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