import { NextResponse } from "next/server";
import { createPublicClient, getAddress, http, keccak256, toBytes } from "viem";
import { base } from "viem/chains";
import { aggregateEpoch, type IndexedMandala } from "../../../lib/epoch";
import { MALKUTA_ENGINE_ABI } from "../../../lib/contract";
import { BASE_MAINNET_RPC_URL, MALKUTA_ENGINE_ADDRESS, MALKUTA_ENGINE_CONFIGURED, MALKUTA_ENGINE_DEPLOYMENT_BLOCK } from "../../../lib/network";

export const runtime = "nodejs";
export const maxDuration = 60;

const BLOCKSCOUT_API_URL = "https://base.blockscout.com/api/v2";
const MANDALA_MINTED_METHOD_ID = "817ffea9";
const ATTRIBUTE_NAMES = {
  source: "Source Text",
  signature: "Numerical Signature",
  symmetry: "Symmetry (Petals)",
  rotation: "Rotation (Phase)",
  scale: "Scale (Phi)",
  hue: "Color (Hue)",
  mapping: "Mapping Mode",
} as const;

type Attribute = { trait_type?: string; value?: string | number };
type Manifest = { image?: string; attributes?: Attribute[] };
type CollectionMandala = IndexedMandala & { verificationStatus: "verified" | "metadata_unavailable"; epochId: string; protocolVersion: string; contentHash: string };
type MintLog = {
  args: { tokenId?: bigint; epochId?: bigint; recipient?: `0x${string}`; contentHash?: `0x${string}`; protocolVersion?: string; metadataURI?: string; price?: bigint };
  blockNumber: bigint | null;
  logIndex: number | null;
  transactionHash: `0x${string}` | null;
};
type BlockscoutParameter = { name: string; value: string };
type BlockscoutLog = {
  block_number: number;
  index: number;
  transaction_hash: `0x${string}`;
  decoded?: { method_id?: string; parameters?: BlockscoutParameter[] };
};
type BlockscoutLogsResponse = {
  items?: BlockscoutLog[];
  next_page_params?: Record<string, string | number> | null;
};
const CONFIRMATION_BLOCKS = BigInt(5);

function ipfsUrls(uri: string) {
  if (!uri.startsWith("ipfs://")) throw new Error("Only canonical IPFS metadata is indexed");
  const path = uri.slice(7);
  const gateways = Array.from(new Set([
    process.env.IPFS_GATEWAY_URL,
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
  ].filter((gateway): gateway is string => Boolean(gateway)).map((gateway) => gateway.replace(/\/+$/, ""))));
  return gateways.map((gateway) => `${gateway}/${path}`);
}

function attribute(manifest: Manifest, name: string) {
  return manifest.attributes?.find((item) => item.trait_type === name)?.value;
}

function numericAttribute(manifest: Manifest, name: string) {
  const value = Number(attribute(manifest, name));
  return Number.isFinite(value) ? value : 0;
}

async function resolveManifest(metadataURI: string, expectedHash: `0x${string}`) {
  let lastError: unknown = new Error("Manifest unavailable");
  for (const url of ipfsUrls(metadataURI)) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000), next: { revalidate: 3600 } });
      if (!response.ok) throw new Error(`Gateway returned ${response.status}`);
      const raw = await response.text();
      if (keccak256(toBytes(raw)).toLowerCase() !== expectedHash.toLowerCase()) throw new Error("Manifest hash mismatch");
      return JSON.parse(raw) as Manifest;
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

async function mapConcurrent<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R | null>) {
  const output: Array<R | null> = Array(items.length).fill(null);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try { output[index] = await mapper(items[index]); } catch { output[index] = null; }
    }
  }));
  return output.filter((item): item is R => item !== null);
}

