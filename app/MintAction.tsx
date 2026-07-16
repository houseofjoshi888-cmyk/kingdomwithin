"use client";

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { encodePacked, formatEther, keccak256 } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useSignMessage, useWriteContract } from "wagmi";
import { MALKUTA_ENGINE_ABI } from "../lib/contract";
import { MALKUTA_ENGINE_ADDRESS, MALKUTA_ENGINE_CONFIGURED, BASE_MAINNET_CHAIN_ID } from "../lib/network";
import { pinCanonicalArtifact, type CanonicalArtifact } from "../lib/pinning";
import { PROTOCOL_VERSION, type Analysis, type MappingMode } from "../lib/protocol";

type MintActionProps = {
  sourceText: string;
  analysis: Analysis;
  mode: MappingMode;
  onPreparationStatus: (status: string) => void;
};

export type MintActionHandle = { prepareCanonical: () => void };

export const MintAction = forwardRef<MintActionHandle, MintActionProps>(function MintAction({ sourceText, analysis, mode, onPreparationStatus }, ref) {
  const [status, setStatus] = useState("");
  const [artifact, setArtifact] = useState<CanonicalArtifact | null>(null);
  const [artifactKey, setArtifactKey] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const currentPreparationKey = useRef("");
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
  const preparationKey = useMemo(() => `${mode}\u0000${sourceText}\u0000${analysis.total}`, [analysis.total, mode, sourceText]);
  currentPreparationKey.current = preparationKey;
  const artifactReady = Boolean(artifact && artifactKey === preparationKey);
  const ready = MALKUTA_ENGINE_CONFIGURED && isConnected && chainId === BASE_MAINNET_CHAIN_ID && Boolean(address) && analysis.total > 0 && supportedMode && epochActive && mintPrice !== undefined && artifactReady && !isPreparing && !isPending;

  const prepareCanonical = useCallback(async () => {
    if (!supportedMode) {
      setStatus("CUSTOM MAP DIGEST REQUIRED BEFORE IPFS PINNING");
      onPreparationStatus("CUSTOM MAPS REQUIRE A RATIFIED MAPPING DIGEST");
      return;
    }
    if (!isConnected || !address) {
      setStatus("CONNECT WALLET, THEN SELECT GENERATE AGAIN TO PIN TO IPFS");
      onPreparationStatus("WALLET REQUIRED FOR SIGNED IPFS PINNING");
      return;
    }
    if (chainId !== BASE_MAINNET_CHAIN_ID) {
      setStatus("SWITCH WALLET TO BASE MAINNET, THEN GENERATE AGAIN");
      onPreparationStatus("BASE MAINNET REQUIRED FOR CANONICAL PINNING");
      return;
    }
    if (!analysis.total) return;
    if (artifact && artifactKey === preparationKey) {
      setStatus("CANONICAL ARTIFACT READY ON IPFS · MINT UNLOCKED");
      onPreparationStatus(`IPFS READY · ${artifact.metadataURI}`);
      return;
    }

    try {
      setIsPreparing(true);
      setStatus("SIGN THE CANONICAL UPLOAD AUTHORIZATION IN YOUR WALLET…");
      onPreparationStatus("AWAITING WALLET SIGNATURE FOR IPFS");
      const pinned = await pinCanonicalArtifact(sourceText, analysis, mode, address, (message) => signMessageAsync({ message }));
      if (currentPreparationKey.current !== preparationKey) {
        setStatus("INPUT CHANGED · GENERATE AGAIN TO PREPARE THE CURRENT MANDALA");
        onPreparationStatus("INPUT CHANGED DURING IPFS PREPARATION");
        return;
      }
      setArtifact(pinned);
      setArtifactKey(preparationKey);
      setStatus("CANONICAL ARTIFACT READY ON IPFS · MINT UNLOCKED");
      onPreparationStatus(`IPFS READY · ${pinned.metadataURI}`);
    } catch (error) {
      const message = error instanceof Error ? error.message.split("\n")[0] : "Canonical IPFS preparation failed.";
      setStatus(`IPFS PREPARATION FAILED · ${message}`);
      onPreparationStatus("IPFS PREPARATION FAILED · GENERATE TO RETRY");
    } finally {
      setIsPreparing(false);
    }
  }, [address, analysis, artifact, artifactKey, chainId, isConnected, mode, onPreparationStatus, preparationKey, signMessageAsync, sourceText, supportedMode]);

  useImperativeHandle(ref, () => ({ prepareCanonical }), [prepareCanonical]);

  async function mint() {
    if (!ready || !address || !publicClient || mintPrice === undefined || !artifact) return;
    try {
      const tokenId = BigInt(keccak256(encodePacked(["address", "bytes32"], [address, artifact.contentHash])));
      setStatus(`CONFIRM ${formatEther(mintPrice)} ETH MINT IN WALLET…`);
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
      ? "CONNECT WALLET, THEN GENERATE"
      : chainId !== BASE_MAINNET_CHAIN_ID
        ? "SWITCH TO BASE MAINNET"
        : !supportedMode
          ? "CUSTOM MAP DIGEST REQUIRED"
          : !epochActive
            ? "EPOCH CLOSED"
            : isPreparing
              ? "PINNING CANONICAL ARTIFACT…"
              : !artifactReady
                ? "GENERATE MANDALA TO ENABLE MINT"
            : isPending
              ? "MINTING…"
              : "MINT CANONICAL NFT";

  const visibleStatus = artifactKey && artifactKey !== preparationKey && status.includes("READY ON IPFS") ? "INPUT CHANGED · GENERATE THE CURRENT MANDALA TO PREPARE ITS IPFS ARTIFACT" : status;

  return (
    <div className="mint-action">
      <div><span>BASE MAINNET MINT</span><small>{mintPrice !== undefined ? `${formatEther(mintPrice)} ETH` : "— ETH"} · EPOCH {epochId?.toString() ?? "—"} · {totalSupply?.toString() ?? "—"} MINTED</small></div>
      <button type="button" onClick={mint} disabled={!ready}>{buttonLabel}<b>↗</b></button>
      {visibleStatus && <output>{visibleStatus}</output>}
    </div>
  );
});
