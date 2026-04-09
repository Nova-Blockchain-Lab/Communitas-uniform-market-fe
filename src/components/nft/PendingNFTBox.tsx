import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChildToParentMessageStatus } from "@arbitrum/sdk";
import NFTCard from "@/components/nft/NFTCard";
import { getPendingOutgoingNftsFromEventLogs, NFTDataWithStatus } from "@/utils/executeMessageL2ToL1Helper";
import { useAppContext } from "@/context/AppContext";
import { useAccount } from "wagmi";
import { Badge, Card, CardHeader, EmptyState, SkeletonBlock, SkeletonLine } from "@/components/ui";

interface PendingNFTsBoxProps {
  refetchNFTs: () => {};
}

/** Map ChildToParentMessageStatus to human-readable labels and progress % */
function getBridgeProgress(state: ChildToParentMessageStatus): { label: string; pct: number } {
  switch (state) {
    case ChildToParentMessageStatus.UNCONFIRMED:
      return { label: "Awaiting confirmation", pct: 33 };
    case ChildToParentMessageStatus.CONFIRMED:
      return { label: "Ready to execute", pct: 66 };
    case ChildToParentMessageStatus.EXECUTED:
      return { label: "Completed", pct: 100 };
    default:
      return { label: "Processing", pct: 15 };
  }
}

/** Check if NFT needs urgent action (CONFIRMED = ready to execute) */
function needsAction(nft: NFTDataWithStatus): boolean {
  return nft.state === ChildToParentMessageStatus.CONFIRMED;
}

/** Skeleton placeholder for a single NFT card slot */
const NFTCardSkeleton: React.FC = () => (
  <div className="flex flex-col gap-2">
    <SkeletonBlock height="14rem" rounded="xl" />
    <div className="px-1 space-y-1.5">
      <SkeletonLine width="60%" height="0.625rem" />
      <SkeletonLine width="100%" height="0.25rem" />
    </div>
  </div>
);

/** Grid of skeleton cards shown while loading */
const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <NFTCardSkeleton key={i} />
    ))}
  </div>
);

/** Progress bar beneath each NFT card */
const BridgeProgressIndicator: React.FC<{
  nft: NFTDataWithStatus;
  index: number;
}> = React.memo(({ nft, index }) => {
  const progress = getBridgeProgress(nft.state);
  const isActionable = needsAction(nft);

  return (
    <div className="mt-2 px-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] sm:text-xs text-gray-500 truncate mr-2">{progress.label}</span>
        <Badge
          variant={isActionable ? "success" : "warning"}
          size="sm"
          pulse={isActionable}
        >
          {progress.pct}%
        </Badge>
      </div>
      <div className="h-1.5 sm:h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isActionable ? "bg-emerald-500" : "bg-amber-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress.pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
        />
      </div>
    </div>
  );
});
BridgeProgressIndicator.displayName = "BridgeProgressIndicator";

const PendingNFTs: React.FC<PendingNFTsBoxProps> = ({ refetchNFTs }) => {
  const { l1Provider, l2Provider } = useAppContext();
  const { address } = useAccount();

  const [pendingNFTs, setPendingNFTs] = useState<NFTDataWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const fetchPendingNFTs = useCallback(async () => {
    if (!l1Provider || !l2Provider || !address) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const nfts = await getPendingOutgoingNftsFromEventLogs(address, l1Provider, l2Provider);
      setPendingNFTs(nfts);
    } catch (error) {
      console.error("Error fetching pending NFTs:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [address, l1Provider, l2Provider]);

  const refetchAllNfts = useCallback(async () => {
    refetchNFTs();
    fetchPendingNFTs();
  }, [refetchNFTs, fetchPendingNFTs]);

  useEffect(() => {
    fetchPendingNFTs();
  }, [fetchPendingNFTs]);

  const actionableCount = useMemo(
    () => pendingNFTs.filter(needsAction).length,
    [pendingNFTs],
  );

  const subtitle = useMemo(() => {
    if (pendingNFTs.length === 0) return undefined;
    return `${pendingNFTs.length} NFT${pendingNFTs.length !== 1 ? "s" : ""} awaiting confirmation`;
  }, [pendingNFTs.length]);

  // --- Loading state: show skeleton card within the section ---
  if (isLoading) {
    return (
      <Card padding="lg">
        <CardHeader
          title="Pending NFTs"
          icon={<Clock size={20} className="text-amber-400" />}
        />
        <LoadingSkeleton />
      </Card>
    );
  }

  // --- Error state ---
  if (hasError && pendingNFTs.length === 0) {
    return (
      <Card padding="lg">
        <CardHeader
          title="Pending NFTs"
          icon={<Clock size={20} className="text-amber-400" />}
        />
        <EmptyState
          icon={<AlertTriangle size={22} className="text-amber-400" />}
          iconColorClass="bg-amber-500/10"
          title="Could not load pending NFTs"
          subtitle="Check your connection and try again."
        />
      </Card>
    );
  }

  // --- Empty state ---
  if (pendingNFTs.length === 0) {
    return null;
  }

  return (
    <Card padding="lg" className="overflow-hidden">
      <CardHeader
        title="Pending NFTs"
        subtitle={subtitle}
        icon={<Clock size={20} className="text-amber-400" />}
      />

      {/* Warning Banner */}
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 sm:mb-6">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-xs sm:text-sm text-amber-200 leading-relaxed">
          These NFTs are being bridged and require execution to complete the transfer.
        </p>
      </div>

      {/* Animated action-needed banner for NFTs that are ready to execute */}
      <AnimatePresence>
        {actionableCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl mb-4 sm:mb-6"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="shrink-0 mt-0.5 sm:mt-0"
            >
              <AlertTriangle size={18} className="text-emerald-400" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-emerald-300">
                {actionableCount} NFT{actionableCount !== 1 ? "s" : ""} ready to execute
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-400/70 leading-relaxed">
                Switch to L1 (Arbitrum) and click Claim to complete the bridge.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NFT Grid with progress indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {pendingNFTs.map((nft, index) => (
          <motion.div
            key={nft.tokenId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col min-w-0"
          >
            <NFTCard
              isL3={false}
              nft={nft}
              refetchNFTs={refetchAllNfts}
            />
            <BridgeProgressIndicator nft={nft} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </Card>
  );
};

export default React.memo(PendingNFTs);