async function readMintLogs(contractTotalSupply: bigint, epochId: bigint, allEpochs: boolean) {
  const logs: MintLog[] = [];
  let pageUrl: string | null = `${BLOCKSCOUT_API_URL}/addresses/${MALKUTA_ENGINE_ADDRESS}/logs`;
  let scannedPages = 0;

  while (pageUrl) {
    const response = await fetch(pageUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Blockscout returned ${response.status}`);
    const page = await response.json() as BlockscoutLogsResponse;
    scannedPages += 1;

    for (const item of page.items ?? []) {
      if (item.decoded?.method_id?.toLowerCase() !== MANDALA_MINTED_METHOD_ID) continue;
      const values = new Map((item.decoded.parameters ?? []).map((parameter) => [parameter.name, parameter.value]));
      const logEpochId = values.get("epochId");
      if (!allEpochs && logEpochId !== epochId.toString()) continue;
      const tokenId = values.get("tokenId");
      const recipient = values.get("recipient");
      const contentHash = values.get("contentHash");
      const protocolVersion = values.get("protocolVersion");
      const metadataURI = values.get("metadataURI");
      const price = values.get("price");
      if (!tokenId || !recipient || !contentHash || !metadataURI) continue;
      logs.push({
        args: {
          tokenId: BigInt(tokenId),
          epochId: BigInt(logEpochId ?? "0"),
          recipient: recipient as `0x${string}`,
          contentHash: contentHash as `0x${string}`,
          protocolVersion: protocolVersion ?? "",
          metadataURI,
          price: BigInt(price ?? "0"),
        },
        blockNumber: BigInt(item.block_number),
        logIndex: item.index,
        transactionHash: item.transaction_hash,
      });
    }

    if (allEpochs && BigInt(logs.length) >= contractTotalSupply) break;
    if (!page.next_page_params) break;
    const nextUrl = new URL(`${BLOCKSCOUT_API_URL}/addresses/${MALKUTA_ENGINE_ADDRESS}/logs`);
    Object.entries(page.next_page_params).forEach(([key, value]) => nextUrl.searchParams.set(key, String(value)));
    pageUrl = nextUrl.toString();
  }

  return { logs, scannedPages };
}

export async function GET(request: Request) {
  const deploymentBlock = MALKUTA_ENGINE_DEPLOYMENT_BLOCK;
  if (!MALKUTA_ENGINE_CONFIGURED || !deploymentBlock || !/^\d+$/.test(deploymentBlock)) {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  try {
    const rpcUrl = process.env.BASE_MAINNET_RPC_URL?.trim() || BASE_MAINNET_RPC_URL;
    const client = createPublicClient({ chain: base, transport: http(rpcUrl, { retryCount: 2, timeout: 12_000 }) });
    const searchParams = new URL(request.url).searchParams;
    const requestedEpoch = searchParams.get("epoch");
    const allEpochs = searchParams.get("scope") === "all";
    const currentEpochId = await client.readContract({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "currentEpochId" });
    const contractTotalSupply = await client.readContract({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "totalSupply" });
    const epochId = requestedEpoch && /^\d+$/.test(requestedEpoch) ? BigInt(requestedEpoch) : currentEpochId;
    const epoch = await client.readContract({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "epochs", args: [epochId] });
    const latestBlock = await client.getBlockNumber();
    const indexedBlock = latestBlock > CONFIRMATION_BLOCKS ? latestBlock - CONFIRMATION_BLOCKS : latestBlock;
    const { logs, scannedPages } = await readMintLogs(contractTotalSupply, epochId, allEpochs);
    logs.sort((a, b) => Number((a.blockNumber ?? BigInt(0)) - (b.blockNumber ?? BigInt(0))) || (a.logIndex ?? 0) - (b.logIndex ?? 0));

    const blockNumbers = Array.from(new Set(logs.map((log) => log.blockNumber?.toString()).filter(Boolean))) as string[];
    const timestamps = new Map<string, number>();
    await mapConcurrent(blockNumbers, 8, async (number) => {
      const block = await client.getBlock({ blockNumber: BigInt(number) });
      timestamps.set(number, Number(block.timestamp));
      return number;
    });

    const mandalas = await mapConcurrent(logs, 8, async (log): Promise<CollectionMandala | null> => {
      if (!log.args.metadataURI || !log.args.contentHash || log.args.tokenId === undefined || !log.args.recipient || !log.transactionHash) return null;
      let manifest: Manifest = {};
      let verificationStatus: CollectionMandala["verificationStatus"] = "verified";
      try { manifest = await resolveManifest(log.args.metadataURI, log.args.contentHash); }
      catch { verificationStatus = "metadata_unavailable"; }
      return {
        tokenId: log.args.tokenId.toString(),
        owner: getAddress(log.args.recipient),
        transactionHash: log.transactionHash,
        timestamp: timestamps.get(log.blockNumber?.toString() ?? "") ?? 0,
        sourceText: String(attribute(manifest, ATTRIBUTE_NAMES.source) ?? ""),
        mappingMode: String(attribute(manifest, ATTRIBUTE_NAMES.mapping) ?? ""),
        metadataURI: log.args.metadataURI,
        imageURI: manifest.image ?? "",
        numericalSignature: numericAttribute(manifest, ATTRIBUTE_NAMES.signature),
        symmetry: numericAttribute(manifest, ATTRIBUTE_NAMES.symmetry),
        rotation: numericAttribute(manifest, ATTRIBUTE_NAMES.rotation),
        scale: numericAttribute(manifest, ATTRIBUTE_NAMES.scale),
        hue: numericAttribute(manifest, ATTRIBUTE_NAMES.hue),
        priceWei: (log.args.price ?? BigInt(0)).toString(),
        verificationStatus,
        epochId: log.args.epochId?.toString() ?? "0",
        protocolVersion: log.args.protocolVersion ?? "",
        contentHash: log.args.contentHash,
      };
    });
    const verifiedMandalas = mandalas.filter((mandala) => mandala.verificationStatus === "verified");

    return NextResponse.json({
      status: "ready",
      chainId: base.id,
      indexedThroughBlock: indexedBlock.toString(),
      epoch: { id: epochId.toString(), name: epoch[2], mintPriceWei: epoch[0].toString(), active: epoch[1] },
      stats: aggregateEpoch(verifiedMandalas),
      latestMints: mandalas.slice().reverse(),
      collectionTotal: mandalas.length,
      contractTotalSupply: contractTotalSupply.toString(),
      verifiedTotal: verifiedMandalas.length,
      rejectedManifests: mandalas.length - verifiedMandalas.length,
      indexHealth: { scannedPages, confirmations: Number(CONFIRMATION_BLOCKS), rpcEndpoints: 1, scope: allEpochs ? "all" : `epoch_${epochId}` },
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800, stale-if-error=86400" } });
  } catch (error) {
    console.error("Epoch indexer failed", error instanceof Error ? error.message : "Unknown indexer error");
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
