"use client";

import { useState } from "react";
import { encodePacked, formatEther, keccak256 } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useSignMessage, useWriteContract } from "wagmi";
import { MALKUTA_ENGINE_ABI } from "../lib/contract";
import { MALKUTA_ENGINE_ADDRESS, MALKUTA_ENGINE_CONFIGURED, BASE_MAINNET_CHAIN_ID } from "../lib/network";
import { pinCanonicalArtifact } from "../lib/pinning";
import { PROTOCOL_VERSION, type Analysis, type MappingMode } from "../lib/protocol";

export function MintAction({ sourceText, analysis, mode }: { sourceText: string; analysis: Analysis; mode: MappingMode }) {
  const [status, setStatus] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync, isPending } = useWriteContract();
  const readsEnabled = MALKUTA_ENGINE_CONFIGURED;

  const { data: epochId } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: MALKUTA_ENGINE_ABI,
    functionName: "currentEpochId",
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled: readsEnabled },
  });
  const { data: epoch } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: MALKUTA_ENGINE_ABI,
    functionName: "epochs",
    args: [epochId ?? BigInt(0)],
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled: readsEnabled && epochId !== undefined },
  });
  const { data: totalSupply } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: MALKUTA_ENGINE_ABI,
    functionName: "totalSupply",
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled: readsEnabled },
  });

  const mintPrice = epoch?.[0];
  const epochActive = epoch?.[1] === true;
  const supportedMode = mode !== "custom";
  const ready = MALKUTA_ENGINE_CONFIGURED && isConnected && chainId === BASE_MAINNET_CHAIN_ID && Boolean(address) && analysis.total > 0 && supportedMode && epochActive && mintPrice !== undefined && !isPending;

  async function mint() {
    if (!ready || !address || !publicClient || mintPrice === undefined) return;
    try {
      setStatus("PINNING CANONICAL SVG TO IPFS…");
      const artifact = await pinCanonicalArtifact(sourceText, analysis, mode, address, (message) => signMessageAsync({ message }));
      const tokenId = BigInt(keccak256(encodePacked(["address", "bytes32"], [address, artifact.contentHash])));
      setStatus("CONFIRM 0.01 ETH MINT IN WALLET…");
      const hash = await writeContractAsync({
        address: MALKUTA_ENGINE_ADDRESS,
        abi: MALKUTA_ENGINE_ABI,
        functionName: "mint",
        args: [tokenId, artifact.contentHash, PROTOCOL_VERSION, artifact.metadataURI],
        value: mintPrice,
        chainId: BASE_MAINNET_CHAIN_ID,
      });
      setStatus("MINT SUBMITTED · WAITING FOR BASE MAINNET…");
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`MINT COMPLETE · TOKEN #${tokenId.toString()} · ${hash.slice(0, 10)}…${hash.slice(-8)}`);
    } catch (error) {
      setStatus(error instanceof Error ? `MINT FAILED · ${error.message.split("\n")[0]}` : "MINT FAILED");
    }
  }

  const buttonLabel = !MALKUTA_ENGINE_CONFIGURED
    ? "MINTING CURRENTLY UNAVAILABLE"
    : !isConnected
      ? "CONNECT WALLET TO MINT"
      : chainId !== BASE_MAINNET_CHAIN_ID
        ? "SWITCH TO BASE MAINNET"
        : !supportedMode
          ? "CUSTOM MAP DIGEST REQUIRED"
          : !epochActive
            ? "EPOCH CLOSED"
            : isPending
              ? "MINTING…"
              : "MINT CANONICAL NFT";

  return (
    <div className="mint-action">
      <div><span>BASE MAINNET MINT</span><small>{mintPrice !== undefined ? `${formatEther(mintPrice)} ETH` : "— ETH"} · EPOCH {epochId?.toString() ?? "—"} · {totalSupply?.toString() ?? "—"} MINTED</small></div>
      <button type="button" onClick={mint} disabled={!ready}>{buttonLabel}<b>↗</b></button>
      {status && <output>{status}</output>}
    </div>
  );
}
