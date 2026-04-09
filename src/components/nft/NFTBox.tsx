import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  useAccount,
  useConfig,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Image as ImageIcon, RefreshCw, Plus, AlertCircle, Grid3X3, LayoutList } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { contractAddresses, defaultChain } from "@/config";
import { useMarketToast } from "@/hooks/useMarketToast";
import CommunitasNFTAbi from "@/../abi/CommunitasNFT.json";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import NFTCard from "@/components/nft/NFTCard";
import PendingNFTs from "@/components/nft/PendingNFTBox";
import { Card, CardHeader, CardSection, Button, EmptyState, SkeletonBlock } from "@/components/ui";
import type { TransactionStatus } from "@/components/ui";
import { TransactionModal } from "@/components/ui";
import { AbiFunction } from "viem";
import { NFTData } from "@/utils/executeMessageL2ToL1Helper";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = "grid" | "list";

/* ------------------------------------------------------------------ */
/*  Skeleton components                                                */
/* ------------------------------------------------------------------ */

/** Single NFT card skeleton used during loading */
const NFTCardSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
  >
    <SkeletonBlock height="0" className="!h-0 pt-[100%]" rounded="sm" />
    <div className="p-3 space-y-2">
      <SkeletonBlock height="0.875rem" width="60%" rounded="md" />
      <SkeletonBlock height="0.75rem" width="80%" rounded="md" />
      <SkeletonBlock height="2rem" rounded="lg" />
    </div>
  </motion.div>
);

