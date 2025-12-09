import React from "react";
import { contractAddresses, OPENSEA_URL_CREATOR } from "@/config";
import { useAccount } from "wagmi";

interface ViewOnOpenseaButtonProps {
  tokenId: string;
}

const ViewOnOpenseaButton: React.FC<ViewOnOpenseaButtonProps> = ({ tokenId }) => {
  const { chainId } = useAccount();

  const contractAddress = contractAddresses[chainId!]["CommunitasNFT"]["General"];
  const openseaLink = OPENSEA_URL_CREATOR(contractAddress, tokenId);

  return (
    <a
      href={openseaLink}
      target="_blank"
      rel="noopener noreferrer"
      className="
        w-full inline-flex items-center justify-center
        px-4 py-2 text-xs font-medium
        bg-transparent text-white/80
        border border-white/40
        rounded-lg
        hover:bg-white/20 hover:border-white/60
        transition-all duration-200
      "
    >
      OpenSea
    </a>
  );
};

export default ViewOnOpenseaButton;
