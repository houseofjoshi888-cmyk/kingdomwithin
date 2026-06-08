import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV_LINKS = [
  { label: "Swap & Bridge", href: "/" },
  { label: "About", href: "/about" },
  { label: "Community", href: "https://thehouseofjoshi.com", external: true },
  { label: "Contact", href: "https://thehouseofjoshi.com/contact", external: true },
];

function isActive(linkHref: string, location: string) {
  if (linkHref === "/") return location === "/" || location === "";
  return location === linkHref || location.startsWith(linkHref + "/");
}

export function Header() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(212,175,55,0.15)] bg-[rgba(11,11,13,0.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo.png"
            alt="House of Joshi"
            className="h-10 w-10 object-contain transition group-hover:scale-105"
          />
          <div className="hidden sm:block">
            <span className="hoj-display block text-sm font-semibold leading-tight text-[rgba(212,175,55,0.95)]">
              House of Joshi
            </span>
            <span className="block text-[9px] text-white/35 leading-tight tracking-[0.18em] uppercase">
              Swap &amp; Bridge
            </span>
          </div>
          <span className="hoj-display text-sm font-semibold text-[rgba(212,175,55,0.95)] sm:hidden">
            HOJ
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl px-3 py-2 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-[rgba(212,175,55,0.9)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-[13px] transition ${
                  isActive(link.href, location)
                    ? "bg-[rgba(212,175,55,0.12)] text-[rgba(212,175,55,0.95)]"
                    : "text-white/60 hover:bg-white/5 hover:text-[rgba(212,175,55,0.9)]"
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:border-[rgba(212,175,55,0.3)] hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/8 bg-[rgba(11,11,13,0.98)] px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/5 hover:text-[rgba(212,175,55,0.9)]"
              >
                {link.label} <span className="text-white/30">↗</span>
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-3 py-3 text-sm transition ${
                  isActive(link.href, location)
                    ? "text-[rgba(212,175,55,0.95)]"
                    : "text-white/65 hover:bg-white/5 hover:text-[rgba(212,175,55,0.9)]"
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      )}
    </header>
  );
}
