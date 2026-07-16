import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function SiteFooter({ tagline = "THE SCRIPTURE IS THE SEED. THE PROTOCOL IS THE PROOF." }: { tagline?: string }) {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/" aria-label="Kingdom Within home">
        <BrandMark />
        <span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span>
      </Link>
      <div className="footer-signature">
        <span>BROUGHT TO YOU BY</span>
        <strong>THE HOUSE OF JOSHI</strong>
        <small>© 2026 THE HOUSE OF JOSHI · ALL RIGHTS RESERVED</small>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/">COMPOSER</Link>
        <Link href="/collection">COLLECTION</Link>
        <Link href="/how-to-use">HOW TO USE</Link>
        <Link href="/verify">VERIFY</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/privacy">PRIVACY</Link>
        <Link href="/terms">TERMS</Link>
        <Link href="/contact">CONTACT</Link>
      </nav>
      <p>{tagline}</p>
    </footer>
  );
}
