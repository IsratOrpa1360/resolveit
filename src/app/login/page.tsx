import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth">
      <Link href="/" className="brand">ResolveIT</Link>

      <div className="card">
        <h1>Log in</h1>

        {/* method="post" keeps the password out of the address bar */}
        <form className="form" method="post">
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
