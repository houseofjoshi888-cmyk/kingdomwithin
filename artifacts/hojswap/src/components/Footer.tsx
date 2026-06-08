const FOOTER_LINKS = [
  {
    heading: "Swap",
    items: [
      { label: "BONE / ETH", href: "/" },
      { label: "TREAT / ETH", href: "/" },
      { label: "OSCAR / ETH", href: "/" },
      { label: "QUEENJOSHI / ETH", href: "/" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Website", href: "https://thehouseofjoshi.com", external: true },
      { label: "Contact", href: "https://thehouseofjoshi.com/contact", external: true },
    ],
  },
  {
    heading: "Protocol",
    items: [
      { label: "0x Protocol", href: "https://0x.org", external: true },
      { label: "Stargate V2 (LayerZero)", href: "https://stargate.finance", external: true },
      { label: "Li.Fi Bridge", href: "https://li.fi", external: true },
      { label: "RainbowKit", href: "https://rainbowkit.com", external: true },
      { label: "Wagmi", href: "https://wagmi.sh", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[rgba(212,175,55,0.12)] bg-[rgba(11,11,13,0.95)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="mb-3 flex items-center gap-2.5">
              <img src="/logo.png" alt="House of Joshi" className="h-9 w-9 object-contain" />
              <span className="hoj-display text-sm font-semibold text-[rgba(212,175,55,0.9)]">
                House of Joshi
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-white/45">
              Swap & bridge HOJ tokens across Ethereum, Base, Cronos, and XRP EVM,
              powered by 0x, Stargate V2, and Li.Fi.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="https://thehouseofjoshi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[rgba(212,175,55,0.7)] hover:text-[rgba(212,175,55,0.95)] transition"
              >
                thehouseofjoshi.com ↗
              </a>
              <div className="mt-1 flex items-center gap-3">
                <a
                  href="https://x.com/thehouseofjoshi"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X / Twitter"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/40 hover:border-[rgba(212,175,55,0.4)] hover:text-[rgba(212,175,55,0.9)] transition"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://discord.com/invite/uH9zVeAwDu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/40 hover:border-[rgba(212,175,55,0.4)] hover:text-[rgba(212,175,55,0.9)] transition"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
                <a
                  href="mailto:support@thehouseofjoshi.com"
                  aria-label="Email"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/40 hover:border-[rgba(212,175,55,0.4)] hover:text-[rgba(212,175,55,0.9)] transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                {group.heading}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item) =>
                  "external" in item && item.external ? (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/55 hover:text-[rgba(212,175,55,0.9)] transition"
                      >
                        {item.label} ↗
                      </a>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <a href={item.href} className="text-xs text-white/55 hover:text-[rgba(212,175,55,0.9)] transition">
                        {item.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-6 sm:flex-row">
          <p className="text-[11px] text-white/35">
            © {new Date().getFullYear()} The House of Joshi. All rights reserved.
          </p>
          <p className="text-center text-[11px] leading-relaxed text-white/30">
            Not financial advice. Swap at your own risk. Always verify token addresses.
          </p>
          <div className="flex gap-4">
            <a
              href="https://thehouseofjoshi.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/40 hover:text-[rgba(212,175,55,0.8)] transition"
            >
              Contact
            </a>
            <a href="/about" className="text-[11px] text-white/40 hover:text-[rgba(212,175,55,0.8)] transition">
              About
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