/** List-view skeleton row */
const NFTListSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04 }}
    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3"
  >
    <SkeletonBlock width="3.5rem" height="3.5rem" rounded="lg" />
    <div className="flex-1 space-y-2">
      <SkeletonBlock height="0.875rem" width="40%" rounded="md" />
      <SkeletonBlock height="0.75rem" width="65%" rounded="md" />
    </div>
    <SkeletonBlock width="5rem" height="2rem" rounded="lg" />
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const NFTBox: React.FC = () => {
  const { address, isConnected, chainId, chain } = useAccount();
  const { chains } = useConfig();
  const { switchChain } = useSwitchChain();
  const toast = useMarketToast();

  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  // Get NFT contract address based on chain
  const nftContractAddress = useMemo(
    () =>
      isConnected && chainId && chains.map((c) => c.id).includes(chainId)
        ? (contractAddresses[chainId]?.["CommunitasNFT"]?.["General"] as `0x${string}`)
        : undefined,
    [isConnected, chainId, chains]
  );

  const isL2 = chainId === defaultChain.id;
  const otherChainId = useMemo(
    () => chains.find((c) => c.id !== chainId)?.id,
    [chains, chainId]
  );

  // ---- Contract reads ------------------------------------------------

  const {
    data: nftsBalance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract(
    nftContractAddress
      ? {
          address: nftContractAddress,
          abi: CommunitasNFTAbi.abi,
          functionName: "balanceOf",
          args: [address],
        }
      : undefined
  );

  const tokenIdsConfig = useMemo(
    () =>
      nftsBalance
        ? Array.from({ length: Number(nftsBalance) }, (_, i) => ({
            abi: CommunitasNFTAbi.abi as AbiFunction[],
            address: nftContractAddress,
            functionName: "tokenOfOwnerByIndex",
            args: [address, i],
          }))
        : [],
    [nftsBalance, nftContractAddress, address]
  );

  const {
    data: tokenIdsOwned,
    isLoading: isTokenIdsLoading,
    refetch: refetchTokenIds,
  } = useReadContracts({ contracts: tokenIdsConfig });

  const tokenUrisConfig = useMemo(
    () =>
      tokenIdsOwned
        ? tokenIdsOwned
            .filter((item) => item.result != null)
            .map((item) => ({
              abi: CommunitasNFTAbi.abi as AbiFunction[],
              address: nftContractAddress,
              functionName: "tokenURI",
              args: [Number(item.result)],
            }))
        : [],
    [tokenIdsOwned, nftContractAddress]
  );

  const {
    data: tokenUris,
    isLoading: isTokenUrisLoading,
    refetch: refetchTokenUris,
  } = useReadContracts({ contracts: tokenUrisConfig });

  // ---- Mint NFT -------------------------------------------------------

  const {
    data: hash,
    writeContract: mintNFT,
    isPending: isMinting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  // Update modal status based on transaction state
  useEffect(() => {
    if (isMinting) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
      refetchAll();
    } else if (writeError || confirmError) {
      setTxStatus("error");
      const err = writeError || confirmError;
      if (err) {
        let message = err.message;
        if (message.includes("User rejected") || message.includes("user rejected")) {
          message = "Transaction was rejected in your wallet";
        } else if (message.includes("insufficient funds")) {
          message = "Insufficient funds for this transaction";
        } else if (message.length > 150) {
          message = message.substring(0, 150) + "...";
        }
        setTxError(message);
      }
    }
  }, [isMinting, isConfirming, isConfirmed, writeError, confirmError]);

  // ---- Handlers -------------------------------------------------------

  const handleMint = useCallback(() => {
    if (!nftContractAddress) return;
    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    mintNFT({
      abi: CommunitasNFTAbi.abi,
      address: nftContractAddress,
      functionName: "mint",
    });
  }, [nftContractAddress, mintNFT, resetWrite]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  }, []);

  const handleSwitchChain = useCallback(() => {
    if (otherChainId) {
      switchChain({ chainId: otherChainId });
    }
  }, [otherChainId, switchChain]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

  const fetchNFTData = useCallback(async () => {
    if (!tokenIdsOwned || !tokenUris || tokenIdsOwned.length !== tokenUris.length) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    try {
      const tokenData = await Promise.all(
        tokenUris.map(async (tokenUri, i) => {
          if (!tokenUri.result) return null;
          const tokenId = String(tokenIdsOwned[i].result);
          try {
            const response = await fetch(tokenUri.result.toString());
            const metadata = await response.json();
            return {
              tokenId,
              name: metadata.name || `NFT #${tokenId}`,
              image: metadata.image || "",
              description: metadata.description || "",
            } as NFTData;
          } catch {
            return {
              tokenId,
              name: `NFT #${tokenId}`,
              image: "",
              description: "",
            } as NFTData;
          }
        })
      );
      setNfts(tokenData.filter(Boolean) as NFTData[]);
    } catch (error) {
      console.error("Error fetching NFT data:", error);
      toast.error("Error Loading NFTs", "Unable to fetch NFT metadata. Please try again.");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenIdsOwned, tokenUris]);

  const refetchAll = useCallback(async () => {
    await refetchBalance();
  }, [refetchBalance]);

  // ---- Effects --------------------------------------------------------

  useEffect(() => {
    if (isConfirmed) {
      toast.success("NFT Minted!", "Your new NFT has been minted successfully.");
      refetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, refetchAll]);

  useEffect(() => {
    if (isConnected && nftContractAddress) {
      refetchBalance();
    }
  }, [isConnected, address, chainId, nftContractAddress, refetchBalance]);

  useEffect(() => {
    if (nftsBalance) refetchTokenIds();
  }, [nftsBalance, refetchTokenIds]);

  useEffect(() => {
    if (tokenIdsOwned) refetchTokenUris();
  }, [tokenIdsOwned, refetchTokenUris]);

  useEffect(() => {
    if (tokenUris) fetchNFTData();
  }, [tokenUris, fetchNFTData]);

  useEffect(() => {
    setIsLoading(isBalanceLoading || isTokenIdsLoading || isTokenUrisLoading);
  }, [isBalanceLoading, isTokenIdsLoading, isTokenUrisLoading]);

  // ---- Derived data ---------------------------------------------------

  const needsConnection = !isConnected || !nftContractAddress;
  const nftCount = nftsBalance ? Number(nftsBalance) : 0;

  /** Sorted NFTs -- newest (highest tokenId) first */
  const sortedNfts = useMemo(
    () => [...nfts].sort((a, b) => Number(b.tokenId) - Number(a.tokenId)),
    [nfts]
  );

  // Skeleton count adapts to expected items (min 4 for first load)
  const skeletonCount = useMemo(
    () => Math.max(nftCount || 4, 4),
    [nftCount]
  );

  // ---- Render helpers -------------------------------------------------

  /** Grid-view class string -- responsive columns */
  const gridClasses =
    "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4";

  /** List-view class string */
  const listClasses = "flex flex-col gap-3";

  // ---- Render ---------------------------------------------------------

  return (
    <div className="w-full max-w-5xl space-y-6">
      <Card padding="lg">
        <CardHeader
          title="Your NFTs"
          subtitle={`${nftCount} item${nftCount !== 1 ? "s" : ""} on ${chain?.name || "Network"}`}
          icon={<ImageIcon size={20} />}
          action={
            !needsConnection && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* View toggle */}
                <button
                  onClick={toggleViewMode}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                  aria-label={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                >
                  {viewMode === "grid" ? <LayoutList size={16} /> : <Grid3X3 size={16} />}
                </button>
                {/* Refresh */}
                <button
                  onClick={refetchAll}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Refresh"
                  aria-label="Refresh NFTs"
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
            )
          }
        />

        {needsConnection ? (
          <div className="py-8">
            <ConnectAndSwitchNetworkButton />
          </div>
        ) : (
          <>
            {/* Chain Switcher -- segmented control */}
            <div className="flex items-center p-1 bg-white/5 rounded-xl mb-6">
              <button
                onClick={() => {
                  if (isL2) handleSwitchChain();
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                  ${
                    !isL2
                      ? "bg-[var(--color-primary-500)] text-white shadow-md"
                      : "text-gray-400 hover:text-white active:bg-white/5"
                  }
                `}
              >
                <span className="truncate">L1 (Arbitrum)</span>
                <span
                  className={`
                  inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold shrink-0
                  ${!isL2 ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"}
                `}
                >
                  {!isL2 ? nftCount : "\u2014"}
                </span>
              </button>
              <button
                onClick={() => {
                  if (!isL2) handleSwitchChain();
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                  ${
                    isL2
                      ? "bg-[var(--color-primary-500)] text-white shadow-md"
                      : "text-gray-400 hover:text-white active:bg-white/5"
                  }
                `}
              >
                <span className="truncate">L2 (Nova Cidade)</span>
                <span
                  className={`
                  inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold shrink-0
                  ${isL2 ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"}
                `}
                >
                  {isL2 ? nftCount : "\u2014"}
                </span>
              </button>
            </div>

            {/* Mint Button (L2 only) */}
            {isL2 && (
              <div className="flex justify-center mb-6">
                <Button
                  variant="primary"
                  onClick={handleMint}
                  loading={isMinting}
                  disabled={isMinting}
                  icon={<Plus size={18} />}
                >
                  Mint Test NFT
                </Button>
              </div>
            )}

            {/* NFT Gallery */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                /* ---------- Loading skeletons ---------- */
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <CardSection title="Loading...">
                    {viewMode === "grid" ? (
                      <div className={gridClasses}>
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                          <NFTCardSkeleton key={`skel-${i}`} index={i} />
                        ))}
                      </div>
                    ) : (
                      <div className={listClasses}>
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                          <NFTListSkeleton key={`skel-list-${i}`} index={i} />
                        ))}
                      </div>
                    )}
                  </CardSection>
                </motion.div>
              ) : nftCount === 0 ? (
                /* ---------- Empty state ---------- */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <EmptyState
                    icon={<AlertCircle size={24} className="text-gray-500" />}
                    title="No NFTs Found"
                    subtitle={`You do not have any NFTs on ${chain?.name || "this network"}.${
                      isL2 ? " Mint a test NFT to get started!" : ""
                    }`}
                    action={
                      isL2 ? (
                        <Button
                          variant="primary"
                          onClick={handleMint}
                          loading={isMinting}
                          disabled={isMinting}
                          icon={<Plus size={16} />}
                        >
                          Mint Test NFT
                        </Button>
                      ) : undefined
                    }
                  />
                </motion.div>
              ) : (
                /* ---------- NFT gallery ---------- */
                <motion.div
                  key={`gallery-${viewMode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <CardSection
                    title={`${isL2 ? "Nova Cidade" : "Arbitrum"} Collection`}
                  >
                    <div className={viewMode === "grid" ? gridClasses : listClasses}>
                      {sortedNfts.map((nft, index) => (
                        <motion.div
                          key={nft.tokenId}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: Math.min(index * 0.06, 0.5),
                            duration: 0.3,
                            ease: "easeOut",
                          }}
                          layout
                        >
                          <NFTCard
                            isL3={isL2}
                            nft={nft}
                            refetchNFTs={refetchAll}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardSection>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        status={txStatus}
        error={txError}
        hash={hash}
      />

      {/* Pending NFTs Section */}
      {isConnected && <PendingNFTs refetchNFTs={refetchAll} />}
    </div>
  );
};

export default NFTBox;
