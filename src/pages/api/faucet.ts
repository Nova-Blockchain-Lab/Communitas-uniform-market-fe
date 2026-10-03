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
import { arbitrumSepolia } from "viem/chains";

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

/* ── Arbitrum Sepolia (parent chain, server-side) ──
 * Server-only var: a server request carries no Origin header, so the browser's
 * domain-restricted key would be rejected here. Unset: viem's public RPC. */
const arbSepoliaRpc = process.env.ARBITRUM_SEPOLIA_RPC_URL;
const arbitrumSepoliaChain = arbSepoliaRpc
  ? defineChain({
      ...arbitrumSepolia,
      rpcUrls: { default: { http: [arbSepoliaRpc] } },
    })
  : arbitrumSepolia;

const ARB_EXPLORER = "https://sepolia.arbiscan.io";
const NOVA_EXPLORER = "https://testnet.explorer.novaims.unl.pt";

/* ── Amounts ── */
// Nova Cidade L3: covers every market test (bids, asks, claims, clearing).
const FAUCET_AMOUNT_NOVA = "0.01";
// Arbitrum Sepolia: covers the two bridge-dependent tests (deposit + withdrawal
// claim). 0.001 ETH bridges across and ~0.0005 ETH covers gas on both legs.
const FAUCET_AMOUNT_ARB = "0.0015";

// Stop if the faucet wallet runs too low on either chain.
const MIN_BALANCE_NOVA = parseEther("0.02");
const MIN_BALANCE_ARB = parseEther("0.003");

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

  const to = address as `0x${string}`;

  try {
    const account = privateKeyToAccount(
      faucetPrivateKey.startsWith("0x")
        ? (faucetPrivateKey as `0x${string}`)
        : (`0x${faucetPrivateKey}` as `0x${string}`),
    );

    const novaTransport = http();
    const arbTransport = http();

    const novaPublic = createPublicClient({
      chain: novaCidade,
      transport: novaTransport,
    });
    const arbPublic = createPublicClient({
      chain: arbitrumSepoliaChain,
      transport: arbTransport,
    });

    /* ── Balance checks on both chains ── */
    const [novaBalance, arbBalance] = await Promise.all([
      novaPublic.getBalance({ address: account.address }),
      arbPublic.getBalance({ address: account.address }),
    ]);

    if (novaBalance < MIN_BALANCE_NOVA) {
      return res.status(503).json({
        error: `Faucet is low on Nova Cidade L3 (${formatEther(novaBalance)} ETH). Please contact the team.`,
      });
    }
    if (arbBalance < MIN_BALANCE_ARB) {
      return res.status(503).json({
        error: `Faucet is low on Arbitrum Sepolia (${formatEther(arbBalance)} ETH). Please contact the team.`,
      });
    }

    const novaWallet = createWalletClient({
      account,
      chain: novaCidade,
      transport: novaTransport,
    });
    const arbWallet = createWalletClient({
      account,
      chain: arbitrumSepoliaChain,
      transport: arbTransport,
    });

    /* ── Send on Nova Cidade L3 ── */
    const novaHash = await novaWallet.sendTransaction({
      to,
      value: parseEther(FAUCET_AMOUNT_NOVA),
    });

    /* ── Send on Arbitrum Sepolia ──
     * Arbitrum Sepolia's base fee fluctuates within seconds; the default
     * EIP-1559 estimate can land below the next block's base fee and revert
     * with "max fee per gas less than block base fee". Apply a 5x base-fee
     * buffer and a zero priority fee (the sequencer ignores tips). */
    const arbBlock = await arbPublic.getBlock({ blockTag: "latest" });
    const arbBaseFee = arbBlock.baseFeePerGas ?? 0n;
    const arbHash = await arbWallet.sendTransaction({
      to,
      value: parseEther(FAUCET_AMOUNT_ARB),
      maxPriorityFeePerGas: 0n,
      maxFeePerGas: arbBaseFee * 5n,
    });

    return res.status(200).json({
      // Legacy fields (Nova Cidade) kept for backwards compatibility.
      hash: novaHash,
      amount: FAUCET_AMOUNT_NOVA,
      explorer: `${NOVA_EXPLORER}/tx/${novaHash}`,
      // Per-chain breakdown.
      novaCidade: {
        chain: "Nova Cidade L3",
        amount: FAUCET_AMOUNT_NOVA,
        hash: novaHash,
        explorer: `${NOVA_EXPLORER}/tx/${novaHash}`,
      },
      arbitrumSepolia: {
        chain: "Arbitrum Sepolia",
        amount: FAUCET_AMOUNT_ARB,
        hash: arbHash,
        explorer: `${ARB_EXPLORER}/tx/${arbHash}`,
      },
    });
  } catch (err: any) {
    const message =
      err?.shortMessage || err?.message || "Transaction failed";
    return res.status(500).json({ error: message });
  }
}
