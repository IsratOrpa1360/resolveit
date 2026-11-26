import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth">
      <h1>Page not found</h1>
      <p className="muted">It may not exist, or you may not have access.</p>
      <Link className="button" href="/dashboard">Go to dashboard</Link>
    </main>
  );
}
