import Link from "next/link";

export function SiteFooter({ tagline = "THE SCRIPTURE IS THE SEED. THE PROTOCOL IS THE PROOF." }: { tagline?: string }) {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/" aria-label="Kingdom Within home">
        <span className="brand-mark">K</span>
        <span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span>
      </Link>
      <div className="footer-signature">
        <span>BROUGHT TO YOU BY</span>
        <strong>THE HOUSE OF JOSHI</strong>
        <small>© 2026 HOUSE OF JOSHI · ALL RIGHTS RESERVED</small>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/">COMPOSER</Link>
        <Link href="/how-to-use">HOW TO USE</Link>
        <Link href="/verify">VERIFY</Link>
      </nav>
      <p>{tagline}</p>
    </footer>
  );
}
