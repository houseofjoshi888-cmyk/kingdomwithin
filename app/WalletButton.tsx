"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const connected = mounted && account && chain;
        const wrongNetwork = connected && chain.unsupported;
        const label = !connected
          ? "CONNECT WALLET"
          : wrongNetwork
            ? "SWITCH TO BASE"
            : `${account.displayName}${account.displayBalance ? ` · ${account.displayBalance}` : ""}`;
        return (
          <button
            className="wallet-button"
            type="button"
            aria-label={label}
            disabled={!mounted}
            onClick={!connected ? openConnectModal : wrongNetwork ? openChainModal : openAccountModal}
          >
            {label}<span>↗</span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
