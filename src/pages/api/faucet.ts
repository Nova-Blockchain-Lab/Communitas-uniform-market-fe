import type { NextApiRequest, NextApiResponse } from "next";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

/* ── Nova Cidade L3 chain definition (server-side) ── */
const novaCidade = defineChain({
  id: 93735000855,
  name: "Nova Cidade Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.novaims.unl.pt/"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://testnet.explorer.novaims.unl.pt/",
    },
  },
});

const FAUCET_AMOUNT = "0.001"; // ETH per request
const MIN_FAUCET_BALANCE = parseEther("0.002"); // stop if faucet wallet runs too low

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, password } = req.body as {
    address?: string;
    password?: string;
  };

  /* ── Validate env ── */
  const faucetPassword = process.env.FAUCET_PASSWORD;
  const faucetPrivateKey = process.env.FAUCET_PRIVATE_KEY;

  if (!faucetPassword || !faucetPrivateKey) {
    return res.status(500).json({ error: "Faucet not configured" });
  }

  /* ── Validate inputs ── */
  if (!password || password !== faucetPassword) {
    return res.status(403).json({ error: "Invalid password" });
  }

  if (!address || !isAddress(address)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  /* ── Send ETH ── */
  try {
    const account = privateKeyToAccount(
      faucetPrivateKey.startsWith("0x")
        ? (faucetPrivateKey as `0x${string}`)
        : (`0x${faucetPrivateKey}` as `0x${string}`),
    );

    const transport = http();

    const publicClient = createPublicClient({ chain: novaCidade, transport });
    const balance = await publicClient.getBalance({ address: account.address });

    if (balance < MIN_FAUCET_BALANCE) {
      return res.status(503).json({
        error: `Faucet wallet is dry (${formatEther(balance)} ETH remaining). Please contact the team.`,
      });
    }

    const walletClient = createWalletClient({
      account,
      chain: novaCidade,
      transport,
    });

    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: parseEther(FAUCET_AMOUNT),
    });

    return res.status(200).json({
      hash,
      amount: FAUCET_AMOUNT,
      explorer: `https://testnet.explorer.novaims.unl.pt/tx/${hash}`,
    });
  } catch (err: any) {
    const message =
      err?.shortMessage || err?.message || "Transaction failed";
    return res.status(500).json({ error: message });
  }
}
