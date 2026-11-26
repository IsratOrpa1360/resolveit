import Link from "next/link";
import styles from "./page.module.css";

const steps = [
  { title: "Report", text: "Describe the problem and choose a category and priority." },
  { title: "Track", text: "Follow the status and get notified when something changes." },
  { title: "Resolve", text: "Talk with your support agent until the issue is fixed." },
];

export default function Home() {
  return (
    <>
      <header className={styles.navbar}>
        <Link href="/" className="brand">ResolveIT</Link>
        <nav className={styles.links} aria-label="Account">
          <Link href="/login">Log in</Link>
          <Link href="/register" className="button">Get started</Link>
        </nav>
      </header>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Report problems. Get them resolved.</h1>
          <p className="muted">One place for students to submit issues, track progress and talk with support.</p>
          <Link href="/register" className="button">Create an account</Link>
        </section>
        <section className={styles.steps} aria-label="How it works">
          {steps.map((s) => (
            <div className="card" key={s.title}><h2>{s.title}</h2><p className="muted">{s.text}</p></div>
          ))}
        </section>
      </main>
    </>
  );
}
