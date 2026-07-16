import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";

type Section = { title: string; content: ReactNode };

export function InformationPage({ code, eyebrow, title, intro, sections, children }: { code: string; eyebrow: string; title: ReactNode; intro: string; sections?: Section[]; children?: ReactNode }) {
  return (
    <main className="information-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Kingdom Within home"><span className="brand-mark">K</span><span><strong>KINGDOM WITHIN</strong><small>TRUST CENTER</small></span></Link>
        <div className="status-line"><span className="pulse" /> PUBLIC RECORD <i /> HOUSE OF JOSHI</div>
        <Link className="guide-back" href="/">RETURN TO COMPOSER <span>↗</span></Link>
      </header>
      <section className="information-hero">
        <p className="eyebrow"><span>{code}</span> {eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <small>LAST UPDATED · 16 JULY 2026</small>
      </section>
      <div className="information-layout">
        <nav className="information-nav" aria-label="Trust center">
          <span>TRUST CENTER</span>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy">PRIVACY</Link>
          <Link href="/terms">TERMS</Link>
          <Link href="/mint-policy">MINT POLICY</Link>
          <Link href="/disclosures">RISK DISCLOSURES</Link>
        </nav>
        <section className="information-content">
          {sections?.map((section, index) => <article id={`section-${index + 1}`} key={section.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{section.title}</h2>{section.content}</div></article>)}
          {children}
        </section>
      </div>
      <div className="information-notice">These pages describe the operation of Kingdom Within and do not replace professional legal, tax, or financial advice. Mandatory rights under applicable law remain unaffected.</div>
      <SiteFooter tagline="CLEAR TERMS. VERIFIABLE PROVENANCE. SOVEREIGN CHOICE." />
    </main>
  );
}
