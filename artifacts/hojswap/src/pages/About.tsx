import { Link } from "wouter";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <img src="/logo.png" alt="House of Joshi" className="mx-auto mb-6 h-24 w-24 object-contain" />
        <h1 className="hoj-display text-2xl font-semibold text-[rgba(212,175,55,0.95)] sm:text-3xl">
          House of Joshi — Swap &amp; Bridge
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65">
          The <strong className="text-white/85">House of Joshi</strong> is a decentralised
          token exchange and cross-chain bridge built for the HOJ community. Trade and bridge
          ETH, USDC, USDT, SHIB, BONE, TREAT, OSCAR, and HOJ tokens — directly from your
          wallet, with no custodian and no sign-up required.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="hoj-display mb-4 text-base font-semibold uppercase tracking-widest text-[rgba(212,175,55,0.8)]">
          What is HOJ Swap &amp; Bridge?
        </h2>
        <div className="hoj-panel rounded-2xl p-5 text-sm leading-relaxed text-white/70 space-y-3">
          <p>
            HOJ Swap &amp; Bridge is the official trading and bridging interface for the House of Joshi
            ecosystem. The <strong className="text-white/85">Swap</strong> feature connects directly to the{" "}
            <a href="https://0x.org" target="_blank" rel="noopener noreferrer" className="text-[rgba(212,175,55,0.85)] hover:underline">
              0x Protocol
            </a>
            , routing trades through the best available on-chain liquidity — across Uniswap,
            Curve, and dozens of other sources.
          </p>
          <p>
            The <strong className="text-white/85">Bridge</strong> feature offers real in-app cross-chain bridging on all supported routes.
            Between <strong className="text-white/85">Ethereum and Base</strong> it uses{" "}
            <a href="https://stargate.finance" target="_blank" rel="noopener noreferrer" className="text-[rgba(212,175,55,0.85)] hover:underline">
              Stargate V2 (LayerZero)
            </a>{" "}
            to move USDC and ETH trustlessly. Between <strong className="text-white/85">Ethereum / Base and Cronos</strong> it routes
            through{" "}
            <a href="https://li.fi" target="_blank" rel="noopener noreferrer" className="text-[rgba(212,175,55,0.85)] hover:underline">
              Li.Fi
            </a>{" "}
            (cBridge / Connext) for the best available rate. XRP EVM bridging is not yet supported by any major
            bridge aggregator and will be added when a reliable protocol becomes available.
          </p>
          <p>
            A <strong className="text-white/85">1% House Fee</strong> is applied to every swap and bridge,
            sent directly to the House of Joshi treasury to support the community and its ongoing development.
          </p>
          <p>
            Fully non-custodial. Your wallet is never exposed to a third party — all transactions are
            signed directly in your browser using MetaMask, Rabby, Coinbase Wallet, Trust Wallet, or
            any WalletConnect-compatible mobile wallet.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="hoj-display mb-4 text-base font-semibold uppercase tracking-widest text-[rgba(212,175,55,0.8)]">
          Supported Tokens
        </h2>
        <div className="space-y-3">
          <div className="hoj-panel rounded-2xl p-4">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-[rgba(212,175,55,0.7)]">HOJ Tokens — Base Network</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { symbol: "QUEENJOSHI", name: "Queen Joshi", desc: "The royal token of the House of Joshi community on Base." },
                { symbol: "KINGJOSHI", name: "King Joshi", desc: "The king counterpart in the HOJ ecosystem on Base." },
              ].map((t) => <TokenRow key={t.symbol} {...t} />)}
            </div>
          </div>
          <div className="hoj-panel rounded-2xl p-4">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-[rgba(212,175,55,0.7)]">Shib Ecosystem — Ethereum</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { symbol: "SHIB", name: "Shiba Inu", desc: "The flagship meme coin on Ethereum." },
                { symbol: "BONE", name: "Bone ShibaSwap", desc: "Governance token of the Shiba Inu ecosystem." },
                { symbol: "TREAT", name: "Treat", desc: "Reward and metaverse token for the Shib ecosystem." },
                { symbol: "OSCAR", name: "Oscar", desc: "Community meme token on Ethereum." },
              ].map((t) => <TokenRow key={t.symbol} {...t} />)}
            </div>
          </div>
          <div className="hoj-panel rounded-2xl p-4">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-[rgba(212,175,55,0.7)]">Stablecoins &amp; Bridgeable — All Chains</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { symbol: "USDC", name: "USD Coin", desc: "Circle's regulated USD stablecoin. Bridge Eth↔Base via Stargate V2, or Eth/Base↔Cronos via Li.Fi — fully in-app." },
                { symbol: "USDT", name: "Tether USD", desc: "The world's largest stablecoin. Bridge Eth↔Cronos via Li.Fi directly in-app." },
                { symbol: "ETH", name: "Ether", desc: "Native asset of Ethereum & Base. Bridge Eth↔Base via Stargate V2, or Eth/Base↔Cronos via Li.Fi — fully in-app." },
              ].map((t) => <TokenRow key={t.symbol} {...t} />)}
            </div>
          </div>
          <div className="hoj-panel rounded-2xl p-4">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-[rgba(212,175,55,0.7)]">Chain-Native Tokens</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { symbol: "CRO", name: "Cronos", desc: "Native token of the Cronos chain. Swap on Cronos." },
                { symbol: "XRP", name: "XRP", desc: "Native asset of the XRP Ledger EVM Sidechain. Swap on XRP EVM." },
                { symbol: "KIND", name: "Kindred", desc: "Community token on Cronos." },
                { symbol: "NBAA", name: "NBAA", desc: "Community token on Cronos." },
              ].map((t) => <TokenRow key={t.symbol} {...t} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="hoj-display mb-4 text-base font-semibold uppercase tracking-widest text-[rgba(212,175,55,0.8)]">
          Supported Networks
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: "Ethereum", badge: "Swap + Bridge", desc: "Home chain for SHIB, BONE, TREAT, OSCAR, USDC, USDT, and ETH. Bridge to Base (Stargate V2) or Cronos (Li.Fi) directly in-app." },
            { name: "Base", badge: "Swap + Bridge", desc: "Coinbase's L2 — home of QUEENJOSHI and KINGJOSHI. Lower fees, faster confirmations. Bridge to Ethereum (Stargate V2) or Cronos (Li.Fi) directly in-app." },
            { name: "Cronos", badge: "Swap + Bridge", desc: "High-throughput EVM chain. Swap CRO, ETH, USDC, USDT, KIND, and NBAA. Bridge USDC/USDT/ETH to Ethereum or Base via Li.Fi — fully in-app, no redirects." },
            { name: "XRP Ledger EVM", badge: "Swap Only", desc: "XRP's EVM sidechain. Trade XRP alongside ETH, USDC, and USDT. In-app bridging to/from XRP EVM is coming soon." },
          ].map((c) => (
            <div key={c.name} className="hoj-panel rounded-2xl p-4">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white/90">{c.name}</h3>
                <span className="rounded-full border border-[rgba(212,175,55,0.3)] px-2 py-0.5 text-[9px] uppercase tracking-wider text-[rgba(212,175,55,0.7)]">{c.badge}</span>
              </div>
              <p className="text-xs leading-relaxed text-white/55">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="hoj-display mb-4 text-base font-semibold uppercase tracking-widest text-[rgba(212,175,55,0.8)]">
          How it Works
        </h2>
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Connect Wallet", desc: "Connect MetaMask, Rabby, Coinbase Wallet, Trust Wallet, or any WalletConnect-compatible mobile wallet." },
            { step: "2", title: "Choose Tokens &amp; Chains", desc: "Select which token to sell (or bridge) and the destination. Adjust slippage if needed." },
            { step: "3", title: "Confirm &amp; Execute", desc: "Review the 0x or Stargate quote — including route, fees, and price impact — then confirm in your wallet." },
          ].map((s) => (
            <div key={s.step} className="hoj-panel rounded-2xl p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(212,175,55,0.15)] text-sm font-bold text-[rgba(212,175,55,0.9)]">
                {s.step}
              </div>
              <h3 className="mb-1 text-sm font-semibold text-white/90" dangerouslySetInnerHTML={{ __html: s.title }} />
              <p className="text-xs leading-relaxed text-white/55">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="hoj-panel rounded-2xl p-4 text-xs text-white/55 space-y-1.5">
          <p><strong className="text-white/75">Swapping</strong> — powered by 0x Protocol. Best price across all major DEXes on Ethereum, Base, Cronos, and XRP EVM. 1% house fee included in the quote.</p>
          <p><strong className="text-white/75">Bridging (Ethereum ↔ Base)</strong> — powered by Stargate V2 (LayerZero). Transfers USDC or ETH trustlessly. Requires a small LayerZero messaging fee paid in ETH, plus 1% house fee.</p>
          <p><strong className="text-white/75">Bridging (Cronos routes)</strong> — powered by Li.Fi (cBridge / Connext). Routes USDC, USDT, or ETH between Ethereum, Base, and Cronos entirely in-app. Live quote fetched before each bridge, 1% house fee applies.</p>
          <p><strong className="text-white/75">Bridging (XRP EVM)</strong> — coming soon. No major bridge aggregator supports the XRP EVM sidechain yet. Swap on XRP EVM is fully available in the meantime.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.05)] p-6 text-center">
        <h2 className="hoj-display mb-2 text-base font-semibold text-[rgba(212,175,55,0.9)]">Ready to trade?</h2>
        <p className="mb-4 text-sm text-white/60">Connect your wallet and swap or bridge in seconds.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-[rgba(212,175,55,0.95)] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[rgba(212,175,55,0.85)] transition"
          >
            Start Swapping
          </Link>
          <a
            href="https://thehouseofjoshi.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-[rgba(212,175,55,0.35)] px-6 py-2.5 text-sm font-medium text-[rgba(212,175,55,0.9)] hover:bg-[rgba(212,175,55,0.08)] transition"
          >
            Contact Us ↗
          </a>
        </div>
      </section>
    </div>
  );
}

function TokenRow({ symbol, name, desc }: { symbol: string; name: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.08)] text-[10px] font-bold text-[rgba(212,175,55,0.9)]">
        {symbol.slice(0, 4)}
      </div>
      <div>
        <div className="text-sm font-semibold text-white/90">{symbol}</div>
        <div className="text-[11px] text-white/45">{name}</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">{desc}</p>
      </div>
    </div>
  );
}
