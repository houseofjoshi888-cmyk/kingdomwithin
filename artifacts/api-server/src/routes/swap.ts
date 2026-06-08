import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ZEROX_BASE_URL = "https://api.0x.org";
const ZEROX_API_KEY = process.env.ZEROX_API_KEY ?? "";
const HOUSE_WALLET = "0x6736d2eA9807297F0e56967361B9410854B86a5f";
const HOUSE_FEE_BPS = "100";

function getZeroxHeaders() {
  return {
    "Content-Type": "application/json",
    "0x-api-key": ZEROX_API_KEY,
    "0x-version": "v2",
  };
}

function missingKeyResponse(res: any) {
  return res.status(503).json({
    error: "api_key_missing",
    reason:
      "The 0x API key is not configured. Set the ZEROX_API_KEY environment variable to enable live swap quotes.",
  });
}

function createMockQuoteResponse(
  sellAmount: string,
  sellToken: string,
  buyToken: string,
) {
  return {
    sellAmount,
    buyAmount: sellAmount,
    sellToken,
    buyToken,
    minBuyAmount: sellAmount,
    liquidityAvailable: true,
    transaction: { to: HOUSE_WALLET, data: "0x", value: "0" },
  };
}

function createMockPriceResponse(sellAmount: string) {
  return {
    sellAmount,
    buyAmount: sellAmount,
    liquidityAvailable: true,
    totalNetworkFee: "0",
  };
}

router.post("/quote", async (req, res) => {
  if (!ZEROX_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      missingKeyResponse(res);
      return;
    }

    const { sellToken, buyToken, sellAmount } = req.body as {
      sellToken: string;
      buyToken: string;
      sellAmount: string;
      chainId: number;
      slippageBps?: number;
      taker?: string;
    };

    res.status(200).json(createMockQuoteResponse(sellAmount, sellToken, buyToken));
    return;
  }
  try {
    const { sellToken, buyToken, sellAmount, chainId, slippageBps, taker } = req.body as {
      sellToken: string;
      buyToken: string;
      sellAmount: string;
      chainId: number;
      slippageBps?: number;
      taker?: string;
    };

    const params = new URLSearchParams({
      chainId: String(chainId),
      sellToken,
      buyToken,
      sellAmount,
      slippageBps: String(slippageBps ?? 100),
      integratorFee: HOUSE_FEE_BPS,
      integratorFeeRecipient: HOUSE_WALLET,
    });
    if (taker) params.set("taker", taker);

    const url = `${ZEROX_BASE_URL}/swap/permit2/quote?${params.toString()}`;
    const upstream = await fetch(url, { headers: getZeroxHeaders() });
    const data = await upstream.json();

    if (upstream.status === 401 || upstream.status === 403) {
      res.status(503).json({
        error: "api_key_invalid",
        reason: "The 0x API key is invalid or has exceeded its quota. Check your ZEROX_API_KEY secret.",
      });
      return;
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    req.log.error(err, "Error fetching 0x quote");
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

router.post("/price", async (req, res) => {
  if (!ZEROX_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      missingKeyResponse(res);
      return;
    }

    const { sellAmount } = req.body as {
      sellToken: string;
      buyToken: string;
      sellAmount: string;
      chainId: number;
      slippageBps?: number;
      taker?: string;
    };
    res.status(200).json(createMockPriceResponse(sellAmount));
    return;
  }
  try {
    const { sellToken, buyToken, sellAmount, chainId, slippageBps, taker } = req.body as {
      sellToken: string;
      buyToken: string;
      sellAmount: string;
      chainId: number;
      slippageBps?: number;
      taker?: string;
    };

    const params = new URLSearchParams({
      chainId: String(chainId),
      sellToken,
      buyToken,
      sellAmount,
      slippageBps: String(slippageBps ?? 100),
    });
    if (taker) params.set("taker", taker);

    const url = `${ZEROX_BASE_URL}/swap/permit2/price?${params.toString()}`;
    const upstream = await fetch(url, { headers: getZeroxHeaders() });
    const data = await upstream.json();

    if (upstream.status === 401 || upstream.status === 403) {
      res.status(503).json({
        error: "api_key_invalid",
        reason: "The 0x API key is invalid or has exceeded its quota. Check your ZEROX_API_KEY secret.",
      });
      return;
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    req.log.error(err, "Error fetching 0x price");
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

router.post("/token-decimals", async (req, res) => {
  try {
    const { tokenAddress, chainId } = req.body as {
      tokenAddress: `0x${string}`;
      chainId: number;
    };

    const { createPublicClient, http, erc20Abi } = await import("viem");
    const { mainnet, base } = await import("viem/chains");

    const chainMap: Record<number, typeof mainnet | typeof base> = {
      1: mainnet,
      8453: base,
    };
    const chain = chainMap[chainId] ?? mainnet;

    const rpcMap: Record<number, string> = {
      1: "https://ethereum-rpc.publicnode.com",
      8453: "https://mainnet.base.org",
      25: "https://mainnet.cronos.org",
    };

    const client = createPublicClient({
      chain,
      transport: http(rpcMap[chainId] ?? rpcMap[1]!),
    });

    const decimals = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    });

    res.json({ decimals: Number(decimals) });
  } catch (err) {
    req.log.error(err, "Error fetching token decimals");
    res.status(500).json({ error: "Failed to fetch token decimals" });
  }
});

export default router;
