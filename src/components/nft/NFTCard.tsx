import React from "react";
import Image from "next/image";
import { ExternalLink, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import BridgeNFTL1ToL2Button from "@/components/nft/BridgeNFTL1ToL2Button";
import { NFTData, NFTDataWithStatus } from "@/utils/executeMessageL2ToL1Helper";
import BridgeNFTL2ToL1Button from "@/components/nft/BridgeNFTL2ToL1Button";
import BridgeNFTL2ToL1ExecuteButton from "@/components/nft/BridgeNFTL2ToL1ExecuteButton";
import ViewOnOpenseaButton from "@/components/nft/ViewOnOpenseaButton";

interface NFTCardProps {
  isL3: boolean;
  nft: NFTData | NFTDataWithStatus;
  refetchNFTs: () => {};
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, isL3, refetchNFTs }) => {
  const isPendingMessage = (nft as NFTDataWithStatus).hash !== undefined;

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl
        bg-white/[0.03] border border-white/10
        hover:border-white/20 hover:bg-white/[0.05]
        transition-all duration-300 flex flex-col
        ${isPendingMessage ? "ring-2 ring-amber-500/30" : ""}
      `}
    >
      {/* Pending badge */}
      {isPendingMessage && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-amber-500/90 text-white text-xs font-medium rounded-lg">
          <Clock size={12} />
          Pending
        </div>
      )}

      {/* Token ID badge */}
      <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-mono rounded-lg">
        #{nft.tokenId.toString()}
      </div>

      {/* Image */}
      <div className="relative w-full pt-[100%] overflow-hidden bg-white/5">
        {nft.image && nft.image.length > 0 ? (
          <Image
            src={nft.image}
            alt={nft.name || "NFT"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
            className="absolute inset-0 object-contain group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-2xl text-gray-600">🖼️</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="font-semibold text-white text-sm truncate">{nft.name}</h3>

        {/* Description */}
        {nft.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{nft.description}</p>
        )}

        {/* Actions */}
        <div className="pt-2 mt-auto space-y-2 nft-card-actions">
          {/* On L1 - Bridge to L2 or view on OpenSea */}
          {!isPendingMessage && !isL3 && (
            <div className="flex flex-col gap-2">
              <BridgeNFTL1ToL2Button tokenId={nft.tokenId} refetchNFTs={refetchNFTs} />
              <ViewOnOpenseaButton tokenId={nft.tokenId} />
            </div>
          )}

          {/* On L2 - Bridge to L1 */}
          {!isPendingMessage && isL3 && (
            <BridgeNFTL2ToL1Button nft={nft} refetchNFTs={refetchNFTs} />
          )}

          {/* Pending - Execute bridge */}
          {isPendingMessage && (
            <BridgeNFTL2ToL1ExecuteButton
              nft={nft as NFTDataWithStatus}
              refetchNFTs={refetchNFTs}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
