import React, { useEffect, useState } from "react";
import { Clock, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import NFTCard from "@/components/nft/NFTCard";
import { getPendingOutgoingNftsFromEventLogs, NFTDataWithStatus } from "@/utils/executeMessageL2ToL1Helper";
import { useAppContext } from "@/context/AppContext";
import { useAccount } from "wagmi";
import { Card, CardHeader } from "@/components/ui";

interface PendingNFTsBoxProps {
  refetchNFTs: () => {};
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

      {/* NFT Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {pendingNFTs.map((nft, index) => (
          <motion.div
            key={nft.tokenId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NFTCard
              isL3={false}
              nft={nft}
              refetchNFTs={refetchAllNfts}
            />
          </motion.div>
        ))}
      </motion.div>
    </Card>
  );
};

export default PendingNFTs;
