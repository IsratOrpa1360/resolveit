"use client";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="card empty stack">
      <h2>Something went wrong</h2>
      <p className="muted">Your data could not be loaded.</p>
      <div><button className="button" onClick={() => retry()}>Try again</button></div>
    </div>
  );
}
