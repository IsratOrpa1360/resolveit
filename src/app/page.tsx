import styles from "./page.module.css";

export default function Home() {
  return (
    <div>
      <header className={styles.navbar}>
        <strong>ResolveIT</strong>
        <a href="/login">Log in</a>
      </header>

      <main className={styles.content}>
        <h1>Report problems. Get them resolved.</h1>
        <p>Submit an issue and track its progress.</p>
      </main>
    </div>
  );
}