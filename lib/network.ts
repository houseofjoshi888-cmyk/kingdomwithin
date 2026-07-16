import { getAddress, type Address } from "viem";

export const BASE_MAINNET_CHAIN_ID = 8453;
export const BASE_MAINNET_RPC_URL = "https://mainnet.base.org";

export const MALKUTA_ENGINE_ADDRESS: Address = getAddress("0x3c626ff68e9a69526117b22d288ab71bda2b377a");
export const MALKUTA_ENGINE_DEPLOYMENT_BLOCK = "48698258";
export const MALKUTA_ENGINE_CONFIGURED = true;
export const MALKUTA_ENGINE_EXPLORER_URL = `https://basescan.org/address/${MALKUTA_ENGINE_ADDRESS}`;
