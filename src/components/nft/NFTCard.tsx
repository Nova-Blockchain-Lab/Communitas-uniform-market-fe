import React, { memo, useState, useCallback } from "react";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import BridgeNFTL1ToL2Button from "@/components/nft/BridgeNFTL1ToL2Button";
import { NFTData, NFTDataWithStatus } from "@/utils/executeMessageL2ToL1Helper";
import BridgeNFTL2ToL1Button from "@/components/nft/BridgeNFTL2ToL1Button";
import BridgeNFTL2ToL1ExecuteButton from "@/components/nft/BridgeNFTL2ToL1ExecuteButton";
import ViewOnOpenseaButton from "@/components/nft/ViewOnOpenseaButton";
import { SkeletonBlock } from "@/components/ui";

interface NFTCardProps {
  isL3: boolean;
  nft: NFTData | NFTDataWithStatus;
  refetchNFTs: () => {};
}

const NFTCard: React.FC<NFTCardProps> = memo(function NFTCard({
  nft,
  isL3,
  refetchNFTs,
}) {
  const isPendingMessage = (nft as NFTDataWithStatus).hash !== undefined;
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = nft.image && nft.image.length > 0;

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl
        bg-white/[0.03] border border-white/10
        hover:border-white/25 hover:bg-white/[0.06]
        hover:shadow-lg hover:shadow-black/20
        active:scale-[0.98]
        transition-all duration-300 ease-out
        flex flex-col w-full h-full
        ${isPendingMessage ? "ring-2 ring-amber-500/30" : ""}
      `}
    >
      {/* Pending badge */}
      {isPendingMessage && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-amber-500/90 text-white text-[10px] sm:text-xs font-medium rounded-lg shadow-md">
          <Clock size={11} className="shrink-0" />
          Pending
        </div>
      )}

      {/* Token ID badge */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-mono rounded-lg shadow-sm">
        #{nft.tokenId.toString()}
      </div>

      {/* Image area -- square aspect ratio via padding trick */}
      <div className="relative w-full pt-[100%] overflow-hidden bg-white/5 shrink-0">
        {/* Skeleton while image loads */}
        {hasImage && !imageLoaded && (
          <div className="absolute inset-0">
            <SkeletonBlock width="100%" height="100%" rounded="sm" />
          </div>
        )}

        {hasImage ? (
          <Image
            src={nft.image}
            alt={nft.name || "NFT"}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            className={`
              absolute inset-0 object-contain
              group-hover:scale-105 transition-transform duration-500 ease-out
              ${imageLoaded ? "opacity-100" : "opacity-0"}
            `}
            onLoad={handleImageLoad}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Eye size={20} className="text-gray-600 sm:w-6 sm:h-6" />
            </div>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-3.5 space-y-1.5 flex-1 flex flex-col min-w-0">
        {/* Name */}
        <h3 className="font-semibold text-white text-sm leading-tight truncate" title={nft.name}>
          {nft.name}
        </h3>

        {/* Description */}
        {nft.description && (
          <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {nft.description}
          </p>
        )}

        {/* Actions, mounted once: below the text on mobile, a hover/focus overlay
            on the image square from md up. */}
        <div
          className="
            pt-2 mt-auto flex flex-col gap-2
            md:absolute md:inset-x-0 md:top-0 md:aspect-square md:z-[5] md:m-0 md:px-4 md:pt-0
            md:justify-center md:bg-black/50 md:opacity-0 md:transition-opacity md:duration-300
            md:group-hover:opacity-100 md:focus-within:opacity-100
          "
        >
          {!isPendingMessage && !isL3 && (
            <>
              <BridgeNFTL1ToL2Button tokenId={nft.tokenId} refetchNFTs={refetchNFTs} />
              <ViewOnOpenseaButton tokenId={nft.tokenId} />
            </>
          )}
          {!isPendingMessage && isL3 && (
            <BridgeNFTL2ToL1Button nft={nft} refetchNFTs={refetchNFTs} />
          )}
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
});

export default NFTCard;
