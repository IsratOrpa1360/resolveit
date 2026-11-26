"use client";
// "use client" = this component runs in the BROWSER.
// It needs to know which page is open, and only the browser knows that.

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; text: string };

export default function NavLinks({ links }: { links: NavLink[] }) {
  const path = usePathname(); // the current address, e.g. "/dashboard"

  return (
    <nav className="nav" aria-label="Main">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          // aria-current marks the open page; globals.css colors it blue.
          aria-current={path === link.href ? "page" : undefined}
        >
          {link.text}
        </Link>
      ))}
    </nav>
  );
}
