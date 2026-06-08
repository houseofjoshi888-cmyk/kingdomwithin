import { useAccount, useBalance } from "wagmi";
import { getChainName } from "@/lib/chains";
import { formatBalanceDisplay, formatUsdDisplay } from "@/lib/format";
import { isNative, isUsdStableToken, Token } from "@/lib/tokens";

export function TokenBalance({
  token,
  chainId,
  isConnected,
  walletChainId,
  onMax,
}: {
  token: Token;
  chainId: number;
  isConnected: boolean;
  walletChainId?: number;
  onMax?: () => void;
}) {
  const { address } = useAccount();
  const onCorrectChain = walletChainId === chainId;

  const { data, isLoading, isError } = useBalance({
    address,
    token: isNative(token) ? undefined : token.address,
    chainId,
    query: {
      enabled: isConnected && !!address && onCorrectChain,
      refetchInterval: 12_000,
    },
  });

  if (!isConnected || !address) return null;

  if (!onCorrectChain) {
    return (
      <p className="mt-2 text-left text-[11px] text-amber-200/80">
        Switch to {getChainName(chainId)} to view balance
      </p>
    );
  }

  let label = "Balance: unavailable";
  if (isLoading) {
    label = "Balance: …";
  } else if (data) {
    const tokenLabel = formatBalanceDisplay(data.value, data.decimals, token.symbol);
    if (isUsdStableToken(token)) {
      const raw = Number(data.value) / 10 ** data.decimals;
      label = `Balance: ${tokenLabel} · ${formatUsdDisplay(raw)}`;
    } else {
      label = `Balance: ${tokenLabel}`;
    }
  }

  return (
    <div className="mt-2 text-left text-[11px] text-white/45">
      <span>{label}</span>
      {onMax && data && data.value > 0n ? (
        <>
          {" · "}
          <button
            type="button"
            onClick={onMax}
            className="font-semibold uppercase tracking-wider text-[rgba(212,175,55,0.95)] underline-offset-2 hover:underline"
          >
            Max
          </button>
        </>
      ) : null}
    </div>
  );
}
