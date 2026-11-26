import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth">
      <Link href="/" className="brand">ResolveIT</Link>
      <div className="card">{children}</div>
    </main>
  );
}
