import React, { useEffect, useState } from "react";
import { Clock, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { ChildToParentMessageStatus } from "@arbitrum/sdk";
import NFTCard from "@/components/nft/NFTCard";
import { getPendingOutgoingNftsFromEventLogs, NFTDataWithStatus } from "@/utils/executeMessageL2ToL1Helper";
import { useAppContext } from "@/context/AppContext";
import { useAccount } from "wagmi";
import { Badge, Card, CardHeader } from "@/components/ui";

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

const PendingNFTs: React.FC<PendingNFTsBoxProps> = ({ refetchNFTs }) => {
  const { l1Provider, l2Provider } = useAppContext();
  const { address } = useAccount();

  const [pendingNFTs, setPendingNFTs] = useState<NFTDataWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPendingNFTs = async () => {
    if (!l1Provider || !l2Provider || !address) return;
    setIsLoading(true);
    try {
      const nfts = await getPendingOutgoingNftsFromEventLogs(address, l1Provider, l2Provider);
      setPendingNFTs(nfts);
    } catch (error) {
      console.error("Error fetching pending NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchAllNfts = async () => {
    refetchNFTs();
    fetchPendingNFTs();
  };

  useEffect(() => {
    fetchPendingNFTs();
  }, [address, l1Provider, l2Provider]);

  // Don't render if loading or no pending NFTs
  if (isLoading) {
    return null;
  }

  if (pendingNFTs.length === 0) {
    return null;
  }

  const actionableCount = pendingNFTs.filter(needsAction).length;

  return (
    <Card padding="lg">
      <CardHeader
        title="Pending NFTs"
        subtitle={`${pendingNFTs.length} NFT${pendingNFTs.length !== 1 ? "s" : ""} awaiting confirmation`}
        icon={<Clock size={20} className="text-amber-400" />}
      />

      {/* Warning Banner */}
      <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
        <AlertTriangle size={20} className="text-amber-400 shrink-0" />
        <p className="text-sm text-amber-200">
          These NFTs are being bridged and require execution to complete the transfer.
        </p>
      </div>

      {/* Animated action-needed banner for NFTs that are ready to execute */}
      {actionableCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl mb-6"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <AlertTriangle size={20} className="text-emerald-400 shrink-0" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-emerald-300">
              {actionableCount} NFT{actionableCount !== 1 ? "s" : ""} ready to execute
            </p>
            <p className="text-xs text-emerald-400/70">
              Switch to L1 (Arbitrum) and click Claim to complete the bridge.
            </p>
          </div>
        </motion.div>
      )}

      {/* NFT Grid with progress indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {pendingNFTs.map((nft, index) => {
          const progress = getBridgeProgress(nft.state);
          return (
            <motion.div
              key={nft.tokenId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col"
            >
              <NFTCard
                isL3={false}
                nft={nft}
                refetchNFTs={refetchAllNfts}
              />
              {/* Bridge progress indicator */}
              <div className="mt-2 px-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500">{progress.label}</span>
                  <Badge
                    variant={needsAction(nft) ? "success" : "warning"}
                    size="sm"
                    pulse={needsAction(nft)}
                  >
                    {progress.pct}%
                  </Badge>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${needsAction(nft) ? "bg-emerald-500" : "bg-amber-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
};

export default PendingNFTs;
