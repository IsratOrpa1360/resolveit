"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }: { links: { href: string; text: string }[] }) {
  const path = usePathname();
  // The most specific match wins, so /admin/users does not also highlight /admin.
  const active = links
    .filter((l) => path === l.href || path.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="nav" aria-label="Main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={l.href === active ? "page" : undefined}>{l.text}</Link>
      ))}
    </nav>
  );
}
