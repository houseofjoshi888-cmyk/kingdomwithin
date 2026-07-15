import { NextResponse } from "next/server";
import { createPublicClient, getAddress, http, keccak256, parseAbiItem, toBytes } from "viem";
import { base } from "viem/chains";
import { aggregateEpoch, type IndexedMandala } from "../../../lib/epoch";
import { MALKUTA_ENGINE_ABI } from "../../../lib/contract";
import { MALKUTA_ENGINE_ADDRESS, MALKUTA_ENGINE_CONFIGURED } from "../../../lib/network";

export const runtime = "edge";

const mintEvent = parseAbiItem("event MandalaMinted(uint256 indexed tokenId, uint256 indexed epochId, address indexed recipient, address operator, bytes32 contentHash, string protocolVersion, string metadataURI, uint256 price)");
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

function ipfsUrl(uri: string) {
  const gateway = (process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs/").replace(/\/+$/, "");
  return uri.startsWith("ipfs://") ? `${gateway}/${uri.slice(7)}` : uri;
}

function attribute(manifest: Manifest, name: string) {
  return manifest.attributes?.find((item) => item.trait_type === name)?.value;
}

function numericAttribute(manifest: Manifest, name: string) {
  const value = Number(attribute(manifest, name));
  return Number.isFinite(value) ? value : 0;
}

async function resolveManifest(metadataURI: string, expectedHash: `0x${string}`) {
  const response = await fetch(ipfsUrl(metadataURI), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Manifest unavailable");
  const raw = await response.text();
  if (keccak256(toBytes(raw)).toLowerCase() !== expectedHash.toLowerCase()) throw new Error("Manifest hash mismatch");
  return JSON.parse(raw) as Manifest;
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

export async function GET(request: Request) {
  const deploymentBlock = process.env.MALKUTA_DEPLOYMENT_BLOCK;
  if (!MALKUTA_ENGINE_CONFIGURED || !deploymentBlock || !/^\d+$/.test(deploymentBlock)) {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  try {
    const client = createPublicClient({ chain: base, transport: http(process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org") });
    const requestedEpoch = new URL(request.url).searchParams.get("epoch");
    const currentEpochId = await client.readContract({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "currentEpochId" });
    const epochId = requestedEpoch && /^\d+$/.test(requestedEpoch) ? BigInt(requestedEpoch) : currentEpochId;
    const epoch = await client.readContract({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "epochs", args: [epochId] });
    const latestBlock = await client.getBlockNumber();
    const chunkSize = BigInt(10_000);
    const logs = [];

    for (let fromBlock = BigInt(deploymentBlock); fromBlock <= latestBlock; fromBlock += chunkSize) {
      const toBlock = fromBlock + chunkSize - BigInt(1) > latestBlock ? latestBlock : fromBlock + chunkSize - BigInt(1);
      logs.push(...await client.getLogs({ address: MALKUTA_ENGINE_ADDRESS, event: mintEvent, args: { epochId }, fromBlock, toBlock }));
    }

    const blockNumbers = Array.from(new Set(logs.map((log) => log.blockNumber?.toString()).filter(Boolean))) as string[];
    const timestamps = new Map<string, number>();
    await mapConcurrent(blockNumbers, 8, async (number) => {
      const block = await client.getBlock({ blockNumber: BigInt(number) });
      timestamps.set(number, Number(block.timestamp));
      return number;
    });

    const mandalas = await mapConcurrent(logs, 8, async (log): Promise<IndexedMandala | null> => {
      if (!log.args.metadataURI || !log.args.contentHash || log.args.tokenId === undefined || !log.args.recipient) return null;
      const manifest = await resolveManifest(log.args.metadataURI, log.args.contentHash);
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
      };
    });

    return NextResponse.json({
      status: "ready",
      chainId: base.id,
      indexedThroughBlock: latestBlock.toString(),
      epoch: { id: epochId.toString(), name: epoch[2], mintPriceWei: epoch[0].toString(), active: epoch[1] },
      stats: aggregateEpoch(mandalas),
      latestMints: mandalas.slice(-24).reverse(),
      rejectedManifests: logs.length - mandalas.length,
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
