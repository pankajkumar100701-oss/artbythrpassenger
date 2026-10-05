import Image from "next/image";
import Link from "next/link";
import { legalNav, nav, site } from "@/data/site";
import { getSettings } from "@/lib/artworks";

export async function SiteFooter() {
  const { contact } = await getSettings();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <Image src="/brand/logo.webp" alt="" width={40} height={40} className="brand-logo" />
            <span className="brand-name">{site.name}</span>
          </Link>
          <p className="muted">
            Paintings and monthly letters from {site.artist}.
            <br />
            Each piece is one-of-a-kind and made by hand.
          </p>
        </div>

        <FooterColumn title="Explore" links={nav} />
        <FooterColumn title="Legal" links={legalNav} />

        <div>
          <h2 className="footer-heading">Contact</h2>
          <ul className="footer-links">
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                Instagram ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>
          {site.name} © {new Date().getFullYear()} — works by {site.artist}
        </p>
        <p>
          {site.name} is a brand owned and operated by {site.owner}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="footer-heading">{title}</h2>
      <ul className="footer-links">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
