import { Token, isNative } from "@/lib/tokens";
import { formatCompactNumber } from "@/lib/format";

export const HOUSE_FEE_BPS = 100;
export const NATIVE_ETH_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type QuoteFee = {
  amount: string;
  token: string;
  type: string;
};

export type Permit2Eip712 = {
  types: Record<string, { name: string; type: string }[]>;
  domain: {
    name: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  };
  message: Record<string, unknown>;
  primaryType: string;
};

export type QuoteResponse = {
  buyAmount?: string;
  sellAmount?: string;
  buyToken?: string;
  sellToken?: string;
  minBuyAmount?: string;
  liquidityAvailable?: boolean;
  fees?: {
    integratorFee?: QuoteFee | null;
    integratorFees?: QuoteFee[];
    zeroExFee?: QuoteFee | null;
    gasFee?: QuoteFee | null;
  };
  route?: {
    fills?: { from: string; to: string; source: string; proportionBps: string }[];
    tokens?: { address: string; symbol: string }[];
  };
  totalNetworkFee?: string | null;
  issues?: {
    allowance?: {
      spender: `0x${string}`;
      actual: string;
      expected?: string;
    } | null;
    balance?: unknown | null;
    simulationIncomplete?: boolean;
  };
  permit2?: {
    type: string;
    hash: `0x${string}`;
    eip712: Permit2Eip712;
  } | null;
  transaction?: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
    gas?: string | null;
    gasPrice?: string;
  };
};

export type PriceResponse = {
  buyAmount?: string;
  sellAmount?: string;
  liquidityAvailable?: boolean;
  totalNetworkFee?: string | null;
  fees?: {
    gasFee?: QuoteFee | null;
    integratorFee?: QuoteFee | null;
    zeroExFee?: QuoteFee | null;
  };
};

export function tokenTo0xParam(t: Token) {
  return isNative(t) ? NATIVE_ETH_ADDRESS : (t.address as string);
}

export function calcPriceImpactPercent(
  quote: QuoteResponse,
  price: PriceResponse,
): number | null {
  if (quote.buyAmount == null || price.buyAmount == null) return null;
  const firm = BigInt(quote.buyAmount);
  const indicative = BigInt(price.buyAmount);
  if (indicative === 0n) return null;
  const diff = indicative - firm;
  return Number((diff * 10000n) / indicative) / 100;
}

export function formatGasCostEth(tx: QuoteResponse["transaction"]): string | null {
  if (!tx?.gas || !tx?.gasPrice) return null;
  try {
    const wei = BigInt(tx.gas) * BigInt(tx.gasPrice);
    const eth = Number(wei) / 1e18;
    if (eth < 0.0001) return "<0.0001";
    return formatCompactNumber(eth, eth < 0.01 ? 4 : 3);
  } catch {
    return null;
  }
}

export function formatFeeAmount(
  fee: QuoteFee | undefined | null,
  decimalsByAddress: Map<string, number>,
  symbolByAddress: Map<string, string>,
): string | null {
  if (!fee?.amount) return null;
  const addr = fee.token.toLowerCase();
  const decimals =
    addr === NATIVE_ETH_ADDRESS.toLowerCase()
      ? 18
      : decimalsByAddress.get(addr);
  const symbol =
    addr === NATIVE_ETH_ADDRESS.toLowerCase()
      ? "ETH"
      : symbolByAddress.get(addr) ?? "token";
  if (decimals == null) return null;
  try {
    const amt = Number(fee.amount) / 10 ** decimals;
    if (amt === 0) return `0 ${symbol}`;
    if (amt < 0.000001) return `<0.000001 ${symbol}`;
    return `${formatCompactNumber(amt, amt >= 1 ? 4 : 6)} ${symbol}`;
  } catch {
    return null;
  }
}
