

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { tokenAddress, chainId } = req.body as { tokenAddress: `0x${string}`; chainId: number };
    const { createPublicClient, http, erc20Abi } = await import("viem");
    const { mainnet, base } = await import("viem/chains");
    const chainMap: Record<number, typeof mainnet | typeof base> = { 1: mainnet, 8453: base };
    const rpcMap: Record<number, string> = {
      1: "https://ethereum-rpc.publicnode.com",
      8453: "https://mainnet.base.org",
    };
    const chain = chainMap[chainId] ?? mainnet;
    const client = createPublicClient({ chain, transport: http(rpcMap[chainId] ?? rpcMap[1]!) });
    const decimals = await client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" });
    return res.json({ decimals: Number(decimals) });
  } catch {
    return res.status(500).json({ error: "Failed to fetch token decimals" });
  }
}
