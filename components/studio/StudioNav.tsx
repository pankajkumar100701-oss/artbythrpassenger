"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/studio/actions";

const links = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/artworks", label: "Artworks" },
  { href: "/studio/categories", label: "Gallery filters" },
  { href: "/studio/letters", label: "Letters" },
  { href: "/studio/news", label: "News" },
  { href: "/studio/site", label: "Site content" },
  { href: "/studio/security", label: "Security" },
];

/** Section tabs for the Studio. Hidden on the login page. */
export function StudioNav() {
  const pathname = usePathname();
  if (pathname === "/studio/login") return null;

  // Add/edit artwork pages live under Artworks.
  const isActive = (href: string) =>
    href === "/studio"
      ? pathname === href
      : pathname.startsWith(href) || (href === "/studio/artworks" && /^\/studio\/(new|edit)(\/|$)/.test(pathname));

  return (
    <nav className="studio-nav" aria-label="Studio">
      <div className="studio-nav-links">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="studio-tab" aria-current={isActive(l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </div>
      <form action={logout}>
        <button className="studio-tab">Log out</button>
      </form>
    </nav>
  );
}
