import { keccak256, toBytes, type Address } from "viem";
import type { MappingMode } from "./protocol";

export function canonicalUploadMessage(address: Address, sourceText: string, mode: MappingMode, timestamp: number) {
  return [
    "Malkuta Canonical IPFS Upload",
    `Address: ${address}`,
    `Mapping: ${mode}`,
    `Source-Hash: ${keccak256(toBytes(sourceText))}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}

