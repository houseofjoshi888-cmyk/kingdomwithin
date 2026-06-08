import { Token, isNative } from "@/lib/tokens";
import { NATIVE_ETH_ADDRESS, tokenTo0xParam } from "@/lib/quote";

const MEME_SYMBOLS = new Set(["QUEENJOSHI", "KINGJOSHI", "BONE", "TREAT", "OSCAR", "SHIB"]);

function liquidRank(t: Token): number {
  if (isNative(t)) return 0;
  if (t.symbol === "USDC") return 1;
  if (t.symbol === "SHIB") return 2;
  return 99;
}

export function pickSwapFeeToken(sell: Token, buy: Token): string {
  const sellRank = liquidRank(sell);
  const buyRank = liquidRank(buy);
  if (sellRank < buyRank) return tokenTo0xParam(sell);
  if (buyRank < sellRank) return tokenTo0xParam(buy);
  return tokenTo0xParam(sell);
}

export function effectiveSlippageBps(sell: Token, buy: Token, userBps: number): number {
  const involvesMeme =
    MEME_SYMBOLS.has(sell.symbol) || MEME_SYMBOLS.has(buy.symbol);
  if (involvesMeme) return Math.max(userBps, 200);
  return userBps;
}

export function parse0xError(payload: {
  error?: string;
  reason?: string;
  message?: string;
  validationErrors?: { field: string; reason: string }[];
}): string {
  if (payload.validationErrors?.length) {
    return payload.validationErrors.map((e) => `${e.field}: ${e.reason}`).join("; ");
  }
  return payload.reason || payload.message || payload.error || "Failed to fetch quote";
}

export function isSameToken(a: Token, b: Token) {
  return tokenTo0xParam(a).toLowerCase() === tokenTo0xParam(b).toLowerCase();
}

export function otherToken(current: Token, selected: Token, pool: Token[]): Token {
  if (!isSameToken(current, selected)) return selected;
  return pool.find((t) => !isSameToken(t, current)) ?? selected;
}

export const NATIVE_ETH = NATIVE_ETH_ADDRESS;
