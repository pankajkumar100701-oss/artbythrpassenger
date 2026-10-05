"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/data/site";
import { AppearanceControls } from "./AppearanceControls";

type Panel = "none" | "menu" | "appearance";

export function SiteHeader({ tagline }: { tagline: string }) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>("none");
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (panel === "none") return;
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setPanel("none");
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel("none");
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? "none" : p));
  const close = () => setPanel("none");
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-bar">
        <Link href="/" className="brand" onClick={close}>
          <Image src="/brand/logo.webp" alt="" width={40} height={40} className="brand-logo" preload />
          <span className="brand-text">
            <span className="brand-name">{site.name}</span>
            <span className="brand-sub">{tagline}</span>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Main">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link" aria-current={isActive(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Appearance"
            aria-expanded={panel === "appearance"}
            onClick={() => toggle("appearance")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label="Menu"
            aria-expanded={panel === "menu"}
            onClick={() => toggle("menu")}
          >
            <span className="burger" data-open={panel === "menu"} aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {panel === "appearance" && (
        <div className="header-panel appearance-panel">
          <p className="panel-label">Appearance</p>
          <AppearanceControls />
          <HostLink onClick={close} />
        </div>
      )}

      {panel === "menu" && (
        <div className="header-panel menu-panel">
          <nav aria-label="Mobile">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="menu-link" onClick={close} aria-current={isActive(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <AppearanceControls />
          <HostLink onClick={close} />
        </div>
      )}
    </header>
  );
}

/** Entry to the Studio. Visitors without the password only reach the login page. */
function HostLink({ onClick }: { onClick: () => void }) {
  return (
    <Link href="/studio" className="host-link" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 6a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 12c-2-.7-3.7-2.1-4.6-3.9.1-1.5 3-2.3 4.6-2.3s4.5.8 4.6 2.3c-.9 1.8-2.6 3.2-4.6 3.9Z" />
      </svg>
      Host control
    </Link>
  );
}
