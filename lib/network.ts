import { getAddress, isAddress, zeroAddress, type Address } from "viem";

export const BASE_MAINNET_CHAIN_ID = 8453;
export const BASE_MAINNET_RPC_URL = "https://mainnet.base.org";

const configuredAddress = process.env.NEXT_PUBLIC_MALKUTA_ENGINE_ADDRESS ?? "";
export const MALKUTA_ENGINE_CONFIGURED = isAddress(configuredAddress) && configuredAddress !== zeroAddress;
export const MALKUTA_ENGINE_ADDRESS: Address = MALKUTA_ENGINE_CONFIGURED ? getAddress(configuredAddress) : zeroAddress;
export const MALKUTA_ENGINE_EXPLORER_URL = MALKUTA_ENGINE_CONFIGURED
  ? `https://basescan.org/address/${MALKUTA_ENGINE_ADDRESS}`
  : "https://basescan.org";
