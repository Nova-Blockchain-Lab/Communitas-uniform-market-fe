import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Droplets,
  Wallet,
  Lock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { useAccount } from "wagmi";

import styles from "@/styles/Home.module.css";
import { AppProvider } from "@/context/AppContext";
import { ErrorBoundary, Button } from "@/components/ui";

/* ── Types ── */
type FaucetStatus = "idle" | "loading" | "success" | "error";

interface FaucetResult {
  hash?: string;
  amount?: string;
  explorer?: string;
  error?: string;
}

/* ── Animation configs ── */
const heroEntrance = { opacity: 0, y: 12 } as const;
const heroAnimate = { opacity: 1, y: 0 } as const;
const heroTransition = { duration: 0.5 } as const;

const cardEntrance = { opacity: 0, y: 20 } as const;
const cardAnimate = { opacity: 1, y: 0 } as const;
const cardTransition = { delay: 0.1 } as const;

const dropAnimation = {
  y: [0, -6, 0],
  scale: [1, 1.1, 1],
};
const dropTransition = {
  repeat: Infinity,
  duration: 2,
  ease: "easeInOut",
} as const;

const gridBgStyle: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
  `,
  backgroundSize: "60px 60px",
};

const mainPaddingStyle: React.CSSProperties = {
  paddingTop: "calc(var(--header-height) + 1.5rem)",
};

export default function Faucet() {
  const { address: connectedAddress } = useAccount();

  const [walletAddress, setWalletAddress] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const [result, setResult] = useState<FaucetResult>({});
  const [copied, setCopied] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill connected wallet
  useEffect(() => {
    if (connectedAddress && !walletAddress) {
      setWalletAddress(connectedAddress);
    }
  }, [connectedAddress, walletAddress]);

  // Copy hash
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyHash = useCallback(() => {
    if (result.hash) {
      navigator.clipboard.writeText(result.hash);
      setCopied(true);
    }
  }, [result.hash]);

  const handleRequest = useCallback(async () => {
    if (!walletAddress || !password) return;

    setStatus("loading");
    setResult({});

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setResult({ error: data.error || "Request failed" });
        return;
      }

      setStatus("success");
      setResult(data);
    } catch {
      setStatus("error");
      setResult({ error: "Network error. Please try again." });
    }
  }, [walletAddress, password]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setResult({});
  }, []);

  const isFormValid = walletAddress.length >= 42 && password.length > 0;

  return (
    <>
      <Head>
        <title>Faucet | COMMUNITAS</title>
        <meta
          name="description"
          content="Request testnet ETH on the Nova Cidade L3 chain"
        />
        <link rel="icon" href="/Logo-NovaCidade.svg" />
      </Head>

      <AppProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-[var(--color-bg-dark)] overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/25 via-transparent to-transparent" />
              <div className="absolute inset-0" style={gridBgStyle} />
            </div>

            {/* Header */}
            <header className={styles.header}>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm font-medium min-h-[44px]"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Market</span>
                </Link>

                <div className="w-px h-5 bg-white/[0.08]" />

                <Link href="/" className={styles.logo}>
                  <Image
                    src="/Logo-NovaCidade.svg"
                    alt="Nova Cidade"
                    height={24}
                    width={100}
                    priority
                  />
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <appkit-network-button />
                <appkit-button />
              </div>
            </header>

            {/* Main Content */}
            <main className="px-3 sm:px-4 pb-8" style={mainPaddingStyle}>
              <div className="w-full max-w-lg mx-auto">
                {/* Faucet Hero */}
                <motion.div
                  initial={heroEntrance}
                  animate={heroAnimate}
                  transition={heroTransition}
                  className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl"
                >
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={dropAnimation}
                      transition={dropTransition}
                      className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center"
                    >
                      <Droplets size={28} className="text-cyan-400" />
                    </motion.div>
                    <div className="text-center">
                      <h1 className="text-lg sm:text-xl font-bold text-white">
                        Nova Cidade Faucet
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Request testnet ETH on the L3 chain
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Card */}
                <motion.div
                  initial={cardEntrance}
                  animate={cardAnimate}
                  transition={cardTransition}
                  className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center gap-2.5">
                    <Droplets size={16} className="text-cyan-400" />
                    <span className="text-sm font-semibold text-white">
                      Request ETH
                    </span>
                    <span className="ml-auto text-[11px] text-gray-600 font-mono">
                      0.001 ETH / request
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <AnimatePresence mode="wait">
                      {(status === "idle" || status === "loading") && (
                        <motion.div
                          key="form"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Wallet Address */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
                              <Wallet size={14} />
                              Wallet Address
                            </label>
                            <div className="relative">
                              <input
                                ref={addressInputRef}
                                type="text"
                                value={walletAddress}
                                onChange={(e) =>
                                  setWalletAddress(e.target.value)
                                }
                                placeholder="0x..."
                                disabled={status === "loading"}
                                className="
                                  w-full px-4 py-3 min-h-[44px]
                                  bg-white/4
                                  border border-[var(--color-border)] rounded-xl
                                  text-sm text-white font-mono placeholder-[var(--color-text-muted)]
                                  transition-all duration-200
                                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                                  hover:border-[var(--color-border-hover)]
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                "
                              />
                              {connectedAddress && walletAddress !== connectedAddress && (
                                <button
                                  type="button"
                                  onClick={() => setWalletAddress(connectedAddress)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-[11px] font-medium hover:bg-cyan-500/20 transition-colors"
                                >
                                  Use wallet
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Password */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
                              <Lock size={14} />
                              Access Password
                            </label>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter faucet password"
                              disabled={status === "loading"}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && isFormValid && status !== "loading") {
                                  handleRequest();
                                }
                              }}
                              className="
                                w-full px-4 py-3 min-h-[44px]
                                bg-white/4
                                border border-[var(--color-border)] rounded-xl
                                text-sm text-white placeholder-[var(--color-text-muted)]
                                transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                                hover:border-[var(--color-border-hover)]
                                disabled:opacity-50 disabled:cursor-not-allowed
                              "
                            />
                          </div>

                          {/* Submit */}
                          <Button
                            fullWidth
                            loading={status === "loading"}
                            disabled={!isFormValid}
                            onClick={handleRequest}
                            icon={<Droplets size={16} />}
                            className="!bg-gradient-to-r !from-cyan-600 !to-cyan-500 hover:!from-cyan-500 hover:!to-cyan-400 !shadow-lg hover:!shadow-xl hover:!shadow-cyan-500/20 active:!from-cyan-700 active:!to-cyan-600"
                          >
                            {status === "loading"
                              ? "Sending ETH..."
                              : "Request Testnet ETH"}
                          </Button>

                          {/* Info */}
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-start gap-2.5">
                              <div className="w-1 h-1 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                                You can request{" "}
                                <span className="text-gray-400 font-medium">
                                  0.001 ETH
                                </span>{" "}
                                once per hour per address on the Nova Cidade L3
                                testnet.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {status === "success" && (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          {/* Success icon */}
                          <div className="flex flex-col items-center py-3">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                damping: 15,
                                delay: 0.1,
                              }}
                              className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3"
                            >
                              <CheckCircle2
                                size={32}
                                className="text-emerald-400"
                              />
                            </motion.div>
                            <h3 className="text-lg font-bold text-white">
                              ETH Sent!
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {result.amount} ETH is on its way to your wallet
                            </p>
                          </div>

                          {/* Tx details */}
                          {result.hash && (
                            <div className="p-3 sm:p-4 rounded-xl bg-white/4 space-y-3">
                              <p className="text-xs text-[var(--color-text-muted)]">
                                Transaction Hash
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs text-gray-300 font-mono truncate min-w-0">
                                  {result.hash}
                                </code>
                                <button
                                  onClick={copyHash}
                                  className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-[var(--color-text-muted)] hover:text-white transition-colors shrink-0"
                                  title="Copy hash"
                                >
                                  {copied ? (
                                    <Check size={14} />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                                {result.explorer && (
                                  <a
                                    href={result.explorer}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-[var(--color-text-muted)] hover:text-white transition-colors shrink-0"
                                    title="View on explorer"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          <Button
                            fullWidth
                            variant="secondary"
                            onClick={handleReset}
                          >
                            Request More
                          </Button>
                        </motion.div>
                      )}

                      {status === "error" && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          {/* Error icon */}
                          <div className="flex flex-col items-center py-3">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                damping: 15,
                                delay: 0.1,
                              }}
                              className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-3"
                            >
                              <XCircle size={32} className="text-red-400" />
                            </motion.div>
                            <h3 className="text-lg font-bold text-white">
                              Request Failed
                            </h3>
                            <p className="text-sm text-red-400/80 mt-1 text-center px-4">
                              {result.error}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              fullWidth
                              variant="secondary"
                              onClick={handleReset}
                            >
                              Back
                            </Button>
                            <Button fullWidth onClick={handleRequest}>
                              Try Again
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-xs text-gray-600">
                    Nova Cidade L3 Testnet Faucet
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    Powered by Arbitrum Orbit
                  </p>
                </div>
              </div>
            </main>
          </div>
        </ErrorBoundary>
      </AppProvider>
    </>
  );
}
