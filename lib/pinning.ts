import type { Address } from "viem";
import type { Analysis, MappingMode } from "./protocol";
import { canonicalUploadMessage } from "./upload-auth";

export type CanonicalArtifact = {
  contentHash: `0x${string}`;
  metadataURI: string;
  imageURI: string;
  manifest: unknown;
};

export async function pinCanonicalArtifact(
  sourceText: string,
  analysis: Analysis,
  mode: MappingMode,
  address: Address,
  signMessage: (message: string) => Promise<`0x${string}`>,
) {
  if (mode === "custom") throw new Error("Custom mappings require a pinned mapping digest before minting.");
  const timestamp = Date.now();
  const message = canonicalUploadMessage(address, sourceText, mode, timestamp);
  const signature = await signMessage(message);
  const response = await fetch("/api/pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, sourceText, mode, timestamp, signature }),
  });
  const result = await response.json() as { contentHash?: `0x${string}`; metadataURI?: string; imageURI?: string; manifest?: unknown; error?: string };
  if (!response.ok || !result.contentHash || !result.metadataURI) throw new Error(result.error ?? "Unable to pin canonical artifact to IPFS.");
  return result as CanonicalArtifact;
}
